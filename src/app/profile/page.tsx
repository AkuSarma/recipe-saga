"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Settings, Bookmark, Edit3, LogOut } from "lucide-react";
import { RecipeCard, type RecipeCardProps } from '@/components/recipe/RecipeCard';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mockSavedRecipes: RecipeCardProps[] = [
  {
    id: '1', 
    title: 'My Favorite Carbonara',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '30 mins',
    author: 'Chef Giovanni',
    likes: 120,
    dataAiHint: 'pasta meal'
  },
  {
    id: '3',
    title: 'Weekend Chocolate Lava Cake',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '25 mins',
    author: 'Sweet Treats',
    likes: 300,
    dataAiHint: 'sweet dessert'
  },
  {
    id: '5',
    title: 'Go-To Vegan Buddha Bowl',
    imageUrl: 'https://placehold.co/400x300.png',
    cookTime: '35 mins',
    author: 'Plant Power',
    likes: 220,
    dataAiHint: 'vegan bowl food'
  },
];


export default function ProfilePage() {
  // Placeholder user data - in a real app, this would come from auth context
  const user = {
    name: 'Alex Chefson',
    email: 'alex.chefson@example.com',
    bio: 'Passionate home cook exploring new flavors and sharing my culinary journey.',
    joinedDate: 'Joined January 2023',
    avatarUrl: 'https://placehold.co/128x128.png',
  };
  const savedRecipes = mockSavedRecipes;

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary ring-2 ring-primary/30">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile human" />
              <AvatarFallback className="text-4xl">
                {user.name.split(' ').map(n => n[0]).join('') || <UserCircle className="h-16 w-16 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center sm:text-left">
              <CardTitle className="text-4xl font-bold text-foreground">{user.name}</CardTitle>
              <CardDescription className="text-md text-muted-foreground mt-1">{user.email}</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">{user.joinedDate}</p>
              <p className="mt-3 text-foreground/80 max-w-md">{user.bio}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
               <Button variant="outline" className="w-full sm:w-auto">
                 <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
               </Button>
               <Button variant="ghost" className="w-full sm:w-auto text-muted-foreground hover:text-destructive">
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
            {/* Placeholder for "View All" or sorting/filtering options */}
        </div>

        {savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map(recipe => (
              <RecipeCard 
                key={`saved-${recipe.id}`} 
                {...recipe} 
                // Remove onLike/onDislike for saved recipes or implement different logic
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
                <a href="/explore">Explore Recipes</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
