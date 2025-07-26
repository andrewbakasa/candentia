import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";

export async function GET(
    req: Request,
    { params }: { params: { searchString: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const decodedSearchTerm = decodeURIComponent(params.searchString);
        const categoryQuery = searchParams.get("category");
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
                                id: true,
                                title: true,
                                createdAt: true,
                                updatedAt: true,
                                public: true,
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

        let filteredCards = cards.filter(card => {
            const isBoardPublic = card?.list?.board?.public === true;
            // Ensure card.active is true if it's a field you want to filter by
            return isBoardPublic && card.active;
        });

        // Apply category filtering
        if (categoryQuery && categoryQuery !== '') {
            const categoryIds = categoryQuery.split(',').map(tag => tag.trim());
            filteredCards = filteredCards.filter(card => {
                // Ensure ALL categoryIds are present on the card
                return categoryIds.every(catId => card.tagIDs?.includes(catId));
            });
        }

        const safeMedia = filteredCards.flatMap((card) =>
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
                title: card.title, // This might be redundant if card.title is already in card object
                listTitle: card.list?.title, // This might be redundant if card.list.title is already in card object
                boardTitle: card.list?.board?.title, // This might be redundant if card.list.board.title is already in card object
                boardCreatedAt: card.list?.board?.createdAt?.toString(),
                boardUpdatedAt: card.list?.board?.updatedAt?.toString(),
            }))
        );

        let finalFilteredMedia = safeMedia;

        if (decodedSearchTerm && decodedSearchTerm !== NO_FILTER_SEARCH_CODE) {
            // Split by semicolon (;) for "OR" groups
            const orSearchGroups = decodedSearchTerm.split(';').map(group => group.trim().toLowerCase());

            finalFilteredMedia = safeMedia.filter((mediaItem) => {
                // For each mediaItem, check if it matches ANY of the OR groups
                return orSearchGroups.some(orGroup => {
                    // Inside each OR group, split by comma (,) for "AND" terms
                    const andSearchTerms = orGroup.split(',').map(term => term.trim()).filter(Boolean); // Filter out empty strings

                    if (andSearchTerms.length === 0) {
                        return true; // If an OR group is empty, consider it a match to not break the 'some' logic
                    }

                    // Check if the mediaItem matches ALL "AND" terms within this OR group
                    return andSearchTerms.every(andTerm => {
                        const targets = [
                            mediaItem?.card?.description,
                            mediaItem?.card?.title,
                            mediaItem?.listTitle,
                            mediaItem?.boardTitle,
                            mediaItem?.description, // CardImage description
                        ].filter(Boolean) as string[]; // Filter out null/undefined and assert type

                        return targets.some(target => target.toLowerCase().includes(andTerm));
                    });
                });
            });
        }

        const response = {
            data: finalFilteredMedia || null,
            hasMedia: finalFilteredMedia.length > 0,
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
//     const { searchParams } = new URL(req.url);
//     const decodedSearchTerm = decodeURIComponent(params.searchString);
//     const categoryQuery = searchParams.get("category");
//     const currentUser = await getCurrentUser();

//     const cards = await prisma.card.findMany({
//       include: {
//         cardImages: {
//           orderBy: { createdAt: "desc" },
//         },
//         list: {
//           include: {
//             board: {
//               select: {
//                 id: true,
//                 title: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 public: true,
//                 user: {
//                   select: {
//                     email: true,
//                     id: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     let filteredCards = cards.filter(card => {
//       const isBoardPublic = card?.list?.board?.public === true;
//       return isBoardPublic && card.active;
//     });

//     // Apply category filtering
//     if (categoryQuery && categoryQuery !== '') {
//       const categoryIds = categoryQuery.split(',').map(tag => tag.trim());
//       filteredCards = filteredCards.filter(card => {
//         return categoryIds.every(catId => card.tagIDs?.includes(catId));
//       });
//     }

//     const safeMedia = filteredCards.flatMap((card) =>
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

//     let finalFilteredMedia = safeMedia;

//     if (decodedSearchTerm && decodedSearchTerm !== NO_FILTER_SEARCH_CODE) {
//       //";" some "," every
//       const searchTerms = decodedSearchTerm.split(';').map(term => term.trim().toLowerCase());

//       finalFilteredMedia = safeMedia.filter((mediaItem) => {
//         return searchTerms.some(term => {
//           const cardDescriptionMatch = mediaItem?.card?.description?.toLowerCase().includes(term);
//           const cardTitleMatch = mediaItem?.card?.title?.toLowerCase().includes(term);
//           const listTitleMatch = mediaItem?.listTitle?.toLowerCase().includes(term);
//           const boardTitleMatch = mediaItem?.boardTitle?.toLowerCase().includes(term);
//           // Add CardImage description to the search
//           const cardImageDescriptionMatch = mediaItem?.description?.toLowerCase().includes(term); 

//           return cardDescriptionMatch || cardTitleMatch || listTitleMatch || boardTitleMatch || cardImageDescriptionMatch;
//         });
//       });
//     }

//     const response = {
//       data: finalFilteredMedia || null,
//       hasMedia: finalFilteredMedia.length > 0,
//     };

//     return NextResponse.json(response);

//   } catch (error) {
//     console.error("Error in /api/cardImagesSearch:", error);
//     return NextResponse.json([], { status: 500 });
//   }
// }