// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
// Assuming Product type and ProductFormData are defined here or imported
import { Product, ProductFormData } from '@/app/ar/types/finance';

// Define the API base URL for products
const API_BASE_URL = '/ar/api/products';

// --- API Functions (Using Fetch API) ---

/**
 * Fetches the list of all products from the Next.js API endpoint.
 */
const fetchProductsApi = async (): Promise<Product[]> => {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
        // Throw an error with the server's message or a generic one
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error.' }));
        throw new Error(errorData.message || `Failed to fetch products: Status ${response.status}`);
    }

    const data: Product[] = await response.json();
    return data;
};

/**
 * Creates a new product by sending POST request to the Next.js API endpoint.
 */
const createProductApi = async (data: ProductFormData): Promise<Product> => {
    // 1. Prepare data for the API (convert numbers to string for safety if needed, or keep as number)
    const payload = {
        sku: data.sku,
        name: data.name,
        // Ensure numeric values are correctly sent, assuming the API expects numbers or strings
        stockQuantity: Number(data.stockQuantity), 
        unitCost: Number(data.unitCost), 
    };

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error during creation.' }));
        throw new Error(errorData.message || `Product creation failed: Status ${response.status}`);
    }

    const newProduct: Product = await response.json();
    return newProduct;
};

// --- The Custom Hook ---

interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    fetchProducts: () => Promise<void>;
    createProduct: (data: ProductFormData) => Promise<Product | null>;
    // Optional: add a way to check if mutation is specifically loading
    isCreating: boolean;
}

export const useProducts = (): UseProductsResult => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false); // Separate loading state for creation
    const [error, setError] = useState<string | null>(null);

    // 1. Fetching all products
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchProductsApi();
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError(err instanceof Error ? err.message : "Could not load products. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Creating a new product
    const createProduct = useCallback(async (data: ProductFormData): Promise<Product | null> => {
        setIsCreating(true); 
        setError(null);
        try {
            console.log("...creating product in backend hook");
            const newProduct = await createProductApi(data);
            
            // Optimistically update the state (preferred for single product creation)
            setProducts(prev => [newProduct, ...prev]); 
            
            return newProduct;
        } catch (err) {
            console.error("Failed to create product:", err);
            setError(err instanceof Error ? err.message : "Product creation failed.");
            return null;
        } finally {
            setIsCreating(false);
        }
    }, []);

    // Fetch products automatically on mount (optional, uncomment if needed)
    /*
    useEffect(() => {
        fetchProducts(); 
    }, [fetchProducts]);
    */

    return {
        products,
        // Use general loading for fetching data
        isLoading,
        // Use specific loading for the mutation (creation)
        isCreating,
        error,
        fetchProducts,
        createProduct,
    };
};