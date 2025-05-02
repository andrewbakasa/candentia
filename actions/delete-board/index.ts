"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { DeleteBoard } from "./schema";
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

  const { id } = data;
  //console.log('inside deleate bord action id>>>', id);
  let board;

  try {


    const child = await prisma.board.findUnique({ 
      where: {
        id,
        userId:currentUser.id 
      },
    });
    
    // Admin has express wrights
    if (child || currentUser.isAdmin){
   
      board = await prisma.board.update({
        where: {
          id: id,
          userId:currentUser.id,// this user is owner and the only one allowed
        },
        data: {
          active: false,// achive
        },
      });
    // console.log('Delete', board)
      await createAuditLog({
        entityTitle: board.title,
        entityId: board.id,
        entityType: ENTITY_TYPE.BOARD,
        action: ACTION.DELETE,
      })
    }
  } catch (error) {
    return {
      error: "Failed to delete."
    }
  }

  revalidatePath(`/projects`);
  redirect(`/projects`);
};

export const deleteBoard = createSafeAction(DeleteBoard, handler);
