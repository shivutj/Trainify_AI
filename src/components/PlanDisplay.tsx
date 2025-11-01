import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Utensils, Heart, Volume2, Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface PlanDisplayProps {
  workoutPlan: string;
  dietPlan: string;
  motivationPlan: string;
  onRegenerate: () => void;
}

export const PlanDisplay = ({ workoutPlan, dietPlan, motivationPlan, onRegenerate }: PlanDisplayProps) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTab, setCurrentTab] = useState("workout");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  const handleTextToSpeech = async () => {
    setIsPlayingAudio(true);
    try {
      let textToRead = "";
      if (currentTab === "workout") textToRead = workoutPlan;
      else if (currentTab === "diet") textToRead = dietPlan;
      else textToRead = motivationPlan;

      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text: textToRead.substring(0, 2000) }, // Limit text length
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.onended = () => setIsPlayingAudio(false);
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      toast({
        title: "Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      setIsPlayingAudio(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
      let prompt = "";
      let type = "";

      if (currentTab === "workout") {
        prompt = "deadlifts"; // Example - in real app, extract from plan
        type = "exercise";
      } else if (currentTab === "diet") {
        prompt = "healthy breakfast bowl"; // Example - in real app, extract from plan
        type = "meal";
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, type },
      });

      if (error) throw error;

      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Generated!",
        description: "Your AI-generated image is ready.",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(20);
    doc.text("AI Fitness Coach - Your Personalized Plan", margin, margin);

    // Workout Plan
    doc.setFontSize(16);
    doc.text("Workout Plan", margin, margin + 15);
    doc.setFontSize(10);
    const workoutLines = doc.splitTextToSize(workoutPlan, maxWidth);
    doc.text(workoutLines, margin, margin + 25);

    doc.addPage();

    // Diet Plan
    doc.setFontSize(16);
    doc.text("Diet Plan", margin, margin);
    doc.setFontSize(10);
    const dietLines = doc.splitTextToSize(dietPlan, maxWidth);
    doc.text(dietLines, margin, margin + 10);

    doc.addPage();

    // Motivation
    doc.setFontSize(16);
    doc.text("Motivation & Tips", margin, margin);
    doc.setFontSize(10);
    const motivationLines = doc.splitTextToSize(motivationPlan, maxWidth);
    doc.text(motivationLines, margin, margin + 10);

    doc.save("fitness-plan.pdf");
    toast({
      title: "PDF Downloaded!",
      description: "Your fitness plan has been saved as a PDF.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto p-6 space-y-6"
    >
      <div className="flex justify-end gap-3">
        <Button onClick={onRegenerate} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate Plan
        </Button>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Export as PDF
        </Button>
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
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{workoutPlan}</div>
              {generatedImage && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={generatedImage}
                  alt="Exercise visualization"
                  className="rounded-lg shadow-lg w-full max-w-md mx-auto"
                />
              )}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleTextToSpeech} disabled={isPlayingAudio} className="gap-2">
                  <Volume2 className="w-4 h-4" />
                  {isPlayingAudio ? "Playing..." : "Read My Plan"}
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage} variant="secondary" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isGeneratingImage ? "Generating..." : "Generate Image"}
                </Button>
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
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{dietPlan}</div>
              {generatedImage && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={generatedImage}
                  alt="Meal visualization"
                  className="rounded-lg shadow-lg w-full max-w-md mx-auto"
                />
              )}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleTextToSpeech} disabled={isPlayingAudio} className="gap-2">
                  <Volume2 className="w-4 h-4" />
                  {isPlayingAudio ? "Playing..." : "Read My Plan"}
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage} variant="secondary" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isGeneratingImage ? "Generating..." : "Generate Image"}
                </Button>
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
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{motivationPlan}</div>
              <div className="pt-4">
                <Button onClick={handleTextToSpeech} disabled={isPlayingAudio} className="gap-2">
                  <Volume2 className="w-4 h-4" />
                  {isPlayingAudio ? "Playing..." : "Read My Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
