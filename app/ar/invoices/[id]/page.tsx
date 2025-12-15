// src/app/invoices/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';

import prisma from '../../../libs/prismadb'; 
// 1. IMPORT THE REAL TYPES from your shared file
import { 
    Invoice, 
    InvoiceStatus, 
    Customer, 
    InvoiceItem 
} from '@/app/ar/types/finance'; 
// import prisma from '../../../libs/prismadb'; 

import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
import InvoiceDetailView from '../../_components/features/invoices/InvoiceDetailsView';


interface InvoiceDetailPageProps {
    params: {
        id: string;
    };
}

/**
 * Invoice Detail Page Component (Server Component)
 */
export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const invoiceId = params.id;
    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
        notFound();
    }
    
    // The invoice object returned from getInvoice already conforms to the Invoice type.
    // We only need this if we were converting string dates from a database fetch.
    const displayInvoice: Invoice = {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
        status: invoice.status as InvoiceStatus, 
    };
    //console.log("invoice====>",invoice)
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header with status and action buttons */}
            <InvoiceDetailHeader invoice={displayInvoice} />
            
            {/* Main detail content */}
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                {/* <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mb-4 sm:mb-6">
                    Invoice # {invoice.invoiceNumber}
                </h1> */}
                
                {/* Invoice Details component */}
                <InvoiceDetailView invoice={displayInvoice} />
                
                <p className="mt-8 text-center text-xs sm:text-sm text-gray-500 border-t pt-4">
                    This invoice was created on {new Date(displayInvoice.invoiceDate).toLocaleDateString()}.
                </p>
            </div>
        </div>
    );
}


async function getInvoice(id: string): Promise<Invoice | null> {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: id },
            include: {
                customer: true, // Assuming your model includes customer data
                items: true,    // Include line items
                
            },
        });
        return invoice as Invoice | null; // Cast to the client-side Invoice type
    } catch (error) {
        console.error(`Database error fetching invoice ${id}:`, error);
        return null;
    }
}

