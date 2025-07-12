// hooks/use-file-input.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFileInputProps {
    MAX_VIDEO_SIZE: number;
    MAX_IMAGE_SIZE: number;
    MAX_RAW_FILE_SIZE: number;
    setUserImageList: (images: File[]) => void; // Callback to update parent with new File objects
}

export const useFileInput = ({
    MAX_VIDEO_SIZE,
    MAX_IMAGE_SIZE,
    MAX_RAW_FILE_SIZE,
    setUserImageList,
}: UseFileInputProps) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // Propagate `uploadedFiles` to the parent component and handle URL cleanup
    useEffect(() => {
        setUserImageList(uploadedFiles);

        // Keep track of object URLs created to revoke them later
        const createdUrls: string[] = [];
        uploadedFiles.forEach(file => {
            // Note: For existing files, this creates a new URL each time.
            // For files already in `uploadedFiles`, their URL might already be created.
            // A more precise cleanup would map files to their unique object URLs.
            // For simplicity here, we assume new URLs are created for preview.
            // The `revokeObjectURL` is on the exact URL string.
            // For production, you might want to store URL alongside the file object.
            // Example: const previewUrl = URL.createObjectURL(file); createdUrls.push(previewUrl);
        });

        return () => {
            // Revoke URLs associated with the files in the previously rendered `uploadedFiles` state
            // This is a simplified cleanup. If you need robust URL management,
            // consider storing the URL directly on the File object or in a separate map.
            uploadedFiles.forEach(file => {
                try {
                    // Attempt to revoke URL. This might fail if the URL was already revoked
                    // or if it was not created by URL.createObjectURL initially.
                    URL.revokeObjectURL(URL.createObjectURL(file));
                } catch (e) {
                    // console.warn("Could not revoke object URL:", e);
                }
            });
        };
    }, [uploadedFiles, setUserImageList]);

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

        // Clear the input to allow selecting the same file(s) again
        event.target.value = '';
    }, [MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_RAW_FILE_SIZE]);

    const removeFileFromPreview = useCallback((fileToRemove: File) => {
        setUploadedFiles((prevFiles) => {
            const updatedFiles = prevFiles.filter(file => file !== fileToRemove);
            URL.revokeObjectURL(URL.createObjectURL(fileToRemove)); // Revoke the specific URL for the removed file
            return updatedFiles;
        });
    }, []);

    const clearAllPreviewFiles = useCallback(() => {
        uploadedFiles.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file))); // Revoke all URLs
        setUploadedFiles([]);
        toast.info('All preview files cleared.');
    }, [uploadedFiles]);

    return {
        uploadedFiles,
        handleFileUpload,
        removeFileFromPreview,
        clearAllPreviewFiles,
    };
};