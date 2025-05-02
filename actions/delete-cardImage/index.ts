"use server";

//import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import { DeleteCardImage } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const owner_id = currentUser.id
  const { id } = data;
  let cardImage;

  try {
      const child = await prisma.cardImage.findUnique({ 
        where: { id },
        
      });

      if (child && 
        ( currentUser.isAdmin   ||(child?.userId==owner_id))){
          //this is second stage deletion
          //ist is cloudinary: ensure protetion like this to make sense here
          cardImage = await prisma.cardImage.delete({ 
            where: { id },
            
          });
      }else{
        //if user has no access
        //Cloudinary access should likewise be protected..
        return {
          error: `User has no access to the file`
        }
      }
        // cardImage = await prisma.cardImage.delete({ 
        //   where: { id },
          
        // });
    
  } catch (error) {
    return {
      error: `Failed to delete. ${error}`
    }
  }

 // revalidatePath(`/board/${boardId}`);
  return { data: cardImage };
};

export const deleteCardImage = createSafeAction(DeleteCardImage, handler);
