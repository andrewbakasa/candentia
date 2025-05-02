"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateListOrder } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  
  const { items, boardId } = data;
  let lists;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const owner_id = currentUser.id

  try {

   const child = await prisma.board.findUnique({ 
      where: {
        id:boardId,
        userId : owner_id 
      },
    });
    
    // Admin has express wrights
    if (child || currentUser.isAdmin){

    //if (child){
        const transaction = items.map((list) => 
        prisma.list.update({
            where: {
              id: list.id,
            },
            data: {
              order: list.order,
            },
          })
        );

        lists = await prisma.$transaction(transaction);
    }else {
      revalidatePath(`/board/${boardId}`);
      return {
         error: `Lists can't be re-ordered. See record creator or Admin`
      }
    }
  } catch (error) {
    return {
      error: "Failed to reorder."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: lists };
};

export const updateListOrder = createSafeAction(UpdateListOrder, handler);
