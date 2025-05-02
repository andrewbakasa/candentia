"use server";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { CreateCardImage } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { revalidatePath } from "next/cache";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const { url,cardId,type, boardId,fileName} = data;
  let cardImage;

  try {
      cardImage = await prisma.cardImage.create({
      data: {
        url,
        cardId,
        type,
        fileName,
        userId: currentUser.id,
      },
    });

   
  } catch (error) {
    return {
      error: "Failed to create."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: cardImage };
};

export const createCardImage = createSafeAction(CreateCardImage, handler);
