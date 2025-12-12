// src/components/features/invoices/InvoiceDetailHeader.tsx
'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, InvoiceStatus } from '@/app/ar/types/finance'; 
import { useInvoices } from '@/app/ar/hooks/useInvoice';
//import { useInvoices } from '@/hooks/useInvoices'; // Assuming you have update/delete methods here

interface InvoiceDetailHeaderProps {
    invoice: Invoice;
}

const statusClasses: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-gray-200 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    [InvoiceStatus.VOID]: ''
};

const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({ invoice }) => {
    const router = useRouter();
    // Assuming useInvoices hook has mutation methods (e.g., markPaid, deleteInvoice)
    // const { markPaid, deleteInvoice, isLoading } = useInvoices(); 
    const isLoading = false; // Mocking loading state for simplicity

    const handleEdit = () => {
        router.push(`/ar/invoices/edit/${invoice.id}`);
    };

    const handleMarkPaid = () => {
        // Implement API call to update status to PAID
        alert(`Action: Mark Invoice ${invoice.invoiceNumber} as PAID.`);
        // await markPaid(invoice.id);
        // router.refresh(); // To re-fetch server data
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
            // Implement API call to delete invoice
            alert(`Action: Delete Invoice ${invoice.invoiceNumber}.`);
            // await deleteInvoice(invoice.id);
            // router.push('/invoices'); // Redirect to list page
        }
    };

    const statusClass = statusClasses[invoice.status] || statusClasses.DRAFT;

    return (
        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-4">
                <span className="text-xl font-semibold text-gray-700">Invoice: {invoice.invoiceNumber}</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase ${statusClass}`}>
                    {invoice.status}
                </span>
            </div>
            
            <div className="space-x-3">
                <button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                    Edit
                </button>

                {invoice.status !== InvoiceStatus.PAID && (
                    <button
                        onClick={handleMarkPaid}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                        Mark as Paid
                    </button>
                )}
                
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default InvoiceDetailHeader;