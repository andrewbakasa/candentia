// app/api/strategies/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { ProposalStatus, PrismaClient } from '@prisma/client';

// Define the required structure for the incoming PUT request body (Goal structure updated)
interface StrategyOutput {
    id?: string;
    title: string;
    responsible: string;
    isCompleted: boolean;
}

interface StrategyOutcome {
    id?: string;
    title: string;
    kpi: string;
    outputs: StrategyOutput[];
}

interface StrategyGoal {
    id?: string;
    title: string;
    targetYear: number;
    outcomes: StrategyOutcome[]; // Nested Outcomes added
}

interface PutBody {
    title: string;
    content: string;
    year: string;
    authorId: string;
    goals: StrategyGoal[]; // Now contains nested outcomes/outputs
    status: string
}

// Client-side signal for an amended strategy, which implies a vote reset
const AMENDED_STATUS_SIGNAL = 'VOTING_OPEN_AMENDED';

// Utility type for Prisma transaction context
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;


// --------------------------------------------------
// 📚 UTILITY: Recursive Goal/Outcome/Output Management
// --------------------------------------------------

/**
 * Handles the recursive creation, update, and deletion of Outcomes and their Outputs
 * for a single goal within a transaction.
 */
async function manageOutcomesAndOutputs(
    tx: PrismaTransaction, 
    goalId: string, 
    incomingOutcomes: StrategyOutcome[]
) {
    // --- 1. Manage Outcomes ---
    const currentOutcomes = await tx.strategyOutcome.findMany({
        where: { goalId: goalId },
        select: { id: true },
    });
    const incomingOutcomeIds = incomingOutcomes.map(o => o.id).filter(id => id);

    const outcomesToDelete = currentOutcomes
        .filter(o => !incomingOutcomeIds.includes(o.id))
        .map(o => o.id);

    // Delete outcomes removed by the user (Prisma will automatically cascade delete related outputs)
    if (outcomesToDelete.length > 0) {
        await tx.strategyOutcome.deleteMany({
            where: { id: { in: outcomesToDelete } },
        });
    }

    // Create/Update all incoming outcomes
    for (const outcome of incomingOutcomes) {
        let currentOutcomeId: string;

        if (outcome.id) {
            // Update existing outcome
            const updated = await tx.strategyOutcome.update({
                where: { id: outcome.id },
                data: {
                    title: outcome.title,
                    kpi: outcome.kpi,
                },
            });
            currentOutcomeId = updated.id;
        } else {
            // Create new outcome
            const created = await tx.strategyOutcome.create({
                data: {
                    goalId: goalId,
                    title: outcome.title,
                    kpi: outcome.kpi,
                },
            });
            currentOutcomeId = created.id;
        }

        // --- 2. Manage Outputs for the current Outcome ---
        const currentOutputs = await tx.strategyOutput.findMany({
            where: { outcomeId: currentOutcomeId },
            select: { id: true },
        });
        const incomingOutputIds = outcome.outputs.map(p => p.id).filter(id => id);

        const outputsToDelete = currentOutputs
            .filter(p => !incomingOutputIds.includes(p.id))
            .map(p => p.id);

        if (outputsToDelete.length > 0) {
            await tx.strategyOutput.deleteMany({
                where: { id: { in: outputsToDelete } },
            });
        }

        // Create/Update all incoming outputs
        for (const output of outcome.outputs) {
            if (output.id) {
                // Update existing output
                await tx.strategyOutput.update({
                    where: { id: output.id },
                    data: {
                        title: output.title,
                        responsible: output.responsible,
                        isCompleted: output.isCompleted,
                    },
                });
            } else {
                // Create new output
                await tx.strategyOutput.create({
                    data: {
                        outcomeId: currentOutcomeId,
                        title: output.title,
                        responsible: output.responsible,
                        isCompleted: output.isCompleted,
                    },
                });
            }
        }
    }
}

// --------------------------------------------------
// 🎯 PUT: Update an existing Strategy by ID
// --------------------------------------------------
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const strategyId = params.id;
    let body: PutBody;

    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { title, content, year, authorId, status, goals } = body; 
    
    // --- Authorization & Edit Check (Omitted for brevity, assuming your logic works) ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });
        
        if (!existingStrategy) {
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }
        
        const canEditDraft = existingStrategy.status === ProposalStatus.DRAFT;
        const isAmendingVote = existingStrategy.status === ProposalStatus.VOTING_OPEN && status === AMENDED_STATUS_SIGNAL;

        if (!canEditDraft && !isAmendingVote) {
            return NextResponse.json({ 
                message: `Cannot edit strategy with status ${existingStrategy.status}. Only DRAFTs can be updated, or a VOTING_OPEN strategy can be amended to status ${AMENDED_STATUS_SIGNAL}.` 
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error during authorization check:', error);
        return NextResponse.json({ message: 'Failed authorization check.' }, { status: 500 });
    }

    // --------------------------------------------------
    // 🏛️ TRANSACTION: Update Strategy and Nested RBM Chain
    // --------------------------------------------------
    try {
        const updatedStrategyWithRBM = await prisma.$transaction(async (tx) => {
            
            // 1. Update the main Strategy record
            await tx.strategy.update({
                where: { id: strategyId },
                data: {
                    title,
                    content,
                    year,
                    status: status as ProposalStatus, 
                    updatedAt: new Date(),
                },
            });
            
            // 2. Manage Goals (Delete, Create/Update)
            const currentGoals = await tx.strategyGoal.findMany({
                where: { strategyId: strategyId },
                select: { id: true },
            });
            const incomingGoalIds = goals.map(g => g.id).filter(id => id);

            const goalsToDelete = currentGoals
                .filter(g => !incomingGoalIds.includes(g.id))
                .map(g => g.id);

            // Delete goals that were removed by the user (Outcomes/Outputs will cascade if schema is configured)
            if (goalsToDelete.length > 0) {
                await tx.strategyGoal.deleteMany({
                    where: { id: { in: goalsToDelete } },
                });
            }

            // Create/Update all incoming goals AND their children
            for (const goal of goals) {
                let currentGoalId: string;

                if (goal.id) {
                    // Update existing goal
                    const updated = await tx.strategyGoal.update({
                        where: { id: goal.id },
                        data: {
                            title: goal.title,
                            targetYear: goal.targetYear,
                        },
                    });
                    currentGoalId = updated.id;
                } else {
                    // Create new goal
                    const created = await tx.strategyGoal.create({
                        data: {
                            strategyId: strategyId,
                            title: goal.title,
                            targetYear: goal.targetYear,
                        },
                    });
                    currentGoalId = created.id;
                }
                
                // 3. Recursive call to manage Outcomes and Outputs for this Goal
                await manageOutcomesAndOutputs(tx, currentGoalId, goal.outcomes);
            }
            
            // 4. FINAL STEP: Fetch the fully updated Strategy with all its related RBM chain
            // Includes are necessary for every level: Goal -> Outcome -> Output
            const finalStrategy = await tx.strategy.findUnique({
                where: { id: strategyId },
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
                throw new Error("Failed to retrieve updated strategy after transaction.");
            }
            
            return finalStrategy; // Return the fully populated object
        });

        // Send the fully updated object (including goals, outcomes, and outputs) to the client
        return NextResponse.json(updatedStrategyWithRBM);

    } catch (error) {
        console.error('Prisma Transaction Error during PUT:', error);
        return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
    }
}
// import { NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb';
// import { ProposalStatus } from '@prisma/client'; 

// // Define the required structure for the incoming PUT request body
// interface GoalData {
//     id?: string; // ID is only present for existing goals
//     title: string;
//     targetYear: number;
// }

// interface PutBody {
//     title: string;
//     content: string;
//     year: string;
//     authorId: string; // Used for authorization check
//     goals: GoalData[];
//     status: string // String type because it may contain client-side signals like 'VOTING_OPEN_AMENDED'
// }

// // Client-side signal for an amended strategy, which implies a vote reset
// const AMENDED_STATUS_SIGNAL = 'VOTING_OPEN_AMENDED';

// // --------------------------------------------------
// // 🎯 PUT: Update an existing Strategy by ID
// // --------------------------------------------------
// export async function PUT(
//     request: Request,
//     { params }: { params: { id: string } }
// ) {
//     const strategyId = params.id;
//     let body: PutBody;

//     try {
//         body = await request.json();
//     } catch (error) {
//         return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
//     }

//     // Destructure for readability; status from the body is the *new* intended status
//     const { title, content, year, authorId, status, goals } = body; 
    
//     // --- Authorization & Edit Check ---
//     try {
//         const existingStrategy = await prisma.strategy.findUnique({
//             where: { id: strategyId },
//             select: { authorId: true, status: true },
//         });
        
//         if (!existingStrategy) {
//             return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
//         }
        
//         // 1. Authorization: Only the author can edit (Uncomment if needed)
//         // if (existingStrategy.authorId !== authorId) {
//         //     return NextResponse.json({ message: 'Unauthorized: Only the author can edit this strategy.' }, { status: 403 });
//         // }

//         // 2. Status Check: Only DRAFTs can be edited, or VOTING_OPEN strategies can be amended.
//         const canEditDraft = existingStrategy.status === ProposalStatus.DRAFT;
//         const isAmendingVote = existingStrategy.status === ProposalStatus.VOTING_OPEN && status === AMENDED_STATUS_SIGNAL;

//         if (!canEditDraft && !isAmendingVote) {
//             return NextResponse.json({ 
//                 message: `Cannot edit strategy with status ${existingStrategy.status}. Only DRAFTs can be updated, or a VOTING_OPEN strategy can be amended to status ${AMENDED_STATUS_SIGNAL}.` 
//             }, { status: 400 });
//         }
//     } catch (error) {
//         console.error('Error during authorization check:', error);
//         return NextResponse.json({ message: 'Failed authorization check.' }, { status: 500 });
//     }

//     // --------------------------------------------------
//     // 🏛️ TRANSACTION: Update Strategy and Nested Goals
//     // --------------------------------------------------
//     try {
//         const updatedStrategyWithGoals = await prisma.$transaction(async (tx) => {
            
//             // 1. Update the main Strategy record
//             await tx.strategy.update({
//                 where: { id: strategyId },
//                 data: {
//                     title,
//                     content,
//                     year,
//                     // Cast 'status' to ProposalStatus type, which Prisma will handle.
//                     status: status as ProposalStatus, 
//                     updatedAt: new Date(),
//                 },
//             });
            
//             // 2. Manage Goals (Delete existing, Create/Update new/old)
            
//             // Get current goal IDs to identify which ones to delete (old goals not in the new list)
//             const currentGoals = await tx.strategyGoal.findMany({
//                 where: { strategyId: strategyId },
//                 select: { id: true },
//             });
//             const incomingGoalIds = goals.map(g => g.id).filter(id => id); // IDs present in the PUT body

//             const goalsToDelete = currentGoals
//                 .filter(g => !incomingGoalIds.includes(g.id))
//                 .map(g => g.id);

//             // Delete goals that were removed by the user
//             if (goalsToDelete.length > 0) {
//                 await tx.strategyGoal.deleteMany({
//                     where: { id: { in: goalsToDelete } },
//                 });
//             }

//             // Create/Update all incoming goals
//             for (const goal of goals) {
//                 if (goal.id) {
//                     // Update existing goal (if it has an ID)
//                     await tx.strategyGoal.update({
//                         where: { id: goal.id },
//                         data: {
//                             title: goal.title,
//                             targetYear: goal.targetYear,
//                         },
//                     });
//                 } else {
//                     // Create new goal (if it lacks an ID, means it was newly added in the form)
//                     await tx.strategyGoal.create({
//                         data: {
//                             strategyId: strategyId,
//                             title: goal.title,
//                             targetYear: goal.targetYear,
//                         },
//                     });
//                 }
//             }
            
//             // 3. 🔑 FINAL STEP: Fetch the fully updated Strategy with all its related Goals
//             const finalStrategy = await tx.strategy.findUnique({
//                 where: { id: strategyId },
//                 include: {
//                     goals: true, // Assuming the relation is named 'goals' in your Prisma schema
//                 },
//             });

//             if (!finalStrategy) {
//                 // This shouldn't happen after a successful update, but is a good safeguard
//                 throw new Error("Failed to retrieve updated strategy after transaction.");
//             }
            
//             return finalStrategy; // Return the fully populated object
//         });

//         // Send the fully updated object (including goals) to the client
//         return NextResponse.json(updatedStrategyWithGoals);

//     } catch (error) {
//         console.error('Prisma Transaction Error during PUT:', error);
//         return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
//     }
// }