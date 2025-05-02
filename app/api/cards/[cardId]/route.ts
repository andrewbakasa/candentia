//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    //const { userId, orgId } = auth();

    // if (!userId || !orgId) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const card = await prisma.card.findMany({// removedunique
      where: {
        id: params.cardId,
        // list: {
        //   // board: {
        //   //   orgId,
        //   // },
        // },
      },
      include: {
        list: {
          select: {
            title: true,
          },
       },
       taggedUsers: {
        include: {
          user: {
            select: {
              // Include fields you want from the User model
              id: true,
              name: true,
              email: true,
              // ... other fields
            },
          },
        },
      },
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}