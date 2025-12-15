// src/app/invoices/[id]/InvoiceActionsWrapper.tsx
'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
// Assuming you have 'react-hot-toast' installed for notifications
import toast from 'react-hot-toast'; 

import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
import { 
    Invoice, 
    Customer, 
    InvoiceItem 
} from '@/app/ar/types/finance'; 

// Define the fully loaded invoice type
type FullInvoice = Invoice & {
    customer: Customer;
    items: InvoiceItem[];
};

interface InvoiceActionsWrapperProps {
    invoice: FullInvoice;
}

const InvoiceActionsWrapper: React.FC<InvoiceActionsWrapperProps> = ({ invoice }) => {
    const router = useRouter();
    
    // Mocking loading state for simplicity
    const isLoading = false; 

    // Handler for Invoice Deletion
    const handleDelete = async () => {
      
        const apiRoute = `/ar/api/invoices/${invoice.id}`; // Matches the path used in the original faulty code
        
        try {
            const response = await fetch(apiRoute, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                toast.success(`Invoice ${invoice.invoiceNumber} deleted successfully.`);
                // Navigate back to the invoice list and refresh the route cache
                router.push('/ar/invoices'); 
                router.refresh(); 
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Deletion failed.');
            }
        } catch (error) {
            console.error(`Error deleting invoice ${invoice.id}:`, error);
            toast.error(`Error deleting invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Handler for Mark Paid logic
    const handleMarkPaid = async () => {
        // Implementation for marking the invoice as paid via API
        // This is necessary because the InvoiceDetailHeader button requires a handler
        console.log(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
        // router.refresh() after successful update
    };


    // Pass the handlers down to the InvoiceDetailHeader
    return (
        <InvoiceDetailHeader 
            invoice={invoice} 
            // Pass the regular functions directly
            onDelete={handleDelete} 
            //onMarkPaid={handleMarkPaid} // Assuming you update the header to accept this
           // isLoading={isLoading} // Assuming you update the header to accept this
        />
    );
};

export default InvoiceActionsWrapper;