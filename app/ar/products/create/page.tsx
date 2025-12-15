'use client'

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductFormData } from '@/app/ar/types/finance'; 
import { ProductForm } from '../../_components/features/invoices/ProductForm';
import { useProducts } from '../../hooks/useProduct';

// --- Component Definition ---
const CreateProductPage = () => {
    const router = useRouter();
    // Assuming useProducts provides createProduct and loading state
    const { createProduct, isLoading: isHookLoading } = useProducts();

    // The payload type for product creation is simply the ProductFormData
    type ProductSubmissionPayload = ProductFormData; 

    // --- 1. Submission Handler ---
    // Use useCallback to memoize the function, matching the style of your template
    const handleFormSubmit = useCallback(async (formData: ProductFormData) => { 
        
        // Product creation usually just requires the core form data.
        const submissionData: ProductSubmissionPayload = formData;
        
        try {
            // Assuming createProduct handles the POST request
            const newProduct = await createProduct(submissionData);
            
            if (newProduct) {
                // Success path handled by onSubmitSuccess
                // The newProduct object is typically used here for routing/ID access
                //return newProduct; 
            } else {
                // Handle API success but no object returned (rare, but good practice)
                throw new Error('Product created, but no object was returned by the API.');
            }
        } catch (error) {
            console.error("Product creation failed:", error);
            // Re-throw the error or handle it here if you don't want the Form component to show the error
            throw error; 
        }
    }, [createProduct]);

  


    return (
        <div className="p-8 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Product</h1>
            
            <ProductForm 
                // Pass a function that directly wraps the hook call
                onSubmit={handleFormSubmit}
                // Pass the loading state from the hook
                isSubmitting={isHookLoading} 
                // Creating a new product
                isEditing={false} 
                // Use the success handler to manage routing/alerts
              
                onSubmitSuccess={() => router.push('/ar/products')} 
            /> 
        </div>
    );
};

export default CreateProductPage;