'use client';
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SafeUser } from "../types";
import Container from "../components/Container";
import Slider from "@/components/modals/media-modal/slider";
import { Separator } from "@radix-ui/react-separator";
import { cn, isWithinOneDay } from "@/lib/utils"; // Removed truncateString as it wasn't used
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
import { getTextFromEditor3_2 } from "@/components/modals/card-modal/description";
import moment from "moment";
import useFavorite from "../hooks/useFavorite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "next/head";
import { Skeleton } from "@/components/ui/skeleton";
import CardTags from "../mycontents/_components/card-tags";
import CreatedAtUpdatedAt from "../mycontents/_components/updatedCreated";
import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Search from "../components/Search";
import { Hint } from "@/components/hint";

import Link from "next/link";
import FilterSection, { LabelValueType } from "@/app/components/FilterSection";
import useIsMobile from "../hooks/isMobile";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";

import { fetcher } from "@/lib/fetcher";

// NOTE: These action functions must return { id: mediaId, cardId: string, description?: string, fileName?: string }
import { updateCardMediaDescription } from '@/app/actions/update-cardMedia-descriptions';
import { updateCardMediaFileName } from '@/app/actions/update-cardMedia-filename';
import { AiFillDashboard, AiFillPicture } from "react-icons/ai";
import { useMediaModal } from "@/hooks/use-media-modal";
import { updateCardMediaViewCount } from "@/app/actions/update-cardMedia-ViewCount";

// Define the structure of the list item for better type safety
interface MediaListItem {
    id: string; // The ID of the specific media item (CardImage)
    cardId: string; // The ID of the card this media belongs to
    boardTitle: string;
    title: string;
    description: string | null; // The media's description field
    fileName: string | null; // The media's file name field
    // ... other CardImage fields and associated Card/Board data
    card: {
        id: string;
        description: string;
        updatedAt: string;
        visible: boolean;
        createdAt: string;
        // ... other Card fields
    };
    // ...
}

interface MediaClientProps {
    currentUser?: SafeUser | null,
    origin: string,
    tagNames: any;
    userNames: any;
}

const MediaClient: React.FC<MediaClientProps> = ({ currentUser, tagNames, userNames, origin }) => {
    const [category, setCategory] = useState<string>('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchFromUrl = searchParams?.get("search");

    const isMobile = useIsMobile();
    // cardMedia state is derived from searchCardWithImageList.data
    const [currentCardData, setCurrentCardData] = useState<any | null>(null);
    const [cardMedia, setCardMedia] = useState<any[]>([]);
    const [filteredMediaCount, setFilteredMediaCount] = useState(0);
    const [hasAnyMedia, setHasAnyMedia] = useState(false);

    const [searchTerm, setSearchTerm] = useState(searchFromUrl || "");
    const [compositeDecorator, setCompositeDecorator] = useState(new CompositeDecorator([]));
    const [currentCardId, setCurrentCardId] = useState<string | null>(null);
    const [sliderIndex, setSliderIndex] = useState(0);
    
    const allowedRoles: string[] = ['admin', 'manager'];
    const queryClient = useQueryClient();

    const canEdit = currentUser?.isAdmin || currentUser?.roles?.some(role =>
        allowedRoles.includes(role.toLowerCase())
    ) || false;

    const { hasFavorited } = useFavorite({
        listingId: currentCardData?.card?.id || "",
        currentUser
    });
   const mediaModal = useMediaModal();
    // --- QUERY FOR MEDIA LIST (This is the list we will update the cache for) ---
    const mediaListQueryKey = ["cardImageSearch", searchFromUrl, category];


       // useAction hook for updating card image description
    const { execute: updateCardImageViewCountMutation } = useAction(updateCardMediaViewCount, {
        onSuccess: (data) => {
          // 2. CORRECT REFRESH: Invalidate the specific query key
          queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] }); 
          //toast.success("Description updated successfully!");
        },
        onError: (error) => {
          toast.error(error);
        },
      });
    
    const handleViewCountUpdateChange = (mediaId: string) => {
      if (!mediaId) {
       // toast.error("Media ID is missing for viewCount update.");
        return;
      }
      updateCardImageViewCountMutation({ id: mediaId});
    };
    const { data: searchCardWithImageList, status: searchStatus, error: searchError, isFetching: isSearchFetching } = useQuery({
        queryKey: mediaListQueryKey,
        queryFn: async () => {
            const encodedSearchTerm = searchFromUrl ? encodeURIComponent(searchFromUrl) : encodeURIComponent(NO_FILTER_SEARCH_CODE);
            const encodedCategory = category ? encodeURIComponent(category) : '';

            let url = `/api/cardImagesSearch/${encodedSearchTerm}`;
            if (encodedCategory) {
                url += `?category=${encodedCategory}`;
            }

            // NOTE: Assuming the API returns a structure like { data: MediaListItem[], hasMedia: boolean }
            const data = await fetcher(url);
            return data || null;
        },
        enabled: true,
    });

    // --- MUTATION HANDLERS (UPDATED TO USE setQueryData) ---

    // useAction hook for updating card image description
    const { execute: updateCardImageDescriptionMutation } = useAction(updateCardMediaDescription, {
        onSuccess: (data) => {
            const { id: mediaId, description: newDescription } = data; // Assuming server returns the updated value
            
            // 💡 STRATEGY: Update the main list query cache directly
            queryClient.setQueryData(mediaListQueryKey, (oldData: any) => {
                if (!oldData || !oldData.data) return oldData;
                
                // Map over the list and replace the item with the updated description
                const newMediaList = oldData.data.map((item: MediaListItem) => {
                    // Assuming item.id is the mediaId
                    if (item.id === mediaId) { 
                        return { ...item, description: newDescription }; 
                    }
                    return item;
                });

                // Return the new data object with the updated list
                return { ...oldData, data: newMediaList };
            });

            // Update the currently displayed card data immediately (optional, but prevents flicker)
            setCurrentCardData((prevData: { id: string; }) => {
                if (prevData?.id === mediaId) {
                    return { ...prevData, description: newDescription };
                }
                return prevData;
            });
            
            toast.success("Description updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });
    
    // useAction hook for updating card image filename
    const { execute: updateCardImageFilenameMutation } = useAction(updateCardMediaFileName, {
        onSuccess: (data) => {
            const { id: mediaId, fileName: newFileName } = data; // Assuming server returns the updated value
            
            // 💡 STRATEGY: Update the main list query cache directly
            queryClient.setQueryData(mediaListQueryKey, (oldData: any) => {
                if (!oldData || !oldData.data) return oldData;

                const newMediaList = oldData.data.map((item: MediaListItem) => {
                    if (item.id === mediaId) {
                        return { ...item, fileName: newFileName };
                    }
                    return item;
                });

                return { ...oldData, data: newMediaList };
            });
            
            // Update the currently displayed card data immediately (optional, but prevents flicker)
            setCurrentCardData((prevData: { id: string; }) => {
                if (prevData?.id === mediaId) {
                    return { ...prevData, fileName: newFileName };
                }
                return prevData;
            });

            toast.success("Filename updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });
    
    // Handler for description change (needs to pass cardId if action requires it)
    const handleDescriptionChange = (mediaId: string, newDescription: string | null, cardId: string) => {
        if (!mediaId) {
            toast.error("Media ID is missing for description update.");
            return;
        }
        // NOTE: The updateCardMediaDescription action needs to return { id: mediaId, description: newDescription } 
        // for the setQueryData logic above to work cleanly.
        updateCardImageDescriptionMutation({ id: mediaId, description: newDescription });
    };
    
    // Handler for filename change
    const handleFileNameChange = (mediaId: string, newFileName: string | null, cardId: string) => {
        if (!mediaId) {
            toast.error("Media ID is missing for filename update.");
            return;
        }
        // NOTE: The updateCardMediaFileName action needs to return { id: mediaId, fileName: newFileName } 
        // for the setQueryData logic above to work cleanly.
        updateCardImageFilenameMutation({ id: mediaId, fileName: newFileName });
    };

    // Card/Slider index change handler
    const handleCardIdChange = (cardId: string | null, index: number) => {
        // cardId here refers to the media item ID (CardImage ID)
        setCurrentCardId(cardId);
        setSliderIndex(index);
    };

    // --- EFFECTS ---
    
    // Effect for highlighting search terms (unchanged)
    useEffect(() => {
        let arrFirst = searchTerm.split(';');
        const subLists = arrFirst.filter(element => element);
        const highlightText = subLists.flatMap(subList => subList.split(','));

        const customHighlightDecorator: DraftDecorator = {
            strategy: (block, callback, contentState) => {
                const text = block.getText();
                const currentSelection = contentState.getSelectionBefore();
                for (let i = 0; i < highlightText.length; i++) {
                    const word = highlightText[i];
                    const startIndex = text.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
                    if (startIndex !== -1) {
                        const endIndex = startIndex + word.length;
                        callback(startIndex, endIndex);
                    }
                }
            },
            component: ({ children, style }) => {
                return <span style={style} className="bg-yellow-400 ">{children}</span>;
            },
        };
        setCompositeDecorator(new CompositeDecorator([customHighlightDecorator]));
    }, [searchTerm]);

    // Effect for setting document title (unchanged)
    useEffect(() => {
        let title = "View Media";
        let description = "View and manage media";

        if (searchFromUrl) {
            title = `Search Results for "${searchFromUrl}"`;
            description = `Search results for "${searchFromUrl}"`;
        }

        document.title = title;
    }, [currentCardData, searchFromUrl]);

    // Handle URL updates when searchTerm changes (unchanged)
    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentQuery = new URLSearchParams(searchParams?.toString());

        if (searchTerm === "") {
            currentQuery.delete("search");
        } else {
            currentQuery.set("search", searchTerm);
        }

        const newUrl = `${currentPath}?${currentQuery.toString()}`;
        router.push(newUrl);
    }, [searchTerm, router, searchParams]);

    // Effect to synchronize component state with fetched data
    // This runs when the query cache is updated (either by fetch or setQueryData)
    useEffect(() => {
        if (searchStatus === "success" && searchCardWithImageList?.data) {
            const mediaData = searchCardWithImageList.data as MediaListItem[];

            setFilteredMediaCount(mediaData.length || 0);
            setCardMedia(mediaData || []);
            setHasAnyMedia(mediaData.length > 0 || false);
            
            // Logic to determine the currently visible media item:
            let selectedItem = null;
            
            if (currentCardId) {
                // 1. Try to find the currently selected item by ID
                selectedItem = mediaData.find(item => item.id === currentCardId);
            } 
            
            if (!selectedItem && mediaData.length > 0) {
                // 2. If no ID or item was found, default to the one at the current slider index
                selectedItem = mediaData[sliderIndex] || mediaData[0];
            }

            setCurrentCardData(selectedItem);
            
            // If the selected item changed, update currentCardId (important for deep linking)
            if (selectedItem && selectedItem.id !== currentCardId) {
                 setCurrentCardId(selectedItem.id);
            }


        } else if (searchStatus === "error") {
            setCurrentCardData(null);
            setCardMedia([]);
            setFilteredMediaCount(0);
            setHasAnyMedia(false);
            setCurrentCardId(null);
        }
    }, [searchStatus, searchCardWithImageList?.data, currentCardId, sliderIndex]);


    const isLoading = isSearchFetching;

    const showNoResultsMessage = !isLoading && filteredMediaCount === 0 && (searchTerm || category);
    console.log("currentCardData", currentCardData)
    return (
        <Container>
            <Head>
                <title>{document.title}</title>
                <meta name="description" content={currentCardData?.card?.description || "A description of the Media"} />
                <meta property="og:title" content={document.title} />
                <meta property="og:description" content={currentCardData?.card?.description || "A description of the Media"} />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <div className="z-51 mt-[-50px] sm:mt-[-80px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
                <div className={cn("flex gap-1 z-51", true ? 'flex-col' : 'flex-row justify-between')}>
                    <div
                        className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg", true ? 'py-1' : '')}
                    >
                    </div>
                </div>

                <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
                    <div className="flex flex-row">
                        <Search
                            setSearchTerm={setSearchTerm}
                            searchTerm={searchTerm}
                            debounce={1500}
                            placeholderText="filter records..."
                        />
                    </div>
                    <div className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg mr-auto", isMobile ? 'py-2' : '')}>
                        <FilterSection
                            setCategory={(selectedCategory) => {
                                setCategory(selectedCategory ? selectedCategory : '');
                            }}
                            productCategories_options={tagNames}
                            category={category === '' ? null : category}
                            isFullwidth={isMobile ? true : false}
                            placeholder="Filter by tags"
                            isDisabled={false}
                        />
                    </div>
                </div>
            </div>

            <div className={cn("mt-0 pb-1 ", 0 == 0 ? "" : "shadow-xl rounded-md p-1 border-yellow-400 border-2")}>
                <div>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-[250px] w-full mb-2" />
                            <Skeleton className="h-4 w-1/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                        </>
                    ) : (
                        <>
                            {hasAnyMedia ? (
                                <Slider
                                        mediaList={cardMedia}
                                        fullView={true}
                                        onCardIdChange={handleCardIdChange} // This updates sliderIndex  
                                        onDescriptionChange={(mediaId, desc) => handleDescriptionChange(mediaId, desc, currentCardData!.cardId)}
                                        onFileNameChange={(mediaId, name) => handleFileNameChange(mediaId, name, currentCardData!.cardId)}
                                        canEdit={canEdit}
                                        sliderIndex={sliderIndex}
                                        filteredMediaCount={filteredMediaCount}
                                        searchTerm={searchTerm}
                                        onViewCountUpdate={handleViewCountUpdateChange}                                        
                                />
                            ) : (
                                showNoResultsMessage && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg shadow-inner text-gray-600 text-center min-h-[300px]">
                                        <p className="text-2xl font-semibold mb-4">No media found for your search.</p>
                                        <p className="text-lg mb-6">Try one of these options to find what you&apos;re looking for:</p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {searchTerm && (
                                                <Button
                                                    onClick={() => setSearchTerm("")}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Clear Search Term
                                                </Button>
                                            )}
                                            {category && (
                                                <Button
                                                    onClick={() => setCategory("")}
                                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Clear Category Filter
                                                </Button>
                                            )}
                                            {(!searchTerm && !category) && (
                                                <p className="text-md">There&apos;s no media to display. Please add some.</p>
                                            )}
                                        </div>
                                        <p className="mt-6 text-sm text-gray-500">
                                            You can also try a different search term or select a different category.
                                        </p>
                                    </div>
                                )
                            )}
                            <Separator />
                            {filteredMediaCount > 0 && (
                                <p className="text-sm text-blue-300 mr-auto">media {sliderIndex + 1} of [{filteredMediaCount}] </p>
                            )}
                            {currentCardData && (
                                <div className="shadow-sm">
                                    <h2 className="text-red-300">{currentCardData?.boardTitle}</h2>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isLoading ? (
                <Skeleton className="h-12 w-full mt-3" />
            ) : (
                currentCardData && (
                    <div className={cn(
                        "p-2 rounded-sm transition-colors duration-300",
                        currentCardData.card?.visible
                            ? isWithinOneDay(currentCardData?.card?.updatedAt || "", moment())
                                ? "bg-yellow-50 hover:bg-yellow-200"
                                : "bg-white hover:bg-gray-200"
                            : "bg-rose-200 hover:bg-rose-300",
                        hasFavorited ? "text-red-400 hover:text-red-600" : ""
                    )}>
                        <Hint
                            sideOffset={20}
                            description="Go to view page"
                        >
                            <h5
                                className='text-sm font-bold text-green-500 hover:cursor-pointer '
                                onClick={() => router.push(`/m/${currentCardData?.card?.id}`)}
                            >
                                {currentCardData?.title}
                            </h5>
                        </Hint>
                        <CreatedAtUpdatedAt
                            createdAt={currentCardData?.card?.createdAt}
                            updatedAt={currentCardData?.card?.updatedAt} />




                        <CardTags
                            index2={String('1')}
                            card={currentCardData?.card}
                            setCategory={setCategory}
                            category={category}
                            tagNames={tagNames}
                        />

                          <div className="flex flex-row gap-2 shadow-md justify-end">

                             {/* View */}
                            {(currentCardData?.card.viewCount != null && Number(currentCardData?.card.viewCount) > 0) && (
                                 <Hint
                                  sideOffset={20}
                                  description={`Number of views is ${currentCardData?.card.viewCount}`}
                                >
                                    <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                        {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                        <span className="absolute top-[-10px] right-[-5px] bg-red-500 text-white text-[10px] font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                            {currentCardData?.card.viewCount}
                                        </span>
                                        {/* Eye Icon for Views */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                  </Hint>
                                )}
                                <Button
                                onClick={ () => mediaModal.onOpen(currentCardData.id, currentCardData?.card?.list?.boardId, currentUser, true)}
                                className="h-auto w-10 justify-end text-muted-foreground text-[11px] hover:text-sm" // No need for relative here unless you have other absolute elements
                                size="sm"
                                variant="ghost"
                                >
                                {/* Button text wrapped in hint */}
                                <Hint
                                    sideOffset={20} // Adjust as needed
                                    description={currentCardData?.cardImages?.length>0?`Show Media(Videos, Picture etc) ${currentCardData?.cardImages?.length}`:`No media found. Click to create new media: videos and still pictures`}
                                    
                                >
                                    {/* Display text */}
                                    <div className="flex flex-row gap-1">
                                    {currentCardData?.cardImages?.length>0 && <span>{`${currentCardData?.cardImages?.length} `}</span>}
                                        <AiFillPicture
                                        size={10}
                                        className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                        />
                                    </div>
                                </Hint>
                                </Button>


                                <Link  
                                key={currentCardData?.card?.list?.boardId} 
                                href={`/board/${currentCardData?.card?.list?.boardId}`} 
                                className= {cn('cursor-pointer ',   
                                'group hover:underline' // Use group:hover for underline on hover
                                )} 
                                > 
                                <Hint
                                sideOffset={20}
                                description={`Update Data`}
                                >
                                <div className="flex flex-row gap-1">

                                <AiFillDashboard
                                size={10}
                                className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                />
                                </div>
                                </Hint>                                                                 
                                </Link>                                     
                        </div>

                        <Editor
                            editorState={EditorState.createWithContent(getTextFromEditor3_2(currentCardData?.card), compositeDecorator)}
                            readOnly
                            onChange={() => { }}
                        />
                    </div>
                )
            )}
        </Container>
    );
};

export default MediaClient;