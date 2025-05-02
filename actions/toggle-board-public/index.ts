"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { ToggleBoard } from "./schema";
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
  let board;



  const owner_id = currentUser.id


  //only update self boards
  //update other arrent allowed
  try {


    const child = await prisma.board.findUnique({ 
      where: { id },
    });

    //Admin has express write
    if (child && 
      ((child?.userId==owner_id)|| currentUser.isAdmin)){

     //toggle
      board=  await prisma.board.update({
          where: { id: child.id },
          data: {  public:!child.public},
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

export const toggleBoard = createSafeAction(ToggleBoard, handler);




