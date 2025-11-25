import prisma from "../libs/prismadb";
import { StrategiesReturnType } from "../strategy/types/strategy";
import getCurrentUser from "./getCurrentUser";

// --- Type Definitions (Reflecting the Prisma schema and required output) ---

// Define the structure of an individual vote record required by the client (VoterAudit from frontend)
interface ClientVoteAudit {
    id: string;
    voterId: string;
    voteType: 'YES' | 'NO';
    email: string | null;
    name: string | null;
}

// Define the full structure of the Strategy returned from Prisma's findMany with includes
// NOTE: totalVotesYes/No are now guaranteed to be numbers after the update.
type StrategyWithVotesAndGoals = Awaited<ReturnType<typeof getStrategiesWithRecalculation>>[number] & {
    votes: {
        id: string;
        voterId: string;
        type: 'YES' | 'NO'; // Matches VoteType enum
        timestamp:string;
        voter: {
            id: string;
            name: string | null;
            email: string | null;
        };
    }[];
};

// -------------------------------------------------------------------------

/**
 * Transforms a raw Strategy object (with included votes) into the structure
 * required by the client, including aggregated vote counts and detailed individual vote records.
 * NOTE: This function no longer recalculates, but uses the counts from the DB or a previous step.
 * @param strategy The raw strategy object from Prisma (after being updated in the DB).
 * @returns The transformed strategy object for the client.
 */
export const transformStrategy = (strategy: StrategyWithVotesAndGoals) => {
    
    // 1. Map and transform the individual vote records to include name/email/timestamp
    const individualVotes: ClientVoteAudit[] = strategy.votes.map(vote => ({
        id: vote.id,
        voterId: vote.voterId,
        voteType: vote.type, // 'type' is used in the model, 'voteType' is used in the frontend prop
        email: vote.voter.email,
        name: vote.voter.name,
        timestamp: vote.timestamp, 
    }));

    // Use destructuring to safely exclude the raw `votes` array
    const { votes, ...rest } = strategy as any;

    // 2. Return the strategy object, relying on the totals already updated in the DB
    return {
        ...rest,
        individualVotes, 
    };
};

/**
 * Fetches all strategies, recalculates vote totals, saves them to the DB,
 * and includes goals and detailed voter information for the client.
 * @returns A promise resolving to the list of strategies for the client.
 */
export default async function getStrategiesWithRecalculation(): Promise<StrategiesReturnType> { 
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return [];
        }
        
        // 1. Fetch all strategies with their votes
        const strategies = await prisma.strategy.findMany({
            include: {
                author: true,
                votes: {
                    include: {
                        voter: {
                            select: { id: true, name: true, email: true }
                        }, 
                    }
                },
                goals: { include: { outcomes: { include: { outputs: true } } } },
            },
            orderBy: [
                { averageStrategicScore: 'desc' },
                { submissionDate: 'desc' },
            ]
        });

        const typedStrategies = strategies as unknown as StrategyWithVotesAndGoals[];

        // 2. Create an array of update promises
        const updatePromises = typedStrategies.map(async (strategy) => {
            // Recalculate totals
            const totalVotesYes = strategy.votes.filter(vote => vote.type === 'YES').length;
            const totalVotesNo = strategy.votes.filter(vote => vote.type === 'NO').length;
            
            // Check if an update is actually necessary (optional, for performance)
            if (strategy.totalVotesYes !== totalVotesYes || strategy.totalVotesNo !== totalVotesNo) {
                // Update the database record with the new totals
                const updatedStrategy = await prisma.strategy.update({
                    where: { id: strategy.id },
                    data: {
                        totalVotesYes: totalVotesYes,
                        totalVotesNo: totalVotesNo,
                    },
                    // Return the full updated strategy with all includes for consistency
                    include: {
                        author: true,
                        votes: {
                            include: { voter: { select: { id: true, name: true, email: true } } }
                        },
                        goals: { include: { outcomes: { include: { outputs: true } } } },
                    }
                });
                return updatedStrategy;
            }

            // If no update was needed, return the original (typed) strategy
            return strategy;
        });

        // 3. Execute all update/fetch operations concurrently
        const updatedStrategies = await Promise.all(updatePromises) as StrategyWithVotesAndGoals[];

        // 4. Map the updated/fetched strategies to transform the data structure for the client
        const safeStrategies = updatedStrategies.map(transformStrategy);

        return safeStrategies as StrategiesReturnType;
        
    } catch (error: any) {
        console.error('Error fetching and updating strategies:', error);
        throw new Error('Failed to fetch and process strategies.');
    }
}