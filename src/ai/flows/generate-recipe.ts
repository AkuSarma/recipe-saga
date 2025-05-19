
'use server'

/**
 * @fileOverview Recipe generation flow from a list of ingredients, mood, and dietary preference.
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
  mood: z.string().optional().describe('The user\'s current mood to tailor the recipe. E.g., Happy, Comforting, Energetic, Quick & Easy.'),
  dietaryPreference: z.enum(['Veg', 'Non-Veg', 'Vegan', 'Any']).default('Any').optional().describe('The dietary preference for the recipe: Veg, Non-Veg, Vegan, or Any.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Internal schema for the prompt, including boolean flags for dietary preferences
const InternalPromptInputSchema = GenerateRecipeInputSchema.extend({
  isVeg: z.boolean().optional(),
  isNonVeg: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isAnyDiet: z.boolean().optional(), // Represents 'Any' or unspecified
});
type InternalPromptInput = z.infer<typeof InternalPromptInputSchema>;


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
  input: {schema: InternalPromptInputSchema}, // Use the internal schema
  output: {schema: GenerateRecipeOutputSchema.omit({ imageUrl: true })},
  prompt: `You are a world-class chef, skilled at creating delicious recipes from a provided list of ingredients.
  The user is also providing their current mood and dietary preference.

  I will provide you a list of ingredients, a mood, and a dietary preference. You will respond with a complete recipe, including:
  - A creative and descriptive title for the recipe.
  - Clear, step-by-step cooking instructions.
  - An estimated cook time.
  - Nutritional information.

  Ingredients: {{ingredients}}
  {{#if mood}}
  Mood: {{mood}}. Please generate a recipe that fits this mood.
  {{/if}}

  Dietary Preference: {{dietaryPreference}}.
  {{#if isVeg}}
  The recipe MUST be strictly vegetarian. Do not include any meat, poultry, or fish. It can include dairy and eggs.
  {{else}}
    {{#if isNonVeg}}
    The recipe can include meat, poultry, or fish.
    {{else}}
      {{#if isVegan}}
      The recipe MUST be strictly vegan. Do not include any meat, poultry, fish, dairy products (milk, cheese, butter, yogurt), eggs, or honey.
      {{else}} {{! This covers isAnyDiet (i.e., dietaryPreference was 'Any') }}
      There are no specific dietary restrictions.
      {{/if}}
    {{/if}}
  {{/if}}

  Do NOT suggest an image or image prompt.
  Ensure the recipe aligns with the provided mood (if any) and dietary preference.
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema, // External input schema remains the same
    outputSchema: GenerateRecipeOutputSchema,
  },
  async (input: GenerateRecipeInput) => {
    // Transform GenerateRecipeInput to InternalPromptInput
    const dp = input.dietaryPreference; // Due to .default('Any'), dp will always be one of the enum values.
    const internalPromptInput: InternalPromptInput = {
      ...input,
      isVeg: dp === 'Veg',
      isNonVeg: dp === 'Non-Veg',
      isVegan: dp === 'Vegan',
      isAnyDiet: dp === 'Any',
    };
    
    const recipeDetails = await recipePrompt(internalPromptInput);
    
    if (!recipeDetails.output) {
      throw new Error("Failed to generate recipe details from LLM.");
    }

    return {
      ...recipeDetails.output,
      imageUrl: "https://picsum.photos/200/300", // Always use picsum.photos
    };
  }
);

// Removed Handlebars import and registerHelper as 'eq' is no longer used.
