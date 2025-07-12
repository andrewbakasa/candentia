import { NextResponse } from 'next/server';
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this is correct path

export async function POST(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { cardId } = params;
  const { reorderedCardImages } = await request.json(); // Expects an array of { cardId: string, newOrder: number }
  console.log("reorderedCardImages",reorderedCardImages )
  if (!Array.isArray(reorderedCardImages)) {
    return new NextResponse("Invalid request body. Expected 'reorderedCardImages' array.", { status: 400 });
  }

  try {
    const operations = reorderedCardImages.map((cardImage: { id: string, newOrder: number }) =>
      prisma.cardImage.update({
        where: {
          id: cardImage.id,
          cardId: cardId, // Ensure the cardImage belongs to the correct Card
        },
        data: {
          order: cardImage.newOrder,
        },
      })
    );

    // Use a Prisma transaction to ensure all updates succeed or none do
    await prisma.$transaction(operations);
    //console.log('..... i am her, card-rorders......')
    return NextResponse.json({ message: "CardImage order updated successfully" });

  } catch (error: any) {
    console.error("Error reordering cardImages:", error);
    return new NextResponse(`Failed to reorder cardImages: ${error.message}`, { status: 500 });
  }
}