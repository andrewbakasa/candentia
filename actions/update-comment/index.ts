"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateComment } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION,  ENTITY_TYPE } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => { 

  const { id, boardId,cardId,...values } = data;
  let comment;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  
  const owner_id = currentUser.id
  try {

    const child = await prisma.comment.findUnique({ 
      where: { id },
      
    });

    // console.log("child.....", child)
    //Admin has express write
    //B
    if (child && 
      //boarder creator is allowed updating rights
               //card owner is allowed updating rights
               (child?.userId==owner_id)  
                 || 
                 //adminis allowed updating rights
                 currentUser.isAdmin){

                    /* 
                     Owner of Board , owner of List, owner of Card, and admin have right to deleted or update card
                    
                    */
                             
      // Update child data
    
      const keys = Object.keys(values);
       //update  general content
          comment=  await prisma.comment.update({
              where: { id: child?.id },
              data: { 
                imageThumbUrl:currentUser.image,//temporal
                ownerEmail:currentUser.email, //temporal
                ...values, 
                },
          });

          // await createAuditLog({
          //   entityTitle: comment?.comment||'cc' ,
          //   entityId: comment.id ,
          //   entityType: ENTITY_TYPE.CARD,
          //   action: ACTION.UPDATE,
          // })
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
          
    } else {
      revalidatePath(`/board/${boardId}`);
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
   
  } catch (error) {
    return {
      error: `Failed to update.${error}`
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};





export const updateComment = createSafeAction(UpdateComment, handler);

/* 
List owner should be able to update a card he doesnt own 



*/
