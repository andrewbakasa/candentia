import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";

export default async function updateCardUserId() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }
 

    const cards = await prisma.card.findMany({
      include: { 
          list:{
            include:{
              board:{
                include:{
                  user:true
                }
              } 
            } 
          }
      }
    });

    //Update all list
  // const transaction = cards.map((card) => 
  //     prisma.card.update({
  //           where: {
  //               id: card.id,
  //           },
  //           data: {
  //               userId: card.list.board?.userId || null,
  //           }
  //     }))
  
  const updates = cards
  .filter((card) => card.list?.board?.userId) // Simplified filter: only keep cards with userId
  .map((card) => {
    const userId = card.list!.board!.userId!; // Non-null assertion since we've filtered

    return prisma.card.update({
      where: { id: card.id },
      data: { userId },
    });
  });

const result = await prisma.$transaction(updates); // No need to filter nulls anymore

return result;
  } catch (error: any) {
    throw new Error(error);
  }
}
