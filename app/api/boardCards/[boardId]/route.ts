//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {

      const cards = await prisma.card.findMany({
        where: {
          listId: {
            in: await prisma.list.findMany({
              where: { boardId: params.boardId },
              select: { id: true }, // Only fetch list IDs for efficiency
            }).then((lists) => lists.map((x) => x.id)),
          },
        },
        include: {
          list: {
            select: {
              title: true,
              order:true,
            },
          },
          taggedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  // ... other fields
                },
              },
            },
          },
        },
        orderBy: {
          // list: { order: 'asc' }, // Order by the list's order field
          order: 'asc', // Order by card's order field within each list
        },
        
      });

      // In your React component
      cards.sort((a, b) => {
        if (a.list.order === b.list.order) {
          return a.order - b.order;
        }
        return a.list.order - b.list.order;
      });
 //     console.log('cards', cards)
      return NextResponse.json(cards);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}
// Explanation:

// where: { list: { boardId: { equals: boardId } } }:
// This is the correct way to filter cards based on the boardId of their associated list.
// list: This targets the related List object for each Card.
// boardId: This specifies the field within the List object to filter on.
// { equals: boardId }: This condition filters for List objects where the boardId field matches the provided boardId.
// This corrected query should effectively filter the cards and return only those that belong to lists within the specified board.