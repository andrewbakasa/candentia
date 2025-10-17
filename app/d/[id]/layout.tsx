// import prisma from "@/app/libs/prismadb";
// import { notFound } from "next/navigation"; // Import for gracefully handling missing records

// /**
//  * Generates dynamic metadata for the page and atomically increments the view count.
//  * @param params Contains the dynamic 'id' of the CardImage record.
//  * @returns Metadata object with the title.
//  */
// export async function generateMetadata({ 
//   params
//  }: {
//   params: { id: string; };
//  }) {
//   const mediaId = params.id;
  
//   try {
//     // IMPROVEMENT: Use a single 'update' operation. This atomically increments the view count 
//     // and fetches the data needed for the title in one efficient database trip.
//     const updatedCardMedia = await prisma.cardImage.update({
//       where: {
//         id: mediaId,
//       },
//       data: {
//         viewCount: { increment: 1 }, // Atomically increment view count
//       },
//       // Select only the fields necessary for the metadata title
//       select: {
//         fileName: true,
//         description: true,
//       }
//     });

//     // Determine the title, prioritizing fileName, then description, then a default.
//     const primaryTitle = updatedCardMedia.fileName || updatedCardMedia.description || "Media Card";

//     // Return the title, truncated to a reasonable length (e.g., 60 characters)
//     return { 
//         title: primaryTitle.substring(0, 60),
//     };

//   } catch (error: any) {
//     // If Prisma throws a 'Record not found' error (P2025), we use Next.js's notFound() 
//     // to render the 404 page, which is the standard way to handle missing data.
//     if (error.code === 'P2025') {
//         console.warn(`CardImage ID ${mediaId} not found during metadata generation.`);
//         notFound();
//     }
    
//     // Log any other database errors and provide a safe fallback title.
//     console.error(`Database error processing metadata for ${mediaId}:`, error);
//     return { title: "Error Loading Content" };
//   }
// }

// /**
//  * The layout component acts as a shell for the children (page content).
//  */
// const MediaLayout = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {
//   return (
//     // Added a simple wrapper for minimal styling structure
//     <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
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
  console.log(`id: ${params.id}`)
  const card = await prisma.cardImage.findUnique({
    where: {
      id: params.id,
    }
  });

   if (card?.viewCount) {
      // Update existing BoardView with increment of 1
      const updatedBoardView = await prisma.cardImage.update({
        where: {
          id: card.id,
        },
        data: {
          viewCount: { increment: 1 }, // Increment by 1
        },
      });
    }else{
        const updatedView = await prisma.cardImage.update({
        where: {
          id: params.id,
        },
        data: {
          viewCount:  1 
        },
      });
    }

 return { title: card?.fileName?.substring(0, 30) || card?.description?.substring(0, 30) || "Card" }
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

