
"use client";
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { IngredientInput } from './IngredientInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type ChangeEvent } from 'react';
import { Loader2, UploadCloud, Sparkles, Image as ImageIcon } from 'lucide-react';
import { handleGenerateRecipe, handleRecognizeIngredients } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface RecipeFormProps {
  onRecipeGenerated: (recipe: GenerateRecipeOutput | null, error?: string) => void;
  onSubmissionStart: () => void;
}

const moods = ["Happy", "Comforting", "Energetic", "Quick & Easy", "Adventurous", "Calm"];
type DietaryPreference = "Veg" | "Non-Veg" | "Vegan" | "Any";

const NO_MOOD_SENTINEL_VALUE = "__NO_MOOD_SELECTED__";

export function RecipeForm({ onRecipeGenerated, onSubmissionStart }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("Any");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecognitionError(null);
    setIngredients([]); // Clear ingredients when new image is selected
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImageFile(null);
      setImagePreview(null);
    }
  };

  const triggerImageRecognition = async () => {
    if (!imagePreview) {
      setRecognitionError("Please select an image first.");
      toast({ title: "No Image", description: "Please select an image to recognize ingredients.", variant: "destructive" });
      return;
    }
    setIsRecognizing(true);
    setRecognitionError(null);
    setFormError(null);

    try {
      const result = await handleRecognizeIngredients(imagePreview);
      if ('error' in result) {
        setRecognitionError(result.error);
        toast({ title: "Recognition Failed", description: result.error, variant: "destructive" });
        setIngredients([]);
      } else {
        setIngredients(result.recognizedIngredients || []);
        if (result.recognizedIngredients && result.recognizedIngredients.length > 0) {
          toast({ title: "Ingredients Recognized!", description: "Review and adjust the ingredients below." });
        } else {
          toast({ title: "No Ingredients Found", description: "Could not identify ingredients in the image, or image was unclear. Try adding manually." });
        }
      }
    } catch (e: any) {
      const errorMessage = e.message || "Failed to recognize ingredients.";
      setRecognitionError(errorMessage);
      toast({ title: "Recognition Error", description: errorMessage, variant: "destructive" });
      setIngredients([]);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ingredients.length === 0) {
      setFormError("Please add at least one ingredient, either manually or by image recognition.");
      onRecipeGenerated(null, "Please add at least one ingredient.");
      return;
    }

    onSubmissionStart();
    setIsLoading(true);
    setFormError(null);
    setRecognitionError(null);

    try {
      const result = await handleGenerateRecipe(
        ingredients,
        selectedMood || undefined,
        dietaryPreference
      );
      if ('error' in result) {
        onRecipeGenerated(null, result.error);
        setFormError(result.error);
      } else {
        onRecipeGenerated(result);
      }
    } catch (e: any) {
      const errorMessage = e.message || "Failed to generate recipe.";
      onRecipeGenerated(null, errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-semibold text-foreground">Craft Your Next Meal</CardTitle>
        <CardDescription className="text-muted-foreground text-sm sm:text-base">
          Match your mood and taste! Upload an image of ingredients, or enter them manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-3 p-4 border rounded-lg bg-card shadow-sm">
            <Label htmlFor="image-upload" className="text-base font-medium flex items-center gap-2 text-primary">
              <UploadCloud className="h-5 w-5" />
              Recognize Ingredients from Image (Optional)
            </Label>
            <Input 
              id="image-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {imagePreview && (
              <div className="mt-4 space-y-3">
                <div className="relative w-full aspect-video rounded-md overflow-hidden border shadow-inner">
                  <Image src={imagePreview} alt="Selected ingredients preview" layout="fill" objectFit="contain" data-ai-hint="food ingredients" />
                </div>
                <Button 
                  type="button" 
                  onClick={triggerImageRecognition} 
                  disabled={isRecognizing || !imagePreview}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {isRecognizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isRecognizing ? 'Recognizing...' : 'Recognize Ingredients'}
                </Button>
              </div>
            )}
            {recognitionError && <p className="text-sm text-destructive text-center mt-2">{recognitionError}</p>}
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Separator className="flex-grow" /> OR <Separator className="flex-grow" />
          </div>

          <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />

          <div className="space-y-2">
            <Label htmlFor="mood-select">What's your mood?</Label>
            <Select
              value={selectedMood || NO_MOOD_SENTINEL_VALUE}
              onValueChange={(value) => {
                if (value === NO_MOOD_SENTINEL_VALUE) {
                  setSelectedMood("");
                } else {
                  setSelectedMood(value);
                }
              }}
            >
              <SelectTrigger id="mood-select" className="w-full">
                <SelectValue placeholder="Select a mood (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MOOD_SENTINEL_VALUE}>None (Surprise Me!)</SelectItem>
                {moods.map(mood => (
                  <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dietary Preference</Label>
            <RadioGroup
              value={dietaryPreference}
              onValueChange={(value) => setDietaryPreference(value as DietaryPreference)}
              className="flex flex-col sm:flex-row gap-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Any" id="diet-any" />
                <Label htmlFor="diet-any" className="font-normal">Any</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Veg" id="diet-veg" />
                <Label htmlFor="diet-veg" className="font-normal">Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Non-Veg" id="diet-nonveg" />
                <Label htmlFor="diet-nonveg" className="font-normal">Non-Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Vegan" id="diet-vegan" />
                <Label htmlFor="diet-vegan" className="font-normal">Vegan</Label>
              </div>
            </RadioGroup>
          </div>

          {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
          <div className="flex justify-center pt-2">
             <Button
                type="submit"
                disabled={isLoading || ingredients.length === 0}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base rounded-lg shadow-md transition-transform hover:scale-105"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Generate Recipe
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
