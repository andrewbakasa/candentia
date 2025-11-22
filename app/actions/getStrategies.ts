import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";


export default async function getStrategies() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

   
     const strategies = await prisma.strategy.findMany({
      include: {
        author: true,
        votes: true, // <-- CORRECTED: Include the 'votes' relationship
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
          averageStrategicScore: 'desc', // Primary sort: highest 'Yes' votes first
        },
        {
          submissionDate: 'desc', // Secondary sort: newest strategies first for ties
        },]
    });

    return strategies;
  } catch (error: any) {
    throw new Error(error);
  }
}

