"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateList } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const owner_id = currentUser.id
  const { percent, id, boardId } = data;
  let list;

  try {

    const child = await prisma.list.findUnique({ 
      where: { 
        id, boardId 
      },
      include: {
        board: true,
      },
    });

    //console.log("child", child)
    //admin has express write
    if (child && 
      ((child.board?.userId==owner_id) ||(child?.userId==owner_id) || currentUser.isAdmin)){
          /* 
           Owner of Board , owner of List and admin have right to deleted or update card
          
          */
       
      list=  await prisma.list.update({
          where: { id: child.id },
          data: {  percent },
      });
      await createAuditLog({
        entityTitle: String(list.percent),
        entityId: list.id,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.UPDATE,
      })
    }else {
      revalidatePath(`/board/${boardId}`);
      return {
        error: `List percent can't be updated. See record creator or Admin`
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

export const updateList = createSafeAction(UpdateList, handler);
