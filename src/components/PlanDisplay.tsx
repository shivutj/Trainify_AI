import { useState } from "react";
import React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dumbbell, Utensils, Heart, Volume2, Image as ImageIcon, Download, RefreshCw, Home, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { textToSpeech, stopSpeech } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface PlanDisplayProps {
  workoutPlan: string;
  dietPlan: string;
  motivationPlan: string;
  onRegenerate: () => void;
  onBackToHome: () => void;
}

export const PlanDisplay = ({ workoutPlan, dietPlan, motivationPlan, onRegenerate, onBackToHome }: PlanDisplayProps) => {
  const [currentTab, setCurrentTab] = useState("workout");
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({});
  const [generatingImages, setGeneratingImages] = useState<{ [key: string]: boolean }>({});
  const [playingAudioKeys, setPlayingAudioKeys] = useState<{ [key: string]: HTMLAudioElement }>({});
  const { toast } = useToast();

  // Format workout plan with proper styling
  const formatWorkoutPlan = (plan: string): React.ReactNode => {
    if (!plan) return <p className="text-base leading-7">{plan}</p>;
    
    const lines = plan.split('\n');
    const formatted: JSX.Element[] = [];
    let currentDay = '';
    let dayIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        formatted.push(<br key={`br-${index}`} />);
        return;
      }

      // Detect Markdown headings (## Day 1:, ### Section, etc.)
      if (/^#{1,3}\s+/.test(trimmedLine)) {
        // Remove markdown formatting (#, **, etc.) and get clean text
        let headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        // Remove leading dashes and spaces
        headingText = headingText.replace(/^-\s*/, '').trim();
        // Remove markdown bold (**text** -> text) - handle multiple asterisks
        headingText = headingText.replace(/\*+/g, '').trim();
        // Remove any remaining markdown formatting (underscores, backticks)
        headingText = headingText.replace(/[_`]/g, '').trim();
        // Clean up any colons and extra spaces
        headingText = headingText.replace(/\s+/g, ' ').trim();
        
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
          if (/day\s+\d+/i.test(headingText) || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(headingText)) {
          dayIndex++;
          const dayKey = `day-${dayIndex}`;
          const isPlayingDay = !!playingAudioKeys[dayKey];
          
          // Get day content for speech
          let dayContent = headingText + ". ";
          let dayExercisesStart = index + 1;
          for (let i = dayExercisesStart; i < lines.length; i++) {
            const nextLine = lines[i]?.trim();
            if (!nextLine) continue;
            if (/^#{1,3}\s+.*day\s+\d+/i.test(nextLine) || /^day\s+\d+/i.test(nextLine) || /^\*\*.*day/i.test(nextLine) || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(nextLine)) break;
            // Clean markdown from day content too
            let cleanLine = nextLine.replace(/\*+/g, '').replace(/[_`#]/g, '').trim();
            cleanLine = cleanLine.replace(/\s+/g, ' ').trim();
            if (cleanLine) dayContent += cleanLine + ". ";
            if (dayContent.length > 1000) break;
          }

          formatted.push(
            <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
              <div className="flex items-center justify-between gap-2 mb-3 border-b-2 border-primary/20 pb-2">
                <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-primary break-words`}>
                  {headingText}
                </h3>
                <Button
                  onClick={() => handleTextToSpeech(dayContent.trim(), dayKey)}
                  variant={isPlayingDay ? "destructive" : "outline"}
                  size="sm"
                  className="gap-1 h-8 px-2 text-xs flex-shrink-0 whitespace-nowrap"
                  title={isPlayingDay ? "Stop audio" : "Listen to day workout"}
                >
                  {isPlayingDay ? (
                    <>
                      <Square className="w-3 h-3" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        } else {
          formatted.push(
            <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
              <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-primary mb-3 border-b-2 border-primary/20 pb-2 break-words`}>
                {headingText}
              </h3>
            </div>
          );
        }
        return;
      }

      // Detect day headers (Day 1, Day 2, etc.) without markdown - also check for day names with asterisks
      if (/^day\s+\d+/i.test(trimmedLine) || /^day\s+\d+:/.test(trimmedLine) || /^\*\*.*day/i.test(trimmedLine) || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(trimmedLine)) {
        dayIndex++;
        // Clean markdown formatting from day header - remove all asterisks first
        let cleanDayText = trimmedLine;
        // Remove leading dashes and spaces
        cleanDayText = cleanDayText.replace(/^-\s*/, '').trim();
        // Remove leading/trailing asterisks
        cleanDayText = cleanDayText.replace(/^\*+/, '').replace(/\*+$/, '').trim();
        // Remove all asterisks anywhere
        cleanDayText = cleanDayText.replace(/\*+/g, '').trim();
        // Remove other markdown formatting
        cleanDayText = cleanDayText.replace(/[_`#]/g, '').trim();
        // Clean up extra spaces
        cleanDayText = cleanDayText.replace(/\s+/g, ' ').trim();
        currentDay = cleanDayText;
        const dayKey = `day-${dayIndex}`;
        const isPlayingDay = !!playingAudioKeys[dayKey];
        
        // Get day content for speech (all exercises in this day)
        let dayContent = cleanDayText + ". ";
        let dayExercisesStart = index + 1;
        for (let i = dayExercisesStart; i < lines.length; i++) {
          const nextLine = lines[i]?.trim();
          if (!nextLine) continue;
          if (/^day\s+\d+/i.test(nextLine) || /^#{1,3}\s+.*day\s+\d+/i.test(nextLine)) break;
            // Clean markdown from day content
            let cleanLine = nextLine.replace(/\*+/g, '').replace(/[_`#]/g, '').trim();
            cleanLine = cleanLine.replace(/\s+/g, ' ').trim();
            if (cleanLine) dayContent += cleanLine + ". ";
          if (dayContent.length > 1000) break; // Limit content
        }

          formatted.push(
            <div key={`day-${dayIndex}`} className="mt-6 mb-4 first:mt-0">
              <div className="flex items-center justify-between gap-2 mb-3 border-b-2 border-primary/20 pb-2">
                <h3 className="text-xl font-bold text-primary break-words flex-1">
                  {cleanDayText}
                </h3>
                <Button
                  onClick={() => handleTextToSpeech(dayContent.trim(), dayKey)}
                  variant={isPlayingDay ? "destructive" : "outline"}
                  size="sm"
                  className="gap-1 h-8 px-2 text-xs flex-shrink-0 whitespace-nowrap"
                  title={isPlayingDay ? "Stop audio" : "Listen to day workout"}
                >
                  {isPlayingDay ? (
                    <>
                      <Square className="w-3 h-3" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        return;
      }

      // Detect Markdown formatted exercises: - **Exercise Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const exerciseMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (exerciseMatch) {
          // Clean markdown formatting from exercise names and details
          let exerciseName = exerciseMatch[1].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          let exerciseDetails = exerciseMatch[2].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          const imageKey = `workout-${index}`;
          const imageUrl = generatedImages[imageKey];
          const isGenerating = generatingImages[imageKey];
          
          // Extract clean exercise name (remove common words like "sets", "reps", etc.)
          const cleanExerciseName = exerciseName.split(/[:\-,]/)[0].trim().toLowerCase();
          
          formatted.push(
            <div key={`exercise-${index}`} className="mb-3 pl-4 border-l-4 border-primary/30 overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0 break-words">
                  <p className="text-sm font-semibold text-primary mb-1 break-words">
                    {exerciseName}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1 ml-2 break-words">
                    {exerciseDetails}
                  </p>
                </div>
                <Button
                  onClick={() => handleGenerateImage(cleanExerciseName, imageKey, "exercise")}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="gap-1 flex-shrink-0 text-xs h-7 px-2"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{isGenerating ? "Gen..." : "Image"}</span>
                </Button>
              </div>
              {imageUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={imageUrl}
                  alt={`${exerciseName} visualization`}
                  className="rounded-lg shadow-md w-full max-w-sm mx-auto mb-2"
                />
              )}
            </div>
          );
        } else {
          // Clean asterisks from regular items
          let cleanItem = trimmedLine.replace(/^-\s+/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-primary/30">
              <p className="text-base font-medium text-foreground mb-1 break-words">
                {cleanItem}
              </p>
            </div>
          );
        }
        return;
      }

      // Detect italic descriptions: *Description:* text
      if (/^\*\*?[Dd]escription:\*\*?\s/.test(trimmedLine) || /^\*\*?[Nn]ote:\*\*?\s/.test(trimmedLine)) {
        formatted.push(
          <div key={`desc-${index}`} className="mb-2 ml-6 italic text-sm text-muted-foreground">
            {trimmedLine.replace(/^\*\*?/, '').replace(/\*\*?/, '')}
          </div>
        );
        return;
      }

      // Detect numbered exercises (1., 2., 3., etc.)
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        // Remove asterisks from numbered items
        let cleanNumbered = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-primary/30">
            <p className="text-base font-medium text-foreground mb-1 break-words">
              {cleanNumbered}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        // Remove asterisks from bullet points
        let cleanBullet = trimmedLine.replace(/^[-•*]\s/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground break-words">
              <span className="text-primary mr-2">•</span>
              {cleanBullet}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification - remove asterisks
      let cleanPara = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
      formatted.push(
        <p key={`para-${index}`} className="mb-2 text-sm text-foreground/90 leading-6 break-words overflow-wrap-anywhere">
          {cleanPara}
        </p>
      );
    });

    return formatted.length > 0 ? formatted : <p className="text-sm leading-6 break-words">{plan}</p>;
  };

  // Format diet plan with proper styling
  const formatDietPlan = (plan: string): React.ReactNode => {
    if (!plan) return <p className="text-base leading-7">{plan}</p>;
    
    const lines = plan.split('\n');
    const formatted: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        formatted.push(<br key={`br-${index}`} />);
        return;
      }

      // Detect Markdown headings (## Breakfast, ### Section, etc.)
      if (/^#{1,3}\s+/.test(trimmedLine)) {
        // Remove markdown formatting and asterisks
        let headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        // Remove leading dashes and spaces
        headingText = headingText.replace(/^-\s*/, '').trim();
        headingText = headingText.replace(/\*+/g, '').trim();
        headingText = headingText.replace(/[_`]/g, '').trim();
        headingText = headingText.replace(/\s+/g, ' ').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        formatted.push(
          <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
            <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-secondary mb-3 border-b-2 border-secondary/20 pb-2 break-words`}>
              {headingText}
            </h3>
          </div>
        );
        return;
      }

      // Detect meal headers (Breakfast, Lunch, Dinner, etc.) without markdown
      if (/^(breakfast|lunch|dinner|snack|meal)/i.test(trimmedLine)) {
        // Remove leading dashes and asterisks from meal headers
        let cleanMealHeader = trimmedLine.replace(/^-\s*/, '').trim();
        cleanMealHeader = cleanMealHeader.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        cleanMealHeader = cleanMealHeader.replace(/\s+/g, ' ').trim();
        formatted.push(
          <div key={`meal-${index}`} className="mt-5 mb-3 first:mt-0">
            <h3 className="text-lg font-bold text-secondary mb-2 break-words">
              {cleanMealHeader}
            </h3>
          </div>
        );
        return;
      }

      // Detect Markdown formatted meals: - **Meal Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const mealMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (mealMatch) {
          // Remove asterisks from meal names and details
          let mealName = mealMatch[1].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          let mealDetails = mealMatch[2].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          const imageKey = `diet-${index}`;
          const imageUrl = generatedImages[imageKey];
          const isGenerating = generatingImages[imageKey];
          
          // Extract clean meal name
          const cleanMealName = mealName.split(/[:\-,]/)[0].trim().toLowerCase();
          
          formatted.push(
            <div key={`meal-item-${index}`} className="mb-4 pl-4 border-l-4 border-secondary/30">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-base font-semibold text-secondary mb-1">
                    {mealName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2 ml-4">
                    {mealDetails}
                  </p>
                </div>
                <Button
                  onClick={() => handleGenerateImage(cleanMealName, imageKey, "meal")}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="gap-1 flex-shrink-0"
                >
                  <ImageIcon className="w-3 h-3" />
                  {isGenerating ? "Generating..." : "Image"}
                </Button>
              </div>
              {imageUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={imageUrl}
                  alt={`${mealName} visualization`}
                  className="rounded-lg shadow-md w-full max-w-sm mx-auto mb-2"
                />
              )}
            </div>
          );
        } else {
          // Clean asterisks from regular items
          let cleanItem = trimmedLine.replace(/^-\s+/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-secondary/30">
              <p className="text-base font-medium text-foreground mb-1 break-words">
                {cleanItem}
              </p>
            </div>
          );
        }
        return;
      }

      // Detect italic descriptions: *Description:* text
      if (/^\*\*?[Dd]escription:\*\*?\s/.test(trimmedLine) || /^\*\*?[Nn]ote:\*\*?\s/.test(trimmedLine)) {
        // Remove all asterisks and markdown formatting
        let cleanDesc = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`desc-${index}`} className="mb-2 ml-6 italic text-sm text-muted-foreground break-words">
            {cleanDesc}
          </div>
        );
        return;
      }

      // Detect numbered items
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        // Remove asterisks from numbered items
        let cleanNumbered = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`item-${index}`} className="mb-2 pl-4 border-l-4 border-secondary/30">
            <p className="text-base text-foreground mb-1 break-words">
              {cleanNumbered}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        // Remove asterisks from bullet points
        let cleanBullet = trimmedLine.replace(/^[-•*]\s/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground break-words">
              <span className="text-secondary mr-2">•</span>
              {cleanBullet}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification - remove asterisks
      let cleanPara = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
      formatted.push(
        <p key={`para-${index}`} className="mb-3 text-base text-foreground/90 leading-7 break-words">
          {cleanPara}
        </p>
      );
    });

    return formatted.length > 0 ? formatted : <p className="text-base leading-7">{plan}</p>;
  };

  // Format motivation plan with proper styling
  const formatMotivationPlan = (plan: string): React.ReactNode => {
    if (!plan) return <p className="text-base leading-7">{plan}</p>;
    
    const lines = plan.split('\n');
    const formatted: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        formatted.push(<br key={`br-${index}`} />);
        return;
      }

      // Detect Markdown headings (## Motivational Quote, ### Section, etc.)
      if (/^#{1,3}\s+/.test(trimmedLine)) {
        // Remove markdown formatting and asterisks
        let headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        // Remove leading dashes and spaces
        headingText = headingText.replace(/^-\s*/, '').trim();
        headingText = headingText.replace(/\*+/g, '').trim();
        headingText = headingText.replace(/[_`]/g, '').trim();
        headingText = headingText.replace(/\s+/g, ' ').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        formatted.push(
          <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
            <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-accent mb-3 border-b-2 border-accent/20 pb-2 break-words`}>
              {headingText}
            </h3>
          </div>
        );
        return;
      }

      // Detect Markdown formatted tips: - **Tip Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const tipMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (tipMatch) {
          // Remove asterisks from tip names and details
          let tipName = tipMatch[1].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          let tipDetails = tipMatch[2].trim().replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          formatted.push(
            <div key={`tip-item-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
              <p className="text-base font-semibold text-accent mb-1 break-words">
                {tipName}
              </p>
              <p className="text-sm text-muted-foreground mb-1 ml-4 break-words">
                {tipDetails}
              </p>
            </div>
          );
        } else {
          // Clean asterisks from regular items
          let cleanItem = trimmedLine.replace(/^-\s+/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
              <p className="text-base font-medium text-foreground mb-1 break-words">
                {cleanItem}
              </p>
            </div>
          );
        }
        return;
      }

      // Detect italic descriptions: *Note:* text
      if (/^\*\*?[Nn]ote:\*\*?\s/.test(trimmedLine) || /^\*\*?[Dd]escription:\*\*?\s/.test(trimmedLine)) {
        // Remove all asterisks and markdown formatting
        let cleanDesc = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`desc-${index}`} className="mb-2 ml-6 italic text-sm text-muted-foreground break-words">
            {cleanDesc}
          </div>
        );
        return;
      }

      // Detect quote patterns (quotes often in quotes or special format)
      if (/^["']/.test(trimmedLine) || (trimmedLine.includes('quote') && trimmedLine.length < 150)) {
        // Remove asterisks from quotes
        let cleanQuote = trimmedLine.replace(/^["']|["']$/g, '').replace(/^["']|["']$/g, '');
        cleanQuote = cleanQuote.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`quote-${index}`} className="my-4 p-4 bg-accent/50 rounded-lg border-l-4 border-accent">
            <p className="text-base italic text-foreground leading-7 break-words">
              {cleanQuote}
            </p>
          </div>
        );
        return;
      }

      // Detect numbered tips
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        // Remove asterisks from numbered items
        let cleanNumbered = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`tip-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
            <p className="text-base text-foreground mb-1 break-words">
              {cleanNumbered}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        // Remove asterisks from bullet points
        let cleanBullet = trimmedLine.replace(/^[-•*]\s/, '').replace(/\*+/g, '').replace(/[_`]/g, '').trim();
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground break-words">
              <span className="text-accent mr-2">•</span>
              {cleanBullet}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification - remove asterisks
      let cleanPara = trimmedLine.replace(/\*+/g, '').replace(/[_`]/g, '').trim();
      formatted.push(
        <p key={`para-${index}`} className="mb-3 text-base text-foreground/90 leading-7 break-words">
          {cleanPara}
        </p>
      );
    });

    return formatted.length > 0 ? formatted : <p className="text-base leading-7">{plan}</p>;
  };

  // Handle speech for specific content (day or exercise)
  const handleTextToSpeech = async (text: string, key: string) => {
    // If already playing this audio, stop it
    if (playingAudioKeys[key]) {
      stopSpeech(playingAudioKeys[key]);
      setPlayingAudioKeys(prev => {
        const newKeys = { ...prev };
        delete newKeys[key];
        return newKeys;
      });
      return;
    }

    // Stop any other playing audio
    Object.values(playingAudioKeys).forEach(audio => stopSpeech(audio));
    setPlayingAudioKeys({});

    try {
      const audio = await textToSpeech(text);
      
      // Store the audio element
      setPlayingAudioKeys(prev => ({ ...prev, [key]: audio }));

      // Set up end handler
      audio.onended = () => {
        setPlayingAudioKeys(prev => {
          const newKeys = { ...prev };
          delete newKeys[key];
          return newKeys;
        });
      };

      audio.onerror = () => {
        setPlayingAudioKeys(prev => {
          const newKeys = { ...prev };
          delete newKeys[key];
          return newKeys;
        });
        toast({
          title: "Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };

      // Play the audio
      audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to play audio. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setPlayingAudioKeys(prev => {
        const newKeys = { ...prev };
        delete newKeys[key];
        return newKeys;
      });
    }
  };

  const handleGenerateImage = async (prompt: string, key: string, type: "exercise" | "meal" = "exercise") => {
    setGeneratingImages(prev => ({ ...prev, [key]: true }));
    setGeneratedImages(prev => ({ ...prev, [key]: "" }));
    
    try {
      // Use Supabase Edge Function for image generation
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, type },
      });

      if (error) throw error;

      setGeneratedImages(prev => ({ ...prev, [key]: data.imageUrl }));
      toast({
        title: "Image Generated!",
        description: `AI-generated image for "${prompt}" is ready.`,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to generate image. Please check that Supabase Edge Functions are deployed and configured.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  // Format text for PDF with proper structure
  const formatPlanForPDF = (plan: string, doc: jsPDF, startY: number, maxWidth: number): number => {
    let y = startY;
    const lineHeight = 7;
    const marginLeft = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const lines = plan.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        y += lineHeight * 0.5;
        return;
      }

      // Check if we need a new page
      if (y > pageHeight - margin - 20) {
        doc.addPage();
        y = margin;
      }

      // Detect Markdown headings (## Day 1:, ### Section, etc.)
      if (/^#{1,3}\s+/.test(trimmedLine)) {
        const headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        y += lineHeight * 1.5;
        doc.setFontSize(headingLevel === 1 ? 18 : headingLevel === 2 ? 16 : 14);
        doc.setFont(undefined, 'bold');
        doc.text(headingText, marginLeft, y);
        doc.setFont(undefined, 'normal');
        y += lineHeight * 1.2;
        return;
      }

      // Detect day headers (Day 1, Day 2, etc.) without markdown
      if (/^day\s+\d+/i.test(trimmedLine)) {
        y += lineHeight * 1.5;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(trimmedLine, marginLeft, y);
        doc.setFont(undefined, 'normal');
        y += lineHeight * 1.2;
        return;
      }

      // Detect Markdown formatted exercises: - **Exercise Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const exerciseMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (exerciseMatch) {
          const exerciseName = exerciseMatch[1].trim();
          const exerciseDetails = exerciseMatch[2].trim();
          
          y += lineHeight;
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text('•', marginLeft, y); // Clean bullet point
          doc.text(exerciseName, marginLeft + 8, y);
          doc.setFont(undefined, 'normal');
          
          if (exerciseDetails) {
            y += lineHeight * 0.8;
            doc.setFontSize(10);
            const detailsLines = doc.splitTextToSize(exerciseDetails, maxWidth - 30);
            doc.text(detailsLines, marginLeft + 15, y);
            y += (detailsLines.length - 1) * lineHeight * 0.8;
          }
          return;
        }
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^[-•*]\s+/, '').replace(/^\s+/, '');
        y += lineHeight;
        doc.setFontSize(10);
        doc.text('•', marginLeft, y); // Clean bullet point
        const textLines = doc.splitTextToSize(content, maxWidth - 25);
        doc.text(textLines, marginLeft + 8, y);
        y += (textLines.length - 1) * lineHeight;
        return;
      }

      // Detect italic descriptions: *Description:* text or *Note:* text
      if (/^\*\*?[Dd]escription:\*\*?\s/.test(trimmedLine) || /^\*\*?[Nn]ote:\*\*?\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\*\*?/, '').replace(/\*\*?/, '').trim();
        y += lineHeight * 0.8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const textLines = doc.splitTextToSize(content, maxWidth - 35);
        doc.text(textLines, marginLeft + 20, y);
        y += (textLines.length - 1) * lineHeight * 0.8;
        doc.setFont(undefined, 'normal');
        return;
      }

      // Detect numbered items
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        y += lineHeight;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const numberMatch = trimmedLine.match(/^(\d+[\.\)])\s*(.+)/);
        if (numberMatch) {
          doc.text(numberMatch[1], marginLeft, y);
          const contentLines = doc.splitTextToSize(numberMatch[2], maxWidth - 30);
          doc.text(contentLines, marginLeft + 15, y);
          y += (contentLines.length - 1) * lineHeight;
        } else {
          const textLines = doc.splitTextToSize(trimmedLine, maxWidth - 15);
          doc.text(textLines, marginLeft, y);
          y += (textLines.length - 1) * lineHeight;
        }
        doc.setFont(undefined, 'normal');
        return;
      }

      // Regular paragraphs - ensure no special characters
      const cleanLine = trimmedLine.replace(/[^\w\s\.,;:!?()-]/g, '').trim();
      if (cleanLine) {
        doc.setFontSize(10);
        const textLines = doc.splitTextToSize(cleanLine, maxWidth - 15);
        y += lineHeight;
        doc.text(textLines, marginLeft, y);
        y += (textLines.length - 1) * lineHeight;
      }
    });

    return y;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    let y = margin;

    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("Trainify AI - Your Personalized Plan", pageWidth / 2, y, { align: 'center' });
    doc.setFont(undefined, 'normal');
    y += 15;

    // Workout Plan Section
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("Workout Plan", margin, y);
    doc.setFont(undefined, 'normal');
    y += 12;

    // Format and add workout plan
    y = formatPlanForPDF(workoutPlan, doc, y, maxWidth);

    // New page for Diet Plan
    doc.addPage();
    y = margin;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("Diet Plan", margin, y);
    doc.setFont(undefined, 'normal');
    y += 12;

    // Format and add diet plan
    y = formatPlanForPDF(dietPlan, doc, y, maxWidth);

    // New page for Motivation
    doc.addPage();
    y = margin;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("Motivation & Tips", margin, y);
    doc.setFont(undefined, 'normal');
    y += 12;

    // Format and add motivation plan
    y = formatPlanForPDF(motivationPlan, doc, y, maxWidth);

    doc.save("trainify-ai-plan.pdf");
    toast({
      title: "PDF Downloaded!",
      description: "Your fitness plan has been saved as a PDF with proper formatting.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={onBackToHome} variant="ghost" className="gap-2 text-xs sm:text-sm">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Button>
          <ThemeToggle />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button onClick={onRegenerate} variant="outline" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Regenerate Plan</span>
            <span className="sm:hidden">Regenerate</span>
          </Button>
          <Button onClick={handleExportPDF} className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export as PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workout" className="gap-2">
            <Dumbbell className="w-4 h-4" />
            Workout Plan
          </TabsTrigger>
          <TabsTrigger value="diet" className="gap-2">
            <Utensils className="w-4 h-4" />
            Diet Plan
          </TabsTrigger>
          <TabsTrigger value="motivation" className="gap-2">
            <Heart className="w-4 h-4" />
            Motivation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Dumbbell className="w-6 h-6 text-primary" />
                Your 7-Day Workout Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="workout-plan-content text-justify leading-relaxed overflow-hidden break-words max-w-full">
                <div className="prose prose-sm max-w-none">
                  {formatWorkoutPlan(workoutPlan)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Utensils className="w-6 h-6 text-secondary" />
                Your Personalized Diet Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="diet-plan-content text-justify leading-relaxed">
                {formatDietPlan(dietPlan)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motivation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="w-6 h-6 text-accent" />
                Daily Motivation & Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="motivation-plan-content text-justify leading-relaxed">
                {formatMotivationPlan(motivationPlan)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
