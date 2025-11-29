import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
import Container from "@/app/components/Container"; 
import { notFound } from 'next/navigation';

// Mock types for the new Strategy models.
// NOTE: You MUST update the actual StrategyOutputModel definition 
// in "../_components/types/output" to correctly reflect the nested 
// 'outcome' object which will now contain the 'goal'.
//import { StrategyOutputModel, StrategyActivityModel } from "../_components/types/output"; 
import StrategyDetailView from "./StrategyOutputDetails";
import { StrategyActivityModel } from "../_components/types/output";
export interface StrategyOutputModel {
  id: string;
  title: string;
  description: string | null;
  
  // Fields from StrategyOutput schema
  responsible: string | null; // Name of the responsible party (non-relational string)
  costEstimate: number | null;
  isCompleted: boolean;
  completionDate: string | null; 

  // Relationship to the Outcome
  outcomeId: string;
  outcome?: StrategyOutcomeMinimal; // Optional relation include

  createdAt: string;
  updatedAt: string;
  
  // Included activities for viewing the detail page (replaces contractActivityModels)
  activities: StrategyActivityModel[];
}
interface StrategyOutcomeMinimal {
  goal: any;
  id: string;
  title: string;
}
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
    // 2. Fetch the Strategy Output, including related goals (nested under outcome), outcomes, and activities
    strategyOutput = await prisma.strategyOutput.findUnique({
      where: {
        id: strategyId,
      },
      include: {
        // MANDATORY: Include the activities relation
        activities: true, 
        // FIX: The 'goal' relation is not directly on StrategyOutput.
        // We must fetch the 'goal' nested under the 'outcome'.
        outcome: {
            include: {
                goal: true, // Assuming StrategyOutcome model has a 'goal' relation
            }
        },
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
    // Safely serialize required Date objects from the Prisma Model
    createdAt: strategyOutput.createdAt ? strategyOutput.createdAt.toString() : null,
    updatedAt: strategyOutput.updatedAt ? strategyOutput.updatedAt.toString() : null,
    
    // FIX: Serialize nested Outcome dates, including the nested Goal serialization
    outcome: strategyOutput.outcome ? {
        ...strategyOutput.outcome,
        // Serialize Outcome dates
        //createdAt: strategyOutput.outcome.createdAt.toString(),
        //updatedAt: strategyOutput.outcome.updatedAt.toString(),

        // ADDED: Serialize nested Goal dates (nested under Outcome)
        goal: strategyOutput.outcome.goal ? {
            ...strategyOutput.outcome.goal,
           // createdAt: strategyOutput.outcome.goal.createdAt.toString(),
           // updatedAt: strategyOutput.outcome.goal.updatedAt.toString(),
        } : null,
    } : null,
    
    // Serialize nested activity dates
    activities: strategyOutput.activities.map(activity => ({
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
        // Note: The structure is now StrategyOutput -> Outcome -> Goal
        strategyOutput={safeStrategyOutput as any} 
        // currentUser={currentUser} 
      />
    </Container>
  );
};

export default StrategyPage;
// import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
// import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
// import Container from "@/app/components/Container"; 
// import { notFound } from 'next/navigation';

// // Mock types for the new Strategy models, assuming they mirror the old Contract structure
// // You MUST ensure these types match your actual Prisma StrategyOutputModel definition.
// import { StrategyOutputModel, StrategyActivityModel } from "../_components/types/output"; 
// import StrategyDetailView from "./StrategyOutputDetails";
// //import StrategyDetail from "./StrategyDetails"; // New client component name

// interface IParams {
//   id?: string;
// }

// // Next.js Server Component for fetching strategy data
// const StrategyPage = async ({ params }: { params: IParams }) => {
//   // 1. Fetch User (needed for client component permissions/context)
//   const currentUser = await getCurrentUser(); 
  
//   const strategyId = params.id;
//   let strategyOutput: StrategyOutputModel | null = null;
  
//   // Basic check for missing ID
//   if (!strategyId) {
//       notFound();
//   }

//   try {
//     // 2. Fetch the Strategy Output, including related activities
//     // NOTE: 'strategyOutputModel' is assumed to be the new Prisma model name.
//     strategyOutput = await prisma.strategyOutput.findUnique({
//       where: {
//         id: strategyId,
//       },
//       include: {
//         // MANDATORY: Include the activities relation (assumed to be named 'strategyActivityModels')
//         activities: true, 
//       },
//       // Safely cast to ensure type compatibility with StrategyOutputModel
//     }) as StrategyOutputModel | null; 

//   } catch (error) {
//     console.error(`[STRATEGY_PAGE_ERROR] Database error for ID ${strategyId}:`, error);
//   }

//   // --- 3. NOT FOUND CHECK ---
//   if (!strategyOutput) {
//     return (
//       <Container>
//         <div className="text-center py-20">
//           <h2 className="text-3xl font-bold text-gray-900">Strategy Output Not Found</h2>
//           <p className="text-gray-500 mt-2">The strategy output you are looking for does not exist or is unavailable.</p>
//         </div>
//       </Container>
//     );
//   }

//   // --- 4. DATA SERIALIZATION ---
//   // Ensure all Date objects are converted to strings before passing to the Client Component
//   const safeStrategyOutput = {
//     ...strategyOutput,
//     // Safely serialize required Date objects from the Prisma Model (handling potential nulls)
//     createdAt: strategyOutput.createdAt ? strategyOutput.createdAt.toString() : null,
//     updatedAt: strategyOutput.updatedAt ? strategyOutput.updatedAt.toString() : null,
//    // effectiveDate: strategyOutput.effectiveDate ? strategyOutput.effectiveDate.toString() : null,
//     //expirationDate: strategyOutput.expirationDate ? strategyOutput.expirationDate.toString() : null,
    
//     // Serialize nested activity dates
//     strategyActivityModels: strategyOutput.activities.map(activity => ({
//       ...activity,
//       // Assuming all activity models have these required date fields
//       createdAt: activity.createdAt.toString(),
//       updatedAt: activity.updatedAt.toString(),
//       //dueDate: activity.dueDate.toString(),
//     })),
//   };

//   // --- 5. RENDER CLIENT COMPONENT ---
//   return (
//     <Container>
//       <StrategyDetailView
//         // Pass the properly serialized data structure
//         strategyOutput={safeStrategyOutput as any} 
//         // currentUser={currentUser} 
//       />
//     </Container>
//   );
// };

// export default StrategyPage;