'use server';

/**
 * @fileOverview Suggests a descriptive filename for a generated PDF based on the image content.
 *
 * - suggestPdfFilename - A function that suggests a filename for the generated PDF.
 * - SuggestPdfFilenameInput - The input type for the suggestPdfFilename function.
 * - SuggestPdfFilenameOutput - The return type for the suggestPdfFilename function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPdfFilenameInputSchema = z.object({
  imageDescriptions: z
    .array(z.string())
    .describe('A list of descriptions of the images in the PDF.'),
});
export type SuggestPdfFilenameInput = z.infer<typeof SuggestPdfFilenameInputSchema>;

const SuggestPdfFilenameOutputSchema = z.object({
  filename: z.string().describe('A suggested filename for the PDF.'),
});
export type SuggestPdfFilenameOutput = z.infer<typeof SuggestPdfFilenameOutputSchema>;

export async function suggestPdfFilename(input: SuggestPdfFilenameInput): Promise<SuggestPdfFilenameOutput> {
  return suggestPdfFilenameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPdfFilenamePrompt',
  input: {schema: SuggestPdfFilenameInputSchema},
  output: {schema: SuggestPdfFilenameOutputSchema},
  prompt: `You are an expert at suggesting relevant filenames based on a list of image descriptions.

Given the following image descriptions, suggest a concise and descriptive filename for the PDF:

{% each imageDescriptions %}- {{{this}}}\n{% endeach %}

Filename: `,
});

const suggestPdfFilenameFlow = ai.defineFlow(
  {
    name: 'suggestPdfFilenameFlow',
    inputSchema: SuggestPdfFilenameInputSchema,
    outputSchema: SuggestPdfFilenameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
