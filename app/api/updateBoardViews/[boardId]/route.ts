//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
//make public
export async function POST(
  request: Request, 
  { params }: { params: { boardId: string } }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.error();
  }

  const { boardId } = params;

  if (!boardId || typeof boardId !== 'string') {
    throw new Error('Invalid ID');
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
      return NextResponse.json(updatedBoardView);
    } else {
      // Create new BoardView with initial viewCount of 1
      const newBoardView = await prisma.boardView.create({
        data: {
          boardId,
          userID: [owner_id],
          viewCount: 1,
        },
      });
      return NextResponse.json(newBoardView);
    }
  } catch (error) {
    return NextResponse.error();
  }
};


