// import prisma from "@/app/libs/prismadb";
// import { notFound } from "next/navigation";

// // The generateMetadata function is executed on the server *before* the layout/page component.
// // It is the ideal place to perform server-side actions like view count increment.
// export async function generateMetadata({ 
//   params
//  }: {
//   params: { id: string; };
//  }) {
//   const cardId = params.id;
  
//   console.log(`Attempting to generate metadata and increment view count for card ID: ${cardId}`);

//   try {
//     // IMPROVEMENT: Use a single 'update' operation to both increment the view count 
//     // and fetch the necessary data (the title) for metadata.
//     // If the record with 'cardId' does not exist, Prisma will throw an error (P2025),
//     // which will be caught below.
//     const updatedCard = await prisma.card.update({
//       where: {
//         id: cardId,
//       },
//       data: {
//         viewCount: { increment: 1 }, // Atomically increment the viewCount by 1
//       },
//       select: {
//         title: true, // Only select the 'title' field to reduce payload size
//       }
//     });

//     // Return the dynamically generated metadata object
//     return {
//       title: updatedCard.title || "Card Details",
//     };

//   } catch (error) {
//     // 1. Log the error for server-side monitoring
//     console.error(`[METADATA ERROR] Card ID ${cardId} could not be processed (possibly not found or DB issue):`, error);

//     // 2. For a production app, if the card is not found, it's better to immediately
//     // use notFound() to serve a 404 page, or return a simple fallback title.
    
//     // Option A: Use Next.js notFound() utility to render the closest not-found.js
//     // notFound(); 

//     // Option B: Return a fallback title and let the layout/page handle the rest
//     return {
//       title: "Card Not Found | Error",
//     };
//   }
// }

// // The layout component remains a simple passthrough for its children (the page component)
// const MediaLayout = async ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
//       {/* This component acts as the shell for the card content */}
//       {children}
//     </div>
//   );
// };

// export default MediaLayout;

import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
  //console.log(`id: ${params.id}`)
  const card = await prisma.card.findUnique({
    where: {
      id: params.id,
    }
  });


     if (card?.viewCount) {
      // Update existing BoardView with increment of 1
      const updatedView = await prisma.card.update({
        where: {
          id: params.id,
        },
        data: {
          viewCount: { increment: 1 }, // Increment by 1
        },
      });      
    } else {
      const updatedView = await prisma.card.update({
        where: {
          id: params.id,
        },
        data: {
          viewCount:  1 
        },
      });  
    }
   //console.log("updatedCardView:" , card)
  return {
    title: card?.title || "Card",
  };
}
const MediaLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {

 

  return (
    <>
      {children}
    </>
  );
};

export default MediaLayout;

