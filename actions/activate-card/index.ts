"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { ActivateCard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  
  const { id } = data;
  let card;

  try {
  
    card = await prisma.card.update({
      where: {
        id: id
      },
      data: {
        active: true,// un-archive
      },
    });
   // console.log('Delete', card)

    await createAuditLog({
      entityTitle: card.title,
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.UPDATE,
    })
  } catch (error) {
    return {
      error: "Failed to active."
    }
  }

  revalidatePath(`/archived-cards`);
  redirect(`/archived-cards`);
};

export const activateCard = createSafeAction(ActivateCard, handler);

