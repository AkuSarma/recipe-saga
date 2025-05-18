
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
import { db } from '@/lib/firebase/config'; // For client-side SDK
import { collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';


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
          // where("cookTime", "==", recipe.cookTime) 
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
        console.error("Error checking saved status:", error);
      }
    };
    checkSavedStatus();
  }, [user, recipe.title, recipe.cookTime, isSavedRecipe]);


  const handleSaveRecipe = async () => {
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to save recipes.', variant: 'destructive' });
      return;
    }
    if (!db) {
      toast({ title: 'Database Error', description: 'Firestore is not available. Please try again later.', variant: 'destructive' });
      return;
    }
    if (alreadySaved && savedRecipeId) { 
      await handleDeleteRecipe(savedRecipeId, true); 
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      // 1. Save to user's private collection
      const userRecipeRef = doc(collection(db, 'users', user.uid, 'savedRecipes'));
      const recipeDataToSaveForUser: Omit<GenerateRecipeOutput, 'imageUrl'> & { 
        userId: string; 
        savedAt: any; 
        originalImageUrl?: string; 
        imageUrl?: string; 
      } = {
        title: recipe.title,
        instructions: recipe.instructions,
        cookTime: recipe.cookTime,
        nutritionalInformation: recipe.nutritionalInformation,
        userId: user.uid,
        savedAt: serverTimestamp(),
      };

      if (recipe.imageUrl && recipe.imageUrl.startsWith('data:image')) {
        recipeDataToSaveForUser.originalImageUrl = `placeholder:generatedImage`; 
        console.log("User Save: Image is a data URI, not saving to Firestore directly.");
      } else if (recipe.imageUrl) {
        recipeDataToSaveForUser.imageUrl = recipe.imageUrl;
      }
      
      delete (recipeDataToSaveForUser as any).id; 
      batch.set(userRecipeRef, recipeDataToSaveForUser);
      
      // 2. Save to public collection for Explore page
      // We use a new doc ref for publicExploreRecipes to get a new unique ID.
      const publicRecipeRef = doc(collection(db, 'publicExploreRecipes'));
       const recipeDataForPublic: Omit<GenerateRecipeOutput, 'imageUrl'> & {
        savedAt: any;
        authorDisplayName?: string; // Store display name of user who saved it
        authorId?: string; // Store UID of user who saved it
        originalImageUrl?: string;
        imageUrl?: string;
      } = {
        title: recipe.title,
        instructions: recipe.instructions, // Potentially shorten or omit for explore card? For now, full.
        cookTime: recipe.cookTime,
        nutritionalInformation: recipe.nutritionalInformation, // Potentially shorten or omit.
        savedAt: serverTimestamp(), // Or a specific "publishedAt" timestamp
        authorDisplayName: user.displayName || "Anonymous Chef",
        authorId: user.uid,
      };

      if (recipe.imageUrl && recipe.imageUrl.startsWith('data:image')) {
        recipeDataForPublic.originalImageUrl = `placeholder:generatedImage`;
        console.log("Public Save: Image is a data URI, not saving to Firestore directly.");
      } else if (recipe.imageUrl) {
        recipeDataForPublic.imageUrl = recipe.imageUrl;
      }
      batch.set(publicRecipeRef, recipeDataForPublic);

      await batch.commit();

      toast({
        title: "Recipe Saved!",
        description: `${recipe.title} has been saved to your collection and is now discoverable.`,
      });
      setAlreadySaved(true);
      setSavedRecipeId(userRecipeRef.id); // Set the ID from the user's saved recipe document
    } catch (error: any) {
      console.error("Error saving recipe:", error);
      toast({ title: 'Failed to Save', description: error.message || "Could not save recipe.", variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = async (recipeIdToDelete: string, isUnsaveAction: boolean = false) => {
    if (!user || !recipeIdToDelete || !db) {
      if (!db) toast({ title: 'Database Error', description: 'Firestore is not available.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    try {
      // For now, "unsave" only removes from the user's private list.
      // Removing from publicExploreRecipes would require more complex logic if other users also saved it.
      await deleteDoc(doc(db, "users", user.uid, "savedRecipes", recipeIdToDelete));
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
      console.error("Error deleting recipe:", error);
      toast({ title: 'Failed to Delete', description: error.message || "Could not delete recipe.", variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };


  const recipeTitle = recipe.title || "Untitled Recipe";
  const displayImageUrl = recipe.imageUrl || `https://placehold.co/800x600.png?text=${encodeURIComponent(recipeTitle)}`;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden border-border">
      <CardHeader className="p-0">
        <div className="relative w-full h-64 md:h-80 xl:h-96">
          <Image
            src={displayImageUrl} 
            alt={recipeTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint="recipe food"
            priority={!isSavedRecipe} 
          />
        </div>
        <div className="p-6">
          <CardTitle className="text-3xl lg:text-4xl font-bold mb-3 text-foreground">{recipeTitle}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {recipe.cookTime && (
              <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 border-primary/50 text-primary">
                <Clock className="h-4 w-4" />
                <span>{recipe.cookTime}</span>
              </Badge>
            )}
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
      <CardFooter className="flex justify-end p-6 bg-muted/30 border-t gap-3">
        {user && isSavedRecipe && recipe.id && onDelete && (
          <Button 
            onClick={() => handleDeleteRecipe(recipe.id!)} 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 border-destructive/50 px-6 py-2.5 rounded-lg shadow-md transition-transform hover:scale-105"
            disabled={isDeleting || authLoading}
          >
            {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
            Delete
          </Button>
        )}
        {user && (
          <Button 
            onClick={handleSaveRecipe} 
            className={`${alreadySaved ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-primary hover:bg-primary/90 text-primary-foreground'} px-6 py-2.5 rounded-lg shadow-md transition-transform hover:scale-105`}
            disabled={isSaving || authLoading}
          >
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Heart className="mr-2 h-5 w-5" />}
            {alreadySaved ? 'Unsave Recipe' : 'Save Recipe'}
          </Button>
        )}
        {!user && !authLoading && (
           <Button 
            onClick={() => toast({title: 'Login Required', description: 'Please log in to save recipes.'})}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg shadow-md transition-transform hover:scale-105"
          >
            <Heart className="mr-2 h-5 w-5" /> Save Recipe
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    