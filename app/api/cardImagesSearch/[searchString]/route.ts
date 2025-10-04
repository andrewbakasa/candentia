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

        // 1. Fetch all cards with their images and necessary relations.
        const cards = await prisma.card.findMany({
            // NOTE: We rely on JavaScript sorting later, so no top-level 'orderBy' is needed here.
            include: {
                cardImages: {
                    // Ensure nested cardImages are still sorted descending (latest first)
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

        // 2. Access and Public/Active Filtering
        let filteredCards = cards.filter(card => {
            const isBoardPublic = card.list?.board?.public === true;
            const isUserOwner = card.list?.board?.user?.id === currentUser?.id;
            const isAccessible = isBoardPublic || isUserOwner;
            
            // Fix: Use optional chaining on card.list for safer property access
            return isAccessible && card.active;
        });

        // 3. Category Filtering
        if (categoryQuery && categoryQuery !== '') {
            const categoryIds = categoryQuery.split(',').map(tag => tag.trim());
            filteredCards = filteredCards.filter(card => {
                return categoryIds.every(catId => card.tagIDs?.includes(catId));
            });
        }

        // 4. Flatten and Shape Data (safeMedia)
        // Convert dates to ISO strings immediately for safety
        const safeMedia = filteredCards.flatMap((card) =>
            card.cardImages.map((image) => ({
                ...image,
                // Use ISOString for safe JSON date serialization
                createdAt: image.createdAt?.toISOString(), 
                card: {
                    ...card,
                    createdAt: card.createdAt.toISOString(),
                    updatedAt: card.updatedAt.toISOString(),
                    listTitle: card.list.title,
                    boardTitle: card.list.board.title,
                    list: {
                        ...card.list,
                        createdAt: card.list.createdAt.toISOString(),
                        updatedAt: card.list.updatedAt.toISOString(),
                        board: {
                            ...card.list.board,
                            createdAt: card.list.board.createdAt.toISOString(),
                            updatedAt: card.list.board.updatedAt.toISOString(),
                        },
                    },
                },
                // Cleaned up redundant flattened properties for consistency
            }))
        );

        // 5. NEW SORTING METHOD: Sort the flattened safeMedia array by image createdAt
        safeMedia.sort((a, b) => {
            // Parse the ISO date strings back into Date objects for comparison
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            
            // Sort descending (b - a) to put the LATEST date first
            return dateB.getTime() - dateA.getTime();
        });

        // 6. Apply Text Search Filtering
        let finalFilteredMedia = safeMedia;

        if (decodedSearchTerm && decodedSearchTerm !== NO_FILTER_SEARCH_CODE) {
            const orSearchGroups = decodedSearchTerm.split(';').map(group => group.trim().toLowerCase());

            finalFilteredMedia = safeMedia.filter((mediaItem) => {
                return orSearchGroups.some(orGroup => {
                    const andSearchTerms = orGroup.split(',').map(term => term.trim()).filter(Boolean);

                    if (andSearchTerms.length === 0) {
                        return true;
                    }

                    return andSearchTerms.every(andTerm => {
                        const targets = [
                            mediaItem.card.description,
                            mediaItem.card.title,
                            mediaItem.card.list.title,
                            mediaItem.card.list.board.title,
                            mediaItem.description,
                        ].filter(Boolean) as string[];

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
        // Ensure a proper error response is returned
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}