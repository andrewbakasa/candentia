import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; 
import prisma from '../../../../libs/prismadb';
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
    
    // 1. Fetch current counts and status BEFORE transaction
    const currentStrategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      select: { 
        status: true,
        totalVotesYes: true,
        totalVotesNo: true,
        // Assuming 'averageStrategicScore' is the field you want to update
      }
    });
    
    if (!currentStrategy || currentStrategy.status !== ProposalStatus.VOTING_OPEN) {
      return NextResponse.json(
        { message: 'Voting is not currently open for this strategy (Status must be VOTING_OPEN).' },
        { status: 403 }
      );
    }
    
    // 2. Determine which counter to increment AND calculate the new counts
    let newYesVotes = currentStrategy.totalVotesYes;
    let newNoVotes = currentStrategy.totalVotesNo;
    
    const voteIncrementData =
      voteType === VoteType.YES 
        ? { totalVotesYes: { increment: 1 } } 
        : { totalVotesNo: { increment: 1 } };

    if (voteType === VoteType.YES) {
        newYesVotes += 1;
    } else {
        newNoVotes += 1;
    }
    
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
        // Ensure this include list is comprehensive to match your client-side data structure
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
      return NextResponse.json({ message: 'Strategy updated but could not be refetched.' }, { status: 500 });
    }

    // 6. Return the full, updated object to the client
    revalidatePath('/strategies');
    revalidatePath(`/strategies/${strategyId}`);

    return NextResponse.json(updatedStrategy, { status: 200 });
  } catch (error: any) {
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