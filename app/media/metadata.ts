// metadata.ts (or metadata.js)
import { Metadata } from 'next';

export const defaultMetadata: Metadata = { // Good practice to have default metadata
  title: 'EEG Media',
  description: 'Projects View',
     icons: {
    icon: '/peeg.jpg', // This refers to app/icon.png
    shortcut: '/shortcut-icon.png', // If you have a different shortcut icon
    apple: '/peeg.jpg', // This refers to app/apple-icon.png
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/peeg.jpg',
      },
      {
        rel: 'mask-icon',
        url: '/peeg.jpg',
        color: '#000000',
      },
    ],
  },
};

// You can create a function to generate dynamic metadata:
export const generateMediaMetadata = (cardId?: string|null): Metadata => {
  return {
    ...defaultMetadata, // Spread the defaults
    title: cardId ? `Media - Card ${cardId}` : defaultMetadata.title,
  };
};