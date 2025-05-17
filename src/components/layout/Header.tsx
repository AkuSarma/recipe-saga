import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Utensils, UserCircle } from 'lucide-react';

export function Header() {
  // Placeholder for authentication state
  const isAuthenticated = false; // Replace with actual auth check later

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground">Recipe Sage</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
          <Link href="/" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
            Generate
          </Link>
          <Link href="/explore" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
            Explore
          </Link>
          {isAuthenticated && (
            <Link href="/profile" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              Profile
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="#">Login</Link>
            </Button>
            // Or a Sign Up button:
            // <Button size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            //   <Link href="#">Sign Up</Link>
            // </Button>
          )}
        </div>
      </div>
    </header>
  );
}
