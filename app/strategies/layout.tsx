import React from 'react';
import { Metadata } from 'next';

// --- METADATA GENERATOR ---
export async function generateMetadata(): Promise<Metadata> {
  // The 'Strategies: Proposal' title is kept as requested.
  return {
    title: "Strategies: Proposal",
  };
}

// --- LAYOUT COMPONENT ---

/**
 * StrategyLayout provides the overall structure for the specific strategy detail page.
 * It ensures the content is full-width, uses a consistent background, 
 * and applies standard padding and a maximum width constraint to the inner content.
 */
const StrategyLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    // 1. Full-width wrapper: Ensures the layout spans the entire viewport width (w-full) 
    // and sets a background color for the overall page area (bg-gray-50 is common).
    // <div className="w-full min-h-screen bg-gray-50"> 
      
    //   {/* 2. Content Container: 
    //     - max-w-screen-2xl: Sets a maximum width for the content to prevent it from stretching too wide on massive screens.
    //     - mx-auto: Centers the content container horizontally.
    //     - py-8: Adds consistent vertical padding (e.g., py-8 for a standard section gap). 
    //       (Adjust py-8 to py-1 sm:py-4 if you prefer the original minimal padding).
    //   */}
    //   <main className="max-w-screen-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    //     {children}
    //   </main>
      
    // </div>
     <>
      {children}
    </>
  );
};

export default StrategyLayout;