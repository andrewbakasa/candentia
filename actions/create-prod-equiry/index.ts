"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// Define the schema directly within this file
const CreateProductEquirySchema = z.object({
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
});

// Explicitly define InputType to *exactly* match the schema, including the optional and default
interface InputType {
  first_name?: string | undefined;
  last_name?: string | undefined;
  phone_number?: string | undefined;
  email: string;
  message: string;
  demoproducts?: string[];
}

interface ReturnType { data?: any; error?: string; }

const handler = async (data: InputType): Promise<ReturnType> => {


  const { demoproducts, ...values } = data;
  let productEquiry;

  try {
    productEquiry = await prisma.productEnquiry.create({
      data: {
        ...values,
        demoproducts: demoproducts,
      },
    });

    await createAuditLog({
      entityId: productEquiry.id,
      entityTitle: 'productEquiry',
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.CREATE,
    });


  } catch (error) {
    return {
      error: "Failed to create.",
    };
  }

  return { data: productEquiry };
};

export const createProductEquiry = createSafeAction(CreateProductEquirySchema, handler);
