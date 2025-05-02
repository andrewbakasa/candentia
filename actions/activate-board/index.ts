"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { ActivateBoard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  
  const { id } = data;
  let board;

  try {
  
    board = await prisma.board.update({
      where: {
        id: id
      },
      data: {
        active: true,// un-archive
      },
    });
   // console.log('Delete', board)

    await createAuditLog({
      entityTitle: board.title,
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.UPDATE,
    })
  } catch (error) {
    return {
      error: "Failed to active."
    }
  }

  revalidatePath(`/projects`);
  redirect(`/projects`);
};

export const activateBoard = createSafeAction(ActivateBoard, handler);

