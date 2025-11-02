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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTab, setCurrentTab] = useState("workout");
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({});
  const [generatingImages, setGeneratingImages] = useState<{ [key: string]: boolean }>({});
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
        const headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        if (/day\s+\d+/i.test(headingText)) {
          dayIndex++;
        }
        
        formatted.push(
          <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
            <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-primary mb-3 border-b-2 border-primary/20 pb-2`}>
              {headingText}
            </h3>
          </div>
        );
        return;
      }

      // Detect day headers (Day 1, Day 2, etc.) without markdown
      if (/^day\s+\d+/i.test(trimmedLine) || /^day\s+\d+:/.test(trimmedLine)) {
        dayIndex++;
        currentDay = trimmedLine;
        formatted.push(
          <div key={`day-${dayIndex}`} className="mt-6 mb-4 first:mt-0">
            <h3 className="text-xl font-bold text-primary mb-3 border-b-2 border-primary/20 pb-2">
              {trimmedLine}
            </h3>
          </div>
        );
        return;
      }

      // Detect Markdown formatted exercises: - **Exercise Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const exerciseMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (exerciseMatch) {
          const exerciseName = exerciseMatch[1].trim();
          const exerciseDetails = exerciseMatch[2].trim();
          const imageKey = `workout-${index}`;
          const imageUrl = generatedImages[imageKey];
          const isGenerating = generatingImages[imageKey];
          
          // Extract clean exercise name (remove common words like "sets", "reps", etc.)
          const cleanExerciseName = exerciseName.split(/[:\-,]/)[0].trim().toLowerCase();
          
          formatted.push(
            <div key={`exercise-${index}`} className="mb-4 pl-4 border-l-4 border-primary/30">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-base font-semibold text-primary mb-1">
                    {exerciseName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2 ml-4">
                    {exerciseDetails}
                  </p>
                </div>
                <Button
                  onClick={() => handleGenerateImage(cleanExerciseName, imageKey, "exercise")}
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
                  alt={`${exerciseName} visualization`}
                  className="rounded-lg shadow-md w-full max-w-sm mx-auto mb-2"
                />
              )}
            </div>
          );
        } else {
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-primary/30">
              <p className="text-base font-medium text-foreground mb-1">
                {trimmedLine.replace(/^-\s+/, '')}
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
        formatted.push(
          <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-primary/30">
            <p className="text-base font-medium text-foreground mb-1">
              {trimmedLine}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground">
              <span className="text-primary mr-2">•</span>
              {trimmedLine.replace(/^[-•*]\s/, '')}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification
      formatted.push(
        <p key={`para-${index}`} className="mb-3 text-base text-foreground/90 leading-7">
          {trimmedLine}
        </p>
      );
    });

    return formatted.length > 0 ? formatted : <p className="text-base leading-7">{plan}</p>;
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
        const headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        formatted.push(
          <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
            <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-secondary mb-3 border-b-2 border-secondary/20 pb-2`}>
              {headingText}
            </h3>
          </div>
        );
        return;
      }

      // Detect meal headers (Breakfast, Lunch, Dinner, etc.) without markdown
      if (/^(breakfast|lunch|dinner|snack|meal)/i.test(trimmedLine)) {
        formatted.push(
          <div key={`meal-${index}`} className="mt-5 mb-3 first:mt-0">
            <h3 className="text-lg font-bold text-secondary mb-2">
              {trimmedLine}
            </h3>
          </div>
        );
        return;
      }

      // Detect Markdown formatted meals: - **Meal Name:** Details
      if (/^-\s+\*\*/.test(trimmedLine)) {
        const mealMatch = trimmedLine.match(/^-\s+\*\*(.+?):\*\*(.+)/);
        if (mealMatch) {
          const mealName = mealMatch[1].trim();
          const mealDetails = mealMatch[2].trim();
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
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-secondary/30">
              <p className="text-base font-medium text-foreground mb-1">
                {trimmedLine.replace(/^-\s+/, '')}
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

      // Detect numbered items
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        formatted.push(
          <div key={`item-${index}`} className="mb-2 pl-4 border-l-4 border-secondary/30">
            <p className="text-base text-foreground mb-1">
              {trimmedLine}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground">
              <span className="text-secondary mr-2">•</span>
              {trimmedLine.replace(/^[-•*]\s/, '')}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification
      formatted.push(
        <p key={`para-${index}`} className="mb-3 text-base text-foreground/90 leading-7">
          {trimmedLine}
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
        const headingText = trimmedLine.replace(/^#+\s+/, '').trim();
        const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 2;
        
        formatted.push(
          <div key={`heading-${index}`} className={`mt-6 mb-4 first:mt-0 ${headingLevel === 2 ? 'mt-8' : 'mt-6'}`}>
            <h3 className={`${headingLevel === 1 ? 'text-2xl' : headingLevel === 2 ? 'text-xl' : 'text-lg'} font-bold text-accent mb-3 border-b-2 border-accent/20 pb-2`}>
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
          const tipName = tipMatch[1].trim();
          const tipDetails = tipMatch[2].trim();
          formatted.push(
            <div key={`tip-item-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
              <p className="text-base font-semibold text-accent mb-1">
                {tipName}
              </p>
              <p className="text-sm text-muted-foreground mb-1 ml-4">
                {tipDetails}
              </p>
            </div>
          );
        } else {
          formatted.push(
            <div key={`item-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
              <p className="text-base font-medium text-foreground mb-1">
                {trimmedLine.replace(/^-\s+/, '')}
              </p>
            </div>
          );
        }
        return;
      }

      // Detect italic descriptions: *Note:* text
      if (/^\*\*?[Nn]ote:\*\*?\s/.test(trimmedLine) || /^\*\*?[Dd]escription:\*\*?\s/.test(trimmedLine)) {
        formatted.push(
          <div key={`desc-${index}`} className="mb-2 ml-6 italic text-sm text-muted-foreground">
            {trimmedLine.replace(/^\*\*?/, '').replace(/\*\*?/, '')}
          </div>
        );
        return;
      }

      // Detect quote patterns (quotes often in quotes or special format)
      if (/^["']/.test(trimmedLine) || (trimmedLine.includes('quote') && trimmedLine.length < 150)) {
        const cleanQuote = trimmedLine.replace(/^["']|["']$/g, '').replace(/^["']|["']$/g, '');
        formatted.push(
          <div key={`quote-${index}`} className="my-4 p-4 bg-accent/50 rounded-lg border-l-4 border-accent">
            <p className="text-base italic text-foreground leading-7">
              {cleanQuote}
            </p>
          </div>
        );
        return;
      }

      // Detect numbered tips
      if (/^\d+[\.\)]/.test(trimmedLine)) {
        formatted.push(
          <div key={`tip-${index}`} className="mb-3 pl-4 border-l-4 border-accent/30">
            <p className="text-base text-foreground mb-1">
              {trimmedLine}
            </p>
          </div>
        );
        return;
      }

      // Detect bullet points or dashes
      if (/^[-•*]\s/.test(trimmedLine)) {
        formatted.push(
          <div key={`bullet-${index}`} className="mb-2 ml-6">
            <p className="text-base text-muted-foreground">
              <span className="text-accent mr-2">•</span>
              {trimmedLine.replace(/^[-•*]\s/, '')}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraphs with proper justification
      formatted.push(
        <p key={`para-${index}`} className="mb-3 text-base text-foreground/90 leading-7">
          {trimmedLine}
        </p>
      );
    });

    return formatted.length > 0 ? formatted : <p className="text-base leading-7">{plan}</p>;
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setIsPlayingAudio(false);
  };

  const handleTextToSpeech = async () => {
    // If already playing, stop and return
    if (isPlayingAudio) {
      handleStopSpeech();
      return;
    }

    setIsPlayingAudio(true);
    try {
      let textToRead = "";
      if (currentTab === "workout") textToRead = workoutPlan;
      else if (currentTab === "diet") textToRead = dietPlan;
      else textToRead = motivationPlan;

      // Limit text length for better performance (Web Speech API can handle longer text)
      const text = textToRead.substring(0, 5000); // Increased limit since it's free

      await textToSpeech(text, "default");
      
      // Note: onend event in textToSpeech will resolve the promise
      // But we still need to update state when done
      setIsPlayingAudio(false);
    } catch (error) {
      console.error("Error playing audio:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to play audio. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsPlayingAudio(false);
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
      className="w-full max-w-5xl mx-auto p-6 space-y-6 relative"
    >
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={onBackToHome} variant="ghost" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          {/* Theme Toggle Button - Next to Back to Home */}
          <ThemeToggle />
        </div>
        <div className="flex gap-3">
          <Button onClick={onRegenerate} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Regenerate Plan
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Export as PDF
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
              <div className="workout-plan-content text-justify leading-relaxed">
                {formatWorkoutPlan(workoutPlan)}
              </div>
              <div className="flex gap-3 pt-4">
                {isPlayingAudio ? (
                  <Button onClick={handleStopSpeech} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop Playing
                  </Button>
                ) : (
                  <Button onClick={handleTextToSpeech} className="gap-2">
                    <Volume2 className="w-4 h-4" />
                    Read My Plan
                  </Button>
                )}
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
              <div className="flex gap-3 pt-4">
                {isPlayingAudio ? (
                  <Button onClick={handleStopSpeech} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop Playing
                  </Button>
                ) : (
                  <Button onClick={handleTextToSpeech} className="gap-2">
                    <Volume2 className="w-4 h-4" />
                    Read My Plan
                  </Button>
                )}
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
              <div className="pt-4">
                {isPlayingAudio ? (
                  <Button onClick={handleStopSpeech} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop Playing
                  </Button>
                ) : (
                  <Button onClick={handleTextToSpeech} className="gap-2">
                    <Volume2 className="w-4 h-4" />
                    Read My Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
