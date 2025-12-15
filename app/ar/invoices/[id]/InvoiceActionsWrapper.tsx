// src/app/invoices/[id]/InvoiceActionsWrapper.tsx
'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 
import { PrinterIcon, FileTextIcon, FileDownIcon, Edit3Icon, MoreVerticalIcon, Trash2Icon, ChevronLeft } from 'lucide-react'; // Assuming you use lucide icons

// Assuming you have components like this (if not, you'd replace them with standard HTML/CSS)
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'; 
import { Button } from '@/components/ui/button'; // Assuming a Button component
import InvoiceDetailHeader from '../../_components/features/invoices/InvoiceDetailsHeader';
import { 
    Invoice, 
    Customer, 
    InvoiceItem, 
    InvoiceStatus
} from '@/app/ar/types/finance'; 

// Helper function to map status to Tailwind classes for a visual badge
const getStatusBadgeClasses = (status: InvoiceStatus): string => {
    switch (status) {
        case 'PAID':
            return 'bg-green-100 text-green-700';
        // case 'PENDING':
        //     return 'bg-yellow-100 text-yellow-700';
        case 'DRAFT':
            return 'bg-gray-100 text-gray-700';
        case 'OVERDUE':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-blue-100 text-blue-700';
    }
};

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

    
const handleReturnToList = () => {
        // Navigate to the main invoice list page
        router.push('/ar/invoices'); 
    };

return (
    // Primary container layout: flex-col on mobile, flex-row on desktop,
    // w-full on mobile, fixed width/max-width often used on desktop (though here we just control flow).
    // On small screens, items stack (flex-col). On desktop (sm:), they flow horizontally.
    <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center p-4 bg-white rounded-xl shadow-lg mb-6">
        
        {/* TOP/LEFT: Return to List Link (Full width on mobile, pushed to the left/top) */}
        <div className="w-full sm:w-auto mb-4 sm:mb-0 mr-auto">
            <button
                onClick={handleReturnToList}
                // Removed redundant 'flex items-center' as the container is flex-col by default on mobile.
                // Added text-left to ensure text alignment is logical if it spans full width.
                className="w-full sm:w-auto flex items-center text-gray-600 hover:text-gray-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-gray-100"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Return to List
            </button>
        </div>

        
        {/* BOTTOM/RIGHT: Action Buttons (Delegated Header Actions + Dropdown) */}
        {/* ml-auto on desktop pushes this content to the far right, and on mobile ensures it is right-aligned 
            if the parent wasn't forced to justify-between. Given the above structure, we rely on the sm:flex-row parent. */}
        <div className="flex items-center space-x-3 ml-auto sm:ml-0">
            
            {/* 1. Delegated Primary Actions (Edit/Mark Paid) */}
            <InvoiceDetailHeader 
                invoice={invoice} 
                onDelete={handleDelete} 
                //onMarkPaid={handleMarkPaid} 
                //isLoading={isLoading} 
            />

            {/* 2. Dropdown Menu for Secondary Actions (Print/Export) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isLoading} className="border-gray-300">
                        <MoreVerticalIcon className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    
                    <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                    
                    {/* Output Actions */}
                    <DropdownMenuItem onClick={handlePrintPDF}>
                        <PrinterIcon className="w-4 h-4 mr-2" /> Print/Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                        <FileDownIcon className="w-4 h-4 mr-2" /> Export to Excel
                    </DropdownMenuItem> 
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    </div>
);
};

export default InvoiceActionsWrapper;