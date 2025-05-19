
"use server";
import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from "@/ai/flows/generate-recipe";

export async function handleGenerateRecipe(
  ingredients: string[],
  mood?: string,
  dietaryPreference?: 'Veg' | 'Non-Veg' | 'Vegan' | 'Any' // Added 'Vegan'
): Promise<GenerateRecipeOutput | { error: string }> {
  if (!ingredients || ingredients.length === 0) {
    return { error: "Please provide at least one ingredient." };
  }

  try {
    const input: GenerateRecipeInput = { 
      ingredients,
      ...(mood && { mood }), // Add mood if provided
      ...(dietaryPreference && { dietaryPreference }), // Add dietaryPreference if provided
    };
    const recipe = await generateRecipe(input);
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

