'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import EmptyState from '@/app/components/EmptyState';
import { SafeUser } from '@/app/types';
import { Header } from './_components/header';
import Slider from './_components/slider';
import EditCardMedia from './_components/editPage';
import { Separator } from '@radix-ui/react-separator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';
import { createCardImage } from '@/actions/create-cardImage';
import ClientOnly from '@/app/components/ClientOnly';
import { Hint } from '@/components/hint';
import moment from 'moment'; // Assuming this is used for date formatting
import CreatedAtUpdatedAt from "@/app/mycontent/_components/updatedCreated";
import CardTags from "@/app/mycontent/_components/card-tags";

import { CompositeDecorator, Editor, EditorState, ContentState } from "draft-js";
import { cn, isWithinOneDay } from "@/lib/utils";
import { useMediaModal } from '@/hooks/use-media-modal';
import { useCommentModal } from '@/hooks/use-comment-modal';
import { Button } from '@/components/ui/button';
import { CommentShow } from '@/app/learn/_components/display-comment';
import { CommentList } from '@/app/learn/_components/display-all-comments';
import { getTextFromEditor3_2 } from '@/components/modals/card-modal/description';
import { AiFillPicture, AiOutlineLink } from 'react-icons/ai'; // Added AiOutlineLink for copy icon

import { CardImage } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import CardImageReorderList from './_components/cardImage-reorder-list';

// Define the necessary related types for CardWithDetails (as provided in the latest immersive artifact)
interface Board {
    id: string;
    title: string;
    orgId: string | null;
    imageId: string;
    imageThumbUrl: string;
    imageFullUrl: string;
    imageUserName: string;
    imageLinkHTML: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    public: boolean;
    userId: string | null;
    percent: number;
    progressStatus: string;
    dragMode: boolean;
}

interface List {
    id: string;
    title: string;
    boardId: string;
    board: Board;
    userId: string | null;
}

interface Tag {
    id: string;
    name: string;
}

interface User {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
    isAdmin?: boolean; // Added isAdmin for check
}

interface Comment {
    id: string;
    text: string;
    userId: string;
    user: User;
    createdAt: Date;
}

interface CardToUser {
    id: string;
    cardId: string;
    userId: string;
    user: User;
}

// Full CardWithDetails type based on previous context and provided types
interface CardWithDetails {
    id: string;
    title: string;
    description: string | null;
    order: number;
    listId: string;
    createdAt: Date;
    updatedAt: Date;
    archived: boolean;
    visible: boolean;
    dueDate: Date | null;
    startDate: Date | null;
    completedAt: Date | null;
    attachments: any[]; // Placeholder
    list: List;
    comments: Comment[];
    taggedUsers: CardToUser[];
    tagIDs: string[]; // List of tag IDs
    user: User; // The user who created the card
    userId: string; // ID of the user who created the card
}

interface ItemComponentInterfaceProps {
    records: any|null; // Use the specific type for 'card'
    currentUser: SafeUser | null;
    userNames: any;
    tagNames: any;
}

const ItemComponentInterface: React.FC<ItemComponentInterfaceProps> = ({ records: card, tagNames, currentUser, userNames }) => {
    const [filteredMediaCount, setFilteredMediaCount] = useState(0);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [currentId, setCurrentId] = useState<string | null>(null); // This seems unused, consider removing
    const [showEditCardMedia, setShowEditCardMedia] = useState(false);

    const [copySuccess, setCopySuccess] = useState(false);
    const [currentURL, setCurrentURL] = useState('');
    const [compositeDecorator] = useState(new CompositeDecorator([]));

    const editorState = card?.description
        ? EditorState.createWithContent(getTextFromEditor3_2(card), compositeDecorator)
        : EditorState.createEmpty(compositeDecorator);

    const ihavecomment = useMemo(() => card?.comments?.find((x: { userId: string; }) => x.userId === currentUser?.id), [card?.comments, currentUser]);
    const mycommentid = ihavecomment?.id || '';

    const iamtagged = useMemo(() => card?.taggedUsers?.find((x: { userId: string; }) => x.userId === currentUser?.id), [card?.taggedUsers, currentUser]);

    const editable = useMemo(() => {
        const listOwnerId = card?.list?.userId;
        const cardCreatorId = card?.userId;
        return (
            listOwnerId === currentUser?.id ||
            cardCreatorId === currentUser?.id ||
            currentUser?.isAdmin
        );
    }, [card?.list?.userId, card?.userId, currentUser?.id, currentUser?.isAdmin]);

    const mediaModal = useMediaModal();
    const commentModal = useCommentModal();

    const id = card?.id || null;

    const queryClient = useQueryClient();

    const { data: cardImageList, status, error, refetch } = useQuery<CardImage[] | null>({
        queryKey: ["cardImage", id],
        queryFn: () => (id ? fetcher(`/api/cardImages/${id}`) : Promise.resolve(null)),
        enabled: !!id,
        select: (data) => data ? [...data].sort((a, b) => a.order - b.order) : null,
    });

    const [localCardImagesForSlider, setLocalCardImagesForSlider] = useState<CardImage[]>([]);
    const [isInitialRenderForMediaPanel, setIsInitialRenderForMediaPanel] = useState(true);

    useEffect(() => {
        if (cardImageList) {
            setLocalCardImagesForSlider(cardImageList);
            setFilteredMediaCount(cardImageList.length);
        } else {
            setLocalCardImagesForSlider([]);
            setFilteredMediaCount(0);
        }
    }, [cardImageList]);

    useEffect(() => {
        // Construct the URL to this specific card item dynamically
        if (typeof window !== 'undefined' && card?.id) {
            setCurrentURL(`${window.location.origin}/card-item/${card.id}`);
        }
    }, [card?.id]); // Re-run when card.id changes

    useEffect(() => {
        if (status === 'success' && isInitialRenderForMediaPanel) {
            if (!cardImageList || cardImageList.length === 0) {
                setShowEditCardMedia(true);
            }
            setIsInitialRenderForMediaPanel(false);
        }
    }, [status, cardImageList, isInitialRenderForMediaPanel]);

    const toggleEditCardMedia = () => {
        setShowEditCardMedia(!showEditCardMedia);
    };

    const refreshCardImages = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleIdChange = (Id: string | null, index: number) => {
        setCurrentId(Id); // This state still seems unused directly in the UI
        setSliderIndex(index);
    };

    const { execute: createCardImageMutation } = useAction(createCardImage, {
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] });
            toast.success(`Media "${data.fileName || data.url}" created`);
            setShowEditCardMedia(false); // Optionally close after successful upload
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // if (!currentUser) {
    //     return (
    //         <ClientOnly>
    //             <EmptyState
    //                 title="Unauthorized"
    //                 subtitle="Please login to view card details."
    //             />
    //         </ClientOnly>
    //     );
    // }

    if (!card) {
        return (
            <ClientOnly>
                <EmptyState
                    title="Card Not Found"
                    subtitle="The requested card could not be found or there was an error fetching it."
                />
            </ClientOnly>
        );
    }

    const boardId = card.list?.board?.id || "";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-inter antialiased py-6 sm:py-10">
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-850 rounded-xl shadow-lg border border-gray-100 dark:border-gray-750 overflow-hidden">

                {/* --- Media & Images Section --- */}
                <section className="p-4 sm:p-7 bg-purple-50 dark:bg-purple-900/40 rounded-b-none sm:rounded-b-none shadow-inner border-b border-purple-100 dark:border-purple-800">
                    <div className="space-y-8">
                        {/* Header for media section */}
                        {!card ? <Header.Skeleton /> : <Header
                            data={card}
                            boardId={boardId}
                            showEditCardMedia={showEditCardMedia}
                            toggleEditCardMedia={toggleEditCardMedia}
                            currentUser={currentUser}
                        />}

                        {/* Slider Container and Loading/Empty States */}
                        <div className="relative w-full flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-md min-h-[300px] justify-center transition-all duration-300 overflow-hidden">
                            {/* Loading Skeleton */}
                            {status === 'pending' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-xl z-10">
                                    <Skeleton className="h-full w-full rounded-xl" />
                                </div>
                            )}

                            {/* Error State */}
                            {status === 'error' && (
                                <p className="text-red-500 dark:text-red-400 text-center text-lg">Error loading media. Please try again.</p>
                            )}

                            {/* Success State with Media */}
                            {status === 'success' && localCardImagesForSlider && localCardImagesForSlider.length > 0 ? (
                                <>
                                    <Slider
                                        mediaList={localCardImagesForSlider}
                                        fullView={!showEditCardMedia}
                                        onCardIdChange={handleIdChange} onDescriptionChange={function (mediaId: string, newDescription: string | null): void {
                                            throw new Error('Function not implemented.');
                                        } } onFileNameChange={function (mediaId: string, newFileName: string | null): void {
                                            throw new Error('Function not implemented.');
                                        } } canEdit={false}                                    />
                                    <p className="mt-6 text-base text-gray-600 dark:text-gray-400 font-semibold">
                                        Media {sliderIndex + 1} of {filteredMediaCount}
                                    </p>
                                </>
                            ) : (
                                // Success State with No Media
                                status === 'success' && (
                                    <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
                                        <AiFillPicture className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-xl font-medium mb-2">No media associated with this card.</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm">Click the <span className='font-bold'>Edit Media button</span> above to add new images or files.</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Media Editing and Reordering Sections */}
                        {showEditCardMedia && currentUser &&(
                            <>
                                <Separator className="my-8 bg-gray-300 dark:bg-gray-600 h-px" />
                                <EditCardMedia
                                    newImageList={[]} // This might need to be stateful if images are pre-added here
                                    dbImages={cardImageList || []}
                                    cardId={card?.id || ""}
                                    createCardImageMutation={createCardImageMutation}
                                    refreshCardImages={refreshCardImages}
                                    boardId={boardId}
                                    currentUser={currentUser}
                                />
                                {card?.id && (
                                    <CardImageReorderList
                                        initialCardImages={cardImageList || []}
                                        cardId={card.id}
                                        onReorderSuccess={refreshCardImages}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* --- Card Details Section --- */}
                <section className="p-4 sm:p-7 mt-0 bg-gray-50 dark:bg-gray-800 rounded-none sm:rounded-none border-b border-green-100 dark:border-green-800">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-5 text-green-700 dark:text-green-400 border-b-2 border-green-200 dark:border-green-700 pb-4">
                        Card Details
                    </h2>
                    <div className="space-y-4"> {/* Increased space-y for better visual separation */}
                        {/* Card Title (clickable for copy link) */}
                        <div className={cn(
                            "p-3 sm:p-4 rounded-lg bg-white dark:bg-gray-750 shadow-sm transition-colors duration-300", // Added background and shadow for visual separation
                        )}>
                            <Hint
                                sideOffset={10}
                                description={copySuccess ? "Copied!" : "Click to copy link and share"}
                            >
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(currentURL);
                                            setCopySuccess(true);
                                            setTimeout(() => setCopySuccess(false), 2000);
                                        } catch (error) {
                                            console.error("Failed to copy:", error);
                                        }
                                    }}
                                    className="w-full text-left flex items-center justify-between group"
                                >
                                    <h3 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors duration-200">
                                        {card?.title}
                                    </h3>
                                    <AiOutlineLink className="w-6 h-6 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-200" />
                                </button>
                            </Hint>
                            {copySuccess && <p className="text-green-600 dark:text-green-400 text-sm mt-2 animate-pulse">Link copied!</p>}
                        </div>

                        {/* Created/Updated Dates */}
                        <CreatedAtUpdatedAt
                            createdAt={card?.createdAt}
                            updatedAt={card?.updatedAt}
                        />

                        {/* Card Tags */}
                        <CardTags
                            index2={String('4')}
                            card={card}
                            setCategory={() => { }}
                            category={''}
                            tagNames={tagNames}
                        />

                        {/* Card Description (Draft.js Editor) */}
                        <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 min-h-[100px] flex flex-col">
                            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Description:</h3>
                            <div className="text-gray-800 dark:text-gray-200 text-sm prose max-w-none prose-blue dark:prose-invert flex-grow overflow-y-auto max-h-[40vh]">
                                <Editor
                                    editorState={editorState}
                                    readOnly
                                    onChange={() => { }}
                                />
                            </div>
                        </div>

                        {/* Author and Date details at the bottom of this section */}
                        <div className="pt-4 mt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Author: <span className="font-semibold text-gray-800 dark:text-gray-200">{card.user.email || 'Unknown'}</span>
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Created: <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(card.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </span>
                        </div>
                    </div>
                </section>

                {/* --- Comments Section --- */}
                <section className="mt-8 p-4 sm:p-7 bg-blue-50 dark:bg-blue-900/40 rounded-xl shadow-inner border border-blue-100 dark:border-blue-800 mx-auto max-w-[calc(100%-2rem)] sm:max-w-6xl mb-8"> {/* Added margin-bottom */}
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300 border-b-2 border-blue-200 dark:border-blue-700 pb-3">
                        Comments & Discussions
                    </h2>
                    <div className="flex flex-col gap-4">

                        {/* "Add Your Comment" button */}
                        {!ihavecomment && (
                            <Button
                                onClick={() => commentModal.onOpen(mycommentid, card.id, boardId)}
                                className="bg-green-600 text-white hover:bg-green-700 text-sm py-1.5 px-4 h-auto rounded-full transition-colors duration-200 shadow-md self-start"
                            >
                                Add Your Comment
                            </Button>
                        )}

                        {/* Your Comment Display */}
                        {ihavecomment && (
                            <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Comment:</h3>
                                <CommentShow data={ihavecomment} cardId={card.id} boardId={boardId} />
                            </div>
                        )}

                        {/* All Comments List */}
                        {card?.comments && card?.comments.length > 0 && (
                            <div className="w-full mt-2">
                                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">All Comments:</h3>
                                <CommentList data={card?.comments} userNames={userNames} />
                            </div>
                        )}
                        {card?.comments?.length === 0 && !ihavecomment && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No comments yet. Be the first to add one!</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ItemComponentInterface;