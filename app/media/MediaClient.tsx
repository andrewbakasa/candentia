'use client';
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SafeUser } from "../types";
import Container from "../components/Container";
import Slider from "@/components/modals/media-modal/slider";
import { Separator } from "@radix-ui/react-separator";
import { cn, isWithinOneDay, truncateString } from "@/lib/utils";
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
import { getTextFromEditor3_2 } from "@/components/modals/card-modal/description";
import moment from "moment";
import useFavorite from "../hooks/useFavorite";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import Head from "next/head";
import { Skeleton } from "@/components/ui/skeleton";
import CardTags from "../mycontents/_components/card-tags";
import CreatedAtUpdatedAt from "../mycontents/_components/updatedCreated";
import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Search from "../components/Search";
import { BsViewStacked } from "react-icons/bs";
import { Hint } from "@/components/hint";

import FilterSection, { LabelValueType } from "../components/FilterSection";
import useIsMobile from "../hooks/isMobile";

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
    const [currentCardData, setCurrentCardData] = useState<any | null>(null);
    const [cardMedia, setCardMedia] = useState<any[]>([]);
    const [filteredMediaCount, setFilteredMediaCount] = useState(0);
    const [hasAnyMedia, setHasAnyMedia] = useState(false);

    const [searchTerm, setSearchTerm] = useState(searchFromUrl || ""); // Initialize searchTerm from URL
    const [compositeDecorator, setCompositeDecorator] = useState(new CompositeDecorator([]));
    const [currentCardId, setCurrentCardId] = useState<string | null>(null);
    const [sliderIndex, setSliderIndex] = useState(0); // Track slider index

    const { hasFavorited } = useFavorite({
        listingId: currentCardData?.card?.id || "",
        currentUser
    });

    // Effect for highlighting search terms
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
                        const style = currentSelection.getStartOffset() <= startIndex &&
                            currentSelection.getEndOffset() >= endIndex ? 'HIGHLIGHTED_SELECTED' : 'HIGHLIGHTED';
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

    // Effect for setting document title
    useEffect(() => {
        let title = "View Media";
        let description = "View and manage media";

        if (searchFromUrl) {
            title = `Search Results for "${searchFromUrl}"`;
            description = `Search results for "${searchFromUrl}"`;
        }

        document.title = title;
    }, [currentCardData, searchFromUrl]);

    // Handle URL updates when searchTerm changes
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
    }, [searchTerm, router, searchParams]); // Depend on searchTerm and router

    const { data: searchCardWithImageList, status: searchStatus, error: searchError, isFetching: isSearchFetching } = useQuery({
        queryKey: ["cardImageSearch", searchFromUrl, category],
        queryFn: async () => {
            const encodedSearchTerm = searchFromUrl ? encodeURIComponent(searchFromUrl) : encodeURIComponent(NO_FILTER_SEARCH_CODE);
            const encodedCategory = category ? encodeURIComponent(category) : '';

            let url = `/api/cardImagesSearch/${encodedSearchTerm}`;
            if (encodedCategory) {
                url += `?category=${encodedCategory}`;
            }

            const data = await fetcher(url);
            return data || null;
        },
        enabled: true,
    });

    const handleCardIdChange = (cardId: string | null, index: number) => {
        setCurrentCardId(cardId);
        setSliderIndex(index);
    };

    useEffect(() => {
        if (searchStatus === "success" && searchCardWithImageList?.data) {
            if (!currentCardId && searchFromUrl) {
                setCurrentCardId(searchCardWithImageList.data[0]?.cardId || null);
                setCurrentCardData(searchCardWithImageList.data[0] || null);
            } else if (currentCardId && searchCardWithImageList.data) {
                const foundMedia = searchCardWithImageList.data.find((item: { cardId: string; }) => item.cardId === currentCardId);
                setCurrentCardData(foundMedia || null);
            }
            setFilteredMediaCount(searchCardWithImageList.data.length || 0);
            setCardMedia(searchCardWithImageList.data || []);
            setHasAnyMedia(searchCardWithImageList?.hasMedia || false);
        } else if (searchStatus === "error") {
            setCurrentCardData(null);
            setCardMedia([]);
            setFilteredMediaCount(0);
            setHasAnyMedia(false);
            setCurrentCardId(null);
        }
    }, [searchStatus, searchFromUrl, searchCardWithImageList?.data, currentCardId, sliderIndex]);


    const isLoading = isSearchFetching;

    const showNoResultsMessage = !isLoading && filteredMediaCount === 0 && (searchTerm || category);

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
                                // Ensure it's explicitly an empty string if null/undefined
                                setCategory(selectedCategory ? selectedCategory : '');
                            }}
                            productCategories_options={tagNames}
                            // Pass null if category is an empty string, otherwise pass the category.
                            // This signals the FilterSection to display its placeholder.
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
                            {hasAnyMedia ? ( // Only render Slider if there's media
                                <Slider
                                    mediaList={cardMedia || []}
                                    fullView={true}
                                    onCardIdChange={handleCardIdChange}
                                    onDescriptionChange={function (mediaId: string, newDescription: string | null): void {
                                        throw new Error("Function not implemented.");
                                    }}
                                    onFileNameChange={function (mediaId: string, newFileName: string | null): void {
                                        throw new Error("Function not implemented.");
                                    }}
                                    canEdit={false}
                                    sliderIndex={sliderIndex}
                                    filteredMediaCount={filteredMediaCount}
                                    searchTerm={searchTerm}
                                />
                            ) : (
                                showNoResultsMessage && ( // Show no results message if no media AND a search/category is active
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
                                            {(!searchTerm && !category) && ( // If somehow this state is reached without search/category
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
                            {filteredMediaCount > 0 && ( // Only show media count if there's actual media
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
// 'use client';
// import { useState, useEffect, useCallback } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { SafeUser } from "../types";
// import Container from "../components/Container";
// import Slider from "@/components/modals/media-modal/slider";
// import { Separator } from "@radix-ui/react-separator";
// import { cn, isWithinOneDay, truncateString } from "@/lib/utils";
// import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
// import { getTextFromEditor3_2 } from "@/components/modals/card-modal/description";
// import moment from "moment";
// import useFavorite from "../hooks/useFavorite";
// import { useQuery } from "@tanstack/react-query";
// import { fetcher } from "@/lib/fetcher";
// import Head from "next/head";
// import { Skeleton } from "@/components/ui/skeleton";
// import CardTags from "../mycontents/_components/card-tags";
// import CreatedAtUpdatedAt from "../mycontents/_components/updatedCreated";
// import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";
// import { Button } from "@/components/ui/button";
// import Search from "../components/Search";
// import { BsViewStacked } from "react-icons/bs";
// import { Hint } from "@/components/hint";

// import FilterSection, { LabelValueType } from "../components/FilterSection";
// import useIsMobile from "../hooks/isMobile";

// interface MediaClientProps {
//     currentUser?: SafeUser | null,
//     origin: string,
//     tagNames: any;
//     userNames: any;
// }

// const MediaClient: React.FC<MediaClientProps> = ({ currentUser, tagNames, userNames, origin }) => {
//     const [category, setCategory] = useState<string>('');
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const searchFromUrl = searchParams?.get("search");

//     const isMobile = useIsMobile();
//     const [currentCardData, setCurrentCardData] = useState<any | null>(null);
//     const [cardMedia, setCardMedia] = useState<any[]>([]);
//     const [filteredMediaCount, setFilteredMediaCount] = useState(0);
//     const [hasAnyMedia, setHasAnyMedia] = useState(false);

//     const [searchTerm, setSearchTerm] = useState(searchFromUrl || ""); // Initialize searchTerm from URL
//     const [compositeDecorator, setCompositeDecorator] = useState(new CompositeDecorator([]));
//     const [currentCardId, setCurrentCardId] = useState<string | null>(null);
//     const [sliderIndex, setSliderIndex] = useState(0); // Track slider index

//     const { hasFavorited } = useFavorite({
//         listingId: currentCardData?.card?.id || "",
//         currentUser
//     });

//     // Effect for highlighting search terms
//     useEffect(() => {
//         let arrFirst = searchTerm.split(';');
//         const subLists = arrFirst.filter(element => element);
//         const highlightText = subLists.flatMap(subList => subList.split(','));

//         const customHighlightDecorator: DraftDecorator = {
//             strategy: (block, callback, contentState) => {
//                 const text = block.getText();
//                 const currentSelection = contentState.getSelectionBefore();
//                 for (let i = 0; i < highlightText.length; i++) {
//                     const word = highlightText[i];
//                     const startIndex = text.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
//                     if (startIndex !== -1) {
//                         const endIndex = startIndex + word.length;
//                         const style = currentSelection.getStartOffset() <= startIndex &&
//                             currentSelection.getEndOffset() >= endIndex ? 'HIGHLIGHTED_SELECTED' : 'HIGHLIGHTED';
//                         callback(startIndex, endIndex);
//                     }
//                 }
//             },
//             component: ({ children, style }) => {
//                 return <span style={style} className="bg-yellow-400 ">{children}</span>;
//             },
//         };
//         setCompositeDecorator(new CompositeDecorator([customHighlightDecorator]));
//     }, [searchTerm]);

//     // Effect for setting document title
//     useEffect(() => {
//         let title = "View Media";
//         let description = "View and manage media";

//         if (searchFromUrl) {
//             title = `Search Results for "${searchFromUrl}"`;
//             description = `Search results for "${searchFromUrl}"`;
//         }

//         document.title = title;
//     }, [currentCardData, searchFromUrl]);

//     // Handle URL updates when searchTerm changes
//     useEffect(() => {
//         const currentPath = window.location.pathname;
//         const currentQuery = new URLSearchParams(searchParams?.toString());

//         if (searchTerm === "") {
//             currentQuery.delete("search");
//         } else {
//             currentQuery.set("search", searchTerm);
//         }

//         const newUrl = `${currentPath}?${currentQuery.toString()}`;
//         router.push(newUrl);
//     }, [searchTerm, router, searchParams]); // Depend on searchTerm and router

//     const { data: searchCardWithImageList, status: searchStatus, error: searchError, isFetching: isSearchFetching } = useQuery({
//         queryKey: ["cardImageSearch", searchFromUrl, category],
//         queryFn: async () => {
//             const encodedSearchTerm = searchFromUrl ? encodeURIComponent(searchFromUrl) : encodeURIComponent(NO_FILTER_SEARCH_CODE);
//             const encodedCategory = category ? encodeURIComponent(category) : '';

//             let url = `/api/cardImagesSearch/${encodedSearchTerm}`;
//             if (encodedCategory) {
//                 url += `?category=${encodedCategory}`;
//             }

//             const data = await fetcher(url);
//             return data || null;
//         },
//         enabled: true,
//     });

//     const handleCardIdChange = (cardId: string | null, index: number) => {
//         setCurrentCardId(cardId);
//         setSliderIndex(index);
//     };

//     useEffect(() => {
//         if (searchStatus === "success" && searchCardWithImageList?.data) {
//             if (!currentCardId && searchFromUrl) {
//                 setCurrentCardId(searchCardWithImageList.data[0]?.cardId || null);
//                 setCurrentCardData(searchCardWithImageList.data[0] || null);
//             } else if (currentCardId && searchCardWithImageList.data) {
//                 const foundMedia = searchCardWithImageList.data.find((item: { cardId: string; }) => item.cardId === currentCardId);
//                 setCurrentCardData(foundMedia || null);
//             }
//             setFilteredMediaCount(searchCardWithImageList.data.length || 0);
//             setCardMedia(searchCardWithImageList.data || []);
//             setHasAnyMedia(searchCardWithImageList?.hasMedia || false);
//         } else if (searchStatus === "error") {
//             setCurrentCardData(null);
//             setCardMedia([]);
//             setFilteredMediaCount(0);
//             setHasAnyMedia(false);
//             setCurrentCardId(null);
//         }
//     }, [searchStatus, searchFromUrl, searchCardWithImageList?.data, currentCardId, sliderIndex]);


//     const isLoading = isSearchFetching;

//     const showNoResultsMessage = !isLoading && filteredMediaCount === 0 && (searchTerm || category);

//     return (
//         <Container>
//             <Head>
//                 <title>{document.title}</title>
//                 <meta name="description" content={currentCardData?.card?.description || "A description of the Media"} />
//                 <meta property="og:title" content={document.title} />
//                 <meta property="og:description" content={currentCardData?.card?.description || "A description of the Media"} />
//                 <link rel="icon" href="/logo.svg" />
//             </Head>
//             <div className="z-51 mt-[-50px] sm:mt-[-80px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
//                 <div className={cn("flex gap-1 z-51", true ? 'flex-col' : 'flex-row justify-between')}>
//                     <div
//                         className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg", true ? 'py-1' : '')}
//                     >
//                     </div>
//                 </div>

//                 <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
//                     <div className="flex flex-row">
//                         <Search
//                             setSearchTerm={setSearchTerm}
//                             searchTerm={searchTerm}
//                             debounce={1500}
//                             placeholderText="filter records..."
//                         />
//                     </div>
//                     <div className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg mr-auto", isMobile ? 'py-2' : '')}>
//                         <FilterSection
//                             setCategory={(selectedCategory) => {
//                                 setCategory(selectedCategory ? selectedCategory : '');
//                             }}
//                             productCategories_options={tagNames}
//                             category={category.length > 0 ? category : null}
//                             isFullwidth={isMobile ? true : false}
//                             placeholder="Filter by tags"
//                             isDisabled={false}
//                         />
//                     </div>
//                 </div>
//             </div>

//             <div className={cn("mt-0 pb-1 ", 0 == 0 ? "" : "shadow-xl rounded-md p-1 border-yellow-400 border-2")}>
//                 <div>
//                     {isLoading ? (
//                         <>
//                             <Skeleton className="h-[250px] w-full mb-2" />
//                             <Skeleton className="h-4 w-1/4 mb-2" />
//                             <Skeleton className="h-4 w-1/2 mb-2" />
//                             <Skeleton className="h-4 w-3/4 mb-2" />
//                             <Skeleton className="h-4 w-full mb-2" />
//                         </>
//                     ) : (
//                         <>
//                             {hasAnyMedia ? ( // Only render Slider if there's media
//                                 <Slider
//                                     mediaList={cardMedia || []}
//                                     fullView={true}
//                                     onCardIdChange={handleCardIdChange}
//                                     onDescriptionChange={function (mediaId: string, newDescription: string | null): void {
//                                         throw new Error("Function not implemented.");
//                                     }}
//                                     onFileNameChange={function (mediaId: string, newFileName: string | null): void {
//                                         throw new Error("Function not implemented.");
//                                     }}
//                                     canEdit={false}
//                                     sliderIndex={sliderIndex}
//                                     filteredMediaCount={filteredMediaCount}
//                                     searchTerm={searchTerm}
//                                 />
//                             ) : (
//                                 showNoResultsMessage && ( // Show no results message if no media AND a search/category is active
//                                     <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg shadow-inner text-gray-600 text-center min-h-[300px]">
//                                         <p className="text-2xl font-semibold mb-4">No media found for your search.</p>
//                                         <p className="text-lg mb-6">Try one of these options to find what you&pos;re looking for:</p>
//                                         <div className="flex flex-col sm:flex-row gap-4">
//                                             {searchTerm && (
//                                                 <Button
//                                                     onClick={() => setSearchTerm("")}
//                                                     className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
//                                                 >
//                                                     Clear Search Term
//                                                 </Button>
//                                             )}
//                                             {category && (
//                                                 <Button
//                                                     onClick={() => setCategory("")}
//                                                     className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
//                                                 >
//                                                     Clear Category Filter
//                                                 </Button>
//                                             )}
//                                             {(!searchTerm && !category) && ( // If somehow this state is reached without search/category
//                                                 <p className="text-md">There&apos;s no media to display. Please add some.</p>
//                                             )}
//                                         </div>
//                                         <p className="mt-6 text-sm text-gray-500">
//                                             You can also try a different search term or select a different category.
//                                         </p>
//                                     </div>
//                                 )
//                             )}
//                             <Separator />
//                             {filteredMediaCount > 0 && ( // Only show media count if there's actual media
//                                 <p className="text-sm text-blue-300 mr-auto">media {sliderIndex + 1} of [{filteredMediaCount}] </p>
//                             )}
//                             {currentCardData && (
//                                 <div className="shadow-sm">
//                                     <h2 className="text-red-300">{currentCardData?.boardTitle}</h2>
//                                 </div>
//                             )}
//                         </>
//                     )}
//                 </div>
//             </div>

//             {isLoading ? (
//                 <Skeleton className="h-12 w-full mt-3" />
//             ) : (
//                 currentCardData && (
//                     <div className={cn(
//                         "p-2 rounded-sm transition-colors duration-300",
//                         currentCardData.card?.visible
//                             ? isWithinOneDay(currentCardData?.card?.updatedAt || "", moment())
//                                 ? "bg-yellow-50 hover:bg-yellow-200"
//                                 : "bg-white hover:bg-gray-200"
//                             : "bg-rose-200 hover:bg-rose-300",
//                         hasFavorited ? "text-red-400 hover:text-red-600" : ""
//                     )}>
//                         <Hint
//                             sideOffset={20}
//                             description="Go to view page"
//                         >
//                             <h5
//                                 className='text-sm font-bold text-green-500 hover:cursor-pointer '
//                                 onClick={() => router.push(`/m/${currentCardData?.card?.id}`)}
//                             >
//                                 {currentCardData?.title}
//                             </h5>
//                         </Hint>
//                         <CreatedAtUpdatedAt
//                             createdAt={currentCardData?.card?.createdAt}
//                             updatedAt={currentCardData?.card?.updatedAt} />

//                         <CardTags
//                             index2={String('1')}
//                             card={currentCardData?.card}
//                             setCategory={setCategory}
//                             category={category}
//                             tagNames={tagNames}
//                         />

//                         <Editor
//                             editorState={EditorState.createWithContent(getTextFromEditor3_2(currentCardData?.card), compositeDecorator)}
//                             readOnly
//                             onChange={() => { }}
//                         />
//                     </div>
//                 )
//             )}
//         </Container>
//     );
// };

// export default MediaClient;