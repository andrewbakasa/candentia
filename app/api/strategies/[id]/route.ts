import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { ProposalStatus, PrismaClient } from '@prisma/client';
import { transformStrategy } from '@/app/actions/getStrategies';

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
    outcomes: StrategyOutcome[];
}

export interface PutBody {
    title: string;
    content: string;
    year: string;
    authorId: string;
    goals: StrategyGoal[];
    status: ProposalStatus | 'VOTING_OPEN_AMENDED'; // Explicitly allow the signal
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
export async function manageOutcomesAndOutputs(
    tx: PrismaTransaction, 
    goalId: string, 
    incomingOutcomes: StrategyOutcome[]
) {
    console.log(`[RBM Debug - Goal ${goalId}] Starting Outcome/Output management.`);

    // --- 1. Manage Outcomes ---
    const currentOutcomes = await tx.strategyOutcome.findMany({
        where: { goalId: goalId },
        select: { id: true },
    });
    const currentOutcomeIds = currentOutcomes.map(o => o.id);
    const incomingOutcomeIds = incomingOutcomes.map(o => o.id).filter(id => id);

    console.log(`[RBM Debug - Goal ${goalId}] Current Outcome IDs in DB:`, currentOutcomeIds);
    console.log(`[RBM Debug - Goal ${goalId}] Incoming Outcome IDs from body:`, incomingOutcomeIds);

    const outcomesToDelete = currentOutcomeIds.filter(id => !incomingOutcomeIds.includes(id));

    // Delete outcomes removed by the user (Prisma will automatically cascade delete related outputs)
    if (outcomesToDelete.length > 0) {
        console.log(`[RBM Debug - Goal ${goalId}] Found ${outcomesToDelete.length} Outcomes to DELETE:`, outcomesToDelete);
        const deleteResult = await tx.strategyOutcome.deleteMany({
            where: { id: { in: outcomesToDelete } },
        });
        console.log(`[RBM Debug - Goal ${goalId}] Outcome Deletion successful. Count: ${deleteResult.count}`);
    } else {
        console.log(`[RBM Debug - Goal ${goalId}] No Outcomes to delete.`);
    }

    // Create/Update all incoming outcomes
    for (const outcome of incomingOutcomes) {
        let currentOutcomeId: string;
        
        console.log(`[RBM Debug - Outcome] Processing Outcome ID: ${outcome.id || 'NEW'}`);

        // CRITICAL VALIDATION: Ensure required fields are present
        if (!outcome.title || !outcome.kpi) {
            console.error(`[RBM Error] Skipping invalid outcome (missing title/kpi) in Goal ${goalId}`);
            continue; 
        }

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
            console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Updated.`);
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
            console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Created.`);
        }

        // --- 2. Manage Outputs for the current Outcome ---
        const currentOutputs = await tx.strategyOutput.findMany({
            where: { outcomeId: currentOutcomeId },
            select: { id: true },
        });
        const currentOutputIds = currentOutputs.map(p => p.id);
        const incomingOutputIds = outcome.outputs.map(p => p.id).filter(id => id);
        
        console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Current Output IDs in DB:`, currentOutputIds);
        console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Incoming Output IDs from body:`, incomingOutputIds);


        const outputsToDelete = currentOutputIds.filter(id => !incomingOutputIds.includes(id));

        if (outputsToDelete.length > 0) {
            console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Found ${outputsToDelete.length} Outputs to DELETE:`, outputsToDelete);
            const deleteResult = await tx.strategyOutput.deleteMany({
                where: { id: { in: outputsToDelete } },
            });
            console.log(`[RBM Debug - Outcome ${currentOutcomeId}] Output Deletion successful. Count: ${deleteResult.count}`);
        } else {
            console.log(`[RBM Debug - Outcome ${currentOutcomeId}] No Outputs to delete.`);
        }

        // Create/Update all incoming outputs
        for (const output of outcome.outputs) {
             // CRITICAL VALIDATION: Ensure required fields are present
             if (!output.title || !output.responsible) {
                 console.error(`[RBM Error] Skipping invalid output (missing title/responsible) in Outcome ${currentOutcomeId}`);
                 continue; // Skip invalid output data
             }
             
             console.log(`[RBM Debug - Output] Processing Output ID: ${output.id || 'NEW'} in Outcome ${currentOutcomeId}`);

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
        console.log(`[API PUT Debug] Received request to update Strategy ID: ${strategyId}`);
        console.log(`[API PUT Debug] Incoming body fields (title, year, status):`, { title: body.title, year: body.year, status: body.status });
        console.log(`[API PUT Debug] Number of incoming Goals: ${body.goals.length}`);
    } catch (error) {
        console.error('[API Error] Invalid JSON body received:', error);
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { title, content, year, authorId, status, goals } = body; 

    // --- Authorization & Pre-Check ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });

        if (!existingStrategy) {
            console.warn(`[API PUT Debug] Strategy ID ${strategyId} not found.`);
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }
        
    } catch (error) {
        console.error('[API Error] Failed during pre-check or authorization:', error);
        return NextResponse.json({ message: 'Failed pre-check or authorization.' }, { status: 500 });
    }

    // Determine the actual status to save and if a vote reset is required
    const isAmendedSignal = status === AMENDED_STATUS_SIGNAL;
    const finalStatus = isAmendedSignal ? ProposalStatus.VOTING_OPEN : (status as ProposalStatus);

    // --------------------------------------------------
    // 🏛️ TRANSACTION: Update Strategy and Nested RBM Chain
    // --------------------------------------------------
    try {
        const updatedStrategyWithRBM = await prisma.$transaction(async (tx) => {
            
            console.log(`[Transaction Debug] Starting update for Strategy ${strategyId}. Final status: ${finalStatus}`);

            await tx.strategy.update({
                where: { id: strategyId },
                data: {
                    title,
                    content,
                    year,
                    status: finalStatus, // Use the resolved status
                    updatedAt: new Date(),
                },
            });
            
            // 3. Manage Goals (Delete, Create/Update)
            console.log(`[Transaction Debug] Starting Goal management.`);
            const currentGoals = await tx.strategyGoal.findMany({
                where: { strategyId: strategyId },
                select: { id: true },
            });
            const currentGoalIds = currentGoals.map(g => g.id);
            const incomingGoalIds = goals.map(g => g.id).filter(id => id);
            
            console.log(`[Transaction Debug] Current Goal IDs in DB:`, currentGoalIds);
            console.log(`[Transaction Debug] Incoming Goal IDs from body:`, incomingGoalIds);

            const goalsToDelete = currentGoalIds.filter(id => !incomingGoalIds.includes(id));

            // Delete goals (Outcomes/Outputs will cascade via schema configuration)
            if (goalsToDelete.length > 0) {
                console.log(`[Transaction Debug] Found ${goalsToDelete.length} Goals to DELETE:`, goalsToDelete);
                const deleteResult = await tx.strategyGoal.deleteMany({
                    where: { id: { in: goalsToDelete } },
                });
                console.log(`[Transaction Debug] Goal Deletion successful. Count: ${deleteResult.count}`);
            } else {
                console.log(`[Transaction Debug] No Goals to delete.`);
            }

            // Create/Update all incoming goals AND their children
            for (const goal of goals) {
                let currentGoalId: string;
                
                console.log(`[Transaction Debug] Processing Goal ID: ${goal.id || 'NEW'}`);

                // CRITICAL VALIDATION
                if (!goal.title || goal.targetYear === undefined || goal.targetYear === null) {
                    console.error('[Transaction Error] Skipping invalid goal (missing title/targetYear).');
                    continue; // Skip invalid goal data
                }

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
                    console.log(`[Transaction Debug - Goal ${currentGoalId}] Updated.`);
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
                    console.log(`[Transaction Debug - Goal ${currentGoalId}] Created.`);
                }
                
                // 4. Recursive call to manage Outcomes and Outputs for this Goal
                await manageOutcomesAndOutputs(tx, currentGoalId, goal.outcomes);
            }
            
            // 5. FINAL STEP: Fetch the fully updated Strategy with all its related RBM chain
            const finalStrategy = await tx.strategy.findUnique({
                where: { id: strategyId },
                include: {
                    author: true,
                    votes: {
                    // CRITICAL: Include the voter to get the email/name for the Admin view
                    include: {
                        voter: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }, 
                    }
                },
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
    
            // 6. Transform the fetched data for the client
            const safeStrategy = transformStrategy(finalStrategy as any);
            console.log('[Transaction Debug] Strategy successfully retrieved and transformed after update.');

            if (!safeStrategy) {
                console.error('[Transaction Error] Failed to retrieve updated strategy after transaction.');
                throw new Error("Failed to retrieve updated strategy after transaction.");
            }
            
            return safeStrategy; 
        }, 
        // Set the interactive transaction timeout to 15 seconds (Good for complex RBM saves)
        {
            timeout: 15000, 
        });
        
        // Send the fully updated object (including goals, outcomes, and outputs) to the client
        return NextResponse.json(updatedStrategyWithRBM);

    } catch (error) {
        console.error('--- DETAILED PRISMA TRANSACTION ERROR DURING PUT ---');
        // Log detailed error and return a general 500 response
        console.error(error);
        return NextResponse.json(
            { message: `Failed to update strategy and goals due to a database error.` }, 
            { status: 500 }
        );
    }
}
// import { NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb';
// import { ProposalStatus, PrismaClient } from '@prisma/client';
// import { transformStrategy } from '@/app/actions/getStrategies';

// interface StrategyOutput {
//     id?: string;
//     title: string;
//     responsible: string;
//     isCompleted: boolean;
// }

// interface StrategyOutcome {
//     id?: string;
//     title: string;
//     kpi: string;
//     outputs: StrategyOutput[];
// }

// interface StrategyGoal {
//     id?: string;
//     title: string;
//     targetYear: number;
//     outcomes: StrategyOutcome[];
// }

// export interface PutBody {
//     title: string;
//     content: string;
//     year: string;
//     authorId: string;
//     goals: StrategyGoal[];
//     status: ProposalStatus | 'VOTING_OPEN_AMENDED'; // Explicitly allow the signal
// }

// // Client-side signal for an amended strategy, which implies a vote reset
// const AMENDED_STATUS_SIGNAL = 'VOTING_OPEN_AMENDED';

// // Utility type for Prisma transaction context
// type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;


// // --------------------------------------------------
// // 📚 UTILITY: Recursive Goal/Outcome/Output Management
// // --------------------------------------------------

// /**
//  * Handles the recursive creation, update, and deletion of Outcomes and their Outputs
//  * for a single goal within a transaction.
//  */
// export async function manageOutcomesAndOutputs(
//     tx: PrismaTransaction, 
//     goalId: string, 
//     incomingOutcomes: StrategyOutcome[]
// ) {
//     // --- 1. Manage Outcomes ---
//     const currentOutcomes = await tx.strategyOutcome.findMany({
//         where: { goalId: goalId },
//         select: { id: true },
//     });
//     const incomingOutcomeIds = incomingOutcomes.map(o => o.id).filter(id => id);

//     const outcomesToDelete = currentOutcomes
//         .filter(o => !incomingOutcomeIds.includes(o.id))
//         .map(o => o.id);

//     // Delete outcomes removed by the user (Prisma will automatically cascade delete related outputs)
//     if (outcomesToDelete.length > 0) {
//         await tx.strategyOutcome.deleteMany({
//             where: { id: { in: outcomesToDelete } },
//         });
//     }

//     // Create/Update all incoming outcomes
//     for (const outcome of incomingOutcomes) {
//         let currentOutcomeId: string;

//         // CRITICAL VALIDATION: Ensure required fields are present
//         if (!outcome.title || !outcome.kpi) {
//              // In a real application, you might throw an error here. Skipping is safer for large form data.
//              continue; 
//         }

//         if (outcome.id) {
//             // Update existing outcome
//             const updated = await tx.strategyOutcome.update({
//                 where: { id: outcome.id },
//                 data: {
//                     title: outcome.title,
//                     kpi: outcome.kpi,
//                 },
//             });
//             currentOutcomeId = updated.id;
//         } else {
//             // Create new outcome
//             const created = await tx.strategyOutcome.create({
//                 data: {
//                     goalId: goalId,
//                     title: outcome.title,
//                     kpi: outcome.kpi,
//                 },
//             });
//             currentOutcomeId = created.id;
//         }

//         // --- 2. Manage Outputs for the current Outcome ---
//         const currentOutputs = await tx.strategyOutput.findMany({
//             where: { outcomeId: currentOutcomeId },
//             select: { id: true },
//         });
//         const incomingOutputIds = outcome.outputs.map(p => p.id).filter(id => id);

//         const outputsToDelete = currentOutputs
//             .filter(p => !incomingOutputIds.includes(p.id))
//             .map(p => p.id);

//         if (outputsToDelete.length > 0) {
//             await tx.strategyOutput.deleteMany({
//                 where: { id: { in: outputsToDelete } },
//             });
//         }

//         // Create/Update all incoming outputs
//         for (const output of outcome.outputs) {
//              // CRITICAL VALIDATION: Ensure required fields are present
//              if (!output.title || !output.responsible) {
//                  continue; // Skip invalid output data
//              }

//             if (output.id) {
//                 // Update existing output
//                 await tx.strategyOutput.update({
//                     where: { id: output.id },
//                     data: {
//                         title: output.title,
//                         responsible: output.responsible,
//                         isCompleted: output.isCompleted,
//                     },
//                 });
//             } else {
//                 // Create new output
//                 await tx.strategyOutput.create({
//                     data: {
//                         outcomeId: currentOutcomeId,
//                         title: output.title,
//                         responsible: output.responsible,
//                         isCompleted: output.isCompleted,
//                     },
//                 });
//             }
//         }
//     }
// }

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
    
//     const { title, content, year, authorId, status, goals } = body; 

//     // --- Authorization & Pre-Check ---
//     try {
//         const existingStrategy = await prisma.strategy.findUnique({
//             where: { id: strategyId },
//             select: { authorId: true, status: true },
//         });

//         if (!existingStrategy) {
//             return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
//         }
        
//         // You would typically verify the authorId here against the authenticated user's ID
//         // if (existingStrategy.authorId !== authenticatedUserId) { ... }
        
//     } catch (error) {
//         return NextResponse.json({ message: 'Failed pre-check or authorization.' }, { status: 500 });
//     }

//     // Determine the actual status to save and if a vote reset is required
//     const isAmendedSignal = status === AMENDED_STATUS_SIGNAL;
//     const finalStatus = isAmendedSignal ? ProposalStatus.VOTING_OPEN : (status as ProposalStatus);

//     // --------------------------------------------------
//     // 🏛️ TRANSACTION: Update Strategy and Nested RBM Chain
//     // --------------------------------------------------
//     try {
//         const updatedStrategyWithRBM = await prisma.$transaction(async (tx) => {
           
//             await tx.strategy.update({
//                 where: { id: strategyId },
//                 data: {
//                     title,
//                     content,
//                     year,
//                     status: finalStatus, // Use the resolved status
//                     updatedAt: new Date(),
//                 },
//             });
            
//             // 3. Manage Goals (Delete, Create/Update)
//             const currentGoals = await tx.strategyGoal.findMany({
//                 where: { strategyId: strategyId },
//                 select: { id: true },
//             });
//             const incomingGoalIds = goals.map(g => g.id).filter(id => id);

//             const goalsToDelete = currentGoals
//                 .filter(g => !incomingGoalIds.includes(g.id))
//                 .map(g => g.id);

//             // Delete goals (Outcomes/Outputs will cascade via schema configuration)
//             if (goalsToDelete.length > 0) {
//                 await tx.strategyGoal.deleteMany({
//                     where: { id: { in: goalsToDelete } },
//                 });
//             }

//             // Create/Update all incoming goals AND their children
//             for (const goal of goals) {
//                 let currentGoalId: string;
                
//                 // CRITICAL VALIDATION
//                 if (!goal.title || goal.targetYear === undefined || goal.targetYear === null) {
//                     continue; // Skip invalid goal data
//                 }

//                 if (goal.id) {
//                     // Update existing goal
//                     const updated = await tx.strategyGoal.update({
//                         where: { id: goal.id },
//                         data: {
//                             title: goal.title,
//                             targetYear: goal.targetYear,
//                         },
//                     });
//                     currentGoalId = updated.id;
//                 } else {
//                     // Create new goal
//                     const created = await tx.strategyGoal.create({
//                         data: {
//                             strategyId: strategyId,
//                             title: goal.title,
//                             targetYear: goal.targetYear,
//                         },
//                     });
//                     currentGoalId = created.id;
//                 }
                
//                 // 4. Recursive call to manage Outcomes and Outputs for this Goal
//                 await manageOutcomesAndOutputs(tx, currentGoalId, goal.outcomes);
//             }
            
//             // 5. FINAL STEP: Fetch the fully updated Strategy with all its related RBM chain
//             const finalStrategy = await tx.strategy.findUnique({
//                 where: { id: strategyId },
//                 include: {
//                     author: true,
//                   votes: {
//                     // CRITICAL: Include the voter to get the email/name for the Admin view
//                     include: {
//                         voter: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                                 email: true,
//                             }
//                         }, 
//                     }
//                 },
//                     goals: {
//                         include: {
//                             outcomes: {
//                                 include: {
//                                     outputs: true,
//                                 }
//                             }
//                         }
//                     },
//                 },
//             });
    
//             // 6. Transform the fetched data for the client
//             const safeStrategy = transformStrategy(finalStrategy as any);

//             if (!safeStrategy) {
//                 throw new Error("Failed to retrieve updated strategy after transaction.");
//             }
            
//             return safeStrategy; 
//         }, 
//         // Set the interactive transaction timeout to 15 seconds (Good for complex RBM saves)
//         {
//             timeout: 15000, 
//         });
        
//         // Send the fully updated object (including goals, outcomes, and outputs) to the client
//         return NextResponse.json(updatedStrategyWithRBM);

//     } catch (error) {
//         console.error('--- DETAILED PRISMA TRANSACTION ERROR DURING PUT ---');
//         // Log detailed error and return a general 500 response
//         console.error(error);
//         return NextResponse.json(
//             { message: `Failed to update strategy and goals due to a database error.` }, 
//             { status: 500 }
//         );
//     }
// }