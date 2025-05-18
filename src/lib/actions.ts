
"use server";
import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from "@/ai/flows/generate-recipe";

export async function handleGenerateRecipe(ingredients: string[]): Promise<GenerateRecipeOutput | { error: string }> {
  if (!ingredients || ingredients.length === 0) {
    return { error: "Please provide at least one ingredient." };
  }

  try {
    const input: GenerateRecipeInput = { ingredients };
    const recipe = await generateRecipe(input);
    // imageUrl is now guaranteed by the flow
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

