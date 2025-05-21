
"use server";
import { generateRecipe, type GenerateRecipeInput, type GenerateRecipeOutput } from "@/ai/flows/generate-recipe";
import { recognizeIngredientsFromImage, type RecognizeIngredientsInput, type RecognizeIngredientsOutput } from "@/ai/flows/recognize-ingredients-flow";

export async function handleGenerateRecipe(
  ingredients: string[],
  mood?: string,
  dietaryPreference?: 'Veg' | 'Non-Veg' | 'Vegan' | 'Any'
): Promise<GenerateRecipeOutput | { error: string }> {
  if (!ingredients || ingredients.length === 0) {
    return { error: "Please provide at least one ingredient." };
  }

  try {
    const input: GenerateRecipeInput = { 
      ingredients,
      ...(mood && { mood }), 
      ...(dietaryPreference && { dietaryPreference }), 
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

export async function handleRecognizeIngredients(
  imageDataUri: string
): Promise<RecognizeIngredientsOutput | { error: string }> {
  if (!imageDataUri) {
    return { error: "No image data provided." };
  }
  try {
    const input: RecognizeIngredientsInput = { imageDataUri };
    const result = await recognizeIngredientsFromImage(input);
    return result;
  } catch (error) {
    console.error("Error recognizing ingredients:", error);
    let errorMessage = "An unexpected error occurred while recognizing ingredients. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
