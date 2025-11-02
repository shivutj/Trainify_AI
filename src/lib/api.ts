// API helper functions to call services directly
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface UserDetails {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  level: string;
  location: string;
  diet: string;
}

// Generate workout, diet, or motivation plan
export async function generatePlan(
  userDetails: UserDetails,
  planType: "workout" | "diet" | "motivation"
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured in .env file");
  }

  let prompt = "";
  let systemPrompt = "";

  if (planType === "workout") {
    systemPrompt = "You are Trainify AI, a certified fitness coach. Create detailed, realistic workout plans.";
    
    const formattingInstructions = `🧠 Formatting Instruction (for Gemini or any AI model):
Format all responses with clean Markdown syntax suitable for both web display and PDF export.
Follow these exact rules:
• Use - (dash) for bullet points — no emojis or special characters.
• Start all sections with clear headings using Markdown (#, ##, ###).
• Use bold for key points and italic for short descriptions.
• Maintain proper paragraph spacing and alignment — every section should be neatly separated.
• When listing items (like exercises), always use:

- **Exercise Name:** Reps, Sets, Rest
  *Description:* short one-line detail.

• Avoid unnecessary line breaks, random bullet icons (•), or markdown symbols like •, →, ►, etc.
• Keep everything grammatically correct and visually aligned.
• Example format:

## Important Considerations
- **Warm-up (5–10 mins):** Light cardio and stretching.
- **Cool-down (5–10 mins):** Static stretches to relax muscles.
- **Hydration:** Drink plenty of water before, during, and after exercise.

## Day 1: Full Body Circuit
- **Jumping Jacks:** 3 sets × 15 reps (30s rest)
  *Description:* Jump with feet apart, arms overhead.
- **Push-ups:** 3 sets AMRAP (45s rest)
  *Description:* Keep core tight, body straight.

Respond only with formatted Markdown text (no raw JSON, code, or styling tags).`;
    
    prompt = `${formattingInstructions}

Now create a detailed 7-day workout plan for:
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
    systemPrompt = "You are Trainify AI, a certified nutritionist. Create personalized, healthy diet plans.";
    
    const formattingInstructions = `🧠 Formatting Instruction (for Gemini or any AI model):
Format all responses with clean Markdown syntax suitable for both web display and PDF export.
Follow these exact rules:
• Use - (dash) for bullet points — no emojis or special characters.
• Start all sections with clear headings using Markdown (#, ##, ###).
• Use bold for key points and italic for short descriptions.
• Maintain proper paragraph spacing and alignment — every section should be neatly separated.
• When listing items (like meals), always use:

- **Meal Name:** Portion size, Calories
  *Description:* short one-line detail.

• Avoid unnecessary line breaks, random bullet icons (•), or markdown symbols like •, →, ►, etc.
• Keep everything grammatically correct and visually aligned.
• Example format:

## Breakfast
- **Oatmeal with Berries:** 1 cup cooked oats, 150 calories
  *Description:* High fiber, sustained energy release.

## Lunch
- **Grilled Chicken Salad:** 200g chicken, 300 calories
  *Description:* Lean protein with fresh vegetables.

Respond only with formatted Markdown text (no raw JSON, code, or styling tags).`;
    
    prompt = `${formattingInstructions}

Now create a personalized daily diet plan for:
Name: ${userDetails.name}, Age: ${userDetails.age}, Gender: ${userDetails.gender}
Goal: ${userDetails.goal}, Diet Type: ${userDetails.diet}

Include:
- Breakfast, Lunch, Dinner, and Snacks
- Portion sizes and approximate calories
- Timing suggestions
- Hydration and recovery advice

Make it specific, healthy, and tailored to their goal.`;
  } else if (planType === "motivation") {
    systemPrompt = "You are Trainify AI, a motivational fitness mentor. Provide encouraging, actionable advice.";
    
    const formattingInstructions = `🧠 Formatting Instruction (for Gemini or any AI model):
Format all responses with clean Markdown syntax suitable for both web display and PDF export.
Follow these exact rules:
• Use - (dash) for bullet points — no emojis or special characters.
• Start all sections with clear headings using Markdown (#, ##, ###).
• Use bold for key points and italic for short descriptions.
• Maintain proper paragraph spacing and alignment — every section should be neatly separated.
• When listing items (like tips), always use:

- **Tip Name:** Brief description
  *Note:* short one-line detail.

• Avoid unnecessary line breaks, random bullet icons (•), or markdown symbols like •, →, ►, etc.
• Keep everything grammatically correct and visually aligned.
• Example format:

## Motivational Quote
"Your body can do it. It's your mind you need to convince."

## Daily Tips
- **Morning Routine:** Start your day with 10 minutes of stretching
  *Note:* Helps improve flexibility and mental clarity.
- **Posture Check:** Keep your shoulders back and core engaged
  *Note:* Prevents back pain and improves confidence.

## Daily Affirmation
"I am strong, capable, and committed to my fitness journey."

Respond only with formatted Markdown text (no raw JSON, code, or styling tags).`;
    
    prompt = `${formattingInstructions}

Now based on the goal (${userDetails.goal}) and fitness level (${userDetails.level}), provide:
- 1 motivational quote
- 3 lifestyle or posture tips
- 1 daily affirmation

Keep it friendly, encouraging, and concise.`;
  }

  // Use Gemini API directly
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 403) {
      throw new Error("Invalid API key or insufficient permissions.");
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error("Invalid response format from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}

// Text to speech using browser's free Web Speech API
export async function textToSpeech(text: string, voice: string = "default"): Promise<void> {
  // Check if browser supports Web Speech API
  if (!("speechSynthesis" in window)) {
    throw new Error("Your browser does not support text-to-speech. Please use a modern browser like Chrome, Firefox, or Safari.");
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      utterance.rate = 1.0; // Speech rate (0.1 to 10)
      utterance.pitch = 1.0; // Pitch (0 to 2)
      utterance.volume = 1.0; // Volume (0 to 1)

      // Function to set voice and start speaking
      const startSpeaking = () => {
        // Try to set a voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Map voice preferences
          const voiceMap: Record<string, number> = {
            "female": 0,
            "male": 1,
            "default": 0,
          };

          const preferredVoiceType = voiceMap[voice.toLowerCase()] || 0;
          
          // Try to find a voice matching the preference
          const preferredVoice = voices.find(v => {
            if (preferredVoiceType === 0) {
              return v.name.toLowerCase().includes("female") || 
                     v.name.toLowerCase().includes("samantha") ||
                     v.name.toLowerCase().includes("zira") ||
                     v.name.toLowerCase().includes("sarah");
            } else {
              return v.name.toLowerCase().includes("male") || 
                     v.name.toLowerCase().includes("david") ||
                     v.name.toLowerCase().includes("mark") ||
                     v.name.toLowerCase().includes("alex");
            }
          });

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          } else {
            // Use default voice
            utterance.voice = voices[0];
          }
        }

        // Handle events
        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (event) => {
          const errorMsg = event.error || "unknown";
          reject(new Error(`Speech synthesis error: ${errorMsg}`));
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      };

      // Load voices if not already loaded (some browsers need this)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          startSpeaking();
        };
      } else {
        startSpeaking();
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to initialize text-to-speech"));
    }
  });
}

// Helper function to stop speech
export function stopSpeech(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

