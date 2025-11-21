import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { ProposalStatus } from '@prisma/client'; 

// Define the required structure for the incoming PUT request body
interface GoalData {
    id?: string; // ID is only present for existing goals
    title: string;
    targetYear: number;
}

interface PutBody {
    title: string;
    content: string;
    year: string;
    authorId: string; // Used for authorization check
    goals: GoalData[];
    status: string // String type because it may contain client-side signals like 'VOTING_OPEN_AMENDED'
}

// Client-side signal for an amended strategy, which implies a vote reset
const AMENDED_STATUS_SIGNAL = 'VOTING_OPEN_AMENDED';

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

    // Destructure for readability; status from the body is the *new* intended status
    const { title, content, year, authorId, status, goals } = body; 
    
    // --- Authorization & Edit Check ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });
        
        if (!existingStrategy) {
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }
        
        // 1. Authorization: Only the author can edit (Uncomment if needed)
        // if (existingStrategy.authorId !== authorId) {
        //     return NextResponse.json({ message: 'Unauthorized: Only the author can edit this strategy.' }, { status: 403 });
        // }

        // 2. Status Check: Only DRAFTs can be edited, or VOTING_OPEN strategies can be amended.
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
    // 🏛️ TRANSACTION: Update Strategy and Nested Goals
    // --------------------------------------------------
    try {
        const updatedStrategyWithGoals = await prisma.$transaction(async (tx) => {
            
            // 1. Update the main Strategy record
            await tx.strategy.update({
                where: { id: strategyId },
                data: {
                    title,
                    content,
                    year,
                    // Cast 'status' to ProposalStatus type, which Prisma will handle.
                    status: status as ProposalStatus, 
                    updatedAt: new Date(),
                },
            });
            
            // 2. Manage Goals (Delete existing, Create/Update new/old)
            
            // Get current goal IDs to identify which ones to delete (old goals not in the new list)
            const currentGoals = await tx.strategyGoal.findMany({
                where: { strategyId: strategyId },
                select: { id: true },
            });
            const incomingGoalIds = goals.map(g => g.id).filter(id => id); // IDs present in the PUT body

            const goalsToDelete = currentGoals
                .filter(g => !incomingGoalIds.includes(g.id))
                .map(g => g.id);

            // Delete goals that were removed by the user
            if (goalsToDelete.length > 0) {
                await tx.strategyGoal.deleteMany({
                    where: { id: { in: goalsToDelete } },
                });
            }

            // Create/Update all incoming goals
            for (const goal of goals) {
                if (goal.id) {
                    // Update existing goal (if it has an ID)
                    await tx.strategyGoal.update({
                        where: { id: goal.id },
                        data: {
                            title: goal.title,
                            targetYear: goal.targetYear,
                        },
                    });
                } else {
                    // Create new goal (if it lacks an ID, means it was newly added in the form)
                    await tx.strategyGoal.create({
                        data: {
                            strategyId: strategyId,
                            title: goal.title,
                            targetYear: goal.targetYear,
                        },
                    });
                }
            }
            
            // 3. 🔑 FINAL STEP: Fetch the fully updated Strategy with all its related Goals
            const finalStrategy = await tx.strategy.findUnique({
                where: { id: strategyId },
                include: {
                    goals: true, // Assuming the relation is named 'goals' in your Prisma schema
                },
            });

            if (!finalStrategy) {
                // This shouldn't happen after a successful update, but is a good safeguard
                throw new Error("Failed to retrieve updated strategy after transaction.");
            }
            
            return finalStrategy; // Return the fully populated object
        });

        // Send the fully updated object (including goals) to the client
        return NextResponse.json(updatedStrategyWithGoals);

    } catch (error) {
        console.error('Prisma Transaction Error during PUT:', error);
        return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
    }
}