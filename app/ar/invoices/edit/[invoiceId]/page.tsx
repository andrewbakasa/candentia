'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Import Prisma types (These are correct)
import { Invoice, Customer, InvoiceItem } from '@prisma/client'; 
// Import the component and the necessary types from the form file
import InvoiceForm, { InvoiceFormData, FullInvoice } from '@/app/ar/_components/features/invoices/InvoiceForm';

interface EditInvoicePageProps {
    params: {
        invoiceId: string;
    };
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
    const { invoiceId } = params;
    const router = useRouter();
    
    // State to hold fetched data and manage submission status
    const [initialData, setInitialData] = useState<FullInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // <-- NEW: Submitting state
    const [error, setError] = useState<string | null>(null);

    // --- Step 1: Fetch Existing Invoice Data ---
    useEffect(() => {
        const fetchInvoice = async () => {
            if (!invoiceId) return;
            setLoading(true);
            try {
                // Assuming your API endpoint is correct for fetching a single invoice
                const response = await fetch(`/ar/api/invoices/${invoiceId}`); 
                if (!response.ok) {
                    throw new Error('Failed to fetch invoice details.');
                }
                const data: FullInvoice = await response.json(); 
                setInitialData(data);
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setError('Could not load invoice data.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [invoiceId]);

    // --- Step 2: Handle Successful Update ---
    const handleUpdateSuccess = useCallback(() => {
       // alert('Invoice updated successfully!');
        // Navigate back to the invoice view page
        router.push(`/ar/invoices/${invoiceId}`); 
    }, [invoiceId, router]);

    // --- Step 3: Handle Form Submission (Update/PATCH) ---
    const handleFormSubmit = async (formData: InvoiceFormData) => {
        if (!initialData) return; // Should not happen due to checks below
        
        // Prepare the submission payload
        const submissionPayload = {
            ...formData,
            // Ensure the invoice ID is included for the PATCH request
            id: initialData.id, 
            // Add amountDue (if required by your backend API)
            amountDue: formData.totalAmount,
            
            // NOTE: The formData already contains subTotal, taxAmount, totalAmount, 
            // calculated and rounded in the InvoiceForm component.
        };

        setIsSubmitting(true);
        try {
            // Assuming your API endpoint accepts PATCH requests for updates
            const response = await fetch(`/ar/api/invoices/${initialData.id}`, {
                method: 'PATCH', // Use PATCH for update
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionPayload),
            });

            if (!response.ok) {
                // Try to get a more specific error message from the response body
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update invoice.');
            }

            // On success, the InvoiceForm calls onSubmitSuccess
        } catch (err) {
            console.error("Invoice update failed:", err);
            alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred during update.'}`);
            // Do not call onSubmitSuccess on failure
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return <div className="p-8 text-center">Loading Invoice #{invoiceId}...</div>;
    }

    if (error || !initialData) {
        return <div className="p-8 text-center text-red-600">{error || 'Invoice not found.'}</div>;
    }

    // --- Rendering the Form ---
    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Edit Invoice: {initialData.invoiceNumber}</h1>
            <InvoiceForm 
                initialData={initialData} 
                onSubmit={handleFormSubmit} // <-- CORRECTED onSubmit handler
                onSubmitSuccess={handleUpdateSuccess} 
                isEditing={true}
                isSubmitting={isSubmitting} // <-- CORRECTED isSubmitting state
            />
        </div>
    );
}