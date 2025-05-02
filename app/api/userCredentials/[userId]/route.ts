//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    

    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      
    });

    return NextResponse.json(user);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}