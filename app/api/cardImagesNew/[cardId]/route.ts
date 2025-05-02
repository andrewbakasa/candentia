import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
  
      let mediaList
      mediaList = await prisma.cardImage.findMany({
        where: {
              cardId: params.cardId,
         },
        orderBy: { createdAt: "desc" },
       
        include: {
          card: {
         
            include: {
              list: {
            
              include :{
                board: { // Now 'board' should be recognized
                select: {
                  title: true,
                  createdAt:true,
                  updatedAt:true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },},
            }
            },
          },
        },
      });
      let safeMedia;
      // media available
      let hasMedia = mediaList.length > 0; // Property to indicate if media exists

      if (hasMedia) {
        safeMedia = mediaList.map((mediaX) => ({
          ...mediaX,
          createdAt: mediaX.createdAt ? mediaX.createdAt.toString() : null, // Handle null for mediaX.createdAt
          listTitle: mediaX.card.list.title,
          boardTitle: mediaX.card.list?.board.title,
          title: mediaX.card?.title,
          boardCreatedAt: mediaX.card.list.board.createdAt ? mediaX.card.list.board.createdAt.toString() : null, // Handle null
          boardUpdatedAt: mediaX.card.list.board.updatedAt ? mediaX.card.list.board.updatedAt.toString() : null, // Handle null
         
        
          card: {
            ...mediaX.card,
            createdAt: mediaX.card.createdAt ? mediaX.card.createdAt.toString() : null, // Handle null for card.createdAt
            updatedAt: mediaX.card.updatedAt ? mediaX.card.updatedAt.toString() : null, // Handle null for card.updatedAt
            list: mediaX.card.list ? { // Handle null for card.list
              ...mediaX.card.list,
              // createdAt is likely on card, not list. If it is on list, use the same null check as above.
              board: mediaX.card.list?.board ? { // Handle null for card.list.board using optional chaining
                ...mediaX.card.list.board,
                createdAt: mediaX.card.list.board.createdAt ? mediaX.card.list.board.createdAt.toString() : null, // Handle null
                updatedAt: mediaX.card.list.board.updatedAt ? mediaX.card.list.board.updatedAt.toString() : null, // Handle null
              } : null,
            } : null,
          },
        }));

      }else{
        // no media
        const card = await prisma.card.findUnique({// removedunique
          where: {
            id: params.cardId,
          },
          include: {
            list: {
          
            include :{
              board: { // Now 'board' should be recognized
              select: {
                title: true,
                createdAt:true,
                updatedAt:true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },},
          }
          },
        });

        if (card){
            safeMedia = [{
           
            id: null,
              cardId: card.id,
              url: null,
              type: 'emptyMedia',
              userId: null,
              fileName: null,
              createdAt: null,
              title: card?.title,
              listTitle: card?.list.title,
              boardTitle: card?.list?.board.title,
              boardCreatedAt: card.list.board.createdAt ? card.list.board.createdAt.toString() : null, // Handle null
              boardUpdatedAt: card.list.board.updatedAt ? card.list.board.updatedAt.toString() : null, // Handle null
          
            
              card: {
                ...card,
                createdAt: card.createdAt ? card.createdAt.toString() : null, // Handle null for card.createdAt
                updatedAt: card.updatedAt ? card.updatedAt.toString() : null, // Handle null for card.updatedAt
                list: card.list ? { // Handle null for card.list
                  ...card.list,
                  // createdAt is likely on card, not list. If it is on list, use the same null check as above.
                  board: card.list?.board ? { // Handle null for card.list.board using optional chaining
                    ...card.list.board,
                    createdAt: card.list.board.createdAt ? card.list.board.createdAt.toString() : null, // Handle null
                    updatedAt: card.list.board.updatedAt ? card.list.board.updatedAt.toString() : null, // Handle null
                  } : null,
                } : null,
              },
            }]
          
          }

      }
    
    // Add the hasMedia property to the response
    const response = {
      data: safeMedia || null,
      hasMedia: hasMedia, // Include the boolean property
    };
   // console.log("response:.......", response)
    return NextResponse.json(response);  
    
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}

