"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { ToggleList } from "./schema";
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
  const { listId , boardId} = data;
  let list;



  const owner_id = currentUser.id


  //only update self boards
  //update other arrent allowed
  try {


    const child_board = await prisma.board.findUnique({ 
      where: { id:boardId },
    });

    const child_list = await prisma.list.findUnique({ 
      where: { id:listId,boardId:boardId },
    });

    //Admin has express write
    if (child_board && 
      ((child_board?.userId==owner_id)|| currentUser.isAdmin)){

     //toggle
      list =  await prisma.list.update({
          where: { id:listId },
          data: { visible :{set: !child_list?.visible }},
      });
      await createAuditLog({
        entityTitle: list.title,
        entityId: list.id,
        entityType: ENTITY_TYPE.LIST,
        action: ACTION.UPDATE,
      })

    } else {
      revalidatePath(`/board/${boardId}`);;
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
    
  } catch (error) {
    
    return {
      error: "Failed to update."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: list };
};

export const toggleList = createSafeAction(ToggleList, handler);




