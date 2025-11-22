// app/api/strategies/route.ts
import { NextResponse } from 'next/server';
import prisma from "../../libs/prismadb";

import { PrismaClient, ProposalStatus } from '@prisma/client'; // Import the enums from Prisma
import { manageOutcomesAndOutputs, PutBody } from './[id]/route';
// Utility type for Prisma transaction context
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

// POST: Create a new Strategy
export async function POST(request: Request) {
  // try {
  //   const body = await request.json();
  //   const { title, content, authorId } = body;

  //   // Basic validation
  //   if (!title || !content || !authorId) {
  //     return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  //   }

  //   const newStrategy = await prisma.strategy.create({
  //     data: {
  //       title,
  //       content,
  //       authorId, // Assumes authorId is provided
  //       status: ProposalStatus.DRAFT, // Default status
  //       // Add default RBM Goal/Outcome/Output structure here if required on creation
  //     },
  //   });
  //   return NextResponse.json(newStrategy, { status: 201 });
  // } catch (error) {
  //   console.error('Error creating strategy:', error);
  //   return NextResponse.json({ message: 'Failed to create strategy' }, { status: 500 });
  // }


   // --------------------------------------------------
    // 🏛️ TRANSACTION: Update Strategy and Nested RBM Chain
    // --------------------------------------------------
    try {
         let body: PutBody;
           //console.log("her:body ")
           try {
               body = await request.json();
           } catch (error) {
               return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
           }
       const { title, content, year, authorId, status, goals } = body;
        // Basic validation
        if (!title || !content || !authorId) {
          return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        const updatedStrategyWithRBM = await prisma.$transaction(async (tx) => {
            
            // 1. Update the main Strategy record
            const newStrategy =await tx.strategy.create({
                data: {
                    title,
                    content,
                    year,
                    authorId, // Assumes authorId is provided
                    status: ProposalStatus.DRAFT, // Default status
                },
            });
            
       
            // Create/Update all incoming goals AND their children
            for (const goal of goals) {
                let currentGoalId: string;
                    // Create new goal
                    const created = await tx.strategyGoal.create({
                        data: {
                            strategyId: newStrategy.id,
                            title: goal.title,
                            targetYear: goal.targetYear,
                        },
                    });
                    currentGoalId = created.id;
                
                // 3. Recursive call to manage Outcomes and Outputs for this Goal
                await manageOutcomesAndOutputs(tx, currentGoalId, goal.outcomes);
            }
            
            // 4. FINAL STEP: Fetch the fully updated Strategy with all its related RBM chain
            // Includes are necessary for every level: Goal -> Outcome -> Output
            const finalStrategy = await tx.strategy.findUnique({
                where: { id: newStrategy.id },
                include: {
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

            if (!finalStrategy) {
                throw new Error("Failed to retrieve created strategy after transaction.");
            }
            
            return finalStrategy; // Return the fully populated object
        });
       console.log("back end return:", updatedStrategyWithRBM)
        // Send the fully updated object (including goals, outcomes, and outputs) to the client
        return NextResponse.json(updatedStrategyWithRBM);

    } catch (error) {
        console.error('Prisma Transaction Error during PUT:', error);
        return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
    }
}