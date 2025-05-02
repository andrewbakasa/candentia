// metadata.ts (or metadata.js)
import { Metadata } from 'next';

export const defaultMetadata: Metadata = { // Good practice to have default metadata
  title: 'Media',
  description: 'Media Management',
};

// You can create a function to generate dynamic metadata:
export const generateMediaMetadata = (cardId?: string|null): Metadata => {
  return {
    ...defaultMetadata, // Spread the defaults
    title: cardId ? `Media - Card ${cardId}` : defaultMetadata.title,
  };
};