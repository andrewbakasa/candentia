'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { CardImage } from '@prisma/client';

interface CardImageReorderListProps {
    initialCardImages: CardImage[];
    cardId: string;
    onReorderSuccess: () => void; // Callback to refresh parent data
}

/**
 * Helper function to send reorder request to your backend API.
 * This function is responsible for communicating with your server to persist the new order.
 * @param cardId The ID of the card to which these images belong.
 * @param reorderedCardImages An array of objects containing the ID and new order for each card image.
 * @returns A promise that resolves with the API response, or rejects with an error.
 */
const updateCardImageOrderInDB = async (cardId: string, reorderedCardImages: { id: string; newOrder: number }[]) => {
    // This URL should point to your actual backend API route for reordering
    // Example: /api/cardImages/[cardId]/reorder-cardImages
    const response = await fetch(`/api/cardImages/${cardId}/reorder-cardImages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reorderedCardImages }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update card image order in database.');
    }
    return response.json();
};

/**
 * Calculates new sequential order values for a given list of card images.
 * This function assumes the input `reorderedItems` array is already in the desired order.
 * It assigns new order values with a step (e.g., 5) to allow for future insertions
 * between existing items without needing to reorder everything.
 *
 * @param reorderedItems The array of CardImage objects in their new, desired order.
 * @returns An array of objects with `id` and `newOrder` for database update.
 */
const calculateNewSequentialOrderValues = (
    reorderedItems: CardImage[]
): { id: string; newOrder: number }[] => {
    const reorderedDataForDB: { id: string; newOrder: number }[] = reorderedItems.map((cardImage, index) => {
        // Assign new order values, e.g., using a step of 5 to allow for future insertions
        const newOrderValue = 5 * index; // Using a step of 5
        return { id: cardImage.id, newOrder: newOrderValue };
    });
    return reorderedDataForDB;
};

// Define the auto-save delay in milliseconds
const AUTO_SAVE_DELAY = 15000; // 15 seconds
const CardImageReorderList: React.FC<CardImageReorderListProps> = ({ initialCardImages, cardId, onReorderSuccess }) => {
    // `localCardImages` holds the current order of card images in the UI.
    const [localCardImages, setLocalCardImages] = useState<CardImage[]>([]);
    // `isSaving` tracks whether the reorder operation is currently being saved to the backend.
    const [isSaving, setIsSaving] = useState(false);
    // `hasChanges` tracks if there are unsaved reorder changes.
    const [hasChanges, setHasChanges] = useState(false);
    // `countdown` stores the seconds remaining until auto-save.
    const [countdown, setCountdown] = useState<number | null>(null);

    // `saveTimeoutRef` holds the ID of the debounce timeout.
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // `countdownIntervalRef` holds the ID of the countdown interval.
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to clear all timers and reset related states
    const clearTimersAndResetStates = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(null);
    }, []);

    // Sync local state with initialCardImages prop
    // Also reset hasChanges and countdown when initial data changes from parent
    useEffect(() => {
        setLocalCardImages(initialCardImages);
        setHasChanges(false); // No changes when initial data is loaded/updated
        clearTimersAndResetStates(); // Clear any active timers
    }, [initialCardImages, clearTimersAndResetStates]);

    // Cleanup the debounce timeout and countdown interval on component unmount
    useEffect(() => {
        return () => {
            clearTimersAndResetStates();
        };
    }, [clearTimersAndResetStates]);

    /**
     * Function to initiate the save operation to the backend.
     * This will be called by the debounce timer or the manual save button/Enter key.
     */
    const saveChanges = useCallback(async () => {
        // Prevent multiple simultaneous save operations
        if (isSaving) {
            return;
        }

        setIsSaving(true);
        clearTimersAndResetStates(); // Clear timers before saving

        try {
            // Calculate the new sequential order values from the current local state
            const reorderedDataForDB = calculateNewSequentialOrderValues(localCardImages);
            console.log("Saving reorderedDataForDB:", reorderedDataForDB);

            // Send the updated order to the backend
            await updateCardImageOrderInDB(cardId, reorderedDataForDB);
            toast.success("Card image order saved successfully!");
            setHasChanges(false); // Mark changes as saved
            onReorderSuccess(); // Notify parent to refresh data
        } catch (error: any) {
            console.error("Error saving new card image order:", error);
            toast.error(error.message || "Failed to save new card image order.");
            // Optionally, revert UI to initial state if save fails.
            // For now, we'll leave the optimistic update in place,
            // but the error message will inform the user.
        } finally {
            setIsSaving(false); // Re-enable UI interactions
        }
    }, [localCardImages, cardId, onReorderSuccess, isSaving, clearTimersAndResetStates]);

    /**
     * Callback function executed when a drag-and-drop operation ends.
     * It updates the local state optimistically and sets up a debounced save.
     * @param result The result object from the drag-and-drop operation.
     */
    const onDragEnd = useCallback((result: DropResult) => {
        // If there's no valid destination or the item was dropped in the same place, do nothing.
        if (!result.destination || result.source.index === result.destination.index) {
            return;
        }

        // Perform optimistic UI update
        const newLocalCardImages = Array.from(localCardImages);
        const [movedCardImage] = newLocalCardImages.splice(result.source.index, 1);
        newLocalCardImages.splice(result.destination.index, 0, movedCardImage);
        setLocalCardImages(newLocalCardImages);

        // Indicate that there are unsaved changes
        setHasChanges(true);

        clearTimersAndResetStates(); // Clear any previous debounce timeout and countdown interval

        // Start countdown
        setCountdown(AUTO_SAVE_DELAY / 1000); // Initialize countdown with total seconds
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearTimersAndResetStates(); // Clear interval when countdown finishes
                    return null; // Hide countdown
                }
                return prev - 1;
            });
        }, 1000); // Decrement every second

        // Set a new timeout to save after the defined delay
        saveTimeoutRef.current = setTimeout(() => {
            saveChanges(); // Trigger save
        }, AUTO_SAVE_DELAY);
    }, [localCardImages, saveChanges, clearTimersAndResetStates]);

    /**
     * Function to abort the scheduled save and revert local changes.
     */
    const cancelScheduledSave = useCallback(() => {
        clearTimersAndResetStates(); // Clear any active timers
        setLocalCardImages(initialCardImages); // Revert local changes to initial state
        setHasChanges(false); // No more unsaved changes
        toast.info("Scheduled save cancelled. Changes reverted.");
    }, [initialCardImages, clearTimersAndResetStates]);

    // Effect to handle manual saving via Enter key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // If Enter key is pressed, there are unsaved changes, and not currently saving
            if (event.key === 'Enter' && hasChanges && !isSaving) {
                event.preventDefault(); // Prevent default Enter key behavior (e.g., form submission)
                saveChanges();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasChanges, isSaving, saveChanges]); // Dependencies for useEffect

    return (
        <div className="mt-6 p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl shadow-inner border border-yellow-100 dark:border-yellow-800 relative">
            {/* Conditional overlay to disable UI during saving */}
            {isSaving && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-50 rounded-xl">
                    <div className="flex flex-col items-center text-yellow-700 dark:text-yellow-300">
                        {/* Spinner icon */}
                        <svg className="animate-spin h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm font-medium">Saving order...</p>
                    </div>
                </div>
            )}

            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-700 dark:text-yellow-400 border-b border-yellow-200 dark:border-yellow-700 pb-2 sm:pb-3">
                Reorder Media
                <span className='text-xs text-blue-500 ml-2' title="Multiple drag & drop, press Enter to save or auto-saves after 15 seconds of inactivity.">
                    (Drag, Enter/Auto-save)
                </span>
            </h3>

            {/* Save Changes Indicator and Buttons */}
            {hasChanges && (
                <div className="mb-4 flex flex-col sm:flex-row items-center justify-between p-2 rounded-md bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 sm:mb-0">
                        Unsaved changes detected.
                        {countdown !== null && countdown > 0 && (
                            <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                                 (Auto-save in {countdown}s) <span className='text-xs  text-yellow-600'>or Press Enter Key, or Save to save now</span> 
                            </span>
                        )}
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={saveChanges}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={cancelScheduledSave}
                            disabled={isSaving} // Disable if a save is in progress
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Droppable area for the list of card images */}
                <Droppable droppableId="cardImages-list-reorder" isDropDisabled={isSaving}>
                    {(provided) => (
                        <ul
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2 sm:space-y-3 p-1 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                        >
                            {/* Display message if no card images are available */}
                            {localCardImages.length === 0 ? (
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 py-3 sm:py-4 text-center">
                                    No card images to reorder. Add some first!
                                </p>
                            ) : (
                                // Map over local card images to render draggable items
                                localCardImages.map((cardImage, index) => (
                                    <Draggable
                                        key={cardImage.id}
                                        draggableId={cardImage.id}
                                        index={index}
                                        isDragDisabled={isSaving} // Disable dragging when saving
                                    >
                                        {(provided, snapshot) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={cn(
                                                    "p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-between cursor-grab",
                                                    "transition-all duration-200 ease-in-out",
                                                    "hover:bg-gray-50 dark:hover:bg-gray-600 transform hover:scale-[1.01]",
                                                    // Apply styles when dragging
                                                    snapshot.isDragging && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-2 dark:ring-offset-gray-800 bg-blue-100 dark:bg-blue-800 shadow-lg scale-[1.02]",
                                                    // Apply transition for drop animation
                                                    snapshot.isDropAnimating && "transition-transform duration-300 ease-out",
                                                    // Apply visual feedback when saving (disabled)
                                                    isSaving && "opacity-50 cursor-not-allowed"
                                                )}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    // Ensure transform is applied correctly during drag
                                                    transform: snapshot.isDragging
                                                        ? provided.draggableProps.style?.transform
                                                        : 'translate(0, 0)',
                                                    // Ensure transition for drop animation
                                                    transition: snapshot.isDropAnimating
                                                        ? 'transform 0.3s ease-out'
                                                        : 'none',
                                                }}
                                            >
                                                {/* Display card image file name */}
                                                <span className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate pr-2">
                                                    {cardImage.fileName || `Card Image ${index + 1}`}
                                                </span>
                                                {/* Display card image type */}
                                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    Type: {cardImage.type}
                                                </span>
                                            </li>
                                        )}
                                    </Draggable>
                                ))
                            )}
                            {provided.placeholder} {/* Placeholder for the dragged item */}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

export default CardImageReorderList;