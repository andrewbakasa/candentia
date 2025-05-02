//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    

    const comment = await prisma.comment.findUnique({
      where: {
        id: params.commentId,
      },
      
    });

    return NextResponse.json(comment);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}