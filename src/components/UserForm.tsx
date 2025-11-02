import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Target, MapPin, Utensils } from "lucide-react";
import fitnessHero from "@/assets/fitness-hero.jpg";

export interface UserDetails {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  level: string;
  location: string;
  diet: string;
}

interface UserFormProps {
  onSubmit: (details: UserDetails) => void;
  isLoading: boolean;
}

export const UserForm = ({ onSubmit, isLoading }: UserFormProps) => {
  const [formData, setFormData] = useState<UserDetails>({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    level: "",
    location: "",
    diet: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof UserDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={fitnessHero} 
          alt="Fitness gym" 
          className="w-full h-full object-cover opacity-20 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl mx-auto p-2 sm:p-2 md:p-2 flex flex-col"
      >
      <Card className="shadow-[var(--shadow-card)] w-full flex flex-col">
        <CardHeader className="text-center space-y-1 pb-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Dumbbell className="w-10 h-10 mx-auto text-primary" />
          </motion.div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Trainify AI
          </CardTitle>
          <CardDescription className="text-sm">
            Get your personalized workout and diet plan powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 px-4 sm:px-6 flex-1 flex flex-col">
          <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Personal Info */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your Name"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="age" className="text-xs">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder="23"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                  <SelectTrigger id="gender" className="h-9 text-sm">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="height" className="text-xs">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  placeholder="150"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="62"
                  className="h-9 text-sm"
                  required
                />
              </div>

              {/* Fitness Goals */}
              <div className="space-y-1">
                <Label htmlFor="goal" className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3" />
                  Fitness Goal
                </Label>
                <Select value={formData.goal} onValueChange={(value) => updateField("goal", value)}>
                  <SelectTrigger id="goal" className="h-9 text-sm">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="level" className="text-xs">Fitness Level</Label>
                <Select value={formData.level} onValueChange={(value) => updateField("level", value)}>
                  <SelectTrigger id="level" className="h-9 text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  Workout Location
                </Label>
                <Select value={formData.location} onValueChange={(value) => updateField("location", value)}>
                  <SelectTrigger id="location" className="h-9 text-sm">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="diet" className="flex items-center gap-1 text-xs">
                  <Utensils className="w-3 h-3" />
                  Dietary Preference
                </Label>
                <Select value={formData.diet} onValueChange={(value) => updateField("diet", value)}>
                  <SelectTrigger id="diet" className="h-9 text-sm">
                    <SelectValue placeholder="Select diet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1"></div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1 mt-auto">
              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold shadow-[var(--shadow-glow)]"
                disabled={isLoading}
              >
                {isLoading ? "Generating Your Plan..." : "Generate My AI Plan"}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
};
