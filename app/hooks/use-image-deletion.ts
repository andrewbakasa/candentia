// hooks/use-CardImages-deletion.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAction } from '@/hooks/use-action'; // Assuming this hook is correct
import { deleteCardImage } from '@/actions/delete-cardImage';
import { SafeUser } from '@/app/types'; // Assuming SafeUser type

// Re-defining ImageUpload interface here for clarity, or import if shared
interface ImageUpload {
    id: string;
    url: string;
    type: string;
    fileName: string | null;
    size?: number;
}

interface UseCardImagesDeletionProps {
    currentUser: SafeUser | null | undefined;
    refreshCardImages: () => void; // Callback to refresh the list of CardImagess from the database
}

export const useCardImageDeletion = ({ currentUser, refreshCardImages }: UseCardImagesDeletionProps) => {
    const [selectedFileToDelete, setSelectedFileToDelete] = useState<ImageUpload | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { execute: executeDeleteCardImage, isLoading: isLoadingDelete } = useAction(deleteCardImage, {
        onSuccess: (data) => {
            toast.success(`File "${data?.url}" deleted successfully.`);
            refreshCardImages();
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const handleDeleteClick = useCallback((image: ImageUpload) => {
        if (!currentUser || !currentUser.isAdmin) {
            toast.error(`User ${currentUser?.email || 'not logged in'} is not allowed to perform this operation.`);
            return;
        }
        setSelectedFileToDelete(image);
        setIsDeleteDialogOpen(true);
    }, [currentUser]);

    // FIX: Explicitly type handleCloseDeleteDialog
    const handleCloseDeleteDialog: () => void = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedFileToDelete(null);
    }, []); // Dependencies are stable, so empty array is fine for this specific case.


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
    }, [selectedFileToDelete, currentUser, executeDeleteCardImage, refreshCardImages]);

    return {
        selectedFileToDelete,
        isDeleteDialogOpen,
        isLoadingDelete,
        handleDeleteClick,
        handleCloseDeleteDialog,
        handleDeleteConfirmation,
    };
};