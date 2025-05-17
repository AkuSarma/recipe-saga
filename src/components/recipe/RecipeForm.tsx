"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { IngredientInput } from './IngredientInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { handleGenerateRecipe } from '@/lib/actions';

interface RecipeFormProps {
  onRecipeGenerated: (recipe: GenerateRecipeOutput | null, error?: string) => void;
  onSubmissionStart: () => void;
}

export function RecipeForm({ onRecipeGenerated, onSubmissionStart }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ingredients.length === 0) {
      setFormError("Please add at least one ingredient.");
      onRecipeGenerated(null, "Please add at least one ingredient.");
      return;
    }
    
    onSubmissionStart(); // Notify parent that submission started
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await handleGenerateRecipe(ingredients);
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
          Enter the ingredients you have, and let our AI chef inspire you!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />
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
