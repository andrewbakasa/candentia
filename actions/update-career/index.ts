"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// --- Schemas ---

const UpdateCareerSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1, { message: "Title is required" }),
    listingTitle: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    fullDescription: z.string().min(1, { message: "Full description is required" }),
    slug: z.string().min(1, { message: "Slug is required" }),
    //active: z.boolean().default(true),
    location: z.string().min(1, { message: "Location is required" }),
    type: z.string().min(1, { message: "Type is required" }),
    department: z.string().min(1, { message: "Department is required" }),
});



// --- Types ---
type CareerUpdateType = z.infer<typeof UpdateCareerSchema>;

interface ReturnType<T = any> {
    data?: T | null;
    error?: string;
}


const handleUpdateCareer = async (data: CareerUpdateType): Promise<ReturnType<any>> => {
    try {
        const { id, ...updateData } = data;

        const existingCareer = await prisma.career.findUnique({ where: { id } });
        if (!existingCareer) {
            return { error: `Career posting with ID "${id}" not found.` };
        }


        const updatedCareer = await prisma.career.update({
            where: { id },
            data: updateData,
        });

        await createAuditLog({
            entityId: updatedCareer.id,
            entityTitle: updatedCareer.title || "Career Posting",
            entityType: ENTITY_TYPE.CARD,
            action: ACTION.UPDATE,
        });

        revalidatePath(`/careers/${updatedCareer.slug}`); 
        revalidatePath(`/careers`);
        return { data: updatedCareer };
    } catch (error: any) {
        return { error: `Failed to update career: ${error.message}` };
    }
};

// --- Exports ---
export const updateCareer = createSafeAction(UpdateCareerSchema, handleUpdateCareer);
