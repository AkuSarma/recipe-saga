"use server";
import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from "@/ai/flows/generate-recipe";

export async function handleGenerateRecipe(ingredients: string[]): Promise<GenerateRecipeOutput | { error: string }> {
  if (!ingredients || ingredients.length === 0) {
    return { error: "Please provide at least one ingredient." };
  }

  try {
    const input: GenerateRecipeInput = { ingredients };
    const recipe = await generateRecipe(input);
    // Ensure imageUrl is always a string, use placeholder if not provided by AI
    if (!recipe.imageUrl) {
      recipe.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(recipe.title || 'Recipe Image')}`;
    }
    return recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    let errorMessage = "An unexpected error occurred while generating the recipe. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
