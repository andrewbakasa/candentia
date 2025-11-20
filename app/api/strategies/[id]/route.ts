 // app/api/strategies/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { ProposalStatus } from '@prisma/client'; // Assuming ProposalStatus is used

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
    console.log("body", body)
    // Basic Validation
    if (!title || !content || !year || !authorId || !goals || goals.length === 0 || !status) {
        return NextResponse.json({ message: 'Missing required fields (title, content, year, authorId, goals, status).' }, { status: 400 });
    }

    // --- Authorization & Edit Check ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });

        if (!existingStrategy) {
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }

        // 1. Authorization: Only the author can edit
        if (existingStrategy.authorId !== authorId) {
            return NextResponse.json({ message: 'Unauthorized: Only the author can edit this strategy.' }, { status: 403 });
        }

        // 2. Status Check: Only DRAFTs can be edited, or VOTING_OPEN strategies can be amended.
        const canEditDraft = existingStrategy.status === ProposalStatus.DRAFT;
        const isAmendingVote = existingStrategy.status === ProposalStatus.VOTING_OPEN && status === AMENDED_STATUS_SIGNAL;

        if (!canEditDraft && !isAmendingVote) {
            // Reject if it's not a DRAFT edit AND not a valid amendment request
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
        const updatedStrategy = await prisma.$transaction(async (tx) => {
            
            // 1. Update the main Strategy record
            // The 'status' variable now correctly holds either the new status (e.g., PENDING_REVIEW for a DRAFT)
            // or the amendment signal (VOTING_OPEN_AMENDED).
            const updatedStrategy = await tx.strategy.update({
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
            
            return updatedStrategy;
        });

        return NextResponse.json(updatedStrategy);

    } catch (error) {
        console.error('Prisma Transaction Error during PUT:', error);
        return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
    }
}
/*
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
    status:string
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
    console.log(title, content, year, authorId, goals, status)

    // Basic Validation
    if (!title || !content || !year || !authorId || !goals || goals.length === 0) {
        return NextResponse.json({ message: 'Missing required fields (title, content, year, authorId, goals).' }, { status: 400 });
    }

    // --- Authorization & Edit Check ---
    try {
        const existingStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { authorId: true, status: true },
        });

        if (!existingStrategy) {
            return NextResponse.json({ message: 'Strategy not found.' }, { status: 404 });
        }

        // 1. Authorization: Only the author can edit
        if (existingStrategy.authorId !== authorId) {
            return NextResponse.json({ message: 'Unauthorized: Only the author can edit this strategy.' }, { status: 403 });
        }

        // 2. Status Check: Only DRAFTs can be edited
        if (existingStrategy.status !== ProposalStatus.DRAFT) {
            return NextResponse.json({ message: 'Cannot edit strategy once it has moved past DRAFT status.' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error during authorization check:', error);
        return NextResponse.json({ message: 'Failed authorization check.' }, { status: 500 });
    }

    // --------------------------------------------------
    // 🏛️ TRANSACTION: Update Strategy and Nested Goals
    // --------------------------------------------------
    try {
        const updatedStrategy = await prisma.$transaction(async (tx) => {
            
            // 1. Update the main Strategy record
            const updatedStrategy = await tx.strategy.update({
                where: { id: strategyId },
                data: {
                    title,
                    content,
                    year,
                    status,
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
            
            return updatedStrategy;
        });

        return NextResponse.json(updatedStrategy);

    } catch (error) {
        console.error('Prisma Transaction Error during PUT:', error);
        return NextResponse.json({ message: 'Failed to update strategy and goals due to a database error.' }, { status: 500 });
    }
} */

// NOTE: The GET handler for fetching data remains in this same file.
// GET: Fetch a single Strategy by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id;

  try {
    const strategy = await prisma.strategy.findUnique({
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

    if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json({ message: 'Failed to fetch strategy' }, { status: 500 });
  }
}