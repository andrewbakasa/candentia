"use server";
import prisma from "../libs/prismadb";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./getCurrentUser";
interface UpdateCardMediaaViewCount {
    id: string; // The ID of the CardMedia to update
   // fileName: string | null; // The new description
}

export const updateCardMediaViewCount = async (data: UpdateCardMediaaViewCount) => {
    //  const currentUser = await getCurrentUser();

    // if (!currentUser) {
    //     return { error: "Unauthorized" };
    // }

    const { id } = data;

    if (!id) {
        return { error: "CardMedia ID is required." };
    }

    try {
       

    let existingView = await prisma.cardImage.findFirst({
        where: {
        id: id
        },
    });


    if (existingView?.viewCount) {
      // Update existing BoardView with increment of 1
        existingView = await prisma.cardImage.update({
            where: {
            id: id,
            },
            data: {
            viewCount: { increment: 1 }, // Increment by 1
            },
        });
    }else{
        existingView = await prisma.cardImage.update({
        where: {
          id: id,
        },
        data: {
          viewCount:  1 
        },
      });
    }

        return { data: existingView };
    } catch (error) {
        console.error("Failed to update CardMedia description:", error);
        return { error: "Failed to update description." };
    }
};
