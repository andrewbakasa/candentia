"use server";
import { createSafeAction } from "@/lib/create-safe-action";

import { InputType, ReturnType } from "./types";
import { CreateAudit } from "./schema";
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

  const { title , id} = data;
  let auditObj;
  
  try {
   

  auditObj=  await createAuditLog({
      entityTitle: title,
      entityId: id,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.UPDATE,
    })

  } catch (error) {
    return {
      error: `Failed to create ${error}.`
    }
  }
  return { data: true };
};

export const createAudit = createSafeAction(CreateAudit, handler);
