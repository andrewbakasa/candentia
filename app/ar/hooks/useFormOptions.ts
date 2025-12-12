// src/hooks/useFormOptions.ts

import { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/app/ar/types/finance';

// Define the structure for a product option (minimal fields needed for the form)
interface ProductOption {
    id: string;
    sku: string;
    name: string;
    unitPrice: number;
}

interface UseFormOptionsResult {
    customers: Customer[];
    products: ProductOption[];
    isLoading: boolean;
    error: string | null;
}

// Helper to fetch data from a given endpoint
const fetchData = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}. Status: ${response.status}`);
    }
    return response.json();
};

export const useFormOptions = (): UseFormOptionsResult => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOptions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch customers from your dedicated API endpoint
            const customerPromise = fetchData<Customer[]>('/ar/api/customers');
            // Fetch products from your dedicated API endpoint
            const productPromise = fetchData<ProductOption[]>('/ar/api/products'); 

            const [customerData, productData] = await Promise.all([customerPromise, productPromise]);

            setCustomers(customerData);
            setProducts(productData);

        } catch (err: any) {
            console.error("Failed to fetch form options:", err);
            setError(err.message || "Could not load required form data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    return { customers, products, isLoading, error };
};