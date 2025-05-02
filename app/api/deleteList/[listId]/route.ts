import { NextResponse } from "next/server";

//import getCurrentUser from getCurrentUser
import prisma from "../../../libs/prismadb"//"..app/libs/prismadb";
import getCurrentUser from "../../../actions/getCurrentUser";

interface IParams {
  listId?: string;
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

  const { listId } = params;

  if (!listId || typeof listId !== 'string') {
    throw new Error('Invalid ID');
  }



  const list = await prisma.list.deleteMany({
    where: {
      id: listId,
    },
  });

  return NextResponse.json(list);
}
