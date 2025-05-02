"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

import { OrderByDate } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
 

  const { id, boardId } = data;
  let cardsToreorder;
  let updatedCards;// transcation update
  try {
    const cardsToreorder = await prisma.card.findMany({
      where: {
        listId:id,
      },
      orderBy: { createdAt: "asc" },
     
    });
   //console.log('Before:', cardsToreorder)

    if (!cardsToreorder) {
      return { error: "List not found" };
    }

    //---------------Ordered----------------------------

    let ordercount = 1;
    cardsToreorder.map(elem => {elem.order = ordercount++;});
    //-------------------------------------------

    //console.log('After:', cardsToreorder)
    try {
      const transaction = cardsToreorder.map((x) => 
          prisma.card.update({
          where: {
            id: x.id,
          },
          data: {
            order: x.order,
            listId: x.listId,
          },
        }),
      );

      updatedCards = await prisma.$transaction(transaction);
    } catch (error) {
      return {
        error: "Failed to reorder."
      }
    }

   
    // await createAuditLog({
    //   entityTitle: list.title,
    //   entityId: list.id,
    //   entityType: ENTITY_TYPE.LIST,
    //   action: ACTION.UPDATE,
    // })
  } catch (error) {
    return {
      error: "Failed to reorder."
    }
  }
  revalidatePath(`/board/${boardId}`);
  return { data: cardsToreorder };
};

export const orderByDate = createSafeAction(OrderByDate, handler);
