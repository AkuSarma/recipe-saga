
'use server';
/**
 * @fileOverview A Genkit flow to recognize food ingredients from an image.
 *
 * - recognizeIngredientsFromImage - A function that handles ingredient recognition.
 * - RecognizeIngredientsInput - The input type (image data URI).
 * - RecognizeIngredientsOutput - The output type (list of ingredients).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeIngredientsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of potential food ingredients, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeIngredientsInput = z.infer<typeof RecognizeIngredientsInputSchema>;

const RecognizeIngredientsOutputSchema = z.object({
  recognizedIngredients: z.array(z.string()).describe("A list of recognized food ingredients from the image."),
});
export type RecognizeIngredientsOutput = z.infer<typeof RecognizeIngredientsOutputSchema>;

export async function recognizeIngredientsFromImage(input: RecognizeIngredientsInput): Promise<RecognizeIngredientsOutput> {
  return recognizeIngredientsFlow(input);
}

const recognizePrompt = ai.definePrompt({
  name: 'recognizeIngredientsPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Using a vision-capable model
  input: {schema: RecognizeIngredientsInputSchema},
  output: {schema: RecognizeIngredientsOutputSchema},
  prompt: `You are an expert at identifying food ingredients from images. Analyze the provided image and list all distinct food ingredients you recognize.
Return your response as a JSON object that strictly adheres to the following Zod schema structure:
{ "recognizedIngredients": z.array(z.string()) }
The value of "recognizedIngredients" should be an array of strings, where each string is an identified ingredient.
Example for a picture of a tomato and an onion: { "recognizedIngredients": ["tomato", "onion"] }
If no ingredients are identifiable or the image does not contain food items, return an empty array: { "recognizedIngredients": [] }
Do not include any explanations or conversational text outside of the JSON object.

Image: {{media url=imageDataUri}}`,
});

const recognizeIngredientsFlow = ai.defineFlow(
  {
    name: 'recognizeIngredientsFlow',
    inputSchema: RecognizeIngredientsInputSchema,
    outputSchema: RecognizeIngredientsOutputSchema,
  },
  async (input: RecognizeIngredientsInput) => {
    const {output} = await recognizePrompt(input);
    if (!output) {
      console.error("Ingredient recognition flow did not receive output from the prompt.");
      return { recognizedIngredients: [] };
    }
    return output;
  }
);
