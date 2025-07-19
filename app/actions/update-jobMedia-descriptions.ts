// actions/update-JobMedia-description.ts
"use server";
import prisma from "../libs/prismadb";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./getCurrentUser";

interface UpdateJobMediaDescriptionInput {
    id: string; // The ID of the CardMedia to update
    description: string | null; // The new description
}


export const updateJobMediaDescription = async (data: UpdateJobMediaDescriptionInput) => {
     const currentUser = await getCurrentUser();

    if (!currentUser) {
        return { error: "Unauthorized" };
    }

    const { id, description } = data;

    if (!id) {
        return { error: "JobMedia ID is required." };
    }

    try {
        const updatedJobMedia = await prisma.jobAttachment.update({
            where: { id: id },
            data: {
                description: description,
            },
        });

        // Revalidate the path if necessary, e.g., if this JobMedia is displayed elsewhere
        // revalidatePath(`/your-JobMedia-page/${updatedJobMedia.boqItemId}`);
        // revalidatePath(`/some-other-path`);

        return { data: updatedJobMedia };
    } catch (error) {
        console.error("Failed to update JobMedia description:", error);
        return { error: "Failed to update description." };
    }
};


