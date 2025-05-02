"use server";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// Define the schema directly within this file
const UpdateEnquirySchema = z.object({
  first_name: z.optional(
    z.string().min(1, { message: "First name is required" }),
  ),
  last_name: z.optional(
    z.string().min(1, { message: "Last name is required" })
  ),
  phone_number: z.optional(
    z.string().min(1, { message: "Phone number is required" }),
  ),
  email: z.string().email({ message: "Invalid email" }),
  message: z.string().min(1, { message: "Message is required" }),
  demoproducts: z.string().array().optional().default([]),
  id:z.string()
});

// Explicitly define InputType to *exactly* match the schema, including the optional and default
interface InputType {
  first_name?: string | undefined;
  last_name?: string | undefined;
  phone_number?: string | undefined;
  email: string;
  message: string;
  demoproducts?: string[];
  id: string;
}

interface ReturnType { data?: any; error?: string; }

const handler = async (data: InputType): Promise<ReturnType> => {


  const { id, demoproducts, ...values } = data;
  let enquiry;
  try {

    const child = await prisma.enquiry.findUnique({ 
      where: { id },
      
    });

   
    if (child ){ 
     
      const keys = Object.keys(values);
       //update  general content
       enquiry=  await prisma.enquiry.update({
              where: { id: child?.id },
              data: {                
                ...values, 
                },
          });

          
          
    } else {
      //revalidatePath(`/board/${boardId}`);
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
   
  } catch (error) {
    return {
      error: `Failed to update.${error}`
    }
  }

  return { data: enquiry };
};

export const updateEnquiry = createSafeAction(UpdateEnquirySchema, handler);