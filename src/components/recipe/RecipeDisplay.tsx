"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Clock, Flame, Heart, BookOpenText, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput;
}

export function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  const { toast } = useToast();

  const handleSaveRecipe = () => {
    // Placeholder for actual save logic
    console.log("Saving recipe:", recipe.title);
    toast({
      title: "Recipe Saved!",
      description: `${recipe.title} has been saved to your collection.`,
      variant: "default",
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden border-border">
      <CardHeader className="p-0">
        <div className="relative w-full h-64 md:h-80 xl:h-96">
          <Image
            src={recipe.imageUrl || `https://placehold.co/800x600.png?text=${encodeURIComponent(recipe.title)}`}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint="recipe food"
            priority
          />
        </div>
        <div className="p-6">
          <CardTitle className="text-3xl lg:text-4xl font-bold mb-3 text-foreground">{recipe.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {recipe.cookTime && (
              <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 border-primary/50 text-primary">
                <Clock className="h-4 w-4" />
                <span>{recipe.cookTime}</span>
              </Badge>
            )}
            {/* Placeholder for difficulty or servings if AI provides it */}
             <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 border-accent/50 text-accent">
                <Info className="h-4 w-4" />
                <span>Details may vary</span>
              </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div>
          <h3 className="text-2xl font-semibold mb-3 flex items-center text-primary">
            <BookOpenText className="mr-2.5 h-6 w-6" />
            Instructions
          </h3>
          <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
            {recipe.instructions || "No instructions provided."}
          </div>
        </div>
        
        {recipe.nutritionalInformation && (
          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center text-primary">
              <Flame className="mr-2.5 h-6 w-6" />
              Nutritional Information
            </h3>
            <p className="text-sm sm:text-base text-foreground/90 whitespace-pre-line leading-relaxed">
              {recipe.nutritionalInformation}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end p-6 bg-muted/30 border-t">
        <Button onClick={handleSaveRecipe} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg shadow-md transition-transform hover:scale-105">
          <Heart className="mr-2 h-5 w-5" /> Save Recipe
        </Button>
      </CardFooter>
    </Card>
  );
}
