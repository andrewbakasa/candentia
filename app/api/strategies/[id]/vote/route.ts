// app/api/strategies/[strategyId]/vote/route.ts

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; 
import prisma from '../../../../libs/prismadb'; // Corrected relative path for libs/prismadb
import { VoteType, ProposalStatus } from '@prisma/client';
import { transformStrategy } from '@/app/actions/getStrategies';

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
        
        
        const updatedStrategy =  await prisma.strategy.findUnique({
                where: { id: strategyId },
                include: {
                    author: true,
                    votes:  {
                          select: { voterId: true, type: true }
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
        const safeUpdateStrategy = transformStrategy(updatedStrategy as any);
        

        if (!safeUpdateStrategy) {
            return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
        }

        // 6. Return the full, updated object to the client
        revalidatePath('/strategies');
        revalidatePath(`/strategies/${strategyId}`);

        return NextResponse.json(safeUpdateStrategy, { status: 200 });
    } catch (error: any) {
        // P2002 is for unique constraint violation. Since we added a separate check above, 
        // this P2002 catch might be redundant if the unique constraint is on (voterId, proposalId).
        // It's safer to keep the explicit check (CORRECTION 1) and remove the catch for P2002,
        // letting the error be caught by the general block, or use the explicit check.
        console.error('Error during vote submission:', error);
        return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } } // strategyId
) {
    const strategyId = params.id;

    try {
        const { voterId, voteType  } = await request.json(); // voteType will be 'YES' or 'NO'

       // console.log(voterId, voteType)

        if (!voterId || !voteType) {
            return NextResponse.json(
                { message: 'Missing voterId or voteType in request body.' },
                { status: 400 }
            );
        }

        // 1. Fetch current strategy data and existing vote
        const [currentStrategy, existingVote] = await prisma.$transaction([
            prisma.strategy.findUnique({
                where: { id: strategyId },
                select: { 
                    status: true,
                    totalVotesYes: true,
                    totalVotesNo: true,
                    // Note: If you have a custom field for the score, include it here
                }
            }),
            prisma.strategyVote.findFirst({
                where: {
                    proposalId: strategyId,
                    voterId: voterId,
                }
            })
        ]);
        
        // Validation Checks
        if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
            return NextResponse.json(
                { message: 'Voting is not currently open for this strategy.' },
                { status: 403 }
            );
        }

        if (!existingVote) {
            // If no vote exists, this should probably be a POST request, not a PUT/PATCH.
            return NextResponse.json(
                { message: 'No existing vote found for this user/strategy. Use POST to cast a new vote.' },
                { status: 404 }
            );
        }

        const oldVoteType = existingVote.type;
        const newType = voteType as VoteType;

        if (oldVoteType === newType) {
            // The user is attempting to switch to the vote they already have
            return NextResponse.json(
                { message: `Vote is already set to ${newType}. No change performed.` },
                { status: 200 }
            );
        }
        
        // 2. Determine the required vote count adjustments
        // We will decrement the old type and increment the new type.
        
        let decrementField: 'totalVotesYes' | 'totalVotesNo';
        let incrementField: 'totalVotesYes' | 'totalVotesNo';

        if (oldVoteType === VoteType.YES && newType === VoteType.NO) {
            decrementField = 'totalVotesYes';
            incrementField = 'totalVotesNo';
        } else if (oldVoteType === VoteType.NO && newType === VoteType.YES) {
            decrementField = 'totalVotesNo';
            incrementField = 'totalVotesYes';
        } else {
            // Should not happen based on the `if (oldVoteType === newType)` check, but safe to include.
            return NextResponse.json({ message: 'Invalid vote switch scenario.' }, { status: 400 });
        }
        
        // 3. Calculate the NEW scores based on the intended change
        // Safely check for nulls/undefineds for Prisma fields, though usually numbers are guaranteed.
        let newYesVotes = currentStrategy.totalVotesYes || 0;
        let newNoVotes = currentStrategy.totalVotesNo || 0;

        if (decrementField === 'totalVotesYes') {
            newYesVotes -= 1;
            newNoVotes += 1;
        } else { // decrementField === 'totalVotesNo'
            newNoVotes -= 1;
            newYesVotes += 1;
        }

        // Ensure counts don't go below zero (safety check)
        newYesVotes = Math.max(0, newYesVotes);
        newNoVotes = Math.max(0, newNoVotes);

        const newScore = calculateScore(newYesVotes, newNoVotes);
        
        // 4. Execute the vote update and counter/score update atomically
        await prisma.$transaction([
            // A. Update the existing StrategyVote record to the new type
            prisma.strategyVote.update({
                where: { id: existingVote.id }, // Use the existing vote's ID
                data: {
                    type: newType, // Change the vote type
                    timestamp: new Date(), // Update the timestamp
                },
            }),

            // B. Atomically update the total vote counts AND the score on the Strategy
            prisma.strategy.update({
                where: { id: strategyId },
                data: {
                    // Decrement the old counter and increment the new counter simultaneously
                    [decrementField]: { decrement: 1 },
                    [incrementField]: { increment: 1 },
                    averageStrategicScore: newScore, // Update the score field
                },
            }),
        ]);
        
        // 5. Fetch the full, updated strategy object after the transaction
        const updatedStrategy = await prisma.strategy.findUnique({
            where: { id: strategyId },
            include: {
                author: true,
                votes: {
                    select: { voterId: true, type: true, id: true, timestamp: true }
                }, 
                goals: {
                    include: { outcomes: { include: { outputs: true } } }
                },
            },
        });
        
        // 6. Transform and return the data
        const safeUpdateStrategy = transformStrategy(updatedStrategy as any);
        
        if (!safeUpdateStrategy) {
            return NextResponse.json({ message: 'Vote switched, but could not refetch strategy.' }, { status: 500 });
        }

        // Revalidate cache paths for fresh data
        revalidatePath('/strategies');
        revalidatePath(`/strategies/${strategyId}`);

        return NextResponse.json(safeUpdateStrategy, { status: 200 });
    } catch (error: any) {
        console.error('Error during vote switching:', error);
        return NextResponse.json({ message: 'Failed to switch vote.' }, { status: 500 });
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

      

        const updatedStrategy =  await prisma.strategy.findUnique({
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
        const safeUpdateStrategy = transformStrategy(updatedStrategy as any);
        
        
        if (!safeUpdateStrategy) {
            return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
        }

        // 6. Return the full, updated object to the client
        revalidatePath('/strategies');
        revalidatePath(`/strategies/${strategyId}`);
        
        return NextResponse.json(safeUpdateStrategy, { status: 200 }); 

    } catch (error) {
        console.error('[DELETE_VOTE_ERROR]', error);
        return NextResponse.json({ message: 'Database error canceling vote.' }, { status: 500 });
    }
}
// // app/api/strategies/[strategyId]/vote/route.ts

// import { NextResponse } from 'next/server';
// import { revalidatePath } from 'next/cache'; 
// import prisma from '../../../../libs/prismadb'; // Corrected relative path for libs/prismadb
// import { VoteType, ProposalStatus } from '@prisma/client';
// import { transformStrategy } from '@/app/actions/getStrategies';

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

// // =======================
// // POST: CAST VOTE HANDLER
// // =======================
// export async function POST(
//     request: Request,
//     { params }: { params: { id: string } } // Use strategyId matching the URL structure
// ) {
//     const strategyId = params.id;

//     try {
//         const { voterId, voteType } = await request.json();

//         if (!voterId || !voteType) {
//             return NextResponse.json(
//                 { message: 'Missing voterId or voteType in request body.' },
//                 { status: 400 }
//             );
//         }
        
//         // 1. Fetch current counts and status BEFORE transaction
//         const currentStrategy = await prisma.strategy.findUnique({
//             where: { id: strategyId },
//             select: { 
//                 status: true,
//                 totalVotesYes: true,
//                 totalVotesNo: true,
//             }
//         });
        
//         if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
//             return NextResponse.json(
//                 { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
//                 { status: 403 }
//             );
//         }
        
//         // **CORRECTION 1: Check for existing vote before proceeding**
//         const existingVote = await prisma.strategyVote.findFirst({
//             where: {
//                 proposalId: strategyId,
//                 voterId: voterId,
//             }
//         });

//         if (existingVote) {
//              return NextResponse.json(
//                  { message: 'User has already voted on this strategy.' },
//                  { status: 409 }
//              );
//         }
        
//         // 2. Determine which counter to increment AND calculate the new counts
//         const isYesVote = voteType === VoteType.YES;
//         let newYesVotes = currentStrategy.totalVotesYes + (isYesVote ? 1 : 0);
//         let newNoVotes = currentStrategy.totalVotesNo + (isYesVote ? 0 : 1);
        
//         const voteIncrementData = isYesVote 
//             ? { totalVotesYes: { increment: 1 } } 
//             : { totalVotesNo: { increment: 1 } };
        
//         // 3. Calculate the NEW score based on the new counts
//         const newScore = calculateScore(newYesVotes, newNoVotes);
        
//         // 4. Execute the vote creation and counter/score update atomically
//         await prisma.$transaction([
//             // A. Create the new StrategyVote record
//             prisma.strategyVote.create({
//                 data: {
//                     proposalId: strategyId,
//                     voterId: voterId,
//                     type: voteType as VoteType,
//                 },
//             }),

//             // B. Atomically update the total vote counts AND the score on the Strategy
//             prisma.strategy.update({
//                 where: { id: strategyId },
//                 data: {
//                     ...voteIncrementData,
//                     averageStrategicScore: newScore, // Update the score field
//                 },
//             }),
//         ]);
        
//         // 5. Fetch the complete, updated strategy object
//         // const updatedStrategy = await prisma.strategy.findUnique({
//         //     where: { id: strategyId },
//         //     include: {
//         //         // IMPORTANT: Ensure the include structure matches client expectation (StrategyWithUserVotes)
//         //         // You likely want the votes associated with the proposal, not complex nested goals/outcomes for this call.
//         //         // Adjusted to include just the RBM relation and simplified votes include for client strategy card.
//         //         // riskBusinessModel: true, 
//         //         votes: {
//         //             select: { voterId: true, type: true }
//         //         }
//         //     }
//         // });

//         const updatedStrategy =  await prisma.strategy.findUnique({
//                 where: { id: strategyId },
//                 include: {
//                     author: true,
//                     votes:  {
//                           select: { voterId: true, type: true }
//                    }, 
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
    

        
//                     // 6. Transform the fetched data for the client
//         const safeUpdateStrategy = transformStrategy(updatedStrategy);
        

//         if (!safeUpdateStrategy) {
//             return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
//         }

//         // 6. Return the full, updated object to the client
//         revalidatePath('/strategies');
//         revalidatePath(`/strategies/${strategyId}`);

//         return NextResponse.json(safeUpdateStrategy, { status: 200 });
//     } catch (error: any) {
//         // P2002 is for unique constraint violation. Since we added a separate check above, 
//         // this P2002 catch might be redundant if the unique constraint is on (voterId, proposalId).
//         // It's safer to keep the explicit check (CORRECTION 1) and remove the catch for P2002,
//         // letting the error be caught by the general block, or use the explicit check.
//         console.error('Error during vote submission:', error);
//         return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
//     }
// }

// // ==========================
// // DELETE: CANCEL VOTE HANDLER
// // ==========================
// export async function DELETE(
//     request: Request,
//     { params }: { params: { id: string } } // Use strategyId matching the URL structure
// ) {
//     const strategyId = params.id; // Use strategyId instead of id

//     if (!strategyId || typeof strategyId !== 'string') {
//         return NextResponse.json({ message: 'Invalid Strategy ID' }, { status: 400 });
//     }

//     // Extract voterId from URL query parameters
//     const { searchParams } = new URL(request.url);
//     const voterId = searchParams.get('voterId');

//     if (!voterId || typeof voterId !== 'string') {
//         return NextResponse.json({ message: 'Missing Voter ID in query' }, { status: 400 });
//     }

//     try {
//         // 1. Find the vote to determine its type and check strategy status
//         const existingVote = await prisma.strategyVote.findFirst({
//             where: {
//                 proposalId: strategyId, // Use the correct ID field from the URL
//                 voterId: voterId,
//             },
//         });

//         if (!existingVote) {
//             return NextResponse.json({ message: 'No existing vote found to cancel.' }, { status: 404 });
//         }
        
//         // Check if strategy is open for voting (optional, but consistent with POST)
//         const currentStrategy = await prisma.strategy.findUnique({
//              where: { id: strategyId },
//              select: { 
//                  status: true,
//                  totalVotesYes: true,
//                  totalVotesNo: true,
//              }
//         });

//         if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
//              return NextResponse.json(
//                  { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
//                  { status: 403 }
//              );
//         }
        
//         const voteType = existingVote.type;
//         const isYesVote = voteType === VoteType.YES;

//         // 2. Calculate the NEW counts after cancellation
//         let newYesVotes = currentStrategy.totalVotesYes - (isYesVote ? 1 : 0);
//         let newNoVotes = currentStrategy.totalVotesNo - (isYesVote ? 0 : 1);
        
//         // Ensure counts don't go negative (shouldn't happen with correct logic)
//         newYesVotes = Math.max(0, newYesVotes);
//         newNoVotes = Math.max(0, newNoVotes);
        
//         // 3. Calculate the NEW score based on the new counts
//         const newScore = calculateScore(newYesVotes, newNoVotes);
        
//         const voteDecrementData = isYesVote 
//             ? { totalVotesYes: { decrement: 1 } } 
//             : { totalVotesNo: { decrement: 1 } };

//         // 4. Execute the vote deletion and counter/score update atomically
//         await prisma.$transaction([
//             // A. Delete the vote record
//             // **CRITICAL CORRECTION 2: Use proposalId (strategyId) and voterId for deletion, NOT the vote's primary ID (if it exists)**
//             prisma.strategyVote.deleteMany({
//                 where: {
//                     proposalId: strategyId, // <-- CORRECTED: Use strategyId to target the proposal
//                     voterId: voterId,
//                 },
//             }),

//             // B. Atomically update the total vote counts AND the score on the Strategy
//             prisma.strategy.update({
//                 where: { id: strategyId },
//                 data: {
//                     ...voteDecrementData,
//                     averageStrategicScore: newScore, // Update the score field
//                 },
//             }),
//         ]);

//         // 5. Fetch the complete, updated strategy object (similar to POST)
//         // const updatedStrategy = await prisma.strategy.findUnique({
//         //     where: { id: strategyId },
//         //     include: {
//         //         // riskBusinessModel: true,
//         //         votes: {
//         //             select: { voterId: true, type: true }
//         //         }
//         //     }
//         // });

//         const updatedStrategy =  await prisma.strategy.findUnique({
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
    

        
//                     // 6. Transform the fetched data for the client
//         const safeUpdateStrategy = transformStrategy(updatedStrategy);
        
        
//         if (!safeUpdateStrategy) {
//             return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
//         }

//         // 6. Return the full, updated object to the client
//         revalidatePath('/strategies');
//         revalidatePath(`/strategies/${strategyId}`);
        
//         return NextResponse.json(safeUpdateStrategy, { status: 200 }); 

//     } catch (error) {
//         console.error('[DELETE_VOTE_ERROR]', error);
//         return NextResponse.json({ message: 'Database error canceling vote.' }, { status: 500 });
//     }
// }