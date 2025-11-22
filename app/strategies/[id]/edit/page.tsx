// app/strategies/[id]/edit/page.tsx

import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
import Container from "@/app/components/Container"; 
import { notFound } from 'next/navigation';
import StrategyForm from "@/app/strategy/_components/StrategyForm";

interface IParams {
  id?: string;
}

// Next.js Server Component for fetching contract data
const StrategyPage = async ({ params }: { params: IParams }) => {
  // 1. Fetch User (needed for client component permissions/context)
  const currentUser = await getCurrentUser(); 
  let strategyToEdit:any
  const strategyId = params.id;
  // Basic check for missing ID
  if (!strategyId) {
      notFound();
  }

  try {  

  
    strategyToEdit = await prisma.strategy.findUnique({
      where: { id: strategyId },
      include: {
        author: true, // Include the author data
        goals: {
          include: {
            outcomes: {
              include: {
                outputs: true,
              },
            },
          },
        },
      },
    });
     

  } catch (error) {
    console.error(`[CONTRACT_PAGE_ERROR] Database error for ID ${strategyId}:`, error);
    // 'contract' remains null if the fetch failed.
  }

  // --- 3. NOT FOUND CHECK ---
  if (!strategyToEdit) {
    // Renders the structured not found UI
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">No Strategy Found</h2>
          <p className="text-gray-500 mt-2">The strategy you are looking for does not exist or is unavailable.</p>
        </div>
      </Container>
    );
  }



    return (
        <div className="max-w-4xl mx-auto py-10">
            {/* StrategyForm receives the real, hydrated data */}
            <StrategyForm 
                initialStrategy={strategyToEdit}
                authorId={currentUser?.id || ""} 
                onSave={function (data: any): void {
                    throw new Error("Function not implemented.");
                } } onCancel={function (): void {
                    throw new Error("Function not implemented.");
                } }  
                // onSave={handleSave}
                // onCancel={handleCancelForm}          
                />
        </div>
    );
};

export default StrategyPage;