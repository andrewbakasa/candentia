


import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
import Container from "@/app/components/Container";
import { notFound } from 'next/navigation';

import StrategyDetailView from "./StrategyOutputDetails";
import { Strategy } from "@prisma/client";

// --- 1. CORRECTED TYPESCRIPT INTERFACES ---
export interface StrategyActivityModel {
  id: string;
  title: string;
  description: string | null;
  
  // Relationship to the Output (replaces contractId)
  outputId: string; 
  
  createdAt: Date; // Use string for DateTimes from API
  updatedAt: Date;
  
  // Activity fields from Prisma schema
  startDate: string | null;
  dueDate: string | null; // Scheduled completion time
  completionDate: string | null; // Date the task was finished
  status: string ;//ActivityStatus;
  progressPercent: number; // 0-100
  activityType:string;
}

// Update StrategyGoal to match the Prisma schema provided
interface StrategyGoalModel {
  id: string;
  title: string;
  description: string | null;
  targetYear: number;
  // strategyId is present but not strictly needed for this view
  // createdAt and updatedAt are present on the full model, needed for serialization
  createdAt: Date;
  updatedAt: Date;
  strategy:Strategy

}

// Update StrategyOutcomeMinimal to include full Goal structure and necessary dates
interface StrategyOutcomeFull {
  id: string;
  title: string;
  description: string | null;
  kpi: string | null;
  goal: StrategyGoalModel | null; // Goal is included
  createdAt: Date;
  updatedAt: Date;
}

// Update StrategyOutputModel to use the correct StrategyOutcomeFull structure
export interface StrategyOutputModel {
  id: string;
  title: string;
  description: string | null;

  // Fields from StrategyOutput schema
  responsible: string | null; // Name of the responsible party (non-relational string)
  costEstimate: number | null;
  isCompleted: boolean;
  completionDate: Date | null; // Should be Date | null from Prisma

  // Relationship to the Outcome
  outcomeId: string;
  outcome?: StrategyOutcomeFull; // Must be StrategyOutcomeFull to align with 'include'

  createdAt: Date; // Should be Date from Prisma
  updatedAt: Date; // Should be Date from Prisma

  // Included activities
  activities: StrategyActivityModel[];
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
    // NOTE: The result type will be the full Prisma Model, which is a superset of StrategyOutputModel

    const currentUser= await getCurrentUser()
    const result = await prisma.strategyOutput.findUnique({
        where: {
          id: strategyId,
        },
        include: {
          activities: {
            include: {
              comments:{
                include:{
                    author:true
                }
              }
            }
          }, // MANDATORY: Include the activities relation
         
          outcome: {
            include: {
              goal: { 
                  include: {
                      // Include the full Strategy object
                      strategy: true 
                  }
              }, 
            }, // Fetch the 'goal' nested under the 'outcome'.
          }
        },
    });
    //console.log("Backend:result", result)
    // Safely assign the result. We trust the runtime structure based on the 'include'.
    strategyOutput = result as unknown as StrategyOutputModel | null;

  } catch (error) {
    console.error(`[STRATEGY_PAGE_ERROR] Database error for ID ${strategyId}:`, error);
    // You might want to re-throw a non-sensitive error or return a simple error page here
    // For now, we'll let the notFound check handle it if strategyOutput remains null
  }

  // --- 3. NOT FOUND CHECK ---
  if (!strategyOutput) {
    // This handles both not-found ID and database errors resulting in null
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Strategy Output Not Found</h2>
          <p className="text-gray-500 mt-2">The strategy output you are looking for does not exist or is unavailable.</p>
        </div>
      </Container>
    );
  }

  // --- 4. DATA SERIALIZATION (Core Fixes Applied Here) ---
  // Ensure all Date objects are converted to strings before passing to the Client Component
  const safeStrategyOutput = {
    ...strategyOutput,
    // Safely serialize required Date objects from the Prisma Model
    createdAt: strategyOutput.createdAt.toISOString(), // Use .toISOString() for reliable serialization
    updatedAt: strategyOutput.updatedAt.toISOString(),

    // FIX: Safely serialize optional completionDate
    completionDate: strategyOutput.completionDate?.toISOString() || null,

    // FIX: Serialize nested Outcome and Goal dates safely
    outcome: strategyOutput.outcome ? {
      ...strategyOutput.outcome,
      // The full outcome model includes these dates, serialize them safely.
      // createdAt: strategyOutput.outcome.createdAt.toISOString(),
      // updatedAt: strategyOutput.outcome.updatedAt.toISOString(),
      
      goal: strategyOutput.outcome.goal ? {
        ...strategyOutput.outcome.goal,

        strategy:strategyOutput.outcome.goal.strategy?{
          ...strategyOutput.outcome.goal.strategy,
          submissionDate: strategyOutput.outcome.goal.strategy.submissionDate.toISOString(),
          updatedAt: strategyOutput.outcome.goal.strategy.updatedAt.toISOString(),
        }:null,
        // The full goal model includes these dates, serialize them safely.
       // createdAt: strategyOutput.outcome.goal.createdAt.toISOString(),
       // updatedAt: strategyOutput.outcome.goal.updatedAt.toISOString(),
      } : null,
    } : null,

    // Serialize nested activity dates
    activities: strategyOutput.activities.map(activity => ({
      ...activity,
      // Assuming all activity models have these required date fields
      // FIX: Use optional chaining on dueDate if it might be null/undefined on the model
      createdAt: activity.createdAt.toISOString(), 
      updatedAt: activity.updatedAt.toISOString(),
      // Assuming dueDate is also a Date | null from Prisma for StrategyActivityModel
      dueDate: (activity as any).dueDate?.toISOString() || null, 
    })),
  };

  // --- 5. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <StrategyDetailView
        // Pass the properly serialized data structure
        currentUser={currentUser}
        strategyOutput={safeStrategyOutput as any}
      // currentUser={currentUser} // Uncomment if needed in the client component
      />
    </Container>
  );
};

export default StrategyPage;


