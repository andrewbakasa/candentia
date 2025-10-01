'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CardWithList2 } from "@/types"; // Assuming CardWithList2 is a type defined in your project
import { fetcher } from "@/lib/fetcher";
import { CardImage } from "@prisma/client"; // Prisma model for CardImage
import { useMediaModal } from "@/hooks/use-media-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Header } from "./header";
import { Separator } from "@radix-ui/react-separator";
import EditCardMedia from "./editPage";
import { useAction } from "@/hooks/use-action";
import toast from "react-hot-toast";
import { createCardImage } from "@/actions/create-cardImage";
import { Skeleton } from '@/components/ui/skeleton';
import Slider from './slider';
import CardImageReorderList from '@/app/card-item/[id]/_components/cardImage-reorder-list';
import { updateCardMediaDescription } from '@/app/actions/update-cardMedia-descriptions';
import { updateCardMediaFileName } from '@/app/actions/update-cardMedia-filename';

export const MediaModal = () => {
    // Hooks to get modal state and data
    const id = useMediaModal((state) => state.id || null);
    const boardId = useMediaModal((state) => state.boardId || "");
    const isOpen = useMediaModal((state) => state.isOpen);
    const currentUser = useMediaModal((state) => state.currentUser);
    const onClose = useMediaModal((state) => state.onClose);

    // Local states for managing slider and media editing
    const [currentCardId, setCurrentCardId] = useState<string | null>(null);
    const [filteredMediaCount, setFilteredMediaCount] = useState(0);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [localCardImagesForSlider, setLocalCardImagesForSlider] = useState<CardImage[]>([]);
    const [showEditCardMedia, setShowEditCardMedia] = useState(false);
    // State to track if it's the initial render for setting default showEditCardMedia
    const [isInitialRenderForMediaPanel, setIsInitialRenderForMediaPanel] = useState(true);

    const queryClient = useQueryClient();

    // Define allowed roles for editing permissions
    const allowedRoles: string[] = ['admin', 'manager']; // Customize as per your application's roles

    // Determine if the current user has editing permissions
    const canEdit = currentUser?.isAdmin || currentUser?.roles?.some(role =>
        allowedRoles.includes(role.toLowerCase())
    ) || false; // Ensure roles array exists before calling .some()

    // useAction hook for updating card image description
    const { execute: updateCardImageDescriptionMutation } = useAction(updateCardMediaDescription, {
        onSuccess: (data) => {
            // Invalidate the specific card image query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] });
            toast.success("Description updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // useAction hook for updating card image filename
    const { execute: updateCardImageFilenameMutation } = useAction(updateCardMediaFileName, {
        onSuccess: (data) => {
            // Invalidate the specific card image query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] });
            toast.success("Filename updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Handler for description change
    const handleDescriptionChange = (mediaId: string, newDescription: string | null) => {
        if (!mediaId) {
            toast.error("Media ID is missing for description update.");
            return;
        }
        updateCardImageDescriptionMutation({ id: mediaId, description: newDescription });
    };

    // Handler for filename change
    const handleFileNameChange = (mediaId: string, newFileName: string | null) => {
        if (!mediaId) {
            toast.error("Media ID is missing for filename update.");
            return;
        }
        updateCardImageFilenameMutation({ id: mediaId, fileName: newFileName });
    };

    // Fetch card images data
    const { data: cardImages, status, error } = useQuery<CardImage[] | null>({
        queryKey: ["cardImage", id],
        queryFn: () => (id ? fetcher(`/api/cardImages/${id}`) : Promise.resolve(null)),
        enabled: !!id,
        // Ensure initial data is sorted by the 'order' field
        select: (data) => data ? [...data].sort((a, b) => a.order - b.order) : null,
    });

    // Fetch card data (e.g., for header)
    const { data: cardData } = useQuery<CardWithList2[] | null>({
        queryKey: ["card", id],
        queryFn: () => (id ? fetcher(`/api/cards/${id}`) : Promise.resolve(null)),
        enabled: !!id,
    });

    // Sync local images for slider with fetched cardImages whenever cardImages changes
    useEffect(() => {
        if (cardImages) {
            setLocalCardImagesForSlider(cardImages);
            setFilteredMediaCount(cardImages.length);
        } else {
            setLocalCardImagesForSlider([]);
            setFilteredMediaCount(0);
        }
    }, [cardImages]);

    // Control showEditCardMedia only on initial load if no images are present
    useEffect(() => {
        if (status === 'success' && isInitialRenderForMediaPanel) {
            if (!cardImages || cardImages.length === 0) {
                setShowEditCardMedia(true);
            }
            setIsInitialRenderForMediaPanel(false); // Mark initial render complete
        }
    }, [status, cardImages, isInitialRenderForMediaPanel]);

    // Handler for slider's card ID and index change
    const handleCardIdChange = (cardId: string | null, index: number) => {
        setCurrentCardId(cardId);
        setSliderIndex(index);
    };

    // Action hook for creating a new card image
    const { execute: createCardImageMutation } = useAction(createCardImage, {
        onSuccess: (data) => {
            // Invalidate the query for the specific card's images to ensure re-fetch and re-sort
            queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] });
            toast.success(`Media "${data.url}" created`); // Assuming 'url' is available
            setShowEditCardMedia(false); // Hide edit panel after successful upload
        },
        onError: (error) => {
            toast.error(error); // Display error toast
        },
    });

    // Toggle function for the media editing panel
    const toggleEditCardMedia = () => {
        setShowEditCardMedia(!showEditCardMedia);
    };

    // Function to manually refresh card images query
    const refreshCardImages = () => {
        queryClient.invalidateQueries({ queryKey: ["cardImage", id] });
    };

    // This useEffect ensures that if cardImages become empty after an operation (e.g., deletion),
    // the edit panel automatically opens.
    useEffect(() => {
        if (status === 'success') {
            if (!cardImages || cardImages.length === 0) {
                setShowEditCardMedia(true);
            } else {
                // If images are present, ensure edit panel is closed unless explicitly opened
                // Commenting out to preserve user's last toggle state: setShowEditCardMedia(false);
            }
        }
    }, [status, cardImages]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose} >
            <DialogContent
                className="
                    w-[95%] /* Occupy 95% of viewport width on all screens */
                    max-w-screen-lg /* Maximum width for larger screens (adjust lg to md/xl if needed) */
                    p-4 sm:p-6 /* Responsive padding: smaller on mobile, larger on sm+ */
                    rounded-xl shadow-2xl bg-white border border-gray-100
                    flex flex-col /* Enables flexbox for its direct children, allowing vertical stacking and height management */
                    h-auto max-h-[95vh] /* Auto height, but never exceed 95% of viewport height (crucial for mobile) */
                    overflow-y-auto /* Allows vertical scrolling within the modal if content overflows */
                    [&>button:last-child]:hidden /* Hides the default close button (if `hideDefaultClose` prop isn't used) */
                "
            >
                {/* Header section */}
                {!cardData ? <Header.Skeleton /> : <Header
                    data={cardData[0]}
                    boardId={boardId}
                    showEditCardMedia={showEditCardMedia}
                    toggleEditCardMedia={toggleEditCardMedia}
                    onClose={onClose} // Pass onClose to Header
                    currentUser={currentUser}
                />}
                {/* Main content div with responsive padding */}
                <div className="mt-6 px-2 sm:px-6">
                    {/* Media Slider Section */}
                    <div className="relative w-full flex flex-col items-center p-2 sm:p-6 bg-gray-50 rounded-lg shadow-inner min-h-[250px] justify-center border border-gray-200">
                        {status === 'pending' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg z-10">
                                <Skeleton className="h-full w-full rounded-lg" />
                            </div>
                        )}
                        {status === 'error' && (
                            <p className="text-red-500 text-center text-lg">Error loading media. Please try again.</p>
                        )}
                        {status === 'success' && localCardImagesForSlider && localCardImagesForSlider.length > 0 ? (
                            <>
                                <Slider
                                    mediaList={localCardImagesForSlider}
                                    fullView={!showEditCardMedia}
                                    onCardIdChange={handleCardIdChange}
                                    onDescriptionChange={handleDescriptionChange} // Pass the new handler
                                    onFileNameChange={handleFileNameChange} // Pass the new handler
                                    canEdit={canEdit} // Pass canEdit prop
                                    sliderIndex={sliderIndex} // Pass sliderIndex
                                    filteredMediaCount={filteredMediaCount} // Pass the actual count
                                />
                                {/* REMOVED THE REDUNDANT MEDIA COUNT DISPLAY HERE as it's now handled inside Slider */}
                            </>
                        ) : (
                            status === 'success' && (
                                <p className="text-gray-500 text-center text-lg font-medium">No media associated with this item.</p>
                            )
                        )}
                    </div>

                    {/* Separator for visual division */}
                    {showEditCardMedia && (
                        <Separator className="my-8 bg-gray-300 h-px" />
                    )}

                    {/* Media Editing Section */}
                    {showEditCardMedia && (
                        <div className="space-y-6">
                            <EditCardMedia
                                newImageList={[]} // Assuming this is managed internally or from another source
                                dbImages={cardImages || []}
                                cardId={cardData?.[0]?.id || ""}
                                createCardImageMutation={createCardImageMutation}
                                refreshCardImages={refreshCardImages}
                                boardId={boardId}
                                currentUser={currentUser}
                            />
                            {cardData?.[0]?.id && (
                                <CardImageReorderList
                                    initialCardImages={cardImages || []}
                                    cardId={cardData?.[0]?.id || ""}
                                    onReorderSuccess={refreshCardImages}
                                />
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};