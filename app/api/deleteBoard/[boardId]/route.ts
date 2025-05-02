import { NextResponse } from "next/server";

//import getCurrentUser from getCurrentUser
import prisma from "../../../libs/prismadb"//"..app/libs/prismadb";
import getCurrentUser from "../../../actions/getCurrentUser";

interface IParams {
  boardId?: string;
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

  const { boardId } = params;

  if (!boardId || typeof boardId !== 'string') {
    throw new Error('Invalid ID');
  }



  const board = await prisma.board.deleteMany({
    where: {
      id: boardId,
    },
  });

  return NextResponse.json(board);
}
