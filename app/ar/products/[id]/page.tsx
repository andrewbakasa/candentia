import React from 'react';
import { notFound } from 'next/navigation';

// Correct imports
import prisma from '../../../libs/prismadb'; 
import { 
    Product, 
    // We only need the Product type here
} from '@/app/ar/types/finance'; 

// Assuming these corresponding components exist
//import ProductDetailView from '../../_components/features/products/ProductDetailsView';
import ProductActionsWrapper from './ProductActionsWrapper'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import ProductDetailView from '../../_components/features/invoices/ProductDetailsView';


// Define the expected type structure coming from the database
// Since products are simpler, we just use the core Product type
type FullProduct = Product & { id: string }; 


interface ProductDetailPageProps {
    params: {
        id: string; // The product ID
    };
}

/**
 * Product Detail Page Component (Server Component)
 * Responsible for fetching data and rendering static structure.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const productId = params.id;
    const product = await getProduct(productId);
    const currentUser = await getCurrentUser(); // Keep for authorization checks if needed
    
    
    if (!product) {
        notFound();
    }
    
    // Prepare the data structure for display/serialization
    // Since Product often contains Date objects (createdAt, updatedAt), they need conversion
    const displayProduct: FullProduct = {
        ...(product as FullProduct), // Cast the Prisma result to the FullProduct type
        // Convert Date objects to serializable strings before passing to client component
       // createdAt: new Date(product.createdAt).toISOString(), 
       // updatedAt: new Date(product.updatedAt).toISOString(),
    } as FullProduct; // Final cast for type safety

    

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header with status and action buttons (Client Component Wrapper) */}
            <ProductActionsWrapper product={displayProduct} currentUser={currentUser} />
            
            {/* Main detail content */}
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                
                {/* Product Details component */}
                <ProductDetailView product={displayProduct} />
                
                <p className="mt-8 text-center text-xs sm:text-sm text-gray-500 border-t pt-4">
                    Product created on {new Date(displayProduct.createdAt).toLocaleDateString()} and last updated on {new Date(displayProduct.updatedAt).toLocaleDateString()}.
                </p>
            </div>
        </div>
    );
}

/**
 * Server-side data fetching function.
 */
async function getProduct(id: string): Promise<FullProduct | null> {
    try {
        // Find a unique product by ID
        const product = await prisma.product.findUnique({
            where: { id: id },
            // Products usually don't have nested includes like invoices, so we keep it simple
            // If you had warehouse/location data, you might include it here.
        });
        
        // The result is cast to the client-side Product type
        return product as FullProduct | null; 
    } catch (error) {
        console.error(`Database error fetching product ${id}:`, error);
        return null;
    }
}