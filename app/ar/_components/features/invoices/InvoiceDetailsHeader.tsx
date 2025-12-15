// src/components/features/invoices/InvoiceDetailHeader.tsx
'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
// Assuming the Invoice and InvoiceStatus types are defined in '@/app/ar/types/finance'
import { Invoice, InvoiceStatus } from '@/app/ar/types/finance'; 

interface InvoiceDetailHeaderProps {
    invoice: Invoice;
}

const statusClasses: Record<InvoiceStatus | string, string> = {
    DRAFT: 'bg-gray-200 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    VOID: 'bg-black text-white' // Using black for VOID as a distinct status
};

const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({ invoice }) => {
    const router = useRouter();
    // Mocking loading state for simplicity
    const isLoading = false; 

    const handleEdit = () => {
        router.push(`/ar/invoices/edit/${invoice.id}`);
    };

    const handleMarkPaid = () => {
        // Implement API call to mark as paid here
        console.log(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
            // Implement API call to delete invoice here
            console.log(`Action: Delete Invoice ${invoice.invoiceNumber}.`);
        }
    };

    const statusClass = statusClasses[invoice.status as keyof typeof statusClasses] || statusClasses.DRAFT;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 bg-white rounded-lg shadow-lg">
            
            {/* Invoice Info & Status (Left Side - Always aligned left) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto pb-3 sm:pb-0">
                <span className="text-xl font-bold text-gray-900">
                    Invoice: <span className="text-indigo-600">{invoice.invoiceNumber}</span>
                </span>
                <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full uppercase ${statusClass}`}>
                    {invoice.status}
                </span>
            </div>
            
            {/* Action Buttons (Right Side - Stack vertically on mobile, wrap horizontally on desktop) */}
            {/* Added w-full and border-t on mobile for better separation and full-width buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                
                {/* Edit Button */}
                {invoice.status !== InvoiceStatus.VOID && (
                    <button
                        onClick={handleEdit}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Edit
                    </button>
                )}

                {/* Mark Paid Button */}
                {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.VOID && (
                    <button
                        onClick={handleMarkPaid}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                        Mark as Paid
                    </button>
                )}
                
                {/* Delete Button */}
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default InvoiceDetailHeader;
// // src/components/features/invoices/InvoiceDetailHeader.tsx
// 'use client'; 

// import React from 'react';
// import { useRouter } from 'next/navigation';
// import { Invoice, InvoiceStatus } from '@/app/ar/types/finance';
// interface InvoiceDetailHeaderProps {
//     invoice: Invoice;
// }

// const statusClasses: Record<InvoiceStatus | string, string> = {
//     DRAFT: 'bg-gray-200 text-gray-700',
//     SENT: 'bg-blue-100 text-blue-700',
//     PAID: 'bg-green-100 text-green-700',
//     OVERDUE: 'bg-red-100 text-red-700',
//     [InvoiceStatus.VOID]: 'bg-yellow-100 text-yellow-800'
// };

// const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({ invoice }) => {
//     const router = useRouter();
//     // const { markPaid, deleteInvoice, isLoading } = useInvoices(); 
//     const isLoading = false; // Mocking loading state for simplicity

//     const handleEdit = () => {
//          router.push(`/ar/invoices/edit/${invoice.id}`);
//         //console.log(`Action: Edit Invoice ${invoice.invoiceNumber}`);
//     };

//     const handleMarkPaid = () => {
//         // alert(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
//         console.log(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
//     };

//     const handleDelete = () => {
//         if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
//             // alert(`Action: Delete Invoice ${invoice.invoiceNumber}.`);
//             console.log(`Action: Delete Invoice ${invoice.invoiceNumber}.`);
//         }
//     };

//     const statusClass = statusClasses[invoice.status] || statusClasses.DRAFT;

//     return (
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 bg-white rounded-lg shadow-md">
            
//             {/* Invoice Info & Status (Left Side) */}
//             <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-0">
//                 <span className="text-lg sm:text-xl font-semibold text-gray-700">Invoice: {invoice.invoiceNumber}</span>
//                 <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full uppercase ${statusClass}`}>
//                     {invoice.status}
//                 </span>
//             </div>
            
//             {/* Action Buttons (Right Side) - Stack vertically on mobile, horizontally on desktop */}
//             <div className="flex flex-wrap gap-2 justify-end">
//                 <button
//                     onClick={handleEdit}
//                     disabled={isLoading}
//                     className="flex-grow sm:flex-grow-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
//                 >
//                     Edit
//                 </button>

//                 {invoice.status !== InvoiceStatus.PAID && (
//                     <button
//                         onClick={handleMarkPaid}
//                         disabled={isLoading}
//                         className="flex-grow sm:flex-grow-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
//                     >
//                         Mark as Paid
//                     </button>
//                 )}
                
//                 <button
//                     onClick={handleDelete}
//                     disabled={isLoading}
//                     className="flex-grow sm:flex-grow-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition"
//                 >
//                     Delete
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default InvoiceDetailHeader;