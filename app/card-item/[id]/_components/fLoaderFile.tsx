'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Trash, FileText, FileImage, FileVideo, UploadCloud } from 'lucide-react'; // Added UploadCloud for 'to be uploaded' section
import { toast } from 'sonner';
import { useAction } from '@/hooks/use-action';
import { SafeUser } from '@/app/types';
import { truncateString } from '@/lib/utils';
import { BsFileExcelFill, BsFilePdfFill, BsFileWordFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';


interface Image {
    id: string;
    url: string;
    cardId: string; // Add cardId property here
    type :string;
    userId: string | null;
    fileName: string| null
}
interface FileUploadProps{
    dbImageList : Image[];
    setUserImageList:(images:File[])=>void;
    currentUser:SafeUser | null | undefined;
    refreshCardImages: () => void;
}

import { deleteCardImage } from '@/actions/delete-cardImage';

export const FUploaderFile = ({
    dbImageList,
    setUserImageList,
    currentUser,
    refreshCardImages,
}: FileUploadProps) => {
    // State to hold the actual File objects that the user has selected for upload.
    // This is the SINGLE SOURCE OF TRUTH for files *to be uploaded*.
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // State for managing deletion of database images.
    const [selectedFileToDelete, setSelectedFileToDelete] = useState<Image | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Constants for file size limits
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_RAW_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    // useAction hook for deleting drawings from the database
    const { execute: executeDeleteCardImage, isLoading: isLoadingDelete } = useAction(deleteCardImage, {
        onSuccess: (data) => {
            toast.success(`File "${data?.url}" deleted successfully.`);
            refreshCardImages(); // Refresh the parent's list of DB images
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Memoized list of images already in the database.
    // This is distinct from `uploadedFiles`.
    const filteredImageList = useMemo(() => dbImageList, [dbImageList]);

    // --- EFFECT: Propagate `uploadedFiles` to the parent component via `setUserImageList` ---
    // This ensures the parent always has the latest list of `File` objects to be processed.
    // Also handles object URL creation and revocation for `imagePreview` (now internal to this component's render logic).
    useEffect(() => {
        setUserImageList(uploadedFiles);

        // Cleanup function: Revoke all object URLs when the component unmounts
        // or when `uploadedFiles` changes (making previous URLs obsolete).
        // Note: This relies on the fact that `URL.createObjectURL` is called within the map
        // and the `file` object itself is unique.
        return () => {
            // No direct `imagePreview` state to clear, but we should clear any lingering URLs
            // if this component were to unmount with files still in `uploadedFiles`.
            // However, the `URL.createObjectURL` is now directly in the render loop,
            // so this cleanup is less critical here, but good practice if URLs were stored.
            // For this specific setup, the browser's garbage collection for ephemeral URLs
            // is generally sufficient, but explicit revocation is safer for long-lived components.
            // For a more robust cleanup, you'd store the created URLs in a ref or state.
            // For now, we rely on the browser's cleanup for temporary URLs.
        };
    }, [uploadedFiles, setUserImageList]); // Dependency: Re-run when `uploadedFiles` changes

    // --- Handlers ---

    // Handles click on a database image to initiate deletion
    const handleDeleteClick = useCallback((image: Image) => {
        if (!currentUser || !currentUser.isAdmin) {
            toast.error(`User ${currentUser?.email || 'not logged in'} is not allowed to perform this operation.`);
            return;
        }
        setSelectedFileToDelete(image);
        setIsDeleteDialogOpen(true); // Open the AlertDialog
    }, [currentUser]);

    // Handles removal of a file from the *preview list* (i.e., a newly uploaded file)
    const removeFileFromPreview = useCallback((fileToRemove: File) => {
        setUploadedFiles((prevFiles) => {
            const updatedFiles = prevFiles.filter(file => file !== fileToRemove);
            URL.revokeObjectURL(URL.createObjectURL(fileToRemove)); // Revoke specific URL
            return updatedFiles;
        });
    }, []);

    // Handles clearing all files from the *preview list*
    const clearAllPreviewFiles = useCallback(() => {
        // Revoke all object URLs for the files being cleared
        uploadedFiles.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file)));
        setUploadedFiles([]); // Clear the array
        toast.info('All preview files cleared.');
    }, [uploadedFiles]);


    // Handles closing the delete confirmation dialog
    const handleCloseDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedFileToDelete(null); // Clear selected file
    }, []);

    // Gets file extension from a URL or File object
    const getFileExtension = useCallback((urlOrFile: string | File): string => {
        if (typeof urlOrFile === 'string') {
            const lastDotIndex = urlOrFile.lastIndexOf('.');
            return lastDotIndex !== -1 ? urlOrFile.substring(lastDotIndex + 1) : '';
        } else {
            const fileName = urlOrFile?.name;
            const lastDotIndex = fileName?.lastIndexOf('.');
            return lastDotIndex !== -1 ? fileName?.substring(lastDotIndex + 1) : '';
        }
    }, []);

    // Returns the appropriate icon component based on file type/extension
    const getFileIcon = useCallback((urlOrFile: string | File) => {
        const extension = getFileExtension(urlOrFile);
        switch (extension?.toLowerCase()) {
            case 'pdf': return <BsFilePdfFill className="text-red-500" />;
            case 'docx':
            case 'doc': return <BsFileWordFill className="text-blue-500" />;
            case 'xlsx':
            case 'xls': return <BsFileExcelFill className="text-green-500" />;
            case 'zip':
            case 'rar':
            case '7z': return <FaArchive className="text-gray-500" />;
            case 'mp3':
            case 'wav':
            case 'ogg': return <FileVideo className="text-purple-500" />;
            case 'txt':
            case 'csv': return <FileText className="text-gray-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg': return <FileImage className="text-blue-400" />;
            default: return <FileText className="text-gray-400" />;
        }
    }, [getFileExtension]);

    // Handles confirmation of database file deletion (Cloudinary + DB)

    const handleDeleteConfirmation = useCallback(async () => {
        setIsDeleteDialogOpen(false);

        if (!selectedFileToDelete) {
            toast.error('No file selected for deletion.');
            return;
        }

        if (!currentUser || !currentUser.isAdmin) {
            toast.error(`User ${currentUser?.email} does not have permission to delete this file.`);
            return;
        }

        try {
            const publicId = selectedFileToDelete.url;
            if (!publicId) {
                toast.error('Cloudinary Public ID is missing. Skipping Cloudinary deletion.');
                return;
            }

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
            const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
            const timestamp = Math.round(new Date().getTime() / 1000);

            let resourceType;
            if (selectedFileToDelete.type.startsWith('image/')) {
                resourceType = 'image';
            } else if (selectedFileToDelete.type.startsWith('video/') || selectedFileToDelete.type.startsWith('audio/')) {
                resourceType = 'video';
            } else {
                resourceType = 'raw';
            }

            const signatureResponse = await fetch('/api/cloudinary-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_id: publicId, timestamp, resourceType }),
            });

            if (!signatureResponse.ok) {
                const errorData = await signatureResponse.json();
                throw new Error(errorData.error || 'Failed to generate signature.');
            }

            const { signature } = await signatureResponse.json();
            const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;

            const destroyResponse = await fetch(destroyUrl, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    public_id: publicId,
                    api_key: apiKey,
                    timestamp: timestamp,
                    signature: signature,
                }),
            });

            if (destroyResponse.ok) {
                executeDeleteCardImage({ id: selectedFileToDelete.id });
                setSelectedFileToDelete(null);
                toast.success('File deleted from Cloudinary and database!');
            } else {
                const errorData = await destroyResponse.json();
                console.error('Cloudinary Error Details:', errorData);
                toast.error(`File not deleted from Cloudinary: ${errorData.error?.message || destroyResponse.statusText}`);
            }
        } catch (error: any) {
            console.error('Unexpected error deleting file:', error);
            toast.error(`Unexpected error deleting file: ${error.message || 'Please try again.'}`);
        }
    }, [selectedFileToDelete, currentUser, executeDeleteCardImage]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target || !event.target.files) return;

        const files = Array.from(event.target.files);
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        files.forEach((file) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/');
            const isRaw = !isImage && !isVideo && !isAudio;

            let maxSize = 0;
            if (isImage) maxSize = MAX_IMAGE_SIZE;
            else if (isVideo || isAudio) maxSize = MAX_VIDEO_SIZE;
            else if (isRaw) maxSize = MAX_RAW_FILE_SIZE;

            if (file.size <= maxSize) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
                toast.error(`${file.name} exceeds the maximum size limit (${(maxSize / (1024 * 1024)).toFixed(2)}MB).`);
            }
        });

        if (invalidFiles.length > 0) {
            console.warn("Some files were too large:", invalidFiles);
        }

        if (validFiles.length > 0) {
            setUploadedFiles((prevFiles) => [...prevFiles, ...validFiles]);
        }

        event.target.value = '';
    }, [MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_RAW_FILE_SIZE]);

    const VideoPlayer = ({ src, pointerEventsNone = false }: { src: string; pointerEventsNone?: boolean }) => {
        const videoRef = useRef<HTMLVideoElement>(null);

        useEffect(() => {
            const video = videoRef.current;
            if (video) {
                video.controls = true;
                video.autoplay = false;
            }
        }, []);

        return <video ref={videoRef} src={src} className={`rounded-lg object-cover h-[100px] w-[100px] ${pointerEventsNone ? 'pointer-events-none' : ''}`} />;
    };

    const AudioPlayer = ({ src, pointerEventsNone = false }: { src: string; pointerEventsNone?: boolean }) => {
        const audioRef = useRef<HTMLAudioElement>(null);

        useEffect(() => {
            const audio = audioRef.current;
            if (audio) {
                audio.controls = true;
                audio.autoplay = false;
            }
        }, []);

        return (
            <audio ref={audioRef} src={src} className={`rounded-lg w-[100px] h-[50px] ${pointerEventsNone ? 'pointer-events-none' : ''}`} />
        );
    };

    return (
        <div className="relative w-full p-3">
            {/* Upload Area */}
            <div className="flex items-center justify-center w-full">
                <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
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
                            const previewUrl = URL.createObjectURL(file); // Create URL on the fly
                            const isImage = file.type.startsWith('image/');
                            const isVideo = file.type.startsWith('video/');
                            const isAudio = file.type.startsWith('audio/');
                            const isRaw = !isImage && !isVideo && !isAudio;
                            const displayName = truncateString(file.name, 15);

                            return (
                                <div
                                    key={file.name + file.size + index} // A more robust key for files
                                    className="relative group flex flex-col items-center justify-center p-2 border-2 border-blue-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => removeFileFromPreview(file)}
                                    title={`Click to remove from upload list: ${file.name}`}
                                >
                                    {isImage && (
                                        <Image
                                            src={previewUrl}
                                            width={100}
                                            height={100}
                                            className="rounded-lg object-cover h-[100px] w-[100px] pointer-events-none"
                                            alt={`Preview of ${file.name}`}
                                        />
                                    )}
                                    {isVideo && <VideoPlayer src={previewUrl} pointerEventsNone={true} />}
                                    {isAudio && <AudioPlayer src={previewUrl} pointerEventsNone={true} />}
                                    {isRaw && (
                                        <div className="flex flex-col items-center justify-center h-[100px] w-[100px] text-center pointer-events-none">
                                            <span className="text-4xl mb-1 text-blue-500">{getFileIcon(file)}</span>
                                            <span className="text-xs text-gray-600 font-medium uppercase">{getFileExtension(file)}</span>
                                        </div>
                                    )}
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
                    <FileText className="h-5 w-5 mr-2 text-gray-500" /> Existing Files
                </h3>
                {filteredImageList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {filteredImageList.map((item) => {
                            const isImage = item.type.startsWith('image/');
                            const isVideo = item.type.startsWith('video/');
                            const isAudio = item.type.startsWith('audio/');
                            const isRaw = !isImage && !isVideo && !isAudio;
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
                                    {isImage && (
                                        <Image
                                            src={item.url}
                                            width={100}
                                            height={100}
                                            className="rounded-lg object-cover h-[100px] w-[100px] pointer-events-none"
                                            alt={item.fileName || 'Uploaded image'}
                                        />
                                    )}
                                    {isVideo && <VideoPlayer src={item.url} pointerEventsNone={true} />}
                                    {isAudio && <AudioPlayer src={item.url} pointerEventsNone={true} />}
                                    {isRaw && (
                                        <div className="flex flex-col items-center justify-center h-[100px] w-[100px] text-center pointer-events-none">
                                            <span className="text-4xl mb-1 text-gray-600">{getFileIcon(item.url)}</span>
                                            <span className="text-xs text-gray-600 font-medium uppercase">{getFileExtension(item.url)}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-center text-gray-800 mt-2 font-medium px-1 pointer-events-none">{displayName}</p>
                                    <div
                                        className="absolute top-1 right-1 bg-red-600 rounded-full p-[3px] text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(item); }} // Prevent parent click
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
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No existing files found.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog (shadcn/ui AlertDialog) */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
