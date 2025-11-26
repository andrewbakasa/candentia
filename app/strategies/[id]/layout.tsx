import prisma from "@/app/libs/prismadb";

// Helper function for Prisma (mocked for environment where full Prisma might not be available)
// NOTE: Since this is a server component handling metadata, we assume Prisma setup is correct.
// We keep the original Prisma call structure.

export async function generateMetadata({ 
  params
}: {
  params: { id: string; };
}) {
  // Fetch strategy details for the title
  let strategy = null;
  try {
    strategy = await prisma.strategy.findUnique({
      where: {
        id: params.id,
      },
      select: {
        title: true, // Only fetch the title field
      }
    });
  } catch (error) {
    console.error("Error fetching strategy for metadata:", error);
  }
    
  return {
    title: `Strategy: ${strategy?.title || 'Unknown'}` || "Strategy Proposal",
  };
}

/**
 * StrategyLayout provides the overall structure for the specific strategy detail page.
 * It ensures the content is full-width and uses standard padding.
 */
const StrategyLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    // We add a wrapper to ensure the layout spans the full viewport width
    // and provide a consistent background color (which is visually overridden
    // by the StrategyClient's padding, but useful for overall structure).
    // <div className="w-full min-h-screen bg-gray-50"> 
    //   <main className="max-w-screen-2xl mx-auto py-1 sm:py-4">
    //     {children}
    //   </main>
    // </div>
   
    <>
      {children}
    </>
  );
};

export default StrategyLayout;
// import prisma from "@/app/libs/prismadb";
// export async function generateMetadata({ 
//   params
//  }: {
//   params: { id: string; };
//  }) {
//   //console.log(`id: ${params.id}`)
//   const strategy = await prisma.strategy.findUnique({
//     where: {
//       id: params.id,
//     }
//   });


    
//   return {
//     title: `Strategy: ${strategy?.title}` || "Strategy",
//   };
// }
// const StrategyLayout = async ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {

 

//   return (
//     <>
//       {children}
//     </>
//   );
// };

// export default StrategyLayout;

