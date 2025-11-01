import { useState } from "react";
import { UserForm, UserDetails } from "@/components/UserForm";
import { PlanDisplay } from "@/components/PlanDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Index = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [dietPlan, setDietPlan] = useState("");
  const [motivationPlan, setMotivationPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const { toast } = useToast();

  const generatePlans = async (details: UserDetails) => {
    setIsLoading(true);
    setUserDetails(details);

    try {
      // Generate all three plans in parallel
      const [workoutResponse, dietResponse, motivationResponse] = await Promise.all([
        supabase.functions.invoke("generate-plan", {
          body: { userDetails: details, planType: "workout" },
        }),
        supabase.functions.invoke("generate-plan", {
          body: { userDetails: details, planType: "diet" },
        }),
        supabase.functions.invoke("generate-plan", {
          body: { userDetails: details, planType: "motivation" },
        }),
      ]);

      if (workoutResponse.error) throw workoutResponse.error;
      if (dietResponse.error) throw dietResponse.error;
      if (motivationResponse.error) throw motivationResponse.error;

      setWorkoutPlan(workoutResponse.data.plan);
      setDietPlan(dietResponse.data.plan);
      setMotivationPlan(motivationResponse.data.plan);

      // Save to localStorage
      localStorage.setItem("fitnessPlans", JSON.stringify({
        userDetails: details,
        workoutPlan: workoutResponse.data.plan,
        dietPlan: dietResponse.data.plan,
        motivationPlan: motivationResponse.data.plan,
      }));

      setShowPlans(true);
      toast({
        title: "Success!",
        description: "Your personalized fitness plan is ready!",
      });
    } catch (error) {
      console.error("Error generating plans:", error);
      toast({
        title: "Error",
        description: "Failed to generate plans. Please try again.",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8">
        {!showPlans ? (
          <UserForm onSubmit={generatePlans} isLoading={isLoading} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlanDisplay
              workoutPlan={workoutPlan}
              dietPlan={dietPlan}
              motivationPlan={motivationPlan}
              onRegenerate={handleRegenerate}
            />
            <div className="text-center mt-6">
              <button
                onClick={handleBackToForm}
                className="text-muted-foreground hover:text-foreground underline"
              >
                ← Back to Form
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
