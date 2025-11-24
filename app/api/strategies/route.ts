import { NextResponse } from 'next/server';
import prisma from "../../libs/prismadb";

import { PrismaClient, ProposalStatus } from '@prisma/client'; // Import the enums from Prisma
// Note: Assuming manageOutcomesAndOutputs and PutBody are correctly imported from the sibling [id] route file
import { manageOutcomesAndOutputs, PutBody } from './[id]/route'; 
import { transformStrategy } from '@/app/actions/getStrategies';

// Utility type for Prisma transaction context (used by manageOutcomesAndOutputs)
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// GET: Fetch all Strategies
export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      include: {
        author: true,
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
      orderBy: {
        submissionDate: 'desc',
      },
    });
    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json({ message: 'Failed to fetch strategies' }, { status: 500 });
  }
}

// POST: Create a new Strategy and its nested RBM chain (Goals, Outcomes, Outputs)
export async function POST(request: Request) {
    try {
      let body: PutBody;
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
      }

      // Destructure and validate required fields
      const { title, content, year, authorId, goals } = body;

      if (!title || !content || !authorId || !goals) {
        return NextResponse.json({ message: 'Missing required fields (title, content, authorId, goals)' }, { status: 400 });
      }

      // --- TRANSACTION: Create Strategy and Nested RBM Chain ---
      const newStrategyWithRBM = await prisma.$transaction(async (tx: PrismaTransaction) => {
          
          // 1. Create the main Strategy record
          const newStrategy = await tx.strategy.create({
              data: {
                  title,
                  content,
                  year,
                  authorId,
                  // Default status for a new creation is DRAFT
                  status: ProposalStatus.DRAFT, 
              },
          });
          
          // 2. Iterate and create all incoming Goals and their children
          for (const goal of goals) {
              
              // CRITICAL VALIDATION: Ensure required fields are present
              if (!goal.title || goal.targetYear === undefined || goal.targetYear === null) {
                  console.error(`[RBM Management - Goal] Skipping Goal due to missing title or targetYear:`, goal);
                  continue; // Skip invalid goal data to prevent DB error
              }

              // Create new Goal record, linked to the Strategy
              const createdGoal = await tx.strategyGoal.create({
                  data: {
                      strategyId: newStrategy.id,
                      title: goal.title,
                      targetYear: goal.targetYear,
                  },
              });
              
              // 3. Use the management utility to create Outcomes and Outputs for this Goal
              if (goal.outcomes) {
                // This function (imported from [id]/route) must handle the creation logic.
                // It performs multiple nested DB operations (findMany, deleteMany, create/update in loops).
                await manageOutcomesAndOutputs(tx, createdGoal.id, goal.outcomes);
              }
          }
          
          // 4. FINAL STEP: Fetch the fully created Strategy with all its nested relations
          const finalStrategy = await tx.strategy.findUnique({
              where: { id: newStrategy.id },
              include: {
                 author: true,
                    votes: true, // 
                  goals: {
                      include: {
                          outcomes: {
                              include: {
                                  outputs: true,
                              }
                          }
                      }
                  },
              },
          });
          const safeStrategy = transformStrategy(finalStrategy);

          if (!safeStrategy) {
              // This is a safety check: if the final fetch fails, the entire transaction rolls back.
              throw new Error("Failed to retrieve created strategy after transaction.");
          }
          
          return safeStrategy; // Return the fully populated object
        
      }, 
      // 🎯 NEW: Set the interactive transaction timeout to 15000ms (15 seconds)
      {
        timeout: 15000, 
      });

      // Send the fully populated object with a 201 Created status
      return NextResponse.json(newStrategyWithRBM, { status: 201 });

    } catch (error) {
      console.error('Prisma Transaction Error during Strategy POST:', error);
      // @ts-ignore
      const errorCode = error.code ? ` P${error.code}` : '';
      return NextResponse.json({ message: `Failed to create strategy and goals due to a database error.${errorCode}` }, { status: 500 });
    }
}