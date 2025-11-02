import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";

interface BlogLink {
  title: string;
  url: string;
  category: string;
}

const suggestedBlogs: BlogLink[] = [
  {
    title: "10 Essential Workout Tips for Beginners",
    url: "https://www.healthline.com/health/exercise-fitness/workout-tips-for-beginners",
    category: "Fitness",
  },
  {
    title: "The Ultimate Guide to Muscle Building Nutrition",
    url: "https://www.bodybuilding.com/content/muscle-building-nutrition-guide.html",
    category: "Nutrition",
  },
  {
    title: "How to Create a Sustainable Workout Routine",
    url: "https://www.self.com/story/how-to-create-sustainable-workout-routine",
    category: "Wellness",
  },
  {
    title: "Pre and Post Workout Meal Ideas",
    url: "https://www.eatwell101.com/pre-post-workout-meals",
    category: "Nutrition",
  },
  {
    title: "Best Exercises for Weight Loss",
    url: "https://www.webmd.com/fitness-exercise/features/best-exercises-weight-loss",
    category: "Fitness",
  },
  {
    title: "Understanding Macros: A Complete Guide",
    url: "https://www.healthline.com/nutrition/how-to-count-macros",
    category: "Nutrition",
  },
];

export const SuggestedReads = () => {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <BookOpen className="w-4 h-4 text-primary" />
          Suggested Reads
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-2">
          {suggestedBlogs.map((blog, index) => (
            <motion.a
              key={index}
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block p-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">
                    {blog.category}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
              </div>
            </motion.a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

