"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { InputType,ReturnType  } from "./types";
import { DeleteJobApplication } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const { id } = data; // 'id' is the jobApplication ID to be deleted
  let jobApplication; // Renamed 'card' to 'jobApplication' for clarity

  try {
    const existingJobApplication = await prisma.jobApplication.findUnique({
      where: { id },
      
    });

    if (!existingJobApplication) {
      return {
        error: "Job application not found.",
      };
    }

    // Check if the current user is the creator of the job application OR an admin
    const isAdmin = currentUser.isAdmin; // Assuming currentUser has an isAdmin boolean property

    if ( isAdmin) {
      jobApplication = await prisma.jobApplication.delete({
        where: { id: existingJobApplication.id },
      });
    } else {
      return {
        error: `Permission denied. Only the creator or an Admin can delete this application.`,
      };
    }

    // You might want to revalidate a specific path here, e.g., the job applications listing page.
    // Replace '/job-applications' with the actual path where job applications are listed.
    revalidatePath("/job-applications");

  } catch (error) {
    console.error("Error deleting job application:", error); // Log the actual error
    return {
      error: `Failed to delete job application.`,
    };
  }

  return { data: jobApplication };
};

export const deleteJobApplication = createSafeAction(DeleteJobApplication, handler);