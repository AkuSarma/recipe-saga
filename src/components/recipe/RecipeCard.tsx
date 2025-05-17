import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Clock, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl: string;
  cookTime?: string;
  author?: string;
  likes?: number;
  onLike?: () => void;
  onDislike?: () => void;
  dataAiHint?: string;
}

export function RecipeCard({ id, title, imageUrl, cookTime, author, likes, onLike, onDislike, dataAiHint }: RecipeCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full rounded-xl border-border">
      <CardHeader className="p-0">
        <Link href={`/recipe/${id}`} className="block aspect-[4/3] relative overflow-hidden rounded-t-xl">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
              data-ai-hint={dataAiHint || "food item"}
            />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/recipe/${id}`} className="block">
          <CardTitle className="text-lg font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">{title}</CardTitle>
        </Link>
        <div className="text-xs text-muted-foreground space-y-1.5">
          {cookTime && (
             <Badge variant="outline" className="flex items-center w-fit gap-1 py-0.5 px-1.5 border-primary/30 text-primary/80">
                <Clock className="h-3 w-3" /> {cookTime}
            </Badge>
          )}
          {author && (
            <p className="flex items-center gap-1"><User className="h-3 w-3" /> By {author}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ThumbsUp className="h-4 w-4 text-primary" />
          <span>{likes || 0}</span>
        </div>
        <div className="flex gap-2">
          {onLike && (
            <Button variant="outline" size="icon" onClick={onLike} aria-label="Like recipe" className="h-8 w-8 border-primary/50 hover:bg-primary/10">
              <ThumbsUp className="h-4 w-4 text-primary" />
            </Button>
          )}
          {/* Placeholder for dislike, or can be removed if not primary action */}
          {/* {onDislike && (
            <Button variant="outline" size="icon" onClick={onDislike} aria-label="Dislike recipe" className="h-8 w-8 border-destructive/50 hover:bg-destructive/10">
              <ThumbsDown className="h-4 w-4 text-destructive" />
            </Button>
          )} */}
          <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10 hover:text-primary">
            <Link href={`/recipe/${id}`}>
              <Eye className="mr-1.5 h-4 w-4" /> View
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
