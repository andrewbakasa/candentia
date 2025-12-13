// src/app/invoices/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Invoice } from '@/app/ar/types/finance'; // Adjust import path for Invoice type
import prisma from '../../../libs/prismadb'; 
import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
import InvoiceDetailView from '../../_components/features/invoices/InvoiceDetailsView';

// Define the expected props for a dynamic server component page
interface InvoiceDetailPageProps {
    params: {
        id: string; // The dynamic part of the URL, e.g., 'INV-2025-001'
    };
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


/**
 * Invoice Detail Page Component (Server Component)
 */
export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const invoiceId = params.id;
    const invoice = await getInvoice(invoiceId);

    // If the invoice is not found in the database, display the Next.js 404 page
    if (!invoice) {
        notFound();
    }
    return (
        <div className="container mx-auto p-8">
            {/* Header with status and action buttons (e.g., Edit, Mark Paid) */}
            <InvoiceDetailHeader invoice={invoice} />
            
            {/* Main detail content */}
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-6">Invoice # {invoice.invoiceNumber}</h1>
                
                {/* Invoice Details component */}
                <InvoiceDetailView invoice={invoice} />
                
                <p className="mt-8 text-center text-gray-500">
                    This invoice was created on {new Date(invoice.invoiceDate).toLocaleDateString()}.
                </p>
            </div>
        </div>
    );
}

