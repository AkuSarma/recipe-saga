
"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Clock, Flame, Heart, BookOpenText, Info, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config'; 
import { collection, query, where, getDocs, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';


interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput & { id?: string }; 
  isSavedRecipe?: boolean; 
  onDelete?: (recipeId: string) => void; 
}

export function RecipeDisplay({ recipe, isSavedRecipe = false, onDelete }: RecipeDisplayProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(isSavedRecipe);
  const [savedRecipeId, setSavedRecipeId] = useState<string | undefined>(recipe.id);


  useEffect(() => {
    if (isSavedRecipe || !user || !recipe.title || !db) return; 

    const checkSavedStatus = async () => {
      try {
        const q = query(
          collection(db, "users", user.uid, "savedRecipes"),
          where("title", "==", recipe.title),
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
  }, [user, recipe.title, recipe.cookTime, recipe.instructions, recipe.nutritionalInformation, isSavedRecipe]);


  const handleSaveRecipe = async () => {
    console.log('[RecipeDisplay] handleSaveRecipe: Function called.');
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to save recipes.', variant: 'destructive' });
      console.log('[RecipeDisplay] handleSaveRecipe: User not authenticated.');
      return;
    }
    if (!db) {
      toast({ title: 'Database Error', description: 'Firestore is not available. Please try again later.', variant: 'destructive' });
      console.log('[RecipeDisplay] handleSaveRecipe: Firestore (db) not available.');
      return;
    }
    
    console.log('[RecipeDisplay] handleSaveRecipe: Initial state - AlreadySaved:', alreadySaved, 'SavedRecipeId:', savedRecipeId);

    if (alreadySaved && savedRecipeId) { 
      console.log('[RecipeDisplay] handleSaveRecipe: Recipe already saved by user, proceeding to unsave.');
      await handleDeleteRecipe(savedRecipeId, true); 
      return;
    }

    setIsSaving(true);
    console.log('[RecipeDisplay] handleSaveRecipe: Proceeding to save new recipe.');
    try {
      const batch = writeBatch(db);

      const recipeDataToSave = {
        title: recipe.title || "Unnamed Recipe",
        instructions: recipe.instructions || "No instructions provided.",
        cookTime: recipe.cookTime || "N/A",
        nutritionalInformation: recipe.nutritionalInformation || "No nutritional information available.",
        imageUrl: recipe.imageUrl && recipe.imageUrl.startsWith('data:image') ? "https://picsum.photos/200/300" : recipe.imageUrl || "https://picsum.photos/200/300",
      };
      
      console.log('[RecipeDisplay] handleSaveRecipe: Base recipe data for save:', JSON.stringify(recipeDataToSave));
      
      // 2. Prepare data for public collection
      const recipeDataForPublic = {
        ...recipeDataToSave, // Use the same base data
        instructions: recipe.instructions || "No instructions provided.",
        nutritionalInformation: recipe.nutritionalInformation || "No nutritional information available.",
        savedAt: serverTimestamp(),
        authorId: user.uid,
        authorDisplayName: user.displayName || "Community Chef",
        likeCount: 0, // Initialize likeCount for new public recipes
      };
      console.log('[RecipeDisplay] handleSaveRecipe: Data for public save (full):', JSON.stringify(recipeDataForPublic));
      
      // 1. Prepare data for user's private collection
      // Include likeCount from the public version (which is 0 if new)
      const userRecipeRef = doc(collection(db, 'users', user.uid, 'savedRecipes'));
      const recipeDataToSaveForUser = {
        ...recipeDataToSave,
        userId: user.uid,
        savedAt: serverTimestamp(),
        likeCount: recipeDataForPublic.likeCount, // Snapshot of public likeCount
      };
      console.log('[RecipeDisplay] handleSaveRecipe: Data for user save:', JSON.stringify(recipeDataToSaveForUser));
      batch.set(userRecipeRef, recipeDataToSaveForUser);
      
      // Set public recipe (this will either create new or overwrite if ID matched, but we generate new ID here)
      const publicRecipeRef = doc(collection(db, 'publicExploreRecipes'));
      batch.set(publicRecipeRef, recipeDataForPublic);


      console.log('[RecipeDisplay] handleSaveRecipe: Attempting batch.commit() with user and public data.');
      await batch.commit();
      console.log('[RecipeDisplay] handleSaveRecipe: batch.commit() successful. UserRef ID:', userRecipeRef.id, 'PublicRef ID:', publicRecipeRef.id);

      toast({
        title: "Recipe Saved!",
        description: `${recipe.title} has been saved to your collection and is now discoverable.`,
      });
      setAlreadySaved(true);
      setSavedRecipeId(userRecipeRef.id); 
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
      if (!db) {
          toast({ title: 'Database Error', description: 'Firestore is not available.', variant: 'destructive' });
      } else if (!user) {
          toast({ title: 'Authentication Error', description: 'You must be logged in to delete recipes.', variant: 'destructive' });
      } else {
          toast({ title: 'Error', description: 'Recipe ID is missing.', variant: 'destructive' });
      }
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

    } catch (error: any) { 
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
              data-ai-hint="recipe food image"
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
          {onDelete && recipe.id && (alreadySaved || isSavedRecipe) && ( 
            <Button
              onClick={() => handleDeleteRecipe(recipe.id!, false)}
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting || isSaving || authLoading}
            >
              {isDeleting && !isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Heart className={alreadySaved ? "text-destructive fill-destructive mr-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            )}
            {alreadySaved ? 'Unsave Recipe' : 'Save Recipe'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
