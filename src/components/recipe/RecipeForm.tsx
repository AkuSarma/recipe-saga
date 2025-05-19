
"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { IngredientInput } from './IngredientInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { handleGenerateRecipe } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface RecipeFormProps {
  onRecipeGenerated: (recipe: GenerateRecipeOutput | null, error?: string) => void;
  onSubmissionStart: () => void;
}

const moods = ["Happy", "Comforting", "Energetic", "Quick & Easy", "Adventurous", "Calm"];
type DietaryPreference = "Veg" | "Non-Veg" | "Any";

export function RecipeForm({ onRecipeGenerated, onSubmissionStart }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("Any");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ingredients.length === 0) {
      setFormError("Please add at least one ingredient.");
      onRecipeGenerated(null, "Please add at least one ingredient.");
      return;
    }
    
    onSubmissionStart();
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await handleGenerateRecipe(
        ingredients,
        selectedMood || undefined, // Send undefined if no mood selected
        dietaryPreference
      );
      if ('error' in result) {
        onRecipeGenerated(null, result.error);
        setFormError(result.error);
      } else {
        onRecipeGenerated(result);
      }
    } catch (e: any) {
      const errorMessage = e.message || "Failed to generate recipe.";
      onRecipeGenerated(null, errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-semibold text-foreground">Craft Your Next Meal</CardTitle>
        <CardDescription className="text-muted-foreground">
          Match your mood and taste! Enter ingredients, select your mood and dietary preference, and let our AI chef inspire you!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />

          <div className="space-y-2">
            <Label htmlFor="mood-select">What's your mood?</Label>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger id="mood-select" className="w-full">
                <SelectValue placeholder="Select a mood (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Surprise Me!)</SelectItem>
                {moods.map(mood => (
                  <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dietary Preference</Label>
            <RadioGroup
              value={dietaryPreference}
              onValueChange={(value) => setDietaryPreference(value as DietaryPreference)}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Any" id="diet-any" />
                <Label htmlFor="diet-any" className="font-normal">Any</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Veg" id="diet-veg" />
                <Label htmlFor="diet-veg" className="font-normal">Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Non-Veg" id="diet-nonveg" />
                <Label htmlFor="diet-nonveg" className="font-normal">Non-Vegetarian</Label>
              </div>
            </RadioGroup>
          </div>
          
          {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
          <div className="flex justify-center pt-2">
             <Button 
                type="submit" 
                disabled={isLoading || ingredients.length === 0} 
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base rounded-lg shadow-md transition-transform hover:scale-105"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Generate Recipe
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
