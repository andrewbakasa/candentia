import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getCardMedia() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    const owner_id = currentUser.id
    let mediaList
      mediaList = await prisma.cardImage.findMany({
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
    
    
    const safeMedia = mediaList.map((mediaX) => ({
      ...mediaX,
      createdAt: mediaX.createdAt ? mediaX.createdAt.toString() : null, // Handle null for mediaX.createdAt
      listTitle: mediaX.card.list.title,
      bordTitle: mediaX.card.list?.board.title,
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
    
    return safeMedia;
  } catch (error: any) {
    throw new Error(error);
  }
}
export async function getSingleCardMedia(cardId: string) {  // New function
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null; // Return null if not logged in
    }

    const mediaItem = await prisma.cardImage.findUnique({
      where: { id: cardId }, // Find by ID
      include: {
        card: {
          include: {
            list: {
              include: {
                board: {
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
                },
              },
            },
          },
        },
      },
    });

    if (!mediaItem) {
      return null; // Return null if not found
    }

    // Transform the single media item (similar to the mapping in getCardMedia)
    const safeMedia = {
      ...mediaItem,
      createdAt: mediaItem.createdAt ? mediaItem.createdAt.toString() : null,
      listTitle: mediaItem.card.list.title,
      bordTitle: mediaItem.card.list?.board.title,
      boardCreatedAt: mediaItem.card.list.board.createdAt ? mediaItem.card.list.board.createdAt.toString() : null,
      boardUpdatedAt: mediaItem.card.list.board.updatedAt ? mediaItem.card.list.board.updatedAt.toString() : null,

      card: {
        ...mediaItem.card,
        createdAt: mediaItem.card.createdAt ? mediaItem.card.createdAt.toString() : null,
        updatedAt: mediaItem.card.updatedAt ? mediaItem.card.updatedAt.toString() : null,
        list: mediaItem.card.list ? {
          ...mediaItem.card.list,
          board: mediaItem.card.list?.board ? {
            ...mediaItem.card.list.board,
            createdAt: mediaItem.card.list.board.createdAt ? mediaItem.card.list.board.createdAt.toString() : null,
            updatedAt: mediaItem.card.list.board.updatedAt ? mediaItem.card.list.board.updatedAt.toString() : null,
          } : null,
        } : null,
      },
    };

    return safeMedia;
  } catch (error: any) {
    throw new Error(error);
  }
}