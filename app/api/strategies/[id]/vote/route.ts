import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; // Import revalidatePath
import prisma from '../../../../libs/prismadb';
import { VoteType, ProposalStatus } from '@prisma/client';



export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    
    // --- (Steps 2 & 3 remain the same) ---
    // 2. Pre-check: Verify the strategy status is VOTING_OPEN
    const strategy = await prisma.strategy.findUnique({
        where: { id: strategyId },
        select: { status: true }
    });
    
    if (!strategy || strategy.status !== ProposalStatus.VOTING_OPEN) {
        return NextResponse.json(
            { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
            { status: 403 }
        );
    }
    
    // 3. Determine which counter to increment
    const voteIncrement =
        voteType === VoteType.YES ? { totalVotesYes: { increment: 1 } } : { totalVotesNo: { increment: 1 } };
    
    // --- End of Steps 2 & 3 ---


    // 4. Execute the vote creation and counter update
    await prisma.$transaction([
      // A. Create the new StrategyVote record
      prisma.strategyVote.create({
        data: {
          proposalId: strategyId,
          voterId: voterId,
          type: voteType as VoteType,
        },
      }),

      // B. Atomically update the total vote counts on the Strategy
      prisma.strategy.update({
        where: { id: strategyId },
        data: voteIncrement,
      }),
    ]);
    
    // 5. CRITICAL FIX: Fetch the complete, updated strategy object
    // You need to select ALL fields the client expects (title, goals, status, scores, votes, etc.)
    const updatedStrategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      // Use a comprehensive `include` or `select` statement that matches 
      // the structure of StrategyWithRBM in your client.
      include: {
        // Example: Include all related fields (RBM, votes, etc.)
        goals: { 
          include: { 
            outcomes: { 
              include: { 
                outputs: true 
              } 
            } 
          } 
        },
        votes: {
          select: { voterId: true, type: true }
        }
      }
    });

    if (!updatedStrategy) {
        // Should not happen if the previous update succeeded, but safe to check.
        return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
    }

    // 6. Return the full, updated object to the client
    revalidatePath('/strategies');
    revalidatePath(`/strategies/${strategyId}`);

    return NextResponse.json(updatedStrategy, { status: 200 }); // Status 200/201 is fine here
  } catch (error: any) {
    // ... (Error handling remains the same)
    if (error.code === 'P2002') { 
        return NextResponse.json(
            { message: 'User has already voted on this strategy.' },
            { status: 409 }
        );
    }
    console.error('Error during vote submission:', error);
    return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
  }
}

// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const strategyId = params.id; // The [id] from the URL

//   try {
//     // 1. Get required data from the request body
//     // NOTE: voterId must be provided by the client, often from an authenticated session.
//     const { voterId, voteType } = await request.json();

//     console.log("voterId, voteType-------->",voterId, voteType)

//     if (!voterId || !voteType) {
//       return NextResponse.json(
//         { message: 'Missing voterId or voteType in request body.' },
//         { status: 400 }
//       );
//     }

//     // 2. Pre-check: Verify the strategy status is VOTING_OPEN
//     const strategy = await prisma.strategy.findUnique({
//         where: { id: strategyId },
//         select: { status: true }
//     });
//      console.log("found ----strategy---->",strategy)
//     if (!strategy || strategy.status !== ProposalStatus.VOTING_OPEN) {
//         return NextResponse.json(
//             { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
//             { status: 403 }
//         );
//     }

//     // 3. Determine which counter to increment
//     const voteIncrement =
//       voteType === VoteType.YES ? { totalVotesYes: { increment: 1 } } : { totalVotesNo: { increment: 1 } };

//     // 4. Execute the transaction
//     const result = await prisma.$transaction([
//       // A. Create the new StrategyVote record
//       prisma.strategyVote.create({
//         data: {
//           proposalId: strategyId,
//           voterId: voterId,
//           type: voteType as VoteType, // Cast the string to the Prisma Enum
//         },
//       }),

//       // B. Atomically update the total vote counts on the Strategy
//       prisma.strategy.update({
//         where: { id: strategyId },
//         data: voteIncrement,
//       }),
//     ]);
    
//     // 5. Revalidate cache paths to show the updated vote counts immediately
//     revalidatePath('/strategies');
//     // Also revalidate the specific strategy's page if one exists
//     revalidatePath(`/strategies/${strategyId}`); 

//    console.log("freturning reponse")
//     return NextResponse.json(
//       { message: 'Vote successfully recorded and totals updated.', vote: result[0] },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     // Handle the unique constraint violation (user already voted)
//     if (error.code === 'P2002') { 
//         return NextResponse.json(
//             { message: 'User has already voted on this strategy.' },
//             { status: 409 }
//         );
//     }
//     console.error('Error during vote submission:', error);
//     return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
//   }
// }
// // app/api/strategies/[id]/vote/route.ts

// import { NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { VoteType, ProposalStatus } from '@prisma/client';

// /**
//  * Handles POST requests to record a vote for a specific strategy.
//  * This function uses a Prisma transaction for atomicity.
//  */
// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const strategyId = params.id; // The [id] from the URL

//   try {
//     // 1. Get required data from the request body
//     // NOTE: voterId must be provided by the client, often from an authenticated session.
//     const { voterId, voteType } = await request.json(); 

//     //console.log("voterId, voteType-------->",voterId, voteType)

//     if (!voterId || !voteType) {
//       return NextResponse.json(
//         { message: 'Missing voterId or voteType in request body.' },
//         { status: 400 }
//       );
//     }
    
//     // 2. Pre-check: Verify the strategy status is VOTING_OPEN
//     const strategy = await prisma.strategy.findUnique({
//         where: { id: strategyId },
//         select: { status: true }
//     });

//     if (!strategy || strategy.status !== ProposalStatus.VOTING_OPEN) {
//         return NextResponse.json(
//             { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
//             { status: 403 }
//         );
//     }

//     // 3. Determine which counter to increment
//     const voteIncrement =
//       voteType === VoteType.YES ? { totalVotesYes: { increment: 1 } } : { totalVotesNo: { increment: 1 } };

//     // 4. Execute the transaction
//     const result = await prisma.$transaction([
//       // A. Create the new StrategyVote record
//       prisma.strategyVote.create({
//         data: {
//           proposalId: strategyId,
//           voterId: voterId,
//           type: voteType as VoteType, // Cast the string to the Prisma Enum
//         },
//       }),

//       // B. Atomically update the total vote counts on the Strategy
//       prisma.strategy.update({
//         where: { id: strategyId },
//         data: voteIncrement,
//       }),
//     ]);

//     return NextResponse.json(
//       { message: 'Vote successfully recorded and totals updated.', vote: result[0] },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     // Handle the unique constraint violation (user already voted)
//     if (error.code === 'P2002') { 
//         return NextResponse.json(
//             { message: 'User has already voted on this strategy.' },
//             { status: 409 }
//         );
//     }
//     console.error('Error during vote submission:', error);
//     return NextResponse.json({ message: 'Failed to record vote.' }, { status: 500 });
//   }
// }