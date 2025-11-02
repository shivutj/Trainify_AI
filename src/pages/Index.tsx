import { useState, useEffect } from "react";
import { UserForm, UserDetails } from "@/components/UserForm";
import { PlanDisplay } from "@/components/PlanDisplay";
import { StreakCalendar } from "@/components/StreakCalendar";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { SuggestedReads } from "@/components/SuggestedReads";
import { generateAllPlans } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [dietPlan, setDietPlan] = useState("");
  const [motivationPlan, setMotivationPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const { toast } = useToast();

  // Fitness facts to display while generating plans
  const fitnessFacts = [
    "Did you know? Regular exercise can boost your mood by releasing endorphins, your body's natural feel-good chemicals.",
    "Did you know? Drinking water before meals can help with weight management by making you feel fuller.",
    "Did you know? Muscle mass increases your metabolism, helping you burn more calories even at rest.",
    "Did you know? A good night's sleep (7-9 hours) is crucial for muscle recovery and growth.",
    "Did you know? Stretching after workouts can improve flexibility and reduce muscle soreness.",
    "Did you know? Eating protein within 30 minutes after exercise helps repair and build muscle tissue.",
    "Did you know? Consistency is more important than intensity - small daily habits lead to big results.",
    "Did you know? Proper breathing during exercise improves performance and reduces fatigue.",
    "Did you know? Rest days are just as important as workout days for muscle recovery and growth.",
    "Did you know? Walking 10,000 steps daily can significantly improve cardiovascular health.",
    "Did you know? Strength training helps maintain bone density, reducing the risk of osteoporosis.",
    "Did you know? Green vegetables are packed with nutrients that aid in muscle recovery and energy production.",
    "Did you know? Meditation and mindfulness can reduce stress, which helps with weight management.",
    "Did you know? Your heart is a muscle - regular cardio exercise makes it stronger and more efficient.",
    "Did you know? Progressive overload - gradually increasing exercise intensity - is key to continuous improvement.",
  ];

  // Rotate facts every 3 seconds while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % fitnessFacts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, fitnessFacts.length]);

  const generatePlans = async (details: UserDetails) => {
    setIsLoading(true);
    setUserDetails(details);

    try {
      // Generate all three plans in ONE optimized API call (uses cache, stable model, single request)
      const { workout: workoutPlanText, diet: dietPlanText, motivation: motivationPlanText } = await generateAllPlans(details);

      setWorkoutPlan(workoutPlanText);
      setDietPlan(dietPlanText);
      setMotivationPlan(motivationPlanText);

      // Save to localStorage
      localStorage.setItem("fitnessPlans", JSON.stringify({
        userDetails: details,
        workoutPlan: workoutPlanText,
        dietPlan: dietPlanText,
        motivationPlan: motivationPlanText,
      }));

      setShowPlans(true);
      
      // Mark today as completed in streak
      const today = new Date().toISOString().split("T")[0];
      const savedStreak = localStorage.getItem("fitnessStreak");
      const streakData = savedStreak ? JSON.parse(savedStreak) : {};
      streakData[today] = true;
      localStorage.setItem("fitnessStreak", JSON.stringify(streakData));
      
      // Trigger custom event so StreakCalendar updates (works for same-window updates)
      window.dispatchEvent(new CustomEvent("streak-update"));
      
      toast({
        title: "Success!",
        description: "Your personalized fitness plan is ready!",
      });
    } catch (error) {
      // Silently handle errors - default plans should already be returned from API
      console.error("Error generating plans:", error);
      // Only show error if it's a critical configuration issue
      if (error instanceof Error && error.message.includes("not configured")) {
        toast({
          title: "Configuration Error",
          description: "Please configure API keys in .env file.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (userDetails) {
      generatePlans(userDetails);
    }
  };

  const handleBackToForm = () => {
    setShowPlans(false);
  };

  const handleBackToHome = () => {
    // Clear all state and localStorage
    setShowPlans(false);
    setUserDetails(null);
    setWorkoutPlan("");
    setDietPlan("");
    setMotivationPlan("");
    localStorage.removeItem("fitnessPlans");
  };

  // Load from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem("fitnessPlans");
    if (saved) {
      const data = JSON.parse(saved);
      setUserDetails(data.userDetails);
      setWorkoutPlan(data.workoutPlan);
      setDietPlan(data.dietPlan);
      setMotivationPlan(data.motivationPlan);
    }
  });

  return (
    <div className={`${!showPlans ? 'min-h-screen lg:h-screen md:h-screen overflow-auto lg:overflow-hidden md:overflow-hidden' : 'min-h-screen overflow-auto'} bg-gradient-to-br from-background via-background to-muted/20`}>
      <div className={`container mx-auto px-4 ${!showPlans ? 'py-1 lg:h-full md:h-full flex flex-col' : 'py-4'} relative`}>
        {!showPlans ? (
          <>
            {/* Motivational Quote with Animated Emoji */}
            <div className="mb-1 flex-shrink-0">
              <MotivationalQuote />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:flex-1 md:flex-1 w-full lg:min-h-0 md:min-h-0 lg:overflow-hidden md:overflow-hidden">
              <div className="lg:col-span-7 flex flex-col w-full lg:min-h-0 md:min-h-0 lg:overflow-hidden md:overflow-hidden">
                <UserForm onSubmit={generatePlans} isLoading={isLoading} />
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 gap-2 w-full lg:min-h-0 md:min-h-0 lg:overflow-hidden md:overflow-hidden">
                <div className="w-full lg:min-h-0 md:min-h-0 lg:overflow-hidden md:overflow-hidden">
                  <StreakCalendar />
                </div>
                <div className="w-full lg:min-h-0 md:min-h-0 lg:overflow-hidden md:overflow-hidden">
                  <SuggestedReads />
                </div>
              </div>
            </div>
            
            {/* Loading overlay with "Did you know?" facts */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                  <Card className="max-w-2xl mx-4 w-full">
                    <CardContent className="p-8 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-6"
                      >
                        <Sparkles className="w-12 h-12 text-primary" />
                      </motion.div>
                      
                      <motion.h2
                        key="loading-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                      >
                        Generating Your Personalized Plan...
                      </motion.h2>
                      
                      <motion.div
                        key={currentFactIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="mt-8 p-6 bg-muted/50 rounded-lg border border-primary/20"
                      >
                        <p className="text-lg text-foreground leading-relaxed">
                          {fitnessFacts[currentFactIndex]}
                        </p>
                      </motion.div>
                      
                      <div className="mt-8 flex justify-center gap-2">
                        {fitnessFacts.map((_, index) => (
                          <div
                            key={index}
                            className={`h-2 w-2 rounded-full transition-all ${
                              index === currentFactIndex
                                ? "bg-primary w-8"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlanDisplay
              workoutPlan={workoutPlan}
              dietPlan={dietPlan}
              motivationPlan={motivationPlan}
              onRegenerate={handleRegenerate}
              onBackToHome={handleBackToHome}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
