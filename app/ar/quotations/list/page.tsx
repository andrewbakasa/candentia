// src/app/ar/quotations/list/page.tsx (Using useQuotations Hook)
'use client';

import React from 'react';
import Link from 'next/link';
import { 
    PlusCircleIcon, 
    PencilIcon, 
    EyeIcon, 
    Trash2Icon,
    ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Quotation } from '@prisma/client';
import { useQuotations } from '../../hooks/useQuotations';
import ConfirmAction from '@/app/de/_components/ConfirmAction';


// Helper to style status badge (Keep this local since it's UI logic)
const StatusBadge: React.FC<{ status: Quotation['status'] }> = ({ status }) => {
    const baseStyle = "px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
        case 'ACCEPTED':
            return <span className={`${baseStyle} bg-green-100 text-green-800`}>Accepted</span>;
        case 'PENDING':
            return <span className={`${baseStyle} bg-yellow-100 text-yellow-800`}>Pending</span>;
        case 'DRAFT':
            return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>Draft</span>;
        case 'REJECTED':
            return <span className={`${baseStyle} bg-red-100 text-red-800`}>Rejected</span>;
        default:
            return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>{status}</span>;
    }
};

export default function QuotationListPage() {
    const router = useRouter();

    // 2. USE THE HOOK
    const { 
        quotations, 
        isLoading, 
        error, 
        deleteQuotation, 
        isMutating 
    } = useQuotations(); 

    const handleDelete = async (id: string) => {
        if (isMutating) return;

        // if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
        //     return;
        // }

        const success = await deleteQuotation(id);
        if (!success) {
            alert("Error deleting quotation. Please try again.");
        }
    };

    // 3. HANDLE LOADING AND ERROR STATES
    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Quotations...</div>;
    }

    if (error) {
        return (
             <div className="p-8 text-center text-red-700 bg-red-50 border border-red-300 rounded-lg max-w-xl mx-auto mt-10">
                <p className="font-semibold mb-2">Error Loading Data</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
            {/* Header (No change) */}
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <div>
                    <Link href="/ar" className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit mb-2">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        All Quotations
                    </h1>
                </div>
                <Link href="/ar/quotations/create">
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 text-sm sm:text-base whitespace-nowrap">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        New Quote
                    </button>
                </Link>
            </div>
            
            {/* Quotations Table */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quote #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created On
                            </th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotations.map((quote) => (
                            <tr key={quote.id} className="hover:bg-indigo-50 transition duration-100">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                    <Link href={`/ar/quotations/${quote.id}`} className="hover:underline">
                                        {quote.quotationNumber}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {quote.customer.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                    ${quote.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <StatusBadge status={quote.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(quote.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <Link href={`/ar/quotations/${quote.id}`}>
                                            <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100 transition"><EyeIcon className="w-5 h-5" /></button>
                                        </Link>
                                        <Link href={`/ar/quotations/edit/${quote.id}`}>
                                            <button className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-100 transition"><PencilIcon className="w-5 h-5" /></button>
                                        </Link>
                                        {/* <button 
                                            onClick={() => handleDelete(quote.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 transition disabled:opacity-50"
                                            disabled={isMutating} // Disable delete button while any mutation (like another delete) is in progress
                                        >
                                            <Trash2Icon className="w-5 h-5" />
                                        </button> */}
                                         <ConfirmAction 
                                            onConfirm={handleDelete} 
                                            itemId={quote.id}
                                            action="Delete" 
                                            heading="Delete Qoute"
                                            description={`This action will permanently delete Qoutation ${quote.id}.`}
                                            showHint={false} 
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {quotations.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        No quotations found. Start by creating a new one.
                    </div>
                )}
            </div>
        </div>
    );
}