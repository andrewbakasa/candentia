import prisma from "../libs/prismadb";
import { StrategiesReturnType } from "../strategy/types/strategy";
import getCurrentUser from "./getCurrentUser";

// Define the structure of the data you want to return to the client.
// This matches the format expected by the StrategyCard component.
export const transformStrategy = (strategy: any) => {
    // Extract the individual vote records
    const individualVotes = strategy.votes.map((vote: any) => ({
        voterId: vote.voterId, // Assuming your Vote model links to the user via 'userId'
        voteType: vote.type, // Assuming your Vote model uses 'type' for 'YES' | 'NO'
    }));

    // Calculate aggregated vote totals from the individual votes for simplicity
    const totalVotesYes = individualVotes.filter((v: any) => v.voteType === 'YES').length;
    const totalVotesNo = individualVotes.filter((v: any) => v.voteType === 'NO').length;


    // Return the strategy object, replacing the raw votes array with the derived data
    // The individualVotes array is essential for the StrategyCard to check the current user's vote.
    return {
        ...strategy,
        individualVotes, // <-- This is the key field for the frontend check
        totalVotesYes,   // <-- Recalculated total (or use strategy.totalVotesYes if pre-calculated on the model)
        totalVotesNo,    // <-- Recalculated total (or use strategy.totalVotesNo if pre-calculated on the model)
        // Ensure you omit `votes` if the original model's `votes` array contains sensitive data not needed in the frontend.
        votes: undefined, // Explicitly remove the raw votes if desired, or if it was an aggregated field
    };
};

//export default async function getStrategies() {
  export default async function getStrategies(): Promise<StrategiesReturnType> { 
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      // Return an empty array if no current user is authenticated
      return [];
    }
   
    // 1. Fetch all strategies, ensuring the `votes` and `goals` relationships are included.
    const strategies = await prisma.strategy.findMany({
      include: {
        author: true,
        votes: true, // <-- Correct: This fetches the full list of individual Vote records
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
   console.log("safeStrategies. votes.......", strategies[0].votes)
    // 2. Map the strategies to transform the data structure for the client
    const safeStrategies = strategies.map(transformStrategy);
    console.log("safeStrategies......", safeStrategies[0].individualVotes)
    // This array now contains the `individualVotes` property needed by the StrategyCard.
    return safeStrategies;
    
  } catch (error: any) {
    // It's generally better to log the error and return a safe, empty result 
    // rather than throwing an error in an API endpoint, but maintaining your pattern:
    console.error('Error fetching strategies:', error);
    throw new Error('Failed to fetch strategies.');
  }
}


// In getStrategies.ts:
// import { StrategiesReturnType } from 'path/to/types'; // Import the new type


// import prisma from "../libs/prismadb";

// import getCurrentUser from "./getCurrentUser";


// export default async function getStrategies() {
//   try {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       return [];
//     }

   
//      const strategies = await prisma.strategy.findMany({
//       include: {
//         author: true,
//         votes: true, // <-- CORRECTED: Include the 'votes' relationship
//         goals: {
//           include: {
//             outcomes: {
//               include: {
//                 outputs: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: [
//         {
//           averageStrategicScore: 'desc', // Primary sort: highest 'Yes' votes first
//         },
//         {
//           submissionDate: 'desc', // Secondary sort: newest strategies first for ties
//         },]
//     });

//     return strategies;
//   } catch (error: any) {
//     throw new Error(error);
//   }
// }

