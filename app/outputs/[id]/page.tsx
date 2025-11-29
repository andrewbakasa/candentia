import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
import Container from "@/app/components/Container"; 
import { notFound } from 'next/navigation';

// Mock types for the new Strategy models, assuming they mirror the old Contract structure
// You MUST ensure these types match your actual Prisma StrategyOutputModel definition.
import { StrategyOutputModel, StrategyActivityModel } from "../_components/types/output"; 
import StrategyDetailView from "./StrategyOutputDetails";
//import StrategyDetail from "./StrategyDetails"; // New client component name

interface IParams {
  id?: string;
}

// Next.js Server Component for fetching strategy data
const StrategyPage = async ({ params }: { params: IParams }) => {
  // 1. Fetch User (needed for client component permissions/context)
  const currentUser = await getCurrentUser(); 
  
  const strategyId = params.id;
  let strategyOutput: StrategyOutputModel | null = null;
  
  // Basic check for missing ID
  if (!strategyId) {
      notFound();
  }

  try {
    // 2. Fetch the Strategy Output, including related activities
    // NOTE: 'strategyOutputModel' is assumed to be the new Prisma model name.
    strategyOutput = await prisma.strategyOutput.findUnique({
      where: {
        id: strategyId,
      },
      include: {
        // MANDATORY: Include the activities relation (assumed to be named 'strategyActivityModels')
        activities: true, 
      },
      // Safely cast to ensure type compatibility with StrategyOutputModel
    }) as StrategyOutputModel | null; 

  } catch (error) {
    console.error(`[STRATEGY_PAGE_ERROR] Database error for ID ${strategyId}:`, error);
  }

  // --- 3. NOT FOUND CHECK ---
  if (!strategyOutput) {
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Strategy Output Not Found</h2>
          <p className="text-gray-500 mt-2">The strategy output you are looking for does not exist or is unavailable.</p>
        </div>
      </Container>
    );
  }

  // --- 4. DATA SERIALIZATION ---
  // Ensure all Date objects are converted to strings before passing to the Client Component
  const safeStrategyOutput = {
    ...strategyOutput,
    // Safely serialize required Date objects from the Prisma Model (handling potential nulls)
    createdAt: strategyOutput.createdAt ? strategyOutput.createdAt.toString() : null,
    updatedAt: strategyOutput.updatedAt ? strategyOutput.updatedAt.toString() : null,
   // effectiveDate: strategyOutput.effectiveDate ? strategyOutput.effectiveDate.toString() : null,
    //expirationDate: strategyOutput.expirationDate ? strategyOutput.expirationDate.toString() : null,
    
    // Serialize nested activity dates
    strategyActivityModels: strategyOutput.activities.map(activity => ({
      ...activity,
      // Assuming all activity models have these required date fields
      createdAt: activity.createdAt.toString(),
      updatedAt: activity.updatedAt.toString(),
      //dueDate: activity.dueDate.toString(),
    })),
  };

  // --- 5. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <StrategyDetailView
        // Pass the properly serialized data structure
        strategyOutput={safeStrategyOutput as any} 
        // currentUser={currentUser} 
      />
    </Container>
  );
};

export default StrategyPage;