'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Import Prisma types (These are correct)
import { Invoice, Customer, InvoiceItem } from '@prisma/client'; 
// Import the component and the necessary types from the form file
import InvoiceForm, { InvoiceFormData, FullInvoice } from '@/app/ar/_components/features/invoices/InvoiceForm';
import { ChevronLeft } from 'lucide-react';

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

  
    
    // --- UPDATED: Navigation handler for the "Cancel" button ---
    const handleCancel = () => {
        // router.back() navigates to the previous page in the history, 
        // which should be the single invoice view page.
        router.back(); 
    };
    // return (
    //     <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            
    //         {/* Header Area with Title and Back Link */}
    //         <div className="flex justify-between items-center mb-6 border-b pb-3">
    //             <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
    //                 Edit Invoice: {initialData.invoiceNumber}
    //             </h1>
                
    //             {/* Return Link Button */}
    //             <button
    //                 onClick={handleReturnToList}
    //                 className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-indigo-50"
    //             >
    //                 <ChevronLeft className="w-5 h-5 mr-1" />
    //                 Return to Invoice List
    //             </button>
    //         </div>
            
    //         <InvoiceForm 
    //             initialData={initialData} 
    //             onSubmit={handleFormSubmit}
    //             onSubmitSuccess={handleUpdateSuccess} 
    //             isEditing={true}
    //             isSubmitting={isSubmitting}
    //         />
    //     </div>
    // );


    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            
            {/* Header Area with Title and Back Link */}
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Edit Invoice: {initialData.invoiceNumber}
                </h1>
                
                {/* Cancel Button (Go Back) */}
                <button
                    onClick={handleCancel} // Use the new handleCancel function
                    className="flex items-center text-gray-600 hover:text-gray-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-gray-100"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Cancel
                </button>
            </div>
            
            <InvoiceForm 
                initialData={initialData} 
                onSubmit={handleFormSubmit}
                onSubmitSuccess={handleUpdateSuccess} 
                isEditing={true}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

