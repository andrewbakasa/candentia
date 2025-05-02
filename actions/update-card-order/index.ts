"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateCardOrder } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const owner_id = currentUser.id
  

  const { items, boardId, } = data;
  let updatedCards;

  try {
    //owner of board
    const child = await prisma.board.findUnique({ 
      where: {
        id:boardId,
        userId : owner_id 
      },
    });
    
    // Admin has express wrights
    if (child || currentUser.isAdmin){
          const transaction = items.map((card) => 
          prisma.card.update({
          where: {
            id: card.id,
          },
          data: {
            order: card.order,
            listId: card.listId,
          },
        }),
      );

      updatedCards = await prisma.$transaction(transaction);
    }else {
      revalidatePath(`/board/${boardId}`);
      return {
         error: `Cards can't be re-ordered. See record creator or Admin`
      }
    }

   
  } catch (error) {
    return {
      error: "Failed to reorder."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: updatedCards };
};

export const updateCardOrder = createSafeAction(UpdateCardOrder, handler);
