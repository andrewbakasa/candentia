"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateBoard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { id, ...values } = data;
  let user;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  try {
    const child = await prisma.board.findUnique({ 
      where: { id },
    });

   
    if (child && 
      //boarder creator is allowed updating rights
          ( //adminis allowed updating rights or owner
            currentUser.isAdmin )){
      // Update child data
      user=  await prisma.board.update({
          where: { id: child.id },
          data: {  ...values, },
      });
      await createAuditLog({
        entityTitle: "BOARD CHANGE",
        entityId: user.id ,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.UPDATE,
      })

    } else {
      revalidatePath(`/board-item/${id}`);
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
   
  } catch (error) {
    return {
      error: "Failed to update."
    }
  }

  revalidatePath(`/board-item/${id}`);
  return { data: user };
};

export const updateBoardPublicity = createSafeAction(UpdateBoard, handler);

/* 
List owner should be able to update a card he doesnt own 



*/
