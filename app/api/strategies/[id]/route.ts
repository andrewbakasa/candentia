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

export interface PutBody {
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
export async function manageOutcomesAndOutputs(
    tx: PrismaTransaction, 
    goalId: string, 
    incomingOutcomes: StrategyOutcome[]
) {
    // TEMPORARY DEBUG LOG
    console.log(`[RBM Management] Starting for Goal ID: ${goalId}. Incoming Outcomes count: ${incomingOutcomes.length}`);
    
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
        // TEMPORARY DEBUG LOG
        console.log(`[RBM Management] Deleting Outcomes IDs: ${outcomesToDelete.join(', ')}`);
        await tx.strategyOutcome.deleteMany({
            where: { id: { in: outcomesToDelete } },
        });
    }

    // Create/Update all incoming outcomes
    for (const outcome of incomingOutcomes) {
        let currentOutcomeId: string;

        // CRITICAL VALIDATION: Ensure required fields are present
        if (!outcome.title || !outcome.kpi) {
             console.error(`[RBM Management] Skipping Outcome due to missing title or KPI:`, outcome);
             continue; // Skip invalid outcome data to prevent DB error
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
            // TEMPORARY DEBUG LOG
            console.log(`[RBM Management] Updated Outcome ID: ${currentOutcomeId}`);
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
            // TEMPORARY DEBUG LOG
            console.log(`[RBM Management] Created new Outcome ID: ${currentOutcomeId}`);
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
            // TEMPORARY DEBUG LOG
            console.log(`[RBM Management] Deleting Outputs IDs: ${outputsToDelete.join(', ')} for Outcome ID: ${currentOutcomeId}`);
            await tx.strategyOutput.deleteMany({
                where: { id: { in: outputsToDelete } },
            });
        }

        // Create/Update all incoming outputs
        for (const output of outcome.outputs) {
             // CRITICAL VALIDATION: Ensure required fields are present
             if (!output.title || !output.responsible) {
                 console.error(`[RBM Management] Skipping Output due to missing title or responsible:`, output);
                 continue; // Skip invalid output data to prevent DB error
             }

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
    console.log("her:body ")
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { title, content, year, authorId, status, goals } = body; 
    console.log("her:body ", body)
    // --- Authorization & Edit Check (Omitted for brevity, assuming your logic works) ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });
       // console.log("her:existingStrategy ", existingStrategy)
        if (!existingStrategy) {
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }

        //  if (existingStrategy.authorId==) {
        //     return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        // }
        
        // Removed commented-out authorization logic for cleanliness
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
                 // TEMPORARY DEBUG LOG
                console.log(`[RBM Management - Goal] Deleting Goals IDs: ${goalsToDelete.join(', ')}`);
                await tx.strategyGoal.deleteMany({
                    where: { id: { in: goalsToDelete } },
                });
            }

            // Create/Update all incoming goals AND their children
            for (const goal of goals) {
                let currentGoalId: string;
                
                // CRITICAL VALIDATION: Ensure required fields are present
                if (!goal.title || goal.targetYear === undefined || goal.targetYear === null) {
                    console.error(`[RBM Management - Goal] Skipping Goal due to missing title or targetYear:`, goal);
                    continue; // Skip invalid goal data to prevent DB error
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
                     // TEMPORARY DEBUG LOG
                    console.log(`[RBM Management - Goal] Updated Goal ID: ${currentGoalId}`);
                } else {
                    // Create new goal
                    const created = await tx.strategyGoal.create({
                        data: {
                            strategyId: strategyId,
                            title: goal.title,
                            targetYear: goal.targetYear,
                            // Ensure the strategyId field is populated correctly
                        },
                    });
                    currentGoalId = created.id;
                     // TEMPORARY DEBUG LOG
                    console.log(`[RBM Management - Goal] Created new Goal ID: ${currentGoalId}`);
                }
                
                // 3. Recursive call to manage Outcomes and Outputs for this Goal
                await manageOutcomesAndOutputs(tx, currentGoalId, goal.outcomes);
            }
            
            // 4. FINAL STEP: Fetch the fully updated Strategy with all its related RBM chain
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
        }, 
        // 🎯 NEW: Set the interactive transaction timeout to 15000ms (15 seconds)
        {
            timeout: 15000, 
        });
       
        // Send the fully updated object (including goals, outcomes, and outputs) to the client
        return NextResponse.json(updatedStrategyWithRBM);

    } catch (error) {
        // TEMPORARY DEBUGGING STEP 3: Log the detailed error object
        console.error('--- DETAILED PRISMA TRANSACTION ERROR DURING PUT ---');
        // @ts-ignore - error might not be a standard Error object
        console.error('Error Code (Pxxxx):', error.code); 
        // @ts-ignore
        console.error('Error Message:', error.message);
        // @ts-ignore
        console.error('Error Stack:', error.stack);
        console.error('Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('-----------------------------------------');
     // @ts-ignore
        return NextResponse.json({ message: `Failed to update strategy and goals due to a database error.${error.code}` }, { status: 500 });
    }
}