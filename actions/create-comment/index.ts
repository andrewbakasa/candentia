"use server";

import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { updateProgressStatus } from "@/lib/updatesTrigger";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const { comment, cardId,boardId} = data;
  let card;

  try {
    const card = await prisma.card.findUnique({
      where: {
        id: cardId,
        // board: {
        //   orgId,
        // },
      },
    });

    if (!card) {
      return {
        error: "Card not found",
      };
    }

  
   let commentM = await prisma.comment.create({
      data: {
       // title,
       comment,
       cardId,
       userId: currentUser.id,
       imageThumbUrl:currentUser.image,
       ownerEmail:currentUser.email
      },
    });

    // await createAuditLog({
    //   entityId: card.id,
    //   entityTitle: card.title,
    //   entityType: ENTITY_TYPE.CARD,
    //   action: ACTION.CREATE,
    // });

    const cardfound= currentUser?.taggedInboxIds.find(v=>(v==cardId))

    if (cardfound){
      let taggedCardIds = [...(currentUser.taggedInboxIds || [])];
      taggedCardIds = taggedCardIds.filter((id) => id !== cardId);

      const user = await prisma.user.update({
        where: {
          id: currentUser.id
        },
        data: {
          taggedInboxIds:taggedCardIds
        }
      });
  }
    // await updateProgressStatus({
    //   boardId:boardId 
    // })
  } catch (error) {
    return {
      error: "Failed to create."
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const createComment = createSafeAction(CreateComment, handler);
