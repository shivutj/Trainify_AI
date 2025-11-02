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

// Cache for API responses
const planCache = new Map<string, { workout: string; diet: string; motivation: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate default plans (used when API fails)
function generateDefaultPlans(userDetails: UserDetails): { workout: string; diet: string; motivation: string } {
  const goal = userDetails.goal || 'maintenance';
  const level = userDetails.level || 'beginner';
  const diet = userDetails.diet || 'non-vegetarian';
  
  const workoutPlan = `## Day 1: Full Body Strength
- **Push-ups:** 3×12 (60s rest)
  *Description:* Keep your core tight and body in a straight line throughout the movement.
- **Squats:** 3×15 (60s rest)
  *Description:* Lower your body as if sitting back into a chair, keeping knees behind toes.
- **Plank:** 3×30s (45s rest)
  *Description:* Hold your body in a straight line from head to heels.

## Day 2: Upper Body Focus
- **Dumbbell Rows:** 3×10 (60s rest)
  *Description:* Pull weights toward your lower chest, squeezing shoulder blades together.
- **Shoulder Press:** 3×10 (60s rest)
  *Description:* Press weights overhead with control, keeping core engaged.
- **Tricep Dips:** 3×12 (45s rest)
  *Description:* Lower body by bending elbows, keeping them close to your sides.

## Day 3: Lower Body & Core
- **Lunges:** 3×12 each leg (60s rest)
  *Description:* Step forward and lower your back knee toward the ground.
- **Deadlifts:** 3×10 (60s rest)
  *Description:* Hinge at hips, keeping back straight and chest up.
- **Mountain Climbers:** 3×20 (45s rest)
  *Description:* Alternate bringing knees toward chest in a running motion.

## Day 4: Cardio & Endurance
- **Jumping Jacks:** 3×20 (30s rest)
  *Description:* Jump feet apart while raising arms overhead.
- **Burpees:** 3×10 (60s rest)
  *Description:* Squat down, jump back to plank, do push-up, jump forward, jump up.
- **High Knees:** 3×30s (30s rest)
  *Description:* Run in place, bringing knees up toward chest.

## Day 5: Full Body Circuit
- **Kettlebell Swings:** 3×15 (60s rest)
  *Description:* Swing weight from between legs to chest height using hip drive.
- **Pull-ups:** 3×8 (60s rest)
  *Description:* Pull your body up until chin clears the bar, lower with control.
- **Russian Twists:** 3×20 each side (45s rest)
  *Description:* Rotate torso side to side while holding a weight or body.

## Day 6: Active Recovery
- **Light Jogging:** 20 minutes (continuous)
  *Description:* Maintain a comfortable pace where you can hold a conversation.
- **Yoga Stretches:** 15 minutes (continuous)
  *Description:* Focus on holding stretches for 30 seconds each, breathing deeply.
- **Walking:** 10 minutes (continuous)
  *Description:* Take a relaxed walk to promote blood flow and recovery.

## Day 7: Rest Day
Rest and recovery are essential for muscle growth and preventing injury.`;

  const dietPlan = `## Breakfast
- **Oatmeal with Berries:** 1 cup cooked oats with fresh mixed berries
- **Scrambled Eggs:** 2 whole eggs with vegetables
- **Greek Yogurt:** 1 cup with honey and nuts

## Lunch
- **Grilled Chicken Salad:** 200g chicken breast with mixed greens
- **Quinoa Bowl:** 1 cup quinoa with roasted vegetables
- **Brown Rice with Fish:** 150g fish with 1 cup brown rice

## Dinner
- **Salmon with Sweet Potato:** 200g salmon with roasted sweet potato
- **Vegetable Stir-fry:** Mixed vegetables with lean protein
- **Lentil Soup:** 1 bowl with whole grain bread`;

  const motivationPlan = `## Motivational Quote
"Success is the sum of small efforts repeated day in and day out."

## Daily Tips
- **Morning Routine:** Start your day with 10 minutes of stretching and deep breathing
- **Stay Hydrated:** Drink at least 8 glasses of water throughout the day

## Daily Affirmation
"I am capable, strong, and committed to achieving my fitness goals."`;

  return { workout: workoutPlan, diet: dietPlan, motivation: motivationPlan };
}

// Generate all three plans in ONE API call (optimized for hackathon)
export async function generateAllPlans(userDetails: UserDetails): Promise<{ workout: string; diet: string; motivation: string }> {
  // Check cache first
  const cacheKey = JSON.stringify(userDetails);
  const cached = planCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("Using cached plans");
    return { workout: cached.workout, diet: cached.diet, motivation: cached.motivation };
  }

  // If no API key, silently use defaults
  if (!GEMINI_API_KEY) {
    console.log("No API key found, using default plans");
    const defaultPlans = generateDefaultPlans(userDetails);
    planCache.set(cacheKey, { ...defaultPlans, timestamp: Date.now() });
    return defaultPlans;
  }

  const formattingInstructions = `Format: Use Markdown. - **Item:** Details. No emojis or special chars.`;

  const systemPrompt = "Create short fitness plans.";
  
  const prompt = `${formattingInstructions}

Plan for: ${userDetails.name}, ${userDetails.age}, ${userDetails.gender}, ${userDetails.height}cm, ${userDetails.weight}kg, Goal: ${userDetails.goal}, Level: ${userDetails.level}, Diet: ${userDetails.diet}

Separate with "===WORKOUT===" "===DIET===" "===MOTIVATION===":

1. WORKOUT: 7 days, 3 exercises/day max.
   Format each day clearly:
   ## Day 1: Full Body
   - **Exercise 1:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   - **Exercise 2:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   - **Exercise 3:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   
   ## Day 2: Upper Body
   - **Exercise 1:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   - **Exercise 2:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   - **Exercise 3:** Sets×Reps (Rest)
     *Description:* Brief one-line description of the exercise.
   
   Continue for all 7 days. Add brief one-line descriptions after each exercise.

2. DIET: Breakfast, Lunch, Dinner only. Format: - **Meal:** Portion. No calories/descriptions.

3. MOTIVATION: 1 quote, 2 tips, 1 affirmation. One line each.

Keep it SHORT. Separate each day clearly with ## Day X: heading.`;

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
    // On any API error, silently use default plans (no error indication to user)
    console.log("API request failed, using default plans");
    const defaultPlans = generateDefaultPlans(userDetails);
    planCache.set(cacheKey, { ...defaultPlans, timestamp: Date.now() });
    return defaultPlans;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    // On parse error, silently use defaults
    console.log("Failed to parse API response, using default plans");
    const defaultPlans = generateDefaultPlans(userDetails);
    planCache.set(cacheKey, { ...defaultPlans, timestamp: Date.now() });
    return defaultPlans;
  }
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    // On invalid response format, silently use defaults
    console.log("Invalid API response format, using default plans");
    const defaultPlans = generateDefaultPlans(userDetails);
    planCache.set(cacheKey, { ...defaultPlans, timestamp: Date.now() });
    return defaultPlans;
  }

  const fullText = data.candidates[0].content.parts[0].text;
  
  // Parse the response into three sections
  const workoutMatch = fullText.split(/===WORKOUT===/)[1]?.split(/===DIET===/)[0]?.trim();
  const dietMatch = fullText.split(/===DIET===/)[1]?.split(/===MOTIVATION===/)[0]?.trim();
  const motivationMatch = fullText.split(/===MOTIVATION===/)[1]?.trim();

  // Fallback parsing if delimiters aren't found
  let workout = workoutMatch || fullText.split("# Workout")[1]?.split("# Diet")[0]?.trim();
  let diet = dietMatch || fullText.split("# Diet")[1]?.split("# Motivation")[0]?.trim() || fullText.split("## Diet")[1]?.split("## Motivation")[0]?.trim();
  let motivation = motivationMatch || fullText.split("# Motivation")[1]?.trim() || fullText.split("## Motivation")[1]?.trim();

  // If parsing failed, use defaults
  if (!workout || !diet || !motivation) {
    console.log("Failed to parse plan sections, using default plans");
    const defaultPlans = generateDefaultPlans(userDetails);
    planCache.set(cacheKey, { ...defaultPlans, timestamp: Date.now() });
    return defaultPlans;
  }

  // Clean up any extra text
  workout = workout.split("===DIET===")[0].trim();
  diet = diet.split("===MOTIVATION===")[0].trim();
  motivation = motivation.split("===WORKOUT===")[0].split("===DIET===")[0].trim();

  const result = { workout, diet, motivation };

  // Cache the result
  planCache.set(cacheKey, { ...result, timestamp: Date.now() });
  
  // Limit cache size (keep last 10 entries)
  if (planCache.size > 10) {
    const firstKey = planCache.keys().next().value;
    planCache.delete(firstKey);
  }

  return result;
}

// Generate workout, diet, or motivation plan (kept for backward compatibility)
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
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. You've used all 50 free requests for today. The quota resets tomorrow, or upgrade to a paid plan for higher limits.");
      }
      if (response.status === 403) {
        throw new Error("Invalid API key or insufficient permissions.");
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    console.error("Gemini API error:", response.status, errorData);
    
    if (response.status === 429) {
      // Extract retry delay from error response if available
      let retryMessage = "You've exceeded the free tier limit of 50 requests per day.";
      const retryInfo = errorData.error?.details?.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
      if (retryInfo?.retryDelay) {
        // retryDelay can be a string like "38s" or a number in seconds
        let delaySeconds = typeof retryInfo.retryDelay === 'string' 
          ? parseFloat(retryInfo.retryDelay.replace('s', ''))
          : parseFloat(retryInfo.retryDelay);
        // If it's milliseconds, divide by 1000
        if (delaySeconds > 1000) delaySeconds = delaySeconds / 1000;
        const seconds = Math.ceil(delaySeconds);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
          retryMessage += ` Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}` : ''}, or upgrade to a paid plan for higher limits.`;
        } else {
          retryMessage += ` Please try again in ${seconds} second${seconds > 1 ? 's' : ''}, or upgrade to a paid plan for higher limits.`;
        }
      } else {
        retryMessage += " The quota resets tomorrow, or you can upgrade to a paid plan for higher limits.";
      }
      throw new Error(retryMessage);
    }
    
    if (response.status === 403) {
      throw new Error("Invalid API key or insufficient permissions. Please check your API key configuration.");
    }
    
    const errorMessage = errorData.error?.message || `Gemini API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error("Invalid response format from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}

// Text to speech using Puter.js free TTS API
export async function textToSpeech(text: string, voice: string = "default"): Promise<HTMLAudioElement> {
  // Check if Puter.js is loaded
  if (typeof window !== 'undefined' && window.puter?.ai?.txt2speech) {
    try {
      const audio = await window.puter.ai.txt2speech(text, {
        engine: "neural",
        language: "en-US",
        voice: "Joanna",
      });
      return audio;
    } catch (error) {
      throw new Error(`Puter.js TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    throw new Error("Puter.js is not loaded. Please ensure the script is included in your HTML.");
  }
}

// Helper function to stop speech
export function stopSpeech(audio?: HTMLAudioElement): void {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

