// src/app/invoices/[id]/InvoiceActionsWrapper.tsx
'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 
import { PrinterIcon, FileTextIcon, FileDownIcon } from 'lucide-react'; // Assuming you use lucide icons

import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
import { 
    Invoice, 
    Customer, 
    InvoiceItem 
} from '@/app/ar/types/finance'; 

type FullInvoice = Invoice & {
    customer: Customer;
    items: InvoiceItem[];
};

// Define the interface for the header component props (assuming you've updated it)
interface InvoiceDetailHeaderProps {
    invoice: FullInvoice;
    onDelete: () => void;
    onMarkPaid: () => void;
    isLoading: boolean; 
    // New optional props for print/export links
    onPrint: () => void; 
    onExportExcel: () => void;
}


interface InvoiceActionsWrapperProps {
    invoice: FullInvoice;
}

const InvoiceActionsWrapper: React.FC<InvoiceActionsWrapperProps> = ({ invoice }) => {
    const router = useRouter();
    const isLoading = false; 

    // --- EXISTING HANDLERS (omitted for brevity) ---

    const handleDelete = async () => {
        // ... (existing handleDelete logic) ...
        const apiRoute = `/ar/api/invoice/${invoice.id}`; // Matches the path used in the original faulty code
        // ... (rest of the delete logic) ...
    };

    const handleMarkPaid = async () => {
        // ... (existing handleMarkPaid logic) ...
    };

    // --- NEW HANDLERS FOR PRINT/EXPORT ---

    const handlePrintPDF = () => {
        // 1. **Client-side Print:** Opens the browser's native print dialog for the current page.
        window.print();

        // 2. **Server-side PDF Generation (Alternative):** // If you need a custom-formatted PDF that is different from the page view, 
        // you would navigate to a dedicated API route:
        // window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
    };

    const handleExportExcel = () => {
        // Triggers the download by navigating the window to a dedicated API route.
        // The API route must respond with the correct headers (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
        window.open(`/ar/api/invoices/${invoice.id}/excel`, '_blank');
        toast.success("Invoice export initiated.");
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 bg-white rounded-lg shadow-lg mb-6">
            
            {/* Invoice Info & Status (Left Side) - Rendered for context/consistency */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto pb-3 sm:pb-0">
                <span className="text-xl font-bold text-gray-900">
                    Invoice: <span className="text-indigo-600">{invoice.invoiceNumber}</span>
                </span>
                <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full uppercase bg-green-100 text-green-700`}>
                    {invoice.status}
                </span>
            </div>
            
            {/* Action Buttons (Right Side) */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                
                {/* PDF Print Button (Client-side Print) */}
                <button
                    onClick={handlePrintPDF}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-blue-400 text-blue-700 rounded-md hover:bg-blue-50 transition flex items-center justify-center"
                >
                    <PrinterIcon className="w-4 h-4 mr-2" /> Print (PDF)
                </button>

                {/* Excel Export Button */}
                <button
                    onClick={handleExportExcel}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-green-400 text-green-700 rounded-md hover:bg-green-50 transition flex items-center justify-center"
                >
                    <FileDownIcon className="w-4 h-4 mr-2" /> Export (Excel)
                </button>

                {/* Render the standard header actions, passing the handlers */}
                <InvoiceDetailHeader 
                    invoice={invoice} 
                    onDelete={handleDelete} 
                   // onMarkPaid={handleMarkPaid} 
                   // isLoading={isLoading} 
                    // Note: You would update the InvoiceDetailHeader to include these buttons 
                    // and use the handlers. For this example, I've defined them here 
                    // and rendered the buttons directly in this wrapper.
                />
            </div>
        </div>
    );
};

export default InvoiceActionsWrapper;

// src/app/invoices/[id]/InvoiceActionsWrapper.tsx
// 'use client'; 

// import React from 'react';
// import { useRouter } from 'next/navigation';
// // Assuming you have 'react-hot-toast' installed for notifications
// import toast from 'react-hot-toast'; 

// import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
// import { 
//     Invoice, 
//     Customer, 
//     InvoiceItem 
// } from '@/app/ar/types/finance'; 

// // Define the fully loaded invoice type
// type FullInvoice = Invoice & {
//     customer: Customer;
//     items: InvoiceItem[];
// };

// interface InvoiceActionsWrapperProps {
//     invoice: FullInvoice;
// }

// const InvoiceActionsWrapper: React.FC<InvoiceActionsWrapperProps> = ({ invoice }) => {
//     const router = useRouter();
    
//     // Mocking loading state for simplicity
//     const isLoading = false; 

//     // Handler for Invoice Deletion
//     const handleDelete = async () => {
      
//         const apiRoute = `/ar/api/invoices/${invoice.id}`; // Matches the path used in the original faulty code
        
//         try {
//             const response = await fetch(apiRoute, {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' },
//             });

//             if (response.ok) {
//                 toast.success(`Invoice ${invoice.invoiceNumber} deleted successfully.`);
//                 // Navigate back to the invoice list and refresh the route cache
//                 router.push('/ar/invoices'); 
//                 router.refresh(); 
//             } else {
//                 const errorData = await response.json();
//                 toast.error(errorData.message || 'Deletion failed.');
//             }
//         } catch (error) {
//             console.error(`Error deleting invoice ${invoice.id}:`, error);
//             toast.error(`Error deleting invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         }
//     };

//     // Handler for Mark Paid logic
//     const handleMarkPaid = async () => {
//         // Implementation for marking the invoice as paid via API
//         // This is necessary because the InvoiceDetailHeader button requires a handler
//         console.log(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
//         // router.refresh() after successful update
//     };


//     // Pass the handlers down to the InvoiceDetailHeader
//     return (
//         <InvoiceDetailHeader 
//             invoice={invoice} 
//             // Pass the regular functions directly
//             onDelete={handleDelete} 
//             //onMarkPaid={handleMarkPaid} // Assuming you update the header to accept this
//            // isLoading={isLoading} // Assuming you update the header to accept this
//         />
//     );
// };

// export default InvoiceActionsWrapper;