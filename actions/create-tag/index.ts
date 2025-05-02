"use server";
import { revalidatePath } from "next/cache";

import prisma  from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { InputType, ReturnType } from "./types";
import { CreateTag } from "./schema";
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
  const { name } = data;
 
  let tag_;
  
  try {
    tag_ = await prisma.tag.create({
      data: {
        name,
        // userId: currentUser.id,
      }
    });
   
    await createAuditLog({
      entityTitle: tag_.name,
      entityId: tag_.id,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.CREATE,
    })
  } catch (error) {
    return {
      error: `Failed to create ${error}.`
    }
  }

  revalidatePath(`/tag/${tag_.id}`);
  return { data: tag_ };
};

export const createTag = createSafeAction(CreateTag, handler);
