// use server
import { revalidatePath } from "next/cache";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateBoardViews } from "./schema";
import { InputType, ReturnType } from "./types";
import getCurrentUser from "@/app/actions/getCurrentUser";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { id, boardId, ...values } = data;
  let card;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const owner_id = currentUser.id;

  try {
    // Find existing BoardView for the given board and user
    const existingBoardView = await prisma.boardView.findFirst({
      where: {
        boardId: boardId,
        userID: {
          has: owner_id,
        },
      },
    });

    if (existingBoardView) {
      // Update existing BoardView with increment of 1
      const updatedBoardView = await prisma.boardView.update({
        where: {
          id: existingBoardView.id,
        },
        data: {
          viewCount: { increment: 1 }, // Increment by 1
          updatedAt: new Date(),
        },
      });
      return { data: updatedBoardView };
    } else {
      // Create new BoardView with initial viewCount of 1
      const newBoardView = await prisma.boardView.create({
        data: {
          boardId,
          userID: [owner_id],
          viewCount: 1,
        },
      });
      return { data: newBoardView };
    }
  } catch (error) {
    return {
      error: `Failed to update.${error}`,
    };
  }
};

export const updateBoardViews = createSafeAction(UpdateBoardViews, handler);