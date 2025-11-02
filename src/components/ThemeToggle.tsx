import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === "system") {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        setIsDark(theme === "dark");
      }
    };

    updateTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg p-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative h-9 w-9 hover:bg-muted/50 rounded-md"
        aria-label="Toggle theme"
        title={`Current: ${theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}`}
      >
        <div className="relative w-[1.2rem] h-[1.2rem] flex items-center justify-center">
          <Sun className={`h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"}`} />
          <Moon className={`h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"}`} />
        </div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}

