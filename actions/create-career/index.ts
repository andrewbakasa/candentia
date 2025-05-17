"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// --- Schemas ---

const CreateCareerSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    listingTitle: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    fullDescription: z.string().min(1, { message: "Full description is required" }),
    slug: z.string().min(1, { message: "Slug is required" }),
   // active: z.boolean().default(true),
    location: z.string().min(1, { message: "Location is required" }),
    type: z.string().min(1, { message: "Type is required" }),
    department: z.string().min(1, { message: "Department is required" }),
});

// --- Types ---

type CareerInputType = z.infer<typeof CreateCareerSchema>;

interface ReturnType<T = any> {
    data?: T | null;
    error?: string;
}

// --- Handlers ---

const handleCreateCareer = async (data: CareerInputType): Promise<ReturnType<any>> => {
    try {
        const career = await prisma.career.create({
            data: {
                title: data.title,
                listingTitle: data.listingTitle,
                shortDescription: data.shortDescription,
                fullDescription: data.fullDescription,
                slug: data.slug,
               // active: data.active,
                location: data.location,
                type: data.type,
                department: data.department,
            },
        });

        await createAuditLog({
            entityId: career.id,
            entityTitle: career.title || "Career Posting", // Use a default if title is null
            entityType: ENTITY_TYPE.CARD, // Or a more appropriate ENTITY_TYPE
            action: ACTION.CREATE,
        });
        revalidatePath('/careers'); // Adjust path as needed
        return { data: career };
    } catch (error: any) {
        return { error: `Failed to create career: ${error.message}` };
    }
};

// const handleUpdateCareer = async (id: string, data: CareerInputType): Promise<ReturnType<any>> => {
//     try {
//         const career = await prisma.career.update({
//             where: { id: id },
//             data: {
//                 title: data.title,
//                 listingTitle: data.listingTitle,
//                 shortDescription: data.shortDescription,
//                 fullDescription: data.fullDescription,
//                 slug: data.slug,
//                // active: data.active,
//                 location: data.location,
//                 type: data.type,
//                 department: data.department,
//             },
//         });

//         await createAuditLog({
//             entityId: career.id,
//             entityTitle: career.title || "Career Posting", // Use a default if title is null
//             entityType: ENTITY_TYPE.CARD, // Or a more appropriate ENTITY_TYPE
//             action: ACTION.UPDATE,
//         });
//         revalidatePath('/careers'); // Adjust path as needed
//         return { data: career };
//     } catch (error: any) {
//         return { error: `Failed to update career: ${error.message}` };
//     }
// };

// --- Exports ---
export const createCareer = createSafeAction(CreateCareerSchema, handleCreateCareer);
