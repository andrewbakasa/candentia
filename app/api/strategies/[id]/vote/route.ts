// app/api/strategies/[id]/vote/route.ts

import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { VoteType, ProposalStatus } from '@prisma/client';

/**
 * Handles POST requests to record a vote for a specific strategy.
 * This function uses a Prisma transaction for atomicity.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id; // The [id] from the URL

  try {
    // 1. Get required data from the request body
    // NOTE: voterId must be provided by the client, often from an authenticated session.
    const { voterId, voteType } = await request.json(); 

    console.log("voterId, voteType",voterId, voteType)

    if (!voterId || !voteType) {
      return NextResponse.json(
        { message: 'Missing voterId or voteType in request body.' },
        { status: 400 }
      );
    }
    
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

    // 4. Execute the transaction
    const result = await prisma.$transaction([
      // A. Create the new StrategyVote record
      prisma.strategyVote.create({
        data: {
          proposalId: strategyId,
          voterId: voterId,
          type: voteType as VoteType, // Cast the string to the Prisma Enum
        },
      }),

      // B. Atomically update the total vote counts on the Strategy
      prisma.strategy.update({
        where: { id: strategyId },
        data: voteIncrement,
      }),
    ]);

    return NextResponse.json(
      { message: 'Vote successfully recorded and totals updated.', vote: result[0] },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle the unique constraint violation (user already voted)
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