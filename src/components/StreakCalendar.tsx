import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar } from "lucide-react";

interface StreakData {
  [date: string]: boolean; // date in YYYY-MM-DD format
}

export const StreakCalendar = () => {
  const [streakData, setStreakData] = useState<StreakData>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Load and refresh streak data from localStorage
  const loadStreakData = () => {
    const saved = localStorage.getItem("fitnessStreak");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStreakData(data);
        calculateStreaks(data);
      } catch (e) {
        console.error("Error loading streak data:", e);
      }
    }
  };

  // Load streak data on mount
  useEffect(() => {
    loadStreakData();
  }, []);

  // Listen for storage changes and custom events (for same-window updates)
  useEffect(() => {
    const handleStorageChange = () => {
      loadStreakData();
    };
    
    const handleStreakUpdate = () => {
      loadStreakData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("streak-update", handleStreakUpdate);
    
    // Also check periodically (in case of same-window updates)
    const interval = setInterval(() => {
      loadStreakData();
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("streak-update", handleStreakUpdate);
      clearInterval(interval);
    };
  }, []);

  const calculateStreaks = (data: StreakData) => {
    const dates = Object.keys(data)
      .filter((date) => data[date])
      .sort()
      .reverse();

    if (dates.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    // Calculate current streak
    let current = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if today or yesterday is in the list
    let checkDate = dates[0] === today || dates[0] === yesterdayStr ? dates[0] : null;
    
    if (checkDate) {
      for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i] + "T00:00:00");
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (
          date.getTime() === expectedDate.getTime() ||
          date.getTime() === expectedDate.getTime() - 86400000
        ) {
          current++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longest = 1;
    let tempLongest = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1] + "T00:00:00");
      const currDate = new Date(dates[i] + "T00:00:00");
      const diffDays = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempLongest++;
      } else {
        longest = Math.max(longest, tempLongest);
        tempLongest = 1;
      }
    }
    longest = Math.max(longest, tempLongest);

    setCurrentStreak(current);
    setLongestStreak(longest);
  };

  // Get last 14 days for calendar display (more compact)
  const getLast14Days = () => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = date.getDate();
      const isToday = i === 0;
      const hasStreak = streakData[dateStr] || false;

      days.push({
        date: dateStr,
        dayName,
        dayNum,
        isToday,
        hasStreak,
      });
    }
    return days;
  };

  const days = getLast14Days();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-1.5 pt-2 px-2">
        <CardTitle className="flex items-center gap-1.5 text-xs">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          Workout Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-2 pb-2 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Streak Stats */}
        <div className="flex gap-2 justify-center flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-lg font-bold text-primary">{currentStreak}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Current</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Calendar className="w-3 h-3 text-secondary" />
              <span className="text-lg font-bold text-secondary">{longestStreak}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Longest</p>
          </div>
        </div>

        {/* Calendar Grid - More compact */}
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {/* Day headers */}
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-[9px] font-medium text-muted-foreground py-0.5"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, idx) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-sm border
                ${
                  day.hasStreak
                    ? "bg-orange-500/20 border-orange-500 shadow-sm shadow-orange-500/30"
                    : day.isToday
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border"
                }
                ${day.isToday ? "ring-1 ring-primary" : ""}
              `}
            >
              {day.hasStreak ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="w-3 h-3 text-orange-500" fill="currentColor" />
                </motion.div>
              ) : (
                <span
                  className={`text-[9px] font-medium ${
                    day.isToday ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {day.dayNum}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Legend - More compact */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground pt-1 border-t flex-shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/20 border border-orange-500 flex items-center justify-center">
              <Flame className="w-1.5 h-1.5 text-orange-500" fill="currentColor" />
            </div>
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/10 border border-primary"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30 border border-border"></div>
            <span>Rest</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

