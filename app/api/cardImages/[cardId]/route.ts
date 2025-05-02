import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
  
    const cardImages = await prisma.cardImage.findMany({// removedunique
      where: {
        cardId: params.cardId,
      },
    });

    
    //console.log("cardImages",cardImages)
    return NextResponse.json(cardImages||null);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}