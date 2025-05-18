
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Settings, Bookmark, Edit3, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { RecipeCard, type RecipeCardProps } from '@/components/recipe/RecipeCard';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
// Assuming getSavedRecipesFromFirestore is client-callable
// import { getSavedRecipesFromFirestore, SavedRecipe, deleteRecipeFromFirestore } from '@/lib/firebase/firestore';

// Using client-side SDK for Firestore directly
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, type Timestamp, doc, deleteDoc as firestoreDeleteDoc } from 'firebase/firestore';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';


interface FirebaseSavedRecipe extends GenerateRecipeOutput {
  id: string; // Firestore document ID
  savedAt: Timestamp; // Firestore Timestamp
  userId: string;
}


export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [savedRecipes, setSavedRecipes] = useState<FirebaseSavedRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [errorLoadingRecipes, setErrorLoadingRecipes] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth?redirect=/profile'); // Redirect to login if not authenticated
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchRecipes = async () => {
        setIsLoadingRecipes(true);
        setErrorLoadingRecipes(null);
        try {
          const q = query(collection(db, "users", user.uid, "savedRecipes"), orderBy("savedAt", "desc"));
          const querySnapshot = await getDocs(q);
          const recipesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseSavedRecipe));
          setSavedRecipes(recipesData);
        } catch (err: any) {
          console.error("Error fetching saved recipes:", err);
          setErrorLoadingRecipes(err.message || "Failed to load saved recipes.");
          toast({ title: "Error", description: "Could not load your saved recipes.", variant: "destructive" });
        } finally {
          setIsLoadingRecipes(false);
        }
      };
      fetchRecipes();
    }
  }, [user, toast]);

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;
    try {
      await firestoreDeleteDoc(doc(db, "users", user.uid, "savedRecipes", recipeId));
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
      toast({ title: "Recipe Deleted", description: "The recipe has been removed from your saved list."});
    } catch (error: any) {
       toast({ title: "Error Deleting", description: error.message || "Could not delete recipe.", variant: "destructive"});
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const userJoinedDate = user?.metadata.creationTime 
    ? `Joined ${new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'Joined recently';

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary ring-2 ring-primary/30">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} data-ai-hint="profile human" />
              <AvatarFallback className="text-4xl">
                {user?.displayName ? getInitials(user.displayName) : <UserCircle className="h-16 w-16 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center sm:text-left">
              <CardTitle className="text-4xl font-bold text-foreground">{user?.displayName || 'Anonymous User'}</CardTitle>
              <CardDescription className="text-md text-muted-foreground mt-1">{user?.email}</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">{userJoinedDate}</p>
              {/* <p className="mt-3 text-foreground/80 max-w-md">{user.bio}</p> */}
            </div>
            <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
               <Button variant="outline" className="w-full sm:w-auto" disabled>
                 <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
               </Button>
               <Button variant="ghost" onClick={logout} className="w-full sm:w-auto text-muted-foreground hover:text-destructive">
                 <LogOut className="mr-2 h-4 w-4" /> Logout
               </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-foreground flex items-center">
            <Bookmark className="mr-3 h-7 w-7 text-primary" />
            My Saved Recipes
            </h2>
        </div>

        {isLoadingRecipes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              // Basic skeleton for recipe card
              <Card key={index} className="flex flex-col h-full rounded-xl border bg-card">
                <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted animate-pulse"></div>
                <CardContent className="p-4 flex-grow space-y-2">
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <div className="h-8 w-20 bg-muted animate-pulse rounded-md ml-auto"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : errorLoadingRecipes ? (
           <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-6 text-center text-destructive flex flex-col items-center gap-3">
              <AlertTriangle className="h-10 w-10" />
              <p className="font-semibold text-lg">Error Loading Saved Recipes</p>
              <p className="text-sm">{errorLoadingRecipes}</p>
            </CardContent>
          </Card>
        ) : savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                id={recipe.id}
                title={recipe.title}
                imageUrl={recipe.imageUrl}
                cookTime={recipe.cookTime}
                // Convert Firestore timestamp to string or handle appropriately if needed
                // author={recipe.author} // Assuming author might not be part of GenerateRecipeOutput
                // likes={recipe.likes} // Assuming likes might not be part of GenerateRecipeOutput
                dataAiHint="saved recipe food"
                // Pass a delete handler to the RecipeCard if you add delete button there,
                // or handle delete via a button on RecipeDisplay when navigating to the recipe detail.
                // For now, let's imagine the RecipeDisplay opened from here would have the delete option.
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border">
            <CardContent className="p-10 text-center">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-foreground">No Saved Recipes Yet</p>
              <p className="text-muted-foreground mt-1">
                Start exploring and save your favorite culinary creations!
              </p>
              <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/explore">Explore Recipes</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
