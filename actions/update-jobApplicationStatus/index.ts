"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// --- Schemas ---


// New Schema for Job Application Status Update
const UpdateJobApplicationStatusSchema = z.object({
    id: z.string().min(1, { message: "Application ID is required" }),
    status: z.string().min(1, { message: "New status is required" }), // You might want to refine this with an enum of valid statuses
});

// New Schema for Career Active Status Update
const UpdateCareerActiveSchema = z.object({
    id: z.string().min(1, { message: "Career ID is required" }),
    active: z.boolean(),
});

// --- Types ---

type JobApplicationStatusUpdateType = z.infer<typeof UpdateJobApplicationStatusSchema>; // New type

interface ReturnType<T = any> {
  data?: T | null;
  error?: string;
}
type CareerActiveUpdateType = z.infer<typeof UpdateCareerActiveSchema>; // New type

// --- Handlers ---
const handleToggleCareerActive = async (data: CareerActiveUpdateType): Promise<ReturnType<any>> => {
    try {
        const { id, active } = data;

        const existingCareer = await prisma.career.findUnique({
            where: { id },
        });

        if (!existingCareer) {
            return { error: `Career with ID "${id}" not found.` };
        }

        const updatedCareer = await prisma.career.update({
            where: { id },
            data: { active },
        });

        // Log the audit event for the status update
        await createAuditLog({
            entityId: updatedCareer.id,
            entityTitle: `Career "${updatedCareer.title}" set to ${updatedCareer.active ? 'active' : 'inactive'}`,
            entityType: ENTITY_TYPE.BOARD, // Adjust if you have a more specific ENTITY_TYPE for careers
            action: ACTION.UPDATE,
        });

        // Revalidate paths to reflect the changes
        revalidatePath(`/careers/${id}`); // Revalidate the specific career's page
        revalidatePath('/careers'); // Revalidate the main careers list page
        revalidatePath('/input-jobs'); // Revalidate input-jobs page where careers are listed

        return { data: updatedCareer };
    } catch (error: any) {
        return { error: `Failed to toggle career active status: ${error.message}` };
    }
};


// New Handler for Job Application Status Update
const handleUpdateJobApplicationStatus = async (data: JobApplicationStatusUpdateType): Promise<ReturnType<any>> => {
    try {
        const { id, status } = data;

        const existingApplication = await prisma.jobApplication.findUnique({
            where: { id: id },
        });

        if (!existingApplication) {
            return { error: `Job Application with ID "${id}" not found.` };
        }

        const updatedApplication = await prisma.jobApplication.update({
            where: { id: id },
            data: { status: status },
        });

        // Log the audit event for the status update
        await createAuditLog({
            entityId: updatedApplication.id,
            entityTitle: `Application for ${updatedApplication.careerId ? `job ID ${updatedApplication.careerId}` : 'unknown job'} by ${updatedApplication.applicantName}`,
            entityType: ENTITY_TYPE.CARD, // You might have a more specific ENTITY_TYPE for job applications
            action: ACTION.UPDATE,
        });

        // Revalidate paths to reflect the changes
        revalidatePath(`/job-applications/${id}`); // Revalidate the specific application's page
        revalidatePath('/job-applications'); // Revalidate the main job applications list page

        return { data: updatedApplication };
    } catch (error: any) {
        return { error: `Failed to update job application status: ${error.message}` };
    }
};

// --- Exports ---
// Export the new action
export const updateJobApplicationStatus = createSafeAction(UpdateJobApplicationStatusSchema, handleUpdateJobApplicationStatus);




export const updateCareerActive = createSafeAction(UpdateCareerActiveSchema, handleToggleCareerActive); // Export the new action
