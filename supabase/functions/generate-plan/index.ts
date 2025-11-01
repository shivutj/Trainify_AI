import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userDetails, planType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    let systemPrompt = "";

    if (planType === "workout") {
      systemPrompt = "You are a certified fitness coach. Create detailed, realistic workout plans.";
      prompt = `Create a detailed 7-day workout plan for:
Name: ${userDetails.name}, Age: ${userDetails.age}, Gender: ${userDetails.gender}
Height: ${userDetails.height} cm, Weight: ${userDetails.weight} kg
Goal: ${userDetails.goal}, Fitness Level: ${userDetails.level}, Location: ${userDetails.location}

Each day should include:
- Exercise name
- Sets, reps, rest time
- Equipment (if required)
- Short exercise description

Format as a structured plan with clear days and exercises. Keep it realistic and goal-oriented.`;
    } else if (planType === "diet") {
      systemPrompt = "You are a certified nutritionist. Create personalized, healthy diet plans.";
      prompt = `Create a personalized daily diet plan for:
Name: ${userDetails.name}, Age: ${userDetails.age}, Gender: ${userDetails.gender}
Goal: ${userDetails.goal}, Diet Type: ${userDetails.diet}

Include:
- Breakfast, Lunch, Dinner, and Snacks
- Portion sizes and approximate calories
- Timing suggestions
- Hydration and recovery advice

Make it specific, healthy, and tailored to their goal.`;
    } else if (planType === "motivation") {
      systemPrompt = "You are a motivational fitness mentor. Provide encouraging, actionable advice.";
      prompt = `Based on the goal (${userDetails.goal}) and fitness level (${userDetails.level}), provide:
- 1 motivational quote
- 3 lifestyle or posture tips
- 1 daily affirmation

Keep it friendly, encouraging, and concise.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedPlan = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ plan: generatedPlan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
