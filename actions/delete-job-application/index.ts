"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { DeleteJobApplication } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { updateProgressStatus } from "@/lib/updatesTrigger";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const owner_id = currentUser.id
  const { id } = data;
  let card;

  try {



    const child = await prisma.jobApplication.findUnique({ 
      where: { id },
        
    });

    if (child &&  currentUser.isAdmin ){
        /* 
         Owner of Board , owner of List, owner of Card, and admin have right to deleted or update card
        
        */
      card=  await prisma.jobApplication.delete({
        where: { id: child.id },
    });
      
 
    }else {
    //  revalidatePath(`/board/${boardId}`);
      return {
        error: `Record can't be deleted. See record creator or Admin`
      }
    }

    
  } catch (error) {
    return {
      error: `Failed to delete. ${error}`
    }
  }

  //revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const deleteJobApplication = createSafeAction(DeleteJobApplication, handler);
