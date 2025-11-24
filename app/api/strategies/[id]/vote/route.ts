// app/api/strategies/[strategyId]/vote/route.ts

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; 
import prisma from '../../../../libs/prismadb'; // Corrected relative path for libs/prismadb
import { VoteType, ProposalStatus } from '@prisma/client';

// Define the scoring function (e.g., Score = (Yes Votes / Total Votes) * 10)
const calculateScore = (yesVotes: number, noVotes: number): number => {
    const totalVotes = yesVotes + noVotes;
    if (totalVotes === 0) {
        return 0.0;
    }
    // Calculate score as percentage of Yes votes, scaled to 10 points, rounded to 2 decimal places
    const score = (yesVotes / totalVotes) * 10;
    return parseFloat(score.toFixed(2));
};

// =======================
// POST: CAST VOTE HANDLER
// =======================
export async function POST(
    request: Request,
    { params }: { params: { id: string } } // Use strategyId matching the URL structure
) {
    const strategyId = params.id;

    try {
        const { voterId, voteType } = await request.json();

        if (!voterId || !voteType) {
            return NextResponse.json(
                { message: 'Missing voterId or voteType in request body.' },
                { status: 400 }
            );
        }
        
        // 1. Fetch current counts and status BEFORE transaction
        const currentStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            select: { 
                status: true,
                totalVotesYes: true,
                totalVotesNo: true,
            }
        });
        
        if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
            return NextResponse.json(
                { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
                { status: 403 }
            );
        }
        
        // **CORRECTION 1: Check for existing vote before proceeding**
        const existingVote = await prisma.strategyVote.findFirst({
            where: {
                proposalId: strategyId,
                voterId: voterId,
            }
        });

        if (existingVote) {
             return NextResponse.json(
                 { message: 'User has already voted on this strategy.' },
                 { status: 409 }
             );
        }
        
        // 2. Determine which counter to increment AND calculate the new counts
        const isYesVote = voteType === VoteType.YES;
        let newYesVotes = currentStrategy.totalVotesYes + (isYesVote ? 1 : 0);
        let newNoVotes = currentStrategy.totalVotesNo + (isYesVote ? 0 : 1);
        
        const voteIncrementData = isYesVote 
            ? { totalVotesYes: { increment: 1 } } 
            : { totalVotesNo: { increment: 1 } };
        
        // 3. Calculate the NEW score based on the new counts
        const newScore = calculateScore(newYesVotes, newNoVotes);
        
        // 4. Execute the vote creation and counter/score update atomically
        await prisma.$transaction([
            // A. Create the new StrategyVote record
            prisma.strategyVote.create({
                data: {
                    proposalId: strategyId,
                    voterId: voterId,
                    type: voteType as VoteType,
                },
            }),

            // B. Atomically update the total vote counts AND the score on the Strategy
            prisma.strategy.update({
                where: { id: strategyId },
                data: {
                    ...voteIncrementData,
                    averageStrategicScore: newScore, // Update the score field
                },
            }),
        ]);
        
        // 5. Fetch the complete, updated strategy object
        const updatedStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            include: {
                // IMPORTANT: Ensure the include structure matches client expectation (StrategyWithUserVotes)
                // You likely want the votes associated with the proposal, not complex nested goals/outcomes for this call.
                // Adjusted to include just the RBM relation and simplified votes include for client strategy card.
                // riskBusinessModel: true, 
                votes: {
                    select: { voterId: true, type: true }
                }
            }
        });

        if (!updatedStrategy) {
            return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
        }

        // 6. Return the full, updated object to the client
        revalidatePath('/strategies');
        revalidatePath(`/strategies/${strategyId}`);

        return NextResponse.json(updatedStrategy, { status: 200 });
    } catch (error: any) {
        // P2002 is for unique constraint violation. Since we added a separate check above, 
        // this P2002 catch might be redundant if the unique constraint is on (voterId, proposalId).
        // It's safer to keep the explicit check (CORRECTION 1) and remove the catch for P2002,
        // letting the error be caught by the general block, or use the explicit check.
        console.error('Error during vote submission:', error);
        return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
    }
}

// ==========================
// DELETE: CANCEL VOTE HANDLER
// ==========================
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } } // Use strategyId matching the URL structure
) {
    const strategyId = params.id; // Use strategyId instead of id

    if (!strategyId || typeof strategyId !== 'string') {
        return NextResponse.json({ message: 'Invalid Strategy ID' }, { status: 400 });
    }

    // Extract voterId from URL query parameters
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get('voterId');

    if (!voterId || typeof voterId !== 'string') {
        return NextResponse.json({ message: 'Missing Voter ID in query' }, { status: 400 });
    }

    try {
        // 1. Find the vote to determine its type and check strategy status
        const existingVote = await prisma.strategyVote.findFirst({
            where: {
                proposalId: strategyId, // Use the correct ID field from the URL
                voterId: voterId,
            },
        });

        if (!existingVote) {
            return NextResponse.json({ message: 'No existing vote found to cancel.' }, { status: 404 });
        }
        
        // Check if strategy is open for voting (optional, but consistent with POST)
        const currentStrategy = await prisma.strategy.findUnique({
             where: { id: strategyId },
             select: { 
                 status: true,
                 totalVotesYes: true,
                 totalVotesNo: true,
             }
        });

        if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
             return NextResponse.json(
                 { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
                 { status: 403 }
             );
        }
        
        const voteType = existingVote.type;
        const isYesVote = voteType === VoteType.YES;

        // 2. Calculate the NEW counts after cancellation
        let newYesVotes = currentStrategy.totalVotesYes - (isYesVote ? 1 : 0);
        let newNoVotes = currentStrategy.totalVotesNo - (isYesVote ? 0 : 1);
        
        // Ensure counts don't go negative (shouldn't happen with correct logic)
        newYesVotes = Math.max(0, newYesVotes);
        newNoVotes = Math.max(0, newNoVotes);
        
        // 3. Calculate the NEW score based on the new counts
        const newScore = calculateScore(newYesVotes, newNoVotes);
        
        const voteDecrementData = isYesVote 
            ? { totalVotesYes: { decrement: 1 } } 
            : { totalVotesNo: { decrement: 1 } };

        // 4. Execute the vote deletion and counter/score update atomically
        await prisma.$transaction([
            // A. Delete the vote record
            // **CRITICAL CORRECTION 2: Use proposalId (strategyId) and voterId for deletion, NOT the vote's primary ID (if it exists)**
            prisma.strategyVote.deleteMany({
                where: {
                    proposalId: strategyId, // <-- CORRECTED: Use strategyId to target the proposal
                    voterId: voterId,
                },
            }),

            // B. Atomically update the total vote counts AND the score on the Strategy
            prisma.strategy.update({
                where: { id: strategyId },
                data: {
                    ...voteDecrementData,
                    averageStrategicScore: newScore, // Update the score field
                },
            }),
        ]);

        // 5. Fetch the complete, updated strategy object (similar to POST)
        const updatedStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            include: {
                // riskBusinessModel: true,
                votes: {
                    select: { voterId: true, type: true }
                }
            }
        });
        
        if (!updatedStrategy) {
            return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
        }

        // 6. Return the full, updated object to the client
        revalidatePath('/strategies');
        revalidatePath(`/strategies/${strategyId}`);
        
        return NextResponse.json(updatedStrategy, { status: 200 }); 

    } catch (error) {
        console.error('[DELETE_VOTE_ERROR]', error);
        return NextResponse.json({ message: 'Database error canceling vote.' }, { status: 500 });
    }
}
// import { NextResponse } from 'next/server';
// import { revalidatePath } from 'next/cache'; 
// import prisma from '../../../../libs/prismadb';
// import { VoteType, ProposalStatus } from '@prisma/client';

// // Define the scoring function (e.g., Score = (Yes Votes / Total Votes) * 10)
// const calculateScore = (yesVotes: number, noVotes: number): number => {
//     const totalVotes = yesVotes + noVotes;
//     if (totalVotes === 0) {
//         return 0.0;
//     }
//     // Calculate score as percentage of Yes votes, scaled to 10 points, rounded to 2 decimal places
//     const score = (yesVotes / totalVotes) * 10;
//     return parseFloat(score.toFixed(2));
// };

// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const strategyId = params.id;

//   try {
//     const { voterId, voteType } = await request.json();

//     if (!voterId || !voteType) {
//       return NextResponse.json(
//         { message: 'Missing voterId or voteType in request body.' },
//         { status: 400 }
//       );
//     }
    
//     // 1. Fetch current counts and status BEFORE transaction
//     const currentStrategy = await prisma.strategy.findUnique({
//       where: { id: strategyId },
//       select: { 
//         status: true,
//         totalVotesYes: true,
//         totalVotesNo: true,
//         // Assuming 'averageStrategicScore' is the field you want to update
//       }
//     });
    
//     if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
//       return NextResponse.json(
//         { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
//         { status: 403 }
//       );
//     }
    
//     // 2. Determine which counter to increment AND calculate the new counts
//     let newYesVotes = currentStrategy.totalVotesYes;
//     let newNoVotes = currentStrategy.totalVotesNo;
    
//     const voteIncrementData =
//       voteType === VoteType.YES 
//         ? { totalVotesYes: { increment: 1 } } 
//         : { totalVotesNo: { increment: 1 } };

//     if (voteType === VoteType.YES) {
//         newYesVotes += 1;
//     } else {
//         newNoVotes += 1;
//     }
    
//     // 3. Calculate the NEW score based on the new counts
//     const newScore = calculateScore(newYesVotes, newNoVotes);
    
//     // 4. Execute the vote creation and counter/score update atomically
//     await prisma.$transaction([
//       // A. Create the new StrategyVote record
//       prisma.strategyVote.create({
//         data: {
//           proposalId: strategyId,
//           voterId: voterId,
//           type: voteType as VoteType,
//         },
//       }),

//       // B. Atomically update the total vote counts AND the score on the Strategy
//       prisma.strategy.update({
//         where: { id: strategyId },
//         data: {
//             ...voteIncrementData,
//             averageStrategicScore: newScore, // Update the score field
//         },
//       }),
//     ]);
    
//     // 5. Fetch the complete, updated strategy object
//     const updatedStrategy = await prisma.strategy.findUnique({
//       where: { id: strategyId },
//       include: {
//         // Ensure this include list is comprehensive to match your client-side data structure
//         goals: { 
//           include: { 
//             outcomes: { 
//               include: { 
//                 outputs: true 
//               } 
//             } 
//           } 
//         },
//         votes: {
//           select: { voterId: true, type: true }
//         }
//       }
//     });

//     if (!updatedStrategy) {
//       return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
//     }

//     // 6. Return the full, updated object to the client
//     revalidatePath('/strategies');
//     revalidatePath(`/strategies/${strategyId}`);

//     return NextResponse.json(updatedStrategy, { status: 200 });
//   } catch (error: any) {
//     if (error.code === 'P2002') { 
//       return NextResponse.json(
//         { message: 'User has already voted on this strategy.' },
//         { status: 409 }
//       );
//     }
//     console.error('Error during vote submission:', error);
//     return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
//   }
// }

// export async function DELETE(
//   request: Request,
//  { params }: { params: { id: string } }
// ) {
//   const { id } = params;

//   if (!id || typeof id !== 'string') {
//     return NextResponse.json({ message: 'Invalid Strategy ID' }, { status: 400 });
//   }

//   // Extract voterId from URL query parameters
//   const { searchParams } = new URL(request.url);
//   const voterId = searchParams.get('voterId');

//   if (!voterId || typeof voterId !== 'string') {
//     return NextResponse.json({ message: 'Missing Voter ID in query' }, { status: 400 });
//   }

//   try {
//     // 1. Delete the vote
//     const deletedVote = await prisma.strategyVote.deleteMany({
//       where: {
//         id: id,
//         voterId: voterId,
//       },
//     });

//     if (deletedVote.count === 0) {
//       return NextResponse.json({ message: 'No existing vote found to cancel.' }, { status: 404 });
//     }

//     // 2. Recalculate and fetch the updated strategy object
//     const updatedStrategy = await prisma.strategy.findUnique({
//       where: { id: id },
//       include: {
//         votes: {
//           select: { voterId: true, voter: true }
//         }
//       }
//     });

//     if (!updatedStrategy) {
//       // This should ideally not happen after a successful vote deletion on a strategy
//       return NextResponse.json({ message: 'Strategy not found after vote cancellation.' }, { status: 404 });
//     }
    
//     // 3. Return the updated strategy object to the client
//     // (This allows the client to instantly update the UI without refetching the whole page)
//     return NextResponse.json(updatedStrategy); 

//   } catch (error) {
//     console.error('[DELETE_VOTE_ERROR]', error);
//     return NextResponse.json({ message: 'Database error canceling vote.' }, { status: 500 });
//   }
// }

// NOTE: You would implement POST for casting a vote here as well, but only DELETE is shown for brevity.