// import prisma from "../libs/prismadb";
// import getCurrentUser from "./getCurrentUser";

// /**
//  * Helper function to safely convert Date objects in a Prisma result
//  * into ISO 8601 strings for transport across API boundaries.
//  * This simplifies the main function logic and ensures consistency.
//  * @param mediaItem The Prisma CardImage object with nested relations.
//  * @returns A new object with all Date objects converted to strings and flattened titles.
//  */
// function safeSerializeDates(mediaItem: any): any {
//   // Use optional chaining and nullish coalescing for safe access
//   const board = mediaItem.card?.list?.board;
//   const card = mediaItem.card;
//   const list = mediaItem.card?.list;
  
//   return {
//     ...mediaItem,
    
//     // Convert top-level dates
//     createdAt: mediaItem.createdAt?.toISOString() ?? null,

//     // Add custom flattened properties for easier consumption
//     listTitle: list?.title ?? null,
//     boardTitle: board?.title ?? null, // FIX: Corrected typo from 'bordTitle' to 'boardTitle'
//     boardCreatedAt: board?.createdAt?.toISOString() ?? null,
//     boardUpdatedAt: board?.updatedAt?.toISOString() ?? null,

//     card: {
//       ...card,
//       createdAt: card?.createdAt?.toISOString() ?? null,
//       updatedAt: card?.updatedAt?.toISOString() ?? null,
      
//       list: list ? {
//         ...list,
//         board: board ? {
//           ...board,
//           createdAt: board?.createdAt?.toISOString() ?? null,
//           updatedAt: board?.updatedAt?.toISOString() ?? null,
//         } : null,
//       } : null,
//     },
//   };
// }

// /**
//  * Fetches all card media items for boards owned by the current user,
//  * ordered by creation date, and includes nested board and user information.
//  * @returns An array of safe-serialized media objects.
//  */
// export async function getCardMedia() {
//   try {
//     const currentUser = await getCurrentUser();
    
//     if (!currentUser) {
//       return [];
//     }
    
//     // IMPROVEMENT: Added a critical security filter to ensure we only fetch media
//     // for boards owned by the current user (using currentUser.id).
//     const mediaList = await prisma.cardImage.findMany({
//       where: {
//         card: {
//           list: {
//             board: {
//               userId: currentUser.id, // Filter by board owner
//             }
//           }
//         }
//       },
//       orderBy: { createdAt: "desc" },
      
//       include: {
//         card: {
//           include: {
//             list: {
//               include: {
//                 board: {
//                   select: {
//                     id: true, 
//                     title: true,
//                     createdAt: true,
//                     updatedAt: true,
//                     user: {
//                       select: {
//                         email: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     // IMPROVEMENT: Use the new helper function for serialization
//     return mediaList.map(safeSerializeDates);
//   } catch (error: any) {
//     console.error("Error fetching card media list:", error);
//     // Throw a new Error with a clearer message
//     throw new Error(`Failed to fetch card media: ${error.message}`);
//   }
// }

// /**
//  * Fetches a single card media item by its ID, atomically increments its view count,
//  * and includes nested board and user information.
//  * @param cardImageId The ID of the CardImage record to fetch/update.
//  * @returns The safe-serialized media object, or null if not found or unauthorized.
//  */
// export async function getSingleCardMedia(cardImageId: string) {
//   try {
//     const currentUser = await getCurrentUser();
//     if (!currentUser) {
//       return null;
//     }

//     // IMPROVEMENT: Use a single 'update' operation. This atomically increments the view count
//     // and fetches all the data in one database query, which is much more efficient
//     // than the original findUnique followed by a separate update.
//     const mediaItemWithIncrement = await prisma.cardImage.update({
//       where: { 
//         id: cardImageId,
//         // Security Check: Only allow update/fetch if the media belongs to a board the user owns
//         card: {
//           list: {
//             board: {
//               userId: currentUser.id,
//             }
//           }
//         }
//       }, 
//       data: {
//         viewCount: { increment: 1 }, // Atomic increment
//       },
//       include: {
//         // Includes are identical to the list query to maintain consistency
//         card: {
//           include: {
//             list: {
//               include: {
//                 board: {
//                   select: {
//                     id: true,
//                     title: true,
//                     createdAt: true,
//                     updatedAt: true,
//                     user: {
//                       select: {
//                         email: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     // IMPROVEMENT: Use the new helper function for serialization
//     return safeSerializeDates(mediaItemWithIncrement);

//   } catch (error: any) {
//     // If the record isn't found or the security check fails, Prisma throws a P2025 error.
//     if (error.code === 'P2025') {
//         console.warn(`CardImage ID ${cardImageId} not found or user is unauthorized.`);
//         return null;
//     }
    
//     console.error("Error fetching or updating single card media:", error);
//     throw new Error(`Failed to fetch single card media: ${error.message}`);
//   }
// }

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

    
    if (mediaItem.viewCount) {
      // Update existing BoardView with increment of 1
      const updatedView = await prisma.cardImage.update({
        where: {
          id: mediaItem.id,
        },
        data: {
          viewCount: { increment: 1 }, // Increment by 1
        },
      });
    }else{
        const updatedView = await prisma.cardImage.update({
        where: {
          id: mediaItem.id,
        },
        data: {
          viewCount:  1 
        },
      });
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