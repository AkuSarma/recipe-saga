"use client";
import { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface IngredientInputProps {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
}

export function IngredientInput({ ingredients, setIngredients }: IngredientInputProps) {
  const [currentIngredient, setCurrentIngredient] = useState('');

  const handleAddIngredient = () => {
    const trimmedIngredient = currentIngredient.trim();
    if (trimmedIngredient && !ingredients.some(ing => ing.toLowerCase() === trimmedIngredient.toLowerCase())) {
      setIngredients([...ingredients, trimmedIngredient]);
      setCurrentIngredient('');
    } else if (trimmedIngredient) {
      // Optionally, provide feedback that ingredient already exists
      console.warn("Ingredient already added or empty");
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredientToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="ingredient-input" className="text-sm font-medium">Add Ingredients</Label>
      <div className="flex gap-2">
        <Input
          id="ingredient-input"
          type="text"
          value={currentIngredient}
          onChange={(e) => setCurrentIngredient(e.target.value)}
          placeholder="E.g., Tomatoes, Onions, Garlic"
          onKeyDown={handleKeyDown}
          className="text-base"
        />
        <Button type="button" onClick={handleAddIngredient} variant="outline" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {ingredients.map((ingredient) => (
            <Badge key={ingredient} variant="secondary" className="py-1.5 px-3 text-sm rounded-full">
              {ingredient}
              <button
                type="button"
                onClick={() => handleRemoveIngredient(ingredient)}
                className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={`Remove ${ingredient}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
