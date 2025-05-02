"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateBoard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from '@/app/actions/getCurrentUser';

const handler = async (data: InputType): Promise<ReturnType> => {
 
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }


  // const { title, id } = data;
  
  const { id, ...values } = data;

  let board;
  const owner_id = currentUser.id
  //only update self boards
  //update other arrent allowed
  try {
    const child = await prisma.board.findUnique({ 
      where: { id },
    });
    //--------------This doesnt work--------------------
    const keys = Object.keys(values);
    //console.log(keys); // Output: An array of keys
    const keyToSearch = 'progressStatus';
    const isKeyPresent = keys.includes(keyToSearch);
    //console.log(isKeyPresent); // Output: true or false
    
    // console.log('val key',values, keys, isKeyPresent, keys.length==1)
    const  updatingStatisticsOnly=  isKeyPresent && (keys.length==1)
    //-----------------------------------------------------------------
    //Admin has express write
    if (child && 
      ((child?.userId==owner_id)|| currentUser.isAdmin 
      // || updatingStatisticsOnly suspended: if user doest own record fewer record might be returnrd
      )){

    //if (child && child?.userId==owner_id) {
      // Update child data
      board=  await prisma.board.update({
          where: { id: child.id },
          data: {  ...values, },
          // data: {  title },
      });
      await createAuditLog({
        entityTitle: board.title,
        entityId: board.id,
        entityType: ENTITY_TYPE.BOARD,
        action: ACTION.UPDATE,
      })

    } else {
      revalidatePath(`/board/${id}`);;
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
    
  } catch (error) {
    
    return {
      error: "Failed to update."
    }
  }

  revalidatePath(`/board/${id}`);
  return { data: board };
};

export const updateBoard = createSafeAction(UpdateBoard, handler);

// async function reconnectBoardToCardAndList(boardId:string) {
//   try {
//     //const board = await prisma.board.findMany();

//     const board = await prisma.board.findUnique({
//       where: {
//           id: boardId,
//       },
//       include: {
//           lists: {
//               orderBy: {
//                   order: 'asc',
//               },
//               include: {
//                   cards:{
//                       orderBy: {
//                           order: 'asc',
//                       },
                      
//                       include: { tags: true ,
                 
//                                   taggedUsers: {
//                                           include: {
//                                           user: {
//                                               select: {
//                                               // Include fields you want from the User model
//                                               id: true,
//                                               name: true,
//                                               email: true,
//                                               // ... other fields
//                                               },
//                                           },
//                                           },
//                                 },
//                                 comments:{
//                                   include: {
//                                     user: {
//                                         select: {
//                                         //  Include fields you want from the User model
//                                         id: true,
//                                         name: true,
//                                         email: true,
//                                         //  ... other fields
//                                         },
//                                     },
//                                   }
//                                 }
                  
//                       },
//                   },
//               },
              
//           },
//           user:true,
//          // listId:true,
//       },
//       });
 
   
//     board?.lists.map((list)=>{
      
//       board=  await prisma.list.update({
//         where: { id: list.id },
//         data: {  boardId, },
//         // data: {  title },
//        });
//       // const list1 = await List.findOne({ id: list.id });
//       // if (list1) {
//       //   list1.boardId = boardId;
//       //   await list1.save();
//       // };
//       // list1?.map((card1)=>{
//       //   const card2 = await Card.findOne({ id: card1.id });
//       //   if (card2) {
//       //     card2.boardId = boardId;
//       //     card2.listId= list.id
//       //     await card2.save();
//       //   }
       
//       // })
//     }) 
   
//     console.log('Board, List, and Card models reconnected successfully.');
//   } catch (error) {
//     console.error('Error reconnecting models:', error);
//   }
// }
