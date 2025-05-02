import { NextResponse } from "next/server";

//import getCurrentUser from getCurrentUser
import prisma from "../../../libs/prismadb"//"..app/libs/prismadb";
import getCurrentUser from "../../../actions/getCurrentUser";
import { updateProgressStatus } from "@/lib/updatesTrigger";

interface IParams {
  cardId?: string;
}
//make public

export async function DELETE(
  request: Request, 
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.error();
  }

  const { cardId } = params;

  if (!cardId || typeof cardId !== 'string') {
    throw new Error('Invalid ID');
  }


  const card = await prisma.card.deleteMany({
    where: {
      id: cardId,
    },
  });

  const cardDeleted = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        include: {
          board: true,
        },
      },
    },
  });
  if (cardDeleted && cardDeleted.list && cardDeleted.list.board) {
    const boardId = cardDeleted.list.board.id;
    await updateProgressStatus({
      boardId:boardId 
    }) 
  } 
  return NextResponse.json(card);
}


