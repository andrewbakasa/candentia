'use client';

import React, { useMemo, useState, useCallback } from 'react'; // Added useState, useCallback
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Trash, UploadCloud } from 'lucide-react';
import { truncateString } from '@/lib/utils'; // Assuming truncateString is here
import { SafeUser } from '@/app/types';

// Import the new hooks and utilities
import { useCardImageDeletion } from '@/app/hooks/use-image-deletion';
import { useFileInput } from '@/app/hooks/use-file-input';
import { getFileIcon, getFileExtension, formatBytes } from '@/app/libs/utils/file-helper'; // Corrected path based on previous turn's structure
import { cn } from '@/lib/utils'; // Assuming cn utility is available for conditional classes

// Extend ImageUpload to potentially include size if your DB stores it.
interface ImageUpload {
    id: string;
    url: string;
    type: string;
    fileName: string | null;
    size?: number; // Ensure this property is fetched from your database if you want to display it
}

interface FileUploaderProps {
    dbImageList: ImageUpload[]; // List of files already in the database
    setUserImageList: (images: File[]) => void; // Callback to update parent with new File objects
    currentUser: SafeUser | null | undefined;
    refreshCardImages: () => void; // Callback to refresh the list of drawings from the database
}

export const FUploaderFile = ({
    dbImageList,
    setUserImageList,
    currentUser,
    refreshCardImages,
}: FileUploaderProps) => {

    // State for drag-and-drop visual feedback
    const [isDragging, setIsDragging] = useState(false);

    // Constants for file size limits
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_RAW_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    // Use the custom hook for file input management
    const {
        uploadedFiles,
        handleFileUpload, // This is used for <input type="file"> onChange
        removeFileFromPreview,
        clearAllPreviewFiles,
    } = useFileInput({
        MAX_VIDEO_SIZE,
        MAX_IMAGE_SIZE,
        MAX_RAW_FILE_SIZE,
        setUserImageList,
    });

    // Use the custom hook for drawing deletion
    const {
        selectedFileToDelete,
        isDeleteDialogOpen,
        isLoadingDelete,
        handleDeleteClick,
        handleCloseDeleteDialog,
        handleDeleteConfirmation,
    } = useCardImageDeletion({
        currentUser,
        refreshCardImages,
    });

    // Memoized list of images already in the database.
    const filteredImageList = useMemo(() => dbImageList, [dbImageList]);

    // --- Drag and Drop Handlers ---

    const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault(); // Prevent default to allow drop
        event.stopPropagation();
        setIsDragging(true); // Set dragging state for visual feedback
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false); // Reset dragging state
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false); // Reset dragging state

        // Check if files were dropped
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            // Create a synthetic event object to pass to handleFileUpload
            // as it expects an event from an input change.
            const syntheticEvent = {
                target: {
                    files: event.dataTransfer.files,
                },
            } as React.ChangeEvent<HTMLInputElement>;
            handleFileUpload(syntheticEvent);
            event.dataTransfer.clearData(); // Clear data after processing
        }
    }, [handleFileUpload]); // Dependency on handleFileUpload

    // --- End Drag and Drop Handlers ---

    return (
        <div className="relative w-full p-0 sm:p-3">
            {/* Upload Area */}
            <div className="flex items-center justify-center min-w-[70vw] w-full">
                <label
                    htmlFor="dropzone-file"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                        "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600",
                        isDragging ? "border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
                    )}
                    onDragOver={handleDragOver}    // NEW: Drag over handler
                    onDragLeave={handleDragLeave}  // NEW: Drag leave handler
                    onDrop={handleDrop}            // NEW: Drop handler
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                            className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {`.xls, .xlsx, .doc, .docx, .pdf, .ppt, .pptx, .txt, .csv, .zip (Max. ${(MAX_RAW_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB)`}
                            <br />
                            {`SVG, PNG, JPG, GIF (Max. ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)} MB)`}
                            <br />
                            {`MP4, WebM, QuickTime, MP3, WAV, OGG (Max. ${(MAX_VIDEO_SIZE / (1024 * 1024)).toFixed(0)} MB)`}
                        </p>
                    </div>
                    <input
                        id="dropzone-file"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .zip, image/png, image/jpeg, image/gif, image/svg+xml, video/mp4, video/webm, video/quicktime, audio/mpeg, audio/wav, audio/ogg, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    />
                </label>
            </div>

            {/* Preview Section (Handles files to be uploaded) */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-blue-800 flex items-center">
                            <UploadCloud className="h-5 w-5 mr-2 text-blue-600" /> Files to be Uploaded
                        </h3>
                        {uploadedFiles.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={clearAllPreviewFiles}
                                className="flex items-center"
                            >
                                <Trash className="h-4 w-4 mr-1" /> Clear All
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {uploadedFiles.map((file, index) => {
                            const displayName = truncateString(file.name, 15);

                            return (
                                <div
                                    key={file.name + file.size + index}
                                    className="relative group flex flex-col items-center justify-center p-2 border-2 border-blue-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => removeFileFromPreview(file)}
                                    title={`Click to remove from upload list: ${file.name}`}
                                >
                                    <div className="flex flex-col items-center justify-center h-[100px] w-[100px] text-center pointer-events-none">
                                        <span className="text-4xl mb-1 text-blue-500">{getFileIcon(file)}</span>
                                        <span className="text-xs text-gray-600 font-medium uppercase">{getFileExtension(file)}</span>
                                        <span className="text-xs text-gray-500 mt-1">{formatBytes(file.size)}</span>
                                    </div>
                                    <p className="text-xs text-center text-gray-800 mt-2 font-medium px-1 pointer-events-none">{displayName}</p>
                                    <div className="absolute top-1 right-1 bg-red-500 rounded-full p-[3px] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105">
                                        <Trash className="h-3 w-3" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Existing Files Section (from DB) */}
            <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Trash className="h-5 w-5 mr-2 text-gray-500" /> Existing Files
                </h3>
                {filteredImageList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {filteredImageList.map((item) => {
                            const displayName = truncateString(item.fileName || '', 15);

                            return (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={item.id}
                                    className="relative group flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    title={`Click to view: ${item.fileName}`}
                                >
                                    <div className="flex flex-col items-center justify-center h-[100px] w-[100px] text-center pointer-events-none">
                                        <span className="text-4xl mb-1 text-gray-600">{getFileIcon(item.url)}</span>
                                        <span className="text-xs text-gray-600 font-medium uppercase">{getFileExtension(item.url)}</span>
                                        {item.size && (
                                            <span className="text-xs text-gray-500 mt-1">{formatBytes(item.size)}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-gray-800 mt-2 font-medium px-1 pointer-events-none">{displayName}</p>
                                    <div
                                        className="absolute top-1 right-1 bg-red-600 rounded-full p-[3px] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(item); }}
                                        title={`Delete from database: ${item.fileName}`}
                                    >
                                        <Trash className="h-3 w-3" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                        <Trash className="h-8 w-8 mb-2" />
                        <p>No existing files found.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog (shadcn/ui AlertDialog) */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => handleCloseDeleteDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ready to Delete File?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete <span className="font-semibold text-red-600">{selectedFileToDelete?.fileName || 'this file'}</span>?
                            This action cannot be undone and will remove the file from the database and Cloudinary.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDeleteDialog} disabled={isLoadingDelete}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirmation}
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={isLoadingDelete}
                        >
                            {isLoadingDelete ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </span>
                            ) : (
                                <>
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};