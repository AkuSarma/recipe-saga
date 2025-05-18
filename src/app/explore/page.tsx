
"use client";
import { useState, useEffect } from 'react';
import { RecipeCard, type RecipeCardProps } from '@/components/recipe/RecipeCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, WifiOff, BookHeart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, limit, type Timestamp, orderBy } from 'firebase/firestore';
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import Image from 'next/image';

interface PublicRecipe extends Omit<GenerateRecipeOutput, 'nutritionalInformation'> {
  savedAt: Timestamp;
  authorDisplayName?: string;
  authorId?: string;
}

function RecipeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden shadow-lg h-full rounded-xl border bg-card">
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted">
        <Image src="https://picsum.photos/400/300" alt="Loading recipe image" layout="fill" objectFit="cover" className="animate-pulse" data-ai-hint="placeholder food" />
      </div>
      <div className="p-4 flex-grow space-y-2">
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-1/4 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="p-4 flex justify-between items-center border-t">
        <div className="h-6 w-1/4 bg-muted animate-pulse rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md"></div>
          <div className="h-8 w-20 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPublicRecipes = async () => {
      if (!db) {
        setError("Database not initialized. Please try again later.");
        setIsLoading(false);
        toast({title: "Error", description: "Could not connect to the database.", variant: "destructive"});
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching from publicExploreRecipes...");
        const q = query(
          collection(db, "publicExploreRecipes"),
          orderBy("savedAt", "desc"), 
          limit(24)
        );
        const querySnapshot = await getDocs(q);
        console.log("Query snapshot empty:", querySnapshot.empty);
        console.log("Number of docs fetched:", querySnapshot.docs.length);
        
        const fetchedRecipes = querySnapshot.docs.map(doc => {
          const data = doc.data() as PublicRecipe;
          const recipeCardData: RecipeCardProps = {
            id: doc.id,
            title: data.title,
            imageUrl: data.imageUrl || "https://picsum.photos/200/300",
            cookTime: data.cookTime,
            author: data.authorDisplayName || "Community Chef",
            likes: Math.floor(Math.random() * 100), // Likes are currently mock for explore
            dataAiHint: 'food recipe'
          };
          if (querySnapshot.docs.length > 0 && doc.id === querySnapshot.docs[0].id) {
             console.log("First doc data from Firestore:", data);
             console.log("Mapped first recipe card data:", recipeCardData);
          }
          return recipeCardData;
        });
        setRecipes(fetchedRecipes);
      } catch (err: any) {
        console.error("Error fetching public recipes:", err);
        if (err.code === 'failed-precondition') {
             setError("Query requires an index. Please check Firestore console for index creation link or create manually: Collection 'publicExploreRecipes', Field 'savedAt', Order 'Descending'.");
             toast({ title: "Indexing Required", description: "A database index is needed to show recipes. Check console.", variant: "destructive", duration: 10000 });
        } else {
            setError(err.message || "Failed to load recipes for exploration.");
            toast({ title: "Error Loading Recipes", description: "Could not fetch community recipes.", variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicRecipes();
  }, [toast]);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipe.author && recipe.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLike = (id: string) => {
    toast({ title: "Liked!", description: `You liked recipe ${id}. (Demo)` });
    setRecipes(prevRecipes => prevRecipes.map(r => r.id === id ? {...r, likes: (r.likes || 0) + 1} : r));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Explore Recipes</h1>
        <p className="text-muted-foreground mt-2">Discover new culinary inspirations from our community.</p>
      </div>

      <div className="sticky top-16 md:top-20 z-40 py-4 bg-background/80 backdrop-blur-md -mx-4 px-4">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search recipes by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg text-base shadow-sm border-border focus:ring-primary"
            aria-label="Search recipes"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {[...Array(6)].map((_, index) => <RecipeCardSkeleton key={index} />)}
        </div>
      ) : error ? (
         <div className="text-center py-10 min-h-[30vh] flex flex-col justify-center items-center">
          <WifiOff className="h-16 w-16 text-destructive mb-4" />
          <p className="text-xl font-semibold text-foreground">Error Loading Recipes</p>
          <p className="text-muted-foreground whitespace-pre-line">{error}</p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              {...recipe}
              onLike={() => handleLike(recipe.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 min-h-[30vh] flex flex-col justify-center items-center">
          <BookHeart className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Community Recipes Yet</p>
          <p className="text-muted-foreground">Be the first to save a recipe and share it with the community!</p>
        </div>
      )}
    </div>
  );
}
