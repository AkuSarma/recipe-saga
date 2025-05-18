
'use server'

/**
 * @fileOverview Recipe generation flow from a list of ingredients.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z.array(
    z.string().describe('A list of ingredients available to use in the recipe.')
  ).describe('The ingredients to generate a recipe from.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  title: z.string().describe('The title of the recipe.'),
  instructions: z.string().describe('Step by step cooking instructions for the recipe.'),
  imageUrl: z.string().describe('A URL of an image of the recipe. This will be https://picsum.photos/200/300.'),
  cookTime: z.string().describe('The estimated cooking time for the recipe.'),
  nutritionalInformation: z.string().describe('Nutritional information for the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema.omit({ imageUrl: true })}, // LLM won't generate imageUrl
  prompt: `You are a world-class chef, skilled at creating delicious recipes from a provided list of ingredients.

  I will provide you a list of ingredients, and you will respond with a complete recipe, including:
  - A creative and descriptive title for the recipe.
  - Clear, step-by-step cooking instructions.
  - An estimated cook time.
  - Nutritional information.

  Do NOT suggest an image or image prompt.

  Ingredients: {{ingredients}}
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const recipeDetails = await recipePrompt(input);
    
    if (!recipeDetails.output) {
      throw new Error("Failed to generate recipe details from LLM.");
    }

    return {
      ...recipeDetails.output,
      imageUrl: "https://picsum.photos/200/300", // Always use picsum.photos
    };
  }
);

