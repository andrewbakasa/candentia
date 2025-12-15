// src/hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceStatus } from '@/app/ar/types/finance';
import { InvoiceFormData } from '../_components/features/invoices/InvoiceForm';

// Define the API base URL (optional, can just use relative paths like '/api/invoices')
const API_BASE_URL = '/ar/api/invoices';

// --- API Functions (Using Fetch API) ---

/**
 * Fetches the list of all invoices from the Next.js API endpoint.
 */
const fetchInvoicesApi = async (): Promise<Invoice[]> => {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
        // Throw an error with the server's message or a generic one
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error.' }));
        throw new Error(errorData.message || `Failed to fetch invoices: Status ${response.status}`);
    }

    // Since dates might be returned as strings, we convert them back to Date objects
    const data: Invoice[] = await response.json();
    return data.map(invoice => ({
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
    }));
};

/**
 * Creates a new invoice by sending POST request to the Next.js API endpoint.
 */
const createInvoiceApi = async (data: InvoiceFormData): Promise<Invoice> => {
    // 1. Prepare data for the API (convert numbers/Decimals to string for safety)
    const payload = {
        customerId: data.customerId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        // The API should handle complex logic, but we send the raw form totals
        taxRate: data.taxRate.toFixed(4),
        totalAmount: data.totalAmount.toFixed(2), 
        items: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            discountRate: item.discountRate.toFixed(2),
            productName: item.productName,
        })),
        status: InvoiceStatus.DRAFT,
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
        throw new Error(errorData.message || `Invoice creation failed: Status ${response.status}`);
    }

    const newInvoice: Invoice = await response.json();
    // Convert dates from string to Date object
    return {
        ...newInvoice,
        invoiceDate: new Date(newInvoice.invoiceDate),
        dueDate: new Date(newInvoice.dueDate),
    };
};

// --- The Custom Hook ---

interface UseInvoicesResult {
    invoices: Invoice[];
    isLoading: boolean;
    error: string | null;
    fetchInvoices: () => Promise<void>;
    createInvoice: (data: InvoiceFormData) => Promise<Invoice | null>;
}

export const useInvoices = (): UseInvoicesResult => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetching all invoices (Now uses fetchInvoicesApi)
    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchInvoicesApi();
            setInvoices(data);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            // Safely handle error object if it's an Error instance
            setError(err instanceof Error ? err.message : "Could not load invoices. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Creating a new invoice (Now uses createInvoiceApi)
    const createInvoice = useCallback(async (data: InvoiceFormData): Promise<Invoice | null> => {
        setIsLoading(true); // You might separate loading state for mutations
        setError(null);
        try {
            console.log("......creting in back end hook")
            const newInvoice = await createInvoiceApi(data);
            
            // Re-fetch the list after a successful creation to keep the state current
            // Alternatively, you can optimistically update the state: setInvoices(prev => [newInvoice, ...prev]); 
            await fetchInvoices(); 
            
            return newInvoice;
        } catch (err) {
            console.error("Failed to create invoice:", err);
            setError(err instanceof Error ? err.message : "Invoice creation failed.");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchInvoices]);

    // Fetch invoices automatically on mount of the list page
    useEffect(() => {
        // If you want the list populated immediately:
        // fetchInvoices(); 
    }, [fetchInvoices]);

    return {
        invoices,
        isLoading,
        error,
        fetchInvoices,
        createInvoice,
    };
};