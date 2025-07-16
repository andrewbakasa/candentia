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


// --- Types ---

type JobApplicationStatusUpdateType = z.infer<typeof UpdateJobApplicationStatusSchema>; // New type

interface ReturnType<T = any> {
  data?: T | null;
  error?: string;
}

// --- Handlers ---


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
