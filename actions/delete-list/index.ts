"use server";

// import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { DeleteList } from "./schema";
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

  const { id, boardId } = data;
  let list;

  try {
    const child = await prisma.list.findUnique({ 
      where: { id },
      include: {
        board: true,
      },
    });
    //Admin has express write
    if (child && 
      // ((child.board?.userId==owner_id)|| currentUser.isAdmin)){
         ((child.board?.userId==owner_id)|| currentUser.isAdmin   ||(child?.userId==owner_id))){
          /* 
           Owner of Board , owner of List,  and admin have right to deleted or update card
          
          */
       
      list=  await prisma.list.update({
          where: { id: child.id },
          data: {  active:false },
      });
      await createAuditLog({
        entityTitle: list.title,
        entityId: list.id,
        entityType: ENTITY_TYPE.LIST,
        action: ACTION.DELETE,
      })

    }else {
      revalidatePath(`/board/${boardId}`);
      return {
        error: `The list can't be deleted. See record creator or Admin`
      }
    }

  } catch (error) {
    return {
      error: "Failed to delete."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: list };
};

export const deleteList = createSafeAction(DeleteList, handler);
