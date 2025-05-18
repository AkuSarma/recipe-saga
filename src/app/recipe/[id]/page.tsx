
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RecipeDisplay } from '@/components/recipe/RecipeDisplay';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

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
  const { user, loading: authLoading } = useAuth();

  const [recipe, setRecipe] = useState<(GenerateRecipeOutput & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Recipe ID is missing.');
      setIsLoading(false);
      return;
    }

    if (authLoading) {
      setIsLoading(true); // Keep showing skeleton while auth is resolving
      return;
    }

    const fetchRecipeData = async () => {
      setIsLoading(true);
      setError(null);

      if (!db) {
        setError("Firestore is not available. Please try again later.");
        setIsLoading(false);
        return;
      }

      let docSnap;
      let fetchedData: GenerateRecipeOutput | null = null;
      let docPath = "";

      try {
        // Try fetching from publicExploreRecipes first
        docPath = `publicExploreRecipes/${id}`;
        const publicRecipeDocRef = doc(db, 'publicExploreRecipes', id);
        docSnap = await getDoc(publicRecipeDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          fetchedData = {
            title: data.title,
            instructions: data.instructions,
            imageUrl: data.imageUrl || `https://placehold.co/800x600.png?text=${encodeURIComponent(data.title || 'Recipe')}`,
            cookTime: data.cookTime,
            nutritionalInformation: data.nutritionalInformation,
          };
        } else if (user) {
          // If not in public and user is logged in, try fetching from user's savedRecipes
          docPath = `users/${user.uid}/savedRecipes/${id}`;
          const userRecipeDocRef = doc(db, 'users', user.uid, 'savedRecipes', id);
          docSnap = await getDoc(userRecipeDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            fetchedData = {
              title: data.title,
              instructions: data.instructions,
              imageUrl: data.imageUrl || `https://placehold.co/800x600.png?text=${encodeURIComponent(data.title || 'Recipe')}`,
              cookTime: data.cookTime,
              nutritionalInformation: data.nutritionalInformation,
            };
          }
        }

        if (fetchedData) {
          setRecipe({ ...fetchedData, id: id }); // Pass the original ID for context in RecipeDisplay
        } else {
          setError(`Recipe with ID "${id}" not found.`);
        }
      } catch (err: any) {
        console.error(`Failed to fetch recipe from ${docPath}:`, err);
        setError('Failed to load recipe details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipeData();
  }, [id, user, authLoading]);

  if (isLoading || authLoading) {
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
      {/* The 'id' prop on 'recipe' passed to RecipeDisplay is used for save/unsave/delete actions */}
      <RecipeDisplay recipe={recipe} />
    </div>
  );
}
