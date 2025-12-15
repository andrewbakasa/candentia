'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 
import { 
    FileDownIcon, 
    MoreVerticalIcon, 
    ChevronLeft,
    CopyIcon,
    EditIcon, // Added EditIcon
    Trash2Icon, // Added TrashIcon
} from 'lucide-react'; 

// Assuming you have components like this 
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'; 
import { Button } from '@/components/ui/button'; // Assuming a Button component

// Import Product types
import { Product } from '@/app/ar/types/finance'; 
import { SafeUser } from '@/app/types';
import ConfirmAction from '@/app/de/_components/ConfirmAction';


// We use the same type from the server component
type FullProduct = Product & { id: string };

interface ProductActionsWrapperProps {
    product: FullProduct;
    currentUser: SafeUser | null;
}

const ProductActionsWrapper: React.FC<ProductActionsWrapperProps> = ({ product, currentUser }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false); 

    // --- Access Control Check ---
    const allowedRoles = ['admin', 'executive', 'inventory_manager'];

    const isAllowedAccess = 
    // 1. Check if currentUser is defined AND currentUser.isAdmin is true.
    (currentUser?.isAdmin === true) || 
    // 2. Check for role matches (only if currentUser and roles are defined).
    (currentUser?.roles?.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    ) === true);

    // --- HANDLERS ---

    const handleDelete = async () => {
        if (!isAllowedAccess || isLoading) return;

       

        setIsLoading(true);
        try {
            const response = await fetch(`/ar/api/products/${product.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete product.' }));
                throw new Error(errorData.message || 'Failed to delete product.');
            }

            toast.success("Product deleted successfully!");
            router.push('/ar/products'); // Navigate back to the product list
        } catch (err) {
            console.error("Deletion failed:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred during deletion.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (isAllowedAccess && !isLoading) {
            router.push(`/ar/products/edit/${product.id}`);
        } else {
            toast.error("You do not have permission to edit this product.");
        }
    };

    // --- Copy Current URL ---
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Product link copied to clipboard.");
        } catch (err) {
            console.error('Failed to copy URL:', err);
            toast.error("Could not copy link. Please try manually.");
        }
    };

    const handleExportExcel = () => {
        // Triggers the download by navigating the window to a dedicated API route.
        window.open(`/ar/api/products/${product.id}/excel`, '_blank');
        toast.success("Product export initiated.");
    };

    
    const handleReturnToList = () => {
        // Navigate to the main product list page
        router.push('/ar/products'); 
    };

return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-xl shadow-lg mb-6">
        
        {/* TOP/LEFT: Return to List Link */}
        <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <button
                onClick={handleReturnToList}
                className="w-full sm:w-auto flex items-center text-gray-600 hover:text-gray-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-gray-100"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Return to Product List
            </button>
        </div>

        
        {/* BOTTOM/RIGHT: Action Buttons */}
        <div className="flex items-center space-x-3 ml-auto sm:ml-0">
            
            {/* 1. Edit Button */}
            <Button 
                onClick={handleEdit}
                disabled={!isAllowedAccess || isLoading}
                variant="default" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                <EditIcon className="w-4 h-4 mr-2" /> Edit Product
            </Button>
            
            {/* 2. Delete Button (High visibility action) */}
            {/* <Button
                onClick={handleDelete}
                disabled={!isAllowedAccess || isLoading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                <Trash2Icon className="w-4 h-4 mr-2" /> Delete
            </Button> */}

           
                    <ConfirmAction 
                        onConfirm={handleDelete} 
                        itemId={product.id}
                        action="Delete" 
                        heading="Delete Product"
                        description={`This action will permanently delete product ${product.name}.`}
                        showHint={false} 
                    />


            {/* 3. Dropdown Menu for Secondary Actions (Export/Copy) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isLoading} className="border-gray-300">
                        <MoreVerticalIcon className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    
                    <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                    
                    {/* Copy URL */}
                    <DropdownMenuItem onClick={handleCopyUrl}>
                        <CopyIcon className="w-4 h-4 mr-2" /> Copy Product Link
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator /> 
                    
                    {/* Output Actions */}
                    <DropdownMenuItem onClick={handleExportExcel}>
                        <FileDownIcon className="w-4 h-4 mr-2" /> Export Details to Excel
                    </DropdownMenuItem> 
                    
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    </div>
);
};

export default ProductActionsWrapper;