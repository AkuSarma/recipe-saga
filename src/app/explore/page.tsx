"use client"; 
import { useState, useEffect } from 'react';
import { RecipeCard, type RecipeCardProps } from '@/components/recipe/RecipeCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockRecipesData: RecipeCardProps[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara Classic',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '30 mins',
    author: 'Chef Giovanni',
    likes: 120,
    dataAiHint: 'pasta dish'
  },
  {
    id: '2',
    title: 'Avocado Toast Deluxe',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '10 mins',
    author: 'Healthy Bites',
    likes: 250,
    dataAiHint: 'breakfast food'
  },
  {
    id: '3',
    title: 'Chocolate Lava Cake',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '25 mins',
    author: 'Sweet Treats',
    likes: 300,
    dataAiHint: 'dessert chocolate'
  },
  {
    id: '4',
    title: 'Grilled Salmon with Asparagus',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '40 mins',
    author: 'SeaFood Lover',
    likes: 180,
    dataAiHint: 'fish meal'
  },
  {
    id: '5',
    title: 'Vegan Buddha Bowl Extravaganza',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '35 mins',
    author: 'Plant Power',
    likes: 220,
    dataAiHint: 'vegan bowl'
  },
  {
    id: '6',
    title: 'Classic Beef Tacos Fiesta',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '45 mins',
    author: 'Mexican Fiesta',
    likes: 195,
    dataAiHint: 'mexican food'
  }
];

// Skeleton for RecipeCard
function RecipeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden shadow-lg h-full rounded-xl border bg-card">
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted animate-pulse"></div>
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
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setRecipes(mockRecipesData);
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipe.author && recipe.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLike = (id: string) => {
    toast({ title: "Liked!", description: `You liked recipe ${id}. (Demo)` });
    setRecipes(prevRecipes => prevRecipes.map(r => r.id === id ? {...r, likes: (r.likes || 0) + 1} : r));
  };

  // const handleDislike = (id: string) => {
  //   toast({ title: "Disliked", description: `You disliked recipe ${id}. (Demo)`, variant: "destructive" });
  //   // Example: setRecipes(prevRecipes => prevRecipes.map(r => r.id === id ? {...r, likes: Math.max(0, (r.likes || 0) -1) } : r));
  // };

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
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              {...recipe}
              onLike={() => handleLike(recipe.id)}
              // onDislike={() => handleDislike(recipe.id)} // Dislike button removed from card for simplicity
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 min-h-[30vh] flex flex-col justify-center items-center">
          <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Recipes Found</p>
          <p className="text-muted-foreground">Try a different search term or check back later!</p>
        </div>
      )}
    </div>
  );
}
