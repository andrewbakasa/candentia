import prisma from "../libs/prismadb";
import { StrategiesReturnType } from "../strategy/types/strategy";
import getCurrentUser from "./getCurrentUser";

// --- Type Definitions (Reflecting the Prisma schema and required output) ---

// Strategy fields that are Date objects in Prisma need to be defined as 'string' for the client
// This is necessary for safe serialization from Server Component to Client Component.

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

// NOTE: This type definition must precisely reflect the full structure returned by prisma.strategy.findMany
// including all nested includes (author, votes, goals, outcomes, outputs) before transformation.
// We are leaving the Date fields here as the raw Prisma types (Date objects) since they are the input
// to `transformStrategy`.

// Define the base types for nested relations (assuming all date fields are raw 'Date' objects from Prisma)
interface OutputType {
    // Assuming these are fields from your Output model
    id: string;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any; // Catch all other fields
}

interface OutcomeType {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    outputs: OutputType[];
    [key: string]: any; 
}

interface GoalType {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    outcomes: OutcomeType[];
    [key: string]: any; 
}

interface AuthorType {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any;
}


// Define the full structure of the Strategy returned from Prisma's findMany with includes
type StrategyWithVotesAndGoals = Awaited<ReturnType<typeof getStrategies>>[number] & {
    // Top-level Strategy fields expected to be Date objects from Prisma
    createdAt: Date; 
    updatedAt: Date;
    submissionDate: Date | null; // Assuming submissionDate can be null
    
    author: AuthorType;
    goals: GoalType[];
    
    // Vote structure returned from the query
    votes: {
        id: string;
        voterId: string;
        type: 'YES' | 'NO'; // Matches VoteType enum
        timestamp: string | Date; // Use string | Date to be safe, but it often comes as Date
        updatedAt: string | Date; // Use string | Date to be safe, but it often comes as Date
        voter: {
            id: string;
            name: string | null;
            email: string | null;
        } | null;
    }[];
    [key: string]: any; // Catch all other fields
};


// -------------------------------------------------------------------------

/**
 * Helper function to safely convert a potentially null/invalid date value to an ISO string.
 * This prevents the RangeError: Invalid time value.
 * @param dateValue The raw date string or Date object from Prisma.
 * @returns The ISO string, or an empty string if the date is invalid or null/undefined.
 */
const safeToISOString = (dateValue: any): string => {
    if (!dateValue) {
        return '';
    }
    
    // Convert to Date object if it's not one (e.g., if it's already a string)
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Check if the constructed Date object is valid before calling toISOString()
    return isNaN(date.getTime()) ? '' : date.toISOString();
};


/**
 * Recursively transforms a raw object by converting all Date properties into ISO strings.
 * This is the safest way to ensure all nested dates are handled for Next.js serialization.
 */
const serializeDates = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeDates(item));
    }

    const newObj: { [key: string]: any } = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];

            if (value instanceof Date) {
                // Primary check for Prisma Date objects
                newObj[key] = safeToISOString(value);
            } else if (typeof value === 'object' && value !== null) {
                // Recursively handle nested objects and arrays
                newObj[key] = serializeDates(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};


/**
 * Transforms a raw Strategy object (with included votes) into the structure
 * required by the client, including aggregated vote counts and detailed individual vote records.
 * @param strategy The raw strategy object from Prisma.
 * @returns The transformed strategy object for the client.
 */
export const transformStrategy = (strategy: StrategyWithVotesAndGoals) => {
    // Step 1: Serialize all Date objects on the entire structure (strategy, author, goals, etc.)
    const safeStrategy = serializeDates(strategy);

    // Step 2: Extract the custom fields and map individual votes (which were serialized in Step 1)
    
    // votes should already contain serialized strings after `serializeDates` runs, 
    // but we map them here to fit the specific ClientVoteAudit structure.
    const individualVotes: ClientVoteAudit[] = safeStrategy.votes.map((vote: any) => ({
        id: vote.id,
        voterId: vote.voterId,
        voteType: vote.type,
        
        // Voter details are already serialized and safely accessed
        email: vote.voter?.email || null,
        name: vote.voter?.name || 'Deleted User',
        
        // These fields are already safe strings from the serializeDates step
        timestamp: vote.timestamp, 
        updatedAt: vote.updatedAt
    }));

    // Step 3: Use destructuring on the *original* raw strategy to get the rest of the fields
    // We then combine the *safe* versions of those fields in the return.
    // NOTE: We rely on the `safeStrategy` object created in Step 1 to hold the safe string dates.
    const { votes, ...restOfRawStrategy } = strategy;


    // Step 4: Return the complete, safe strategy object for the client
    return {
        // Spread the entire serialized strategy (excluding votes, which is handled below)
        ...serializeDates(restOfRawStrategy),

        // Leveraging the model's pre-calculated totals
        totalVotesYes: safeStrategy.totalVotesYes, 
        totalVotesNo: safeStrategy.totalVotesNo,
        
        // The detailed list of individual votes (including email/name)
        individualVotes, 
    };
};

// ... (getStrategies remains mostly the same, but the function signature is complex)

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
        
        // 1. Fetch all strategies, ensuring all relationships are included.
        const strategies = await prisma.strategy.findMany({
            include: {
                author: true,
                votes: {
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

        // Use assertion to ensure the type safety for mapping
        const typedStrategies = strategies as unknown as StrategyWithVotesAndGoals[];

        // 2. Map the strategies to transform the data structure for the client,
        // which includes full Date serialization and custom vote audits.
        const safeStrategies = typedStrategies.map(transformStrategy);

        return safeStrategies as StrategiesReturnType;
        
    } catch (error: any) {
        console.error('Error fetching strategies:', error);
        // Ensure you throw a generic error in production environments
        throw new Error('Failed to fetch strategies.'); 
    }
}
// import prisma from "../libs/prismadb";
// import { StrategiesReturnType } from "../strategy/types/strategy";
// import getCurrentUser from "./getCurrentUser";

// // --- Type Definitions (Reflecting the Prisma schema and required output) ---

// // Define the structure of an individual vote record required by the client (VoterAudit from frontend)
// interface ClientVoteAudit {
//     id: string;
//     voterId: string;
//     voteType: 'YES' | 'NO';
//     email: string | null;
//     name: string | null;
//     timestamp: string; // 💡 CORRECT: Expects the ISO string format
//     updatedAt: string; // 💡 CORRECT: Expects the ISO string format
// }

// // Define the full structure of the Strategy returned from Prisma's findMany with includes
// type StrategyWithVotesAndGoals = Awaited<ReturnType<typeof getStrategies>>[number] & {
//     votes: {
//         id: string;
//         voterId: string;
//         type: 'YES' | 'NO'; // Matches VoteType enum
//         timestamp:string;
//         updatedAt:string;
//         voter: {
//             id: string;
//             name: string | null;
//             email: string | null;
//         } | null; // CRITICAL: Updated type to explicitly allow null/undefined voter
//     }[];
// };

// // -------------------------------------------------------------------------

// /**
//  * Transforms a raw Strategy object (with included votes) into the structure
//  * required by the client, including aggregated vote counts and detailed individual vote records.
//  * @param strategy The raw strategy object from Prisma.
//  * @returns The transformed strategy object for the client.
//  */

// // Inside `getStrategies` and `transformStrategy` context:


// export const transformStrategy = (strategy: StrategyWithVotesAndGoals) => {
//     // 1. Map and transform the individual vote records to include name/email
//     const individualVotes: ClientVoteAudit[] = strategy.votes.map(vote => ({
//         id: vote.id,
//         voterId: vote.voterId,
//         voteType: vote.type, // 'type' is used in the model, 'voteType' is used in the frontend prop
//         
//         // 🚨 FIX: Use optional chaining (?.) to safely access properties, 
//         // and provide a fallback string (like 'Unknown' or 'Deleted User')
//         // if the voter is missing.
//         email: vote.voter?.email || null,
//         name: vote.voter?.name || 'Deleted User',
//         timestamp: new Date(vote.timestamp).toISOString(), 
//         updatedAt: new Date(vote.updatedAt).toISOString()
//     }));

//     // Use destructuring to safely exclude the raw `votes` array
//     const { votes, ...rest } = strategy;

//     // 2. Return the strategy object, leveraging the pre-calculated totals from the model
//     return {
//         ...rest,
//         // Leveraging the model's pre-calculated totals for efficiency
//         totalVotesYes: strategy.totalVotesYes, 
//         totalVotesNo: strategy.totalVotesNo,
//         // The detailed list of individual votes (including email/name)
//         individualVotes, 
//     };
// };

// /**
//  * Fetches all strategies, includes goals, and detailed voter information.
//  * @returns A promise resolving to the list of strategies for the client.
//  */
// export default async function getStrategies(): Promise<StrategiesReturnType> { 
//     try {
//         const currentUser = await getCurrentUser();

//         if (!currentUser) {
//             // Return an empty array if no current user is authenticated
//             return [];
//         }
//         
//         // 1. Fetch all strategies, ensuring the `votes` (with nested `voter` data) and `goals` relationships are included.
//         const strategies = await prisma.strategy.findMany({
//             include: {
//                 author: true,
//                 votes: {
//                     // CRITICAL: Include the voter to get the email/name for the Admin view
//                     include: {
//                         voter: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                                 email: true, // This is already correctly included!
//                             }
//                         }, 
//                     }
//                 },
//                 goals: {
//                     include: {
//                         outcomes: {
//                             include: {
//                                 outputs: true,
//                             },
//                         },
//                     },
//                 },
//             },
//             orderBy: [
//                 {
//                     averageStrategicScore: 'desc',
//                 },
//                 {
//                     submissionDate: 'desc',
//                 },
//             ]
//         });

//         // Use assertion to ensure the type safety for mapping (this is common practice when using `findMany` with complex includes)
//         const typedStrategies = strategies as unknown as StrategyWithVotesAndGoals[];

//         // 2. Map the strategies to transform the data structure for the client
//         const safeStrategies = typedStrategies.map(transformStrategy);

//         // This array now contains the `individualVotes` property needed by the StrategyCard.
//         return safeStrategies as StrategiesReturnType;
//         
//     } catch (error: any) {
//         console.error('Error fetching strategies:', error);
//         throw new Error('Failed to fetch strategies.');
//     }
// }