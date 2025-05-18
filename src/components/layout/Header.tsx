
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Utensils, UserCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, loading, logout } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
          {user && (
            <Link href="/profile" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              Profile
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User Avatar'} data-ai-hint="user avatar" />
                    <AvatarFallback>
                      {user.displayName ? getInitials(user.displayName) : <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
