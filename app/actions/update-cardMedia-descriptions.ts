// actions/update-CardMedia-description.ts
"use server";
import prisma from "../libs/prismadb";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./getCurrentUser";

interface UpdateCardMediaDescriptionInput {
    id: string; // The ID of the CardMedia to update
    description: string | null; // The new description
}


export const updateCardMediaDescription = async (data: UpdateCardMediaDescriptionInput) => {
     const currentUser = await getCurrentUser();

    if (!currentUser) {
        return { error: "Unauthorized" };
    }

    const { id, description } = data;

    if (!id) {
        return { error: "CardMedia ID is required." };
    }

    try {
        const updatedCardMedia = await prisma.cardImage.update({
            where: { id: id },
            data: {
                description: description,
            },
        });

        // Revalidate the path if necessary, e.g., if this CardMedia is displayed elsewhere
        // revalidatePath(`/your-CardMedia-page/${updatedCardMedia.boqItemId}`);
        // revalidatePath(`/some-other-path`);

        return { data: updatedCardMedia };
    } catch (error) {
        console.error("Failed to update CardMedia description:", error);
        return { error: "Failed to update description." };
    }
};


