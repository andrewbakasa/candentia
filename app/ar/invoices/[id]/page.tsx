// src/app/invoices/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';

// Correct imports
import prisma from '../../../libs/prismadb'; 
import { 
    Invoice, 
    Customer, 
    InvoiceItem 
} from '@/app/ar/types/finance'; 

import InvoiceDetailView from '../../_components/features/invoices/InvoiceDetailsView';
import InvoiceActionsWrapper from './InvoiceActionsWrapper';
// Import the dedicated Client Component for the Header and its actions
//import InvoiceActionsWrapper from './InvoiceActionsWrapper'; 


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
// // src/app/invoices/[id]/page.tsx
// 'use client'
// import React, { useCallback } from 'react';
// import { notFound } from 'next/navigation';

// import prisma from '../../../libs/prismadb'; 
// // 1. IMPORT THE REAL TYPES from your shared file
// import { 
//     Invoice, 
//     InvoiceStatus, 
//     Customer, 
//     InvoiceItem 
// } from '@/app/ar/types/finance'; 
// // import prisma from '../../../libs/prismadb'; 

// import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
// import InvoiceDetailView from '../../_components/features/invoices/InvoiceDetailsView';


// interface InvoiceDetailPageProps {
//     params: {
//         id: string;
//     };
// }

// /**
//  * Invoice Detail Page Component (Server Component)
//  */
// export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
//     const invoiceId = params.id;
//     const invoice = await getInvoice(invoiceId);

//     if (!invoice) {
//         notFound();
//     }

//     const handleIODeleteExternal = async (id: string) => {
//             //call api/defect/io method delete....
//             const apiRoute = `/ar/api/invoice/${id}`;
//             //console.log(`Attempting to delete IO`);
//             try {
//                 const response = await fetch(apiRoute, {
//                     method: 'DELETE',
//                     headers: { 'Content-Type': 'application/json' },
//                 });
    
//                 if (response.ok) {
//                     // *** OPTIMISTIC STATE UPDATE: Remove the comment from the list ***
//                     // setLocalDefect(prevDefect => ({
//                     //     ...prevDefect,
//                     //     improvementOpportunities: prevDefect.improvementOpportunities.filter(io => io.id !== id),
//                     // }));
//                     //toast.success('IO record deleted successfully.');
//                 } else if (response.status === 401 || response.status === 403 || response.status === 404) {
//                     const errorData = await response.json();
//                     console.error('Deletion failed:', errorData.message);
//                     //toast.error(errorData.message || 'Deletion failed.');
//                 } else {
//                     throw new Error(`Server responded with status: ${response.status}`);
//                 }
//             } catch (error) {
//                 console.error(`Network or unexpected error while deleting IO ${id}:`, error);
//                 //toast.error(`Error deleting IO: ${error instanceof Error ? error.message : 'Unknown error'}`);
//             }
            
            
//         };
    
//     // The invoice object returned from getInvoice already conforms to the Invoice type.
//     // We only need this if we were converting string dates from a database fetch.
//     const displayInvoice: Invoice = {
//         ...invoice,
//         invoiceDate: new Date(invoice.invoiceDate),
//         dueDate: new Date(invoice.dueDate),
//         status: invoice.status as InvoiceStatus, 
//     };
//     //console.log("invoice====>",invoice)
//     return (
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
//             {/* Header with status and action buttons */}
//             <InvoiceDetailHeader invoice={displayInvoice} onDelete={handleIODeleteExternal} />
            
//             {/* Main detail content */}
//             <div className="bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                               
//                 {/* Invoice Details component */}
//                 <InvoiceDetailView invoice={displayInvoice} />
                
//                 <p className="mt-8 text-center text-xs sm:text-sm text-gray-500 border-t pt-4">
//                     This invoice was created on {new Date(displayInvoice.invoiceDate).toLocaleDateString()}.
//                 </p>
//             </div>
//         </div>
//     );
// }


// async function getInvoice(id: string): Promise<Invoice | null> {
//     try {
//         const invoice = await prisma.invoice.findUnique({
//             where: { id: id },
//             include: {
//                 customer: true, // Assuming your model includes customer data
//                 items: true,    // Include line items
                
//             },
//         });
//         return invoice as Invoice | null; // Cast to the client-side Invoice type
//     } catch (error) {
//         console.error(`Database error fetching invoice ${id}:`, error);
//         return null;
//     }
// }

