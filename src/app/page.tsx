
"use client";
import { useState } from 'react';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { RecipeForm } from '@/components/recipe/RecipeForm';
import { RecipeDisplay } from '@/components/recipe/RecipeDisplay';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Sparkles } from 'lucide-react'; 
import Image from 'next/image';

function RecipeDisplaySkeleton() {
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full aspect-[16/9] bg-muted">
           <Image src="https://picsum.photos/800/450" alt="Loading recipe image" layout="fill" objectFit="cover" className="animate-pulse" data-ai-hint="placeholder food" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md"></div>
          <div className="flex gap-4">
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded-md"></div>
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="p-6 flex justify-end bg-muted/30 border-t">
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecipeGenerated = (recipe: GenerateRecipeOutput | null, errorMsg?: string) => {
    setIsLoading(false);
    if (errorMsg) {
      setError(errorMsg);
      setGeneratedRecipe(null);
    } else if (recipe) {
      setGeneratedRecipe(recipe);
      setError(null);
    }
  };

  const handleFormSubmissionStart = () => {
    setIsLoading(true);
    setError(null);
    setGeneratedRecipe(null);
  };

  return (
    <div className="space-y-10">
      <RecipeForm 
        onRecipeGenerated={handleRecipeGenerated} 
        onSubmissionStart={handleFormSubmissionStart} 
      />
      
      {isLoading && (
        <>
          <Separator className="my-8" />
          <RecipeDisplaySkeleton />
        </>
      )}

      {!isLoading && generatedRecipe && (
        <>
          <Separator className="my-8" />
          <RecipeDisplay recipe={generatedRecipe} />
        </>
      )}

      {!isLoading && error && !generatedRecipe && (
         <>
          <Separator className="my-8" />
          <Card className="w-full max-w-3xl mx-auto border-destructive bg-destructive/10">
            <CardContent className="p-6 text-center text-destructive flex flex-col items-center gap-3">
              <AlertTriangle className="h-10 w-10" />
              <p className="font-semibold text-lg">Oops! Something went wrong.</p>
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && !generatedRecipe && !error && (
         <div className="text-center py-10 text-muted-foreground">
            <Sparkles className="mx-auto h-12 w-12 mb-4 text-primary/70" />
            <p className="text-lg">Ready to discover your next favorite dish?</p>
            <p>Add some ingredients above and let the magic happen!</p>
        </div>
      )}
    </div>
  );
}
