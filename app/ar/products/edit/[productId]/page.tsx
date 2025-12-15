'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductFormData } from '@/app/ar/types/finance'; 
// Import the component we created earlier

import { ChevronLeft } from 'lucide-react';
import { ProductForm } from '@/app/ar/_components/features/invoices/ProductForm';
import { toast } from 'sonner';

// --- Props Interface ---
interface EditProductPageProps {
    params: {
        productId: string; // ID of the product to edit
    };
}

// --- Component Definition ---
export default function EditProductPage({ params }: EditProductPageProps) {
    const { productId } = params;
    const router = useRouter();
    
    // State to hold fetched data and manage submission status
    // The initialData for a product is just the Product type with an ID
    const [initialData, setInitialData] = useState<(Product & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Step 1: Fetch Existing Product Data ---
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setLoading(true);
            setError(null);
            try {
                // API endpoint updated for fetching a single product
                const response = await fetch(`/ar/api/products/${productId}`); 
                
                if (!response.ok) {
                    throw new Error('Failed to fetch product details.');
                }
                
                // Assuming the API returns the Product type
                const data: Product & { id: string } = await response.json(); 
                setInitialData(data);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError('Could not load product data.');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    // --- Step 2: Handle Successful Update ---
    const handleUpdateSuccess = useCallback(() => {
        //alert(`Product ${productId} updated successfully!`);
        // Navigate back to the product detail view page (or list page)
        toast.success("Updated successfully")
        router.push(`/ar/products/${productId}`); 
    }, [productId, router]);

    // --- Step 3: Handle Form Submission (Update/PATCH) ---
    const handleFormSubmit = async (formData: ProductFormData) => {
        if (!initialData) return;
        
        // The submission payload is the combined form data and the ID
        const submissionPayload: ProductFormData & { id: string } = {
            ...formData,
            id: initialData.id, 
        };

        setIsSubmitting(true);
        try {
            // API endpoint updated for updating a product
            const response = await fetch(`/ar/api/products/${initialData.id}`, {
                method: 'PATCH', // Use PATCH for update
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionPayload),
            });

            if (!response.ok) {
                // Try to get a more specific error message from the response body
                const errorData = await response.json().catch(() => ({ message: 'Failed to update product.' }));
                throw new Error(errorData.message || 'Failed to update product.');
            }

            // On success, the ProductForm calls onSubmitSuccess
        } catch (err) {
            console.error("Product update failed:", err);
            alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred during update.'}`);
            // Do not call onSubmitSuccess on failure, which is handled by the ProductForm
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Loading & Error States ---
    if (loading) {
        return <div className="p-8 text-center text-indigo-600">Loading Product #{productId}...</div>;
    }

    if (error || !initialData) {
        return <div className="p-8 text-center text-red-600 font-semibold">{error || 'Product not found.'}</div>;
    }

    // --- Cancel/Back Navigation Handler ---
    const handleCancel = () => {
        // Navigates back to the previous page (likely the product details page)
        router.back(); 
    };
    
    // --- Render ---
    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            
            {/* Header Area with Title and Back Link */}
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Edit Product: {initialData.name} ({initialData.sku})
                </h1>
                
                {/* Cancel Button (Go Back) */}
                <button
                    onClick={handleCancel} 
                    className="flex items-center text-gray-600 hover:text-gray-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-gray-100"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Cancel
                </button>
            </div>
            
            <ProductForm 
                initialData={initialData} 
                onSubmit={handleFormSubmit}
                onSubmitSuccess={handleUpdateSuccess} 
                isEditing={true}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
