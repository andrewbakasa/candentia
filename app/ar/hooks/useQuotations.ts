// src/hooks/useQuotations.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
// Import the necessary types from the hypothetical file structure
import { 
    Quotation, 
    QuotationFormData, 
    QuotationItem, 
    QuotationStatus,
    QuotationCreationPayload,
    QuotationClient
} from '@/app/ar/types/finance';

// Define the API base URL for quotations
const API_BASE_URL = '/ar/api/quotations'; // Matches the backend routes defined previously

// --- 1. API Functions (Data Fetching and Mutation) ---

/**
 * Fetches the list of all quotations from the Next.js API endpoint.
 */
const fetchQuotationsApi = async (): Promise<Quotation[]> => {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error.' }));
        throw new Error(errorData.message || `Failed to fetch quotations: Status ${response.status}`);
    }

    // The API route for GET /api/quotations is structured to return a list of Quotations
    const data: Quotation[] = await response.json(); 
    return data;
};

/**
 * Creates a new quotation by sending a POST request.
 */
const createQuotationApi = async (data: QuotationCreationPayload): Promise<Quotation> => {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // The data structure matches the API POST expectation
    });
    console.log('POST: useQouotation ',API_BASE_URL,data)

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error during creation.' }));
        throw new Error(errorData.message || `Quotation creation failed: Status ${response.status}`);
    }

    const newQuotation: Quotation = await response.json();
    return newQuotation;
};

/**
 * Updates an existing quotation by sending a PUT request.
 */
const updateQuotationApi = async (id: string, data: QuotationFormData): Promise<Quotation> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error during update.' }));
        throw new Error(errorData.message || `Quotation update failed: Status ${response.status}`);
    }

    const updatedQuotation: Quotation = await response.json();
    return updatedQuotation;
};

/**
 * Deletes a quotation by sending a DELETE request.
 */
const deleteQuotationApi = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error during deletion.' }));
        throw new Error(errorData.message || `Quotation deletion failed: Status ${response.status}`);
    }
    // Returns void on success (HTTP 204 No Content)
};
// --- 2. The Custom Hook Interface ---

interface UseQuotationsResult {
    quotations: Quotation[];
    isLoading: boolean;
    error: string | null;
    fetchQuotations: () => Promise<void>;
    createQuotation: (data: QuotationCreationPayload) => Promise<Quotation | null>;
    updateQuotation: (id: string, data: QuotationFormData) => Promise<Quotation | null>;
    deleteQuotation: (id: string) => Promise<boolean>;
    isMutating: boolean; // Combined state for both creating and updating
    // FIX: Add the missing property to the result type
    fetchQuotationById: (id: string) => Promise<QuotationClient | null>;
}

// --- 3. The Custom Hook Implementation ---

export const useQuotations = (): UseQuotationsResult => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isMutating, setIsMutating] = useState<boolean>(false); // Separate loading state for mutations
    const [error, setError] = useState<string | null>(null);

    // 1. Fetching all quotations
    const fetchQuotations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchQuotationsApi();
            setQuotations(data);
        } catch (err) {
            console.error("Failed to fetch quotations:", err);
            setError(err instanceof Error ? err.message : "Could not load quotations. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Creating a new quotation
    const createQuotation = useCallback(async (data: QuotationCreationPayload): Promise<Quotation | null> => {
        setIsMutating(true); 
        setError(null);
        try {
            console.log("...creating quotation in backend hook");
            const newQuotation = await createQuotationApi(data);
            
            // Optimistically update the state: prepend the new item
            setQuotations(prev => [newQuotation, ...prev]); 
            
            return newQuotation;
        } catch (err) {
            console.error("Failed to create quotation:", err);
            setError(err instanceof Error ? err.message : "Quotation creation failed.");
            return null;
        } finally {
            setIsMutating(false);
        }
    }, []);

    // 3. Updating an existing quotation
    const updateQuotation = useCallback(async (id: string, data: QuotationFormData): Promise<Quotation | null> => {
        setIsMutating(true); 
        setError(null);
        try {
            console.log(`...updating quotation ${id} in backend hook`);
            const updatedQuotation = await updateQuotationApi(id, data);
            
            // Update the specific quotation in the list state
            setQuotations(prev => prev.map(q => 
                q.id === id ? updatedQuotation : q
            ));
            
            return updatedQuotation;
        } catch (err) {
            console.error("Failed to update quotation:", err);
            setError(err instanceof Error ? err.message : "Quotation update failed.");
            return null;
        } finally {
            setIsMutating(false);
        }
    }, []);

  //4. Deleting a quotation
    const deleteQuotation = useCallback(async (id: string): Promise<boolean> => {
        setIsMutating(true); 
        setError(null);
        try {
            await deleteQuotationApi(id);
            
            // Optimistically update the state: remove the deleted item
            setQuotations(prev => prev.filter(q => q.id !== id)); 
            
            return true;
        } catch (err) {
            console.error("Failed to delete quotation:", err);
            setError(err instanceof Error ? err.message : "Quotation deletion failed.");
            return false;
        } finally {
            setIsMutating(false);
        }
    }, []);

    // 5--- Add the missing fetch function ---
   // FIX: Wrap the fetch function in useCallback.
    const fetchQuotationById = useCallback(async (id: string): Promise<QuotationClient | null> => {
        // ... set loading state if needed ...
        try {
            // Assuming this is the actual fetch logic inside your hook
            const response = await fetch(`/ar/api/quotations/${id}`);
            if (!response.ok) {
                // ... error handling ...
                return null;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching quotation by ID:', error);
            return null;
        }
        // Empty dependency array means this function reference will never change
    }, []);
   // Fetch quotations automatically on mount (optional)
   
    useEffect(() => {
        fetchQuotations(); 
    }, [fetchQuotations]);
   

    return {
        quotations,
        isLoading,
        isMutating, // Combined mutation state
        error,
        fetchQuotations,
        createQuotation,
        updateQuotation,
        deleteQuotation,
        fetchQuotationById
    };
};