'use server';

import { suggestPdfFilename } from '@/ai/flows/suggest-pdf-filename';
import { z } from 'zod';

const FilenamesSchema = z.array(z.string());

export async function getSuggestedFilename(filenames: string[]): Promise<string> {
  try {
    const validatedFilenames = FilenamesSchema.parse(filenames);
    if(validatedFilenames.length === 0) {
        return `fotopdf-export-${new Date().toISOString().split('T')[0]}.pdf`;
    }
    const result = await suggestPdfFilename({ imageDescriptions: validatedFilenames });
    return result.filename;
  } catch (error) {
    console.error('Error suggesting filename:', error);
    // Return a generic name on error
    const firstImageName = filenames[0]?.split('.')[0] || 'export';
    return `${firstImageName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  }
}
