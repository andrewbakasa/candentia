import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: { searchString: string } }
) {
  try {
    const decodedSearchTerm = decodeURIComponent(params.searchString);
    const currentUser = await getCurrentUser();

    const cards = await prisma.card.findMany({
      include: {
        cardImages: {
          orderBy: { createdAt: "desc" },
        },
        list: {
          include: {
            board: {
              select: {
                id: true, // Include the id to check if the board is public
                title: true,
                createdAt: true,
                updatedAt: true,
                public: true, // Select the public property
                user: {
                  select: {
                    email: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const filteredCards = cards.filter(card => {
      const isBoardPublic = card?.list?.board?.public === true;
      return isBoardPublic && card.active;
    });

    const safeMedia = filteredCards.flatMap((card) => // Use filteredCards here
      card.cardImages.map((image) => ({
        ...image,
        createdAt: image.createdAt?.toString(),
        card: {
          ...card,
          createdAt: card.createdAt?.toString(),
          updatedAt: card.updatedAt?.toString(),
          title: card?.title,
          listTitle: card.list.title,
          boardTitle: card.list?.board.title,
          list: card.list ? {
            ...card.list,
            createdAt: card.list.createdAt?.toString(),
            updatedAt: card.list.updatedAt?.toString(),
            board: card.list.board ? {
              ...card.list.board,
              createdAt: card.list.board.createdAt?.toString(),
              updatedAt: card.list.board.updatedAt?.toString(),
            } : null,
          } : null,
        },
        title: card.title,
        listTitle: card.list?.title,
        boardTitle: card.list?.board?.title,
        boardCreatedAt: card.list?.board?.createdAt?.toString(),
        boardUpdatedAt: card.list?.board?.updatedAt?.toString(),
      }))
    );

    let finalFilteredMedia = safeMedia; // Initialize with all media after card filtering

    if (decodedSearchTerm && decodedSearchTerm !== NO_FILTER_SEARCH_CODE) {
      const searchTerms = decodedSearchTerm.split(';').map(term => term.trim().toLowerCase());
      //console.log(`Search Splits:::${searchTerms}`);

      //filter search string....
      finalFilteredMedia = safeMedia.filter((mediaItem) => {
        return searchTerms.some(term => {
          const descriptionMatch = mediaItem?.card?.description?.toLowerCase().includes(term);
          const cardTitleMatch = mediaItem?.card?.title?.toLowerCase().includes(term);
          const listTitleMatch = mediaItem?.listTitle?.toLowerCase().includes(term);
          const boardTitleMatch = mediaItem?.boardTitle?.toLowerCase().includes(term);

          return descriptionMatch || cardTitleMatch || listTitleMatch || boardTitleMatch;
        });
      });
    }

    // Add the hasMedia property to the response
    const response = {
      data: finalFilteredMedia || null,
      hasMedia: true//hasMedia, // Include the boolean property
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error in /api/cardImagesSearch:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import prisma from "@/app/libs/prismadb";
// import getCurrentUser from "@/app/actions/getCurrentUser";
// import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";

// export async function GET(
//   req: Request,
//   { params }: { params: { searchString: string } }
// ) {
//   try {
//     const decodedSearchTerm = decodeURIComponent(params.searchString);    
//     const currentUser = await getCurrentUser(); 
   
//     // if (!currentUser) {
//     //   return NextResponse.json([], { status:500 }); // Return a NextResponse with appropriate status
     
//     // }
   
//     const cards = await prisma.card.findMany({
//       include: {
//         cardImages: {
//           orderBy: { createdAt: "desc" },
//         },
//         list: {
//           include: {
//             board: {
//               select: {
//                 title: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 user: {
//                   select: {
//                     email: true,
//                     id:true
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     const filteredCards = cards.filter(card => {
//       const isOwner = card?.list.board.user?.id === currentUser?.id;// pass the owner of board
//       const isAdminOrOwner = isOwner || currentUser?.isAdmin;// pass admin
//       const cardCreator = card.userId === currentUser?.id;// pass who created this card
//       return (card.visible || isAdminOrOwner || cardCreator) && card.active;
//     });


//     const safeMedia = filteredCards.flatMap((card) => // Use filteredCards here
//       card.cardImages.map((image) => ({
//         ...image,
//         createdAt: image.createdAt?.toString(),
//         card: {
//           ...card,
//           createdAt: card.createdAt?.toString(),
//           updatedAt: card.updatedAt?.toString(),
//           title: card?.title,
//           listTitle: card.list.title,
//           boardTitle: card.list?.board.title,
//           list: card.list ? {
//             ...card.list,
//             createdAt: card.list.createdAt?.toString(),
//             updatedAt: card.list.updatedAt?.toString(),
//             board: card.list.board ? {
//               ...card.list.board,
//               createdAt: card.list.board.createdAt?.toString(),
//               updatedAt: card.list.board.updatedAt?.toString(),
//             } : null,
//           } : null,
//         },
//         title: card.title,
//         listTitle: card.list?.title,
//         boardTitle: card.list?.board?.title,
//         boardCreatedAt: card.list?.board?.createdAt?.toString(),
//         boardUpdatedAt: card.list?.board?.updatedAt?.toString(),
//       }))
//     );

//     let finalFilteredMedia = safeMedia; // Initialize with all media after card filtering

//     if (decodedSearchTerm && decodedSearchTerm !==NO_FILTER_SEARCH_CODE) {
//       const searchTerms = decodedSearchTerm.split(';').map(term => term.trim().toLowerCase());
//       //console.log(`Search Splits:::${searchTerms}`);
   
//      //filter search string....
//       finalFilteredMedia = safeMedia.filter((mediaItem) => {
//         return searchTerms.some(term => {
//           const descriptionMatch = mediaItem?.card?.description?.toLowerCase().includes(term);
//           const cardTitleMatch = mediaItem?.card?.title?.toLowerCase().includes(term);
//           const listTitleMatch = mediaItem?.listTitle?.toLowerCase().includes(term);
//           const boardTitleMatch = mediaItem?.boardTitle?.toLowerCase().includes(term);

//           return descriptionMatch || cardTitleMatch || listTitleMatch || boardTitleMatch;
//         });
//       });
//     }

//      // Add the hasMedia property to the response
//      const response = {
//       data: finalFilteredMedia || null,
//       hasMedia: true//hasMedia, // Include the boolean property
//     };

//     return NextResponse.json(response);  
 
//   } catch (error) {
//     console.error("Error in /api/cardImagesSearch:", error);
//     return NextResponse.json([],{ status: 500 });
//   }
// }
