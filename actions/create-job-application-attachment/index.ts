"use server";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";

import { CreateJobImage } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { revalidatePath } from "next/cache";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const { url,jobAppId,type, fileName} = data;
  let jobImage;

  try {
      jobImage = await prisma.jobAttachment.create({
      data: {
        url,
        jobAppId,
        type,
        fileName,
        userId: currentUser.id,
      },
    });

    console.log("jobImage", jobImage)
  } catch (error) {
    return {
      error: "Failed to create."
    }
  }

 // revalidatePath(`/board/${boardId}`);
  return { data: jobImage };
};

export const createJobImage = createSafeAction(CreateJobImage, handler);
