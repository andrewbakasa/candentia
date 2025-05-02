"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { DeleteCard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { updateProgressStatus } from "@/lib/updatesTrigger";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const owner_id = currentUser.id
  const { id, boardId } = data;
  let card;

  try {



    const child = await prisma.card.findUnique({ 
      where: { id },
        include: {
          list: {
                include: {
                  board: true,
                },
          },
       },
    });

    if (child && 
      ((child.list.board?.userId==owner_id)|| currentUser.isAdmin   ||(child?.userId==owner_id))){
        /* 
         Owner of Board , owner of List, owner of Card, and admin have right to deleted or update card
        
        */
      card=  await prisma.card.update({
        where: { id: child.id },
        data: {  active:false },
    });
      await createAuditLog({
        entityTitle: card.title ,
        entityId: card.id ,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.DELETE,
      })

      await updateProgressStatus({
        boardId:boardId 
      })
 
    }else {
      revalidatePath(`/board/${boardId}`);
      return {
        error: `Record can't be deleted. See record creator or Admin`
      }
    }

    
  } catch (error) {
    return {
      error: `Failed to delete. ${error}`
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const deleteCard = createSafeAction(DeleteCard, handler);
