"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RecipeDisplay } from '@/components/recipe/RecipeDisplay';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

// Mock function to simulate fetching recipe details
const mockRecipeDatabase: Record<string, GenerateRecipeOutput> = {
  '1': {
    title: 'Spaghetti Carbonara Classic',
    instructions: '1. Cook 200g spaghetti according to package directions.\n2. While pasta cooks, fry 100g pancetta or guanciale until crispy. Remove from pan, leave fat.\n3. In a bowl, whisk 2 large egg yolks, 1 whole egg, 50g grated Pecorino Romano, and a pinch of black pepper.\n4. Drain pasta, reserving some pasta water. Add pasta to the pan with pancetta fat. Toss.\n5. Remove from heat. Quickly mix in egg mixture. If too thick, add a bit of pasta water.\n6. Stir in crispy pancetta. Serve immediately with more cheese and pepper.',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '30 mins',
    nutritionalInformation: 'Approx. Calories: 600 per serving\nProtein: 30g, Carbs: 50g, Fat: 30g\n(Values are estimates and can vary based on specific ingredients and portion sizes.)',
  },
  '2': {
    title: 'Avocado Toast Deluxe',
    instructions: '1. Toast 2 slices of your favorite bread until golden brown.\n2. Mash 1 ripe avocado in a bowl. Season with salt, pepper, and a squeeze of lime juice.\n3. Spread avocado mixture evenly on toasts.\n4. Top with your choice of: feta cheese, red pepper flakes, a poached egg, or smoked salmon.\n5. Garnish with fresh herbs like cilantro or chives.',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '10 mins',
    nutritionalInformation: 'Approx. Calories: 350 (without egg/salmon)\nProtein: 10g, Carbs: 35g, Fat: 20g\n(Rich in healthy fats and fiber.)',
  },
   '3': {
    title: 'Chocolate Lava Cake',
    instructions: '1. Preheat oven to 425°F (220°C). Grease and flour 2 ramekins.\n2. Melt 4 oz bittersweet chocolate and 4 tbsp unsalted butter together. Stir until smooth.\n3. In a separate bowl, whisk 1 large egg, 1 egg yolk, 2 tbsp granulated sugar, and 1/2 tsp vanilla extract until pale.\n4. Gently fold chocolate mixture into egg mixture. Then, fold in 1 tbsp all-purpose flour.\n5. Divide batter between ramekins. Bake for 12-14 minutes until edges are set but center is soft.\n6. Let cool for a minute, then invert onto plates. Serve with berries or ice cream.',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '25 mins',
    nutritionalInformation: 'Approx. Calories: 450 per cake\n(A decadent treat, enjoy in moderation!)',
  },
  // Add other recipes to match explore page for navigation
   '4': {
    title: 'Grilled Salmon with Asparagus',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '40 mins',
    instructions: 'Detailed instructions for salmon...',
    nutritionalInformation: 'Nutritional info for salmon...'
  },
  '5': {
    title: 'Vegan Buddha Bowl Extravaganza',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '35 mins',
    instructions: 'Detailed instructions for buddha bowl...',
    nutritionalInformation: 'Nutritional info for buddha bowl...'
  },
  '6': {
    title: 'Classic Beef Tacos Fiesta',
    imageUrl: 'https://placehold.co/800x600.png',
    cookTime: '45 mins',
    instructions: 'Detailed instructions for tacos...',
    nutritionalInformation: 'Nutritional info for tacos...'
  }
};

async function fetchRecipeDetails(id: string): Promise<GenerateRecipeOutput | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockRecipeDatabase[id] || null;
}

// Skeleton for RecipeDisplay on detail page
function RecipeDetailSkeleton() {
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="relative w-full h-64 md:h-80 xl:h-96" />
        <div className="p-6">
          <Skeleton className="h-10 w-3/4 mb-3" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div>
          <Skeleton className="h-8 w-1/3 mb-3" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-5/6 mb-2" />
        </div>
        <div>
          <Skeleton className="h-8 w-1/3 mb-3" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
      <CardContent className="flex justify-end p-6 bg-muted/30 border-t">
         <Skeleton className="h-12 w-40 rounded-lg" />
      </CardContent>
    </Card>
  );
}


export default function RecipeDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [recipe, setRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      fetchRecipeDetails(id)
        .then(data => {
          if (data) {
            setRecipe(data);
          } else {
            setError(`Recipe with ID "${id}" not found.`);
          }
        })
        .catch(err => {
          console.error('Failed to fetch recipe:', err);
          setError('Failed to load recipe details. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (params.id) { // If params.id exists but is not a string (e.g. string[])
        setError('Invalid recipe ID format.');
        setIsLoading(false);
    } else { // If params.id is undefined
        // This case should ideally not happen with typical routing
        setError('Recipe ID is missing.');
        setIsLoading(false);
    }
  }, [id, params.id]);

  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Error Loading Recipe</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!recipe) {
     // This state should ideally be covered by the error state from fetchRecipeDetails
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Recipe Not Available</h2>
        <p className="text-muted-foreground">The recipe you are looking for could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <RecipeDisplay recipe={recipe} />
    </div>
  );
}
