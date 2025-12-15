// src/app/invoices/[id]/page.tsx
import React from 'react';
import { notFound, useRouter } from 'next/navigation';

// Correct imports
import prisma from '../../../libs/prismadb'; 
import { 
    Invoice, 
    Customer, 
    InvoiceItem 
} from '@/app/ar/types/finance'; 

import InvoiceDetailView from '../../_components/features/invoices/InvoiceDetailsView';
import InvoiceActionsWrapper from './InvoiceActionsWrapper';
import { ChevronLeft } from 'lucide-react';


// Define the expected type structure coming from the database
type FullInvoice = Invoice & {
    customer: Customer;
    items: InvoiceItem[];
};

interface InvoiceDetailPageProps {
    params: {
        id: string;
    };
}

/**
 * Invoice Detail Page Component (Server Component)
 * Responsible for fetching data and rendering static structure.
 */
export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const invoiceId = params.id;
    const invoice = await getInvoice(invoiceId);
    
    

    if (!invoice) {
        notFound();
    }
    
    // Prepare the data structure for display/serialization
    const displayInvoice: FullInvoice = {
        ...invoice,
        // Convert Date objects to serializable strings before passing to client component
       // invoiceDate: invoice.invoiceDate.toISOString(), 
       // dueDate: invoice.dueDate.toISOString(),
    };

    

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header with status and action buttons (Client Component Wrapper) */}
            <InvoiceActionsWrapper invoice={displayInvoice} />
            
            {/* Main detail content */}
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                
                {/* Invoice Details component */}
                <InvoiceDetailView invoice={displayInvoice} />
                
                <p className="mt-8 text-center text-xs sm:text-sm text-gray-500 border-t pt-4">
                    This invoice was created on {new Date(displayInvoice.invoiceDate).toLocaleDateString()}.
                </p>
            </div>
        </div>
    );
}

/**
 * Server-side data fetching function.
 */
async function getInvoice(id: string): Promise<FullInvoice | null> {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: id },
            include: {
                customer: true, // Include customer data
                items: true,    // Include line items
            },
        });
        
        // The result is cast to the client-side Invoice type
        return invoice as FullInvoice | null; 
    } catch (error) {
        console.error(`Database error fetching invoice ${id}:`, error);
        return null;
    }
}