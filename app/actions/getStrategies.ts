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
    timestamp: string; // 💡 CORRECT: Expects the ISO string format
    updatedAt: string; // 💡 CORRECT: Expects the ISO string format
}

// Define the full structure of the Strategy returned from Prisma's findMany with includes
type StrategyWithVotesAndGoals = Awaited<ReturnType<typeof getStrategies>>[number] & {
    votes: {
        id: string;
        voterId: string;
        type: 'YES' | 'NO'; // Matches VoteType enum
        timestamp:string;
        updatedAt:string;
        voter: {
            id: string;
            name: string | null;
            email: string | null;
        } | null; // CRITICAL: Updated type to explicitly allow null/undefined voter
    }[];
};

// -------------------------------------------------------------------------

/**
 * Transforms a raw Strategy object (with included votes) into the structure
 * required by the client, including aggregated vote counts and detailed individual vote records.
 * @param strategy The raw strategy object from Prisma.
 * @returns The transformed strategy object for the client.
 */

// Inside `getStrategies` and `transformStrategy` context:


export const transformStrategy = (strategy: StrategyWithVotesAndGoals) => {
    // 1. Map and transform the individual vote records to include name/email
    const individualVotes: ClientVoteAudit[] = strategy.votes.map(vote => ({
        id: vote.id,
        voterId: vote.voterId,
        voteType: vote.type, // 'type' is used in the model, 'voteType' is used in the frontend prop
        
        // 🚨 FIX: Use optional chaining (?.) to safely access properties, 
        // and provide a fallback string (like 'Unknown' or 'Deleted User')
        // if the voter is missing.
        email: vote.voter?.email || null,
        name: vote.voter?.name || 'Deleted User',
        timestamp: new Date(vote.timestamp).toISOString(), 
        updatedAt: new Date(vote.updatedAt).toISOString()
    }));

    // Use destructuring to safely exclude the raw `votes` array
    const { votes, ...rest } = strategy;

    // 2. Return the strategy object, leveraging the pre-calculated totals from the model
    return {
        ...rest,
        // Leveraging the model's pre-calculated totals for efficiency
        totalVotesYes: strategy.totalVotesYes, 
        totalVotesNo: strategy.totalVotesNo,
        // The detailed list of individual votes (including email/name)
        individualVotes, 
    };
};

/**
 * Fetches all strategies, includes goals, and detailed voter information.
 * @returns A promise resolving to the list of strategies for the client.
 */
export default async function getStrategies(): Promise<StrategiesReturnType> { 
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            // Return an empty array if no current user is authenticated
            return [];
        }
        
        // 1. Fetch all strategies, ensuring the `votes` (with nested `voter` data) and `goals` relationships are included.
        const strategies = await prisma.strategy.findMany({
            include: {
                author: true,
                votes: {
                    // CRITICAL: Include the voter to get the email/name for the Admin view
                    include: {
                        voter: {
                            select: {
                                id: true,
                                name: true,
                                email: true, // This is already correctly included!
                            }
                        }, 
                    }
                },
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
            orderBy: [
                {
                    averageStrategicScore: 'desc',
                },
                {
                    submissionDate: 'desc',
                },
            ]
        });

        // Use assertion to ensure the type safety for mapping (this is common practice when using `findMany` with complex includes)
        const typedStrategies = strategies as unknown as StrategyWithVotesAndGoals[];

        // 2. Map the strategies to transform the data structure for the client
        const safeStrategies = typedStrategies.map(transformStrategy);

        // This array now contains the `individualVotes` property needed by the StrategyCard.
        return safeStrategies as StrategiesReturnType;
        
    } catch (error: any) {
        console.error('Error fetching strategies:', error);
        throw new Error('Failed to fetch strategies.');
    }
}