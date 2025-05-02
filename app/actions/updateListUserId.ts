import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";
// this is meant to swap users?
export default async function updateListUserId() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }
 
    const lists = await prisma.list.findMany({
      include: {
          cards: true, 
          board:{
            include:{
              user:true
            }
          }  
      }
    });

   
    //Update all list
//   const transaction = lists.map((list) => 
//    prisma.list.update({
//             where: {
//                 id: list.id,
//             },
//             data: {
//                 userId: list.board?.userId,
//             }
//        }));

//  const updateList = await prisma.$transaction(transaction);
//     return updateList;

    const updates = lists
    .filter((list) => list?.board?.userId) // Simplified filter: only keep cards with userId
    .map((list) => {
      const userId = list!.board!.userId!; // Non-null assertion since we've filtered
  
      return prisma.list.update({
        where: { id: list.id },
        data: { userId },
      });
    });
  
  const result = await prisma.$transaction(updates); // No need to filter nulls anymore
  return result;
  } catch (error: any) {
    throw new Error(error);
  }
}
