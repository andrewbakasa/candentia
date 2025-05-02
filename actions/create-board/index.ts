"use server";
import { revalidatePath } from "next/cache";

import prisma  from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { InputType, ReturnType } from "./types";
import { CreateBoard } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from '@/app/actions/getCurrentUser';
const handler = async (data: InputType): Promise<ReturnType> => {
  const orgId= "10001"
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  //console.log("1. data:",data)
  const { title, image } = data;
 
  const [
    imageId,
    imageThumbUrl,
    imageFullUrl,
    imageLinkHTML,
    imageUserName
  ] = image.split("|");

  if (!imageId || !imageThumbUrl || !imageFullUrl || !imageUserName || !imageLinkHTML) {
    return {
      error: "Missing fields. Failed to create board."
    };
  }

  //console.log(prisma, typeof(prisma))
  // console.log(
  // '______________' + imageId,
  // '______________' + title,
  // '______________' + imageThumbUrl,
  // '______________' + imageFullUrl,
  // '______________' + imageLinkHTML,
  // '______________' + orgId,
  // '______________' + imageUserName)

  let board_;
  
  try {
    board_ = await prisma.board.create({
      data: {
        title,
        orgId,
        imageId,
        imageThumbUrl,
        imageFullUrl,
        imageUserName,
        imageLinkHTML,
        userId: currentUser.id,
      }
    });
    //console.log(">>>",board)
    // if (!isPro) {
    //  await incrementAvailableCount();
    // }

    await createAuditLog({
      entityTitle: board_.title,
      entityId: board_.id,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.CREATE,
    })
  } catch (error) {
    return {
      error: `Failed to create ${error}.`
    }
  }

  revalidatePath(`/board/${board_.id}`);
  return { data: board_ };
};

export const createBoard = createSafeAction(CreateBoard, handler);
