"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { InputType, ReturnType } from "./types";
import { GetCurrentUser } from "./schema";
import { SafeUser } from "@/app/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { email } = data;
  let user:any;
  console.log('email',email)
  try {
     user = await prisma.user.findUnique({ 
      where: { email },
    });

    if (user){
    
     
    } else {
      
     user= await getCurrentUser();

      if (!user) {
        return {
          error: "Unauthorized",
        };
      }
    
    }
   
  } catch (error) {
    return {
      error: "Failed to update."
    }
  }

  // re/validatePath(`/tag/${id}`);
  return { data: user };
};

export const getCurrUser = createSafeAction(GetCurrentUser, handler);
