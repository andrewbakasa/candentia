"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { ActivateList } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  
  const { id } = data;
  let list;

  try {
  
    list = await prisma.list.update({
      where: {
        id: id
      },
      data: {
        active: true,// un-archive
      },
    });
   // console.log('Delete', list)

    await createAuditLog({
      entityTitle: list.title,
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.UPDATE,
    })
  } catch (error) {
    return {
      error: "Failed to active."
    }
  }

  revalidatePath(`/archived-lists`);
  redirect(`/archived-lists`);
};

export const activateList = createSafeAction(ActivateList, handler);

