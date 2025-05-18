
"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Clock, Flame, Heart, BookOpenText, Info, Loader2, Trash2 } from 'lucide-react'; // Added Trash2
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config'; // For client-side SDK
import { collection, query, where, getDocs, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';


interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput & { id?: string }; // id is optional, will be present for saved recipes
  isSavedRecipe?: boolean; // To indicate if this recipe is already saved (e.g. on profile page)
  onDelete?: (recipeId: string) => void; // Callback for deleting a saved recipe
}

export function RecipeDisplay({ recipe, isSavedRecipe = false, onDelete }: RecipeDisplayProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(isSavedRecipe);
  const [savedRecipeId, setSavedRecipeId] = useState<string | undefined>(recipe.id);


  // Check if the current recipe (by title and cookTime for instance) is already saved by this user
  useEffect(() => {
    if (isSavedRecipe || !user || !recipe.title || !db) return; 

    const checkSavedStatus = async () => {
      try {
        const q = query(
          collection(db, "users", user.uid, "savedRecipes"),
          where("title", "==", recipe.title),
          // where("cookTime", "==", recipe.cookTime) // Consider adding more fields for uniqueness
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setAlreadySaved(true);
          setSavedRecipeId(querySnapshot.docs[0].id);
        } else {
          setAlreadySaved(false);
          setSavedRecipeId(undefined);
        }
      } catch (error) {
        console.error("[RecipeDisplay] Error checking saved status:", error);
      }
    };
    checkSavedStatus();
  }, [user, recipe.title, recipe.cookTime, isSavedRecipe]);


  const handleSaveRecipe = async () => {
    console.log('[RecipeDisplay] handleSaveRecipe: Function called.');
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to save recipes.', variant: 'destructive' });
      console.log('[RecipeDisplay] handleSaveRecipe: User not authenticated.');
      return;
    }
    console.log('[RecipeDisplay] handleSaveRecipe: User authenticated:', user.uid, user.displayName);
    if (!db) {
      toast({ title: 'Database Error', description: 'Firestore is not available. Please try again later.', variant: 'destructive' });
      console.log('[RecipeDisplay] handleSaveRecipe: Firestore (db) not available.');
      return;
    }
    console.log('[RecipeDisplay] handleSaveRecipe: Firestore (db) available.');
    
    console.log('[RecipeDisplay] handleSaveRecipe: Initial state - AlreadySaved:', alreadySaved, 'SavedRecipeId:', savedRecipeId);

    if (alreadySaved && savedRecipeId) { 
      console.log('[RecipeDisplay] handleSaveRecipe: Recipe already saved by user, proceeding to unsave.');
      await handleDeleteRecipe(savedRecipeId, true); // true indicates it's an unsave action
      return;
    }

    setIsSaving(true);
    console.log('[RecipeDisplay] handleSaveRecipe: Proceeding to save new recipe.');
    try {
      const batch = writeBatch(db);

      const baseRecipeData = {
        title: recipe.title,
        instructions: recipe.instructions,
        cookTime: recipe.cookTime,
        nutritionalInformation: recipe.nutritionalInformation,
      };
      console.log('[RecipeDisplay] handleSaveRecipe: Base recipe data:', JSON.stringify(baseRecipeData));


      // 1. Save to user's private collection
      const userRecipeRef = doc(collection(db, 'users', user.uid, 'savedRecipes'));
      const recipeDataToSaveForUser: any = {
        ...baseRecipeData,
        userId: user.uid,
        savedAt: serverTimestamp(),
      };

      // Handle imageUrl: if it's a data URI, we might store a placeholder or skip it for user's direct save.
      // For now, if it's a data URI, let's save a note but not the URI itself to prevent large docs.
      // The actual image is generated and displayed on the client already.
      if (recipe.imageUrl && recipe.imageUrl.startsWith('data:image')) {
        recipeDataToSaveForUser.originalImageUrl = `placeholder:generatedImage-${Date.now()}`; 
        // We don't set 'imageUrl' to the data URI here to avoid Firestore document size issues.
        // The component already displays the data URI from the 'recipe' prop.
        console.log("[RecipeDisplay] User Save: Image is a data URI. Not saving full data URI to user's private recipe. Original shown from prop.");
      } else if (recipe.imageUrl) {
        recipeDataToSaveForUser.imageUrl = recipe.imageUrl; // It's a regular URL
        console.log("[RecipeDisplay] User Save: Image is a URL, setting imageUrl.");
      } else {
         recipeDataToSaveForUser.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(recipe.title || 'Recipe')}`;
        console.log("[RecipeDisplay] User Save: No imageUrl provided for recipe, using placeholder for user save.");
      }
      
      console.log('[RecipeDisplay] handleSaveRecipe: Data for user save:', JSON.stringify(recipeDataToSaveForUser));
      batch.set(userRecipeRef, recipeDataToSaveForUser);
      
      // 2. Save to public collection for Explore page - SIMPLIFIED DATA
      const publicRecipeRef = doc(collection(db, 'publicExploreRecipes'));
      // Ensure only necessary and size-appropriate data is saved publicly.
      const recipeDataForPublic: any = {
        title: recipe.title || "Unnamed Recipe",
        savedAt: serverTimestamp(),
        authorId: user.uid,
        authorDisplayName: user.displayName || "Community Chef",
        cookTime: recipe.cookTime || "N/A",
        // For public recipes, always ensure imageUrl is a URL, not a data URI.
        // If original is data URI, use a placeholder. If it's a URL, use it. If null, use placeholder.
        imageUrl: (recipe.imageUrl && !recipe.imageUrl.startsWith('data:image'))
          ? recipe.imageUrl
          : `https://placehold.co/400x300.png?text=${encodeURIComponent(recipe.title || 'Explore')}`,
        // nutritionalInformation and full instructions are often too large or not needed for public listings.
        // instructions: recipe.instructions ? recipe.instructions.substring(0, 200) + '...' : "No instructions preview.", // Example: truncated instructions
      };

      console.log('[RecipeDisplay] handleSaveRecipe: Data for public save (simplified):', JSON.stringify(recipeDataForPublic));
      batch.set(publicRecipeRef, recipeDataForPublic);

      console.log('[RecipeDisplay] handleSaveRecipe: Attempting batch.commit() with user and public data.');
      await batch.commit();
      console.log('[RecipeDisplay] handleSaveRecipe: batch.commit() successful. UserRef ID:', userRecipeRef.id, 'PublicRef ID:', publicRecipeRef.id);

      toast({
        title: "Recipe Saved!",
        description: `${recipe.title} has been saved to your collection and is now discoverable.`,
      });
      setAlreadySaved(true);
      setSavedRecipeId(userRecipeRef.id); // Store the ID of the recipe in the user's collection
    } catch (error: any) {
      console.error("[RecipeDisplay] Error saving recipe:", error);
      toast({ title: 'Failed to Save', description: error.message || "Could not save recipe.", variant: 'destructive' });
    } finally {
      setIsSaving(false);
      console.log('[RecipeDisplay] handleSaveRecipe: Finished save attempt.');
    }
  };

  const handleDeleteRecipe = async (recipeIdToDelete: string, isUnsaveAction: boolean = false) => {
    console.log(`[RecipeDisplay] handleDeleteRecipe: Called for ID ${recipeIdToDelete}. Is unsave: ${isUnsaveAction}`);
    if (!user || !recipeIdToDelete || !db) {
      if (!db) toast({ title: 'Database Error', description: 'Firestore is not available.', variant: 'destructive' });
      console.log('[RecipeDisplay] handleDeleteRecipe: User, recipeId, or db missing.');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedRecipes", recipeIdToDelete));
      console.log(`[RecipeDisplay] handleDeleteRecipe: Successfully deleted/unsaved from user's private collection.`);
      toast({
        title: isUnsaveAction ? "Recipe Unsaved" : "Recipe Deleted",
        description: `${recipe.title} has been removed from your collection.`,
        variant: isUnsaveAction ? "default" : "destructive"
      });
      if (onDelete && !isUnsaveAction) {
        onDelete(recipeIdToDelete);
      }
      setAlreadySaved(false); 
      setSavedRecipeId(undefined);

    } catch (error: any) { // This was the line with the error, now completed
      console.error(`[RecipeDisplay] Error ${isUnsaveAction ? 'unsaving' : 'deleting'} recipe:`, error);
      toast({
        title: `Failed to ${isUnsaveAction ? 'Unsave' : 'Delete'}`,
        description: error.message || `Could not ${isUnsaveAction ? 'unsave' : 'delete'} recipe.`,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      console.log(`[RecipeDisplay] handleDeleteRecipe: Finished ${isUnsaveAction ? 'unsave' : 'delete'} attempt for ID ${recipeIdToDelete}.`);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden border-border">
      <CardHeader className="p-0 relative">
        <div className="relative w-full aspect-[16/9] bg-muted">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              className="object-cover"
              data-ai-hint="recipe delicious food"
              priority={!recipe.id} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-t-lg bg-muted">
              <Flame className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-6 pt-16 absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end">
          <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{recipe.title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground items-center">
          {recipe.cookTime && (
            <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 text-base rounded-md">
              <Clock className="h-4 w-4" />
              <span>{recipe.cookTime}</span>
            </Badge>
          )}
           {/* Placeholder for servings or difficulty, can be added if AI provides it */}
           {/* <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 text-base rounded-md">
             <Flame className="h-4 w-4" />
             <span>Serves 2-4</span> 
           </Badge> */}
        </div>

        {recipe.instructions && (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center">
              <BookOpenText className="mr-2 h-5 w-5 text-primary" />
              Instructions
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-line leading-relaxed">
              {recipe.instructions.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0">{line}</p>
              ))}
            </div>
          </div>
        )}

        {recipe.nutritionalInformation && (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center">
              <Info className="mr-2 h-5 w-5 text-primary" />
              Nutritional Information
            </h3>
            <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
              {recipe.nutritionalInformation}
            </p>
          </div>
        )}
      </CardContent>

      {user && (
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-end gap-3 bg-muted/30 border-t">
          {onDelete && recipe.id && !alreadySaved && ( // Show delete button only if it's a saved recipe being viewed (e.g., from profile) AND it's not just an unsave action covered by the other button.
            <Button
              onClick={() => handleDeleteRecipe(recipe.id!, false)}
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting || isSaving || authLoading}
            >
              {isDeleting && !isSaving ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete Permanently
            </Button>
          )}
          <Button
            onClick={handleSaveRecipe}
            variant={alreadySaved ? "outline" : "default"}
            className="w-full sm:w-auto min-w-[150px]"
            disabled={isSaving || isDeleting || authLoading}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Heart className={alreadySaved ? "text-destructive fill-destructive" : ""} />
            )}
            {alreadySaved ? 'Unsave Recipe' : 'Save Recipe'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    