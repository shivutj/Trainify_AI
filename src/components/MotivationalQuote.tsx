import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";

const motivationalQuotes = [
  { emoji: "💪", quote: "Every workout is progress. Keep going!" },
  { emoji: "🔥", quote: "You're stronger than you think!" },
  { emoji: "🌟", quote: "Small steps lead to big transformations!" },
  { emoji: "⚡", quote: "Push through the pain, gain through the struggle!" },
  { emoji: "🎯", quote: "Your future self will thank you for starting today!" },
  { emoji: "🚀", quote: "Be stronger than your excuses!" },
  { emoji: "💎", quote: "Diamonds are made under pressure. So are you!" },
  { emoji: "🏆", quote: "Champions are made in the gym!" },
  { emoji: "✨", quote: "Every expert was once a beginner!" },
  { emoji: "🌱", quote: "Growth happens outside your comfort zone!" },
  { emoji: "🎨", quote: "Your body can do it. It's your mind you need to convince!" },
  { emoji: "⚡", quote: "Don't stop when you're tired. Stop when you're done!" },
];

export const MotivationalQuote = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 5000); // Change quote every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentQuote = motivationalQuotes[currentIndex];

  return (
    <Card className="w-full border-primary/20 shadow-lg relative">
      {/* Theme Toggle Button - Inside header */}
      <div className="absolute top-1 right-1 z-10">
        <ThemeToggle />
      </div>
      <CardContent className="p-2 py-3 pr-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-1"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="text-3xl mb-1"
            >
              {currentQuote.emoji}
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-semibold text-foreground leading-tight"
            >
              {currentQuote.quote}
            </motion.p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 pt-1">
              {motivationalQuotes.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 w-1.5"
                  }`}
                  initial={{ width: index === currentIndex ? 6 : 1.5 }}
                  animate={{ width: index === currentIndex ? 24 : 6 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

