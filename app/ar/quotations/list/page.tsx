'use client';

import React from 'react';
import Link from 'next/link';
import { 
    PlusCircleIcon, 
    PencilIcon, 
    EyeIcon, 
    Trash2Icon,
    ChevronLeft,
    DollarSignIcon,
    CalendarIcon,
    UserIcon,
    TagIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// NOTE: Assuming your Quotation type includes the related Customer object (quote.customer.name)
import { Quotation } from '@prisma/client'; 
// NOTE: The useQuotations hook and ConfirmAction are external and assumed correct
import { useQuotations } from '../../hooks/useQuotations';
import ConfirmAction from '@/app/de/_components/ConfirmAction';


// Helper to style status badge
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
            // Fallback for any other status like EXPIRED or INVOICED
            return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>{status}</span>;
    }
};

// --- NEW COMPONENT: Mobile Card View ---
interface QuotationCardProps {
    quote: any; // Using 'any' for simplicity since Customer is not fully typed here
    handleDelete: (id: string) => Promise<void>;
    isMutating: boolean;
}

const QuotationCard: React.FC<QuotationCardProps> = ({ quote, handleDelete, isMutating }) => (
    <div className="bg-white p-4 shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition duration-150 sm:hidden">
        <div className="flex justify-between items-start mb-3 border-b pb-2">
            <div>
                <Link href={`/ar/quotations/${quote.id}`} className="text-lg font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                    {quote.quotationNumber}
                </Link>
                <div className="mt-1">
                    <StatusBadge status={quote.status} />
                </div>
            </div>
            <div className="text-xl font-extrabold text-gray-900">
                ${quote.totalAmount.toFixed(2)}
            </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center"><UserIcon className="w-4 h-4 mr-2 text-gray-400" /> {quote.customer.name}</p>
            <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-gray-400" /> Created: {new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
            <Link href={`/ar/quotations/${quote.id}`}>
                <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100 transition"><EyeIcon className="w-5 h-5" /></button>
            </Link>
            <Link href={`/ar/quotations/edit/${quote.id}`}>
                <button className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-100 transition"><PencilIcon className="w-5 h-5" /></button>
            </Link>
            <ConfirmAction 
                onConfirm={() => handleDelete(quote.id)} // Pass function reference
                itemId={quote.id}
                action="Delete" 
                heading="Confirm Delete Quotation"
                description={`This action will permanently delete Quotation ${quote.quotationNumber}.`}
                showHint={false} 
            />
        </div>
    </div>
);


// --- EXISTING COMPONENT: Desktop Table Row (Refactored for clarity) ---
interface QuotationTableRowProps {
    quote: any;
    handleDelete: (id: string) => Promise<void>;
}

const QuotationTableRow: React.FC<QuotationTableRowProps> = ({ quote, handleDelete }) => (
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
                <ConfirmAction 
                    onConfirm={() => handleDelete(quote.id)} // Pass function reference
                    itemId={quote.id}
                    action="Delete" 
                    heading="Confirm Delete Quotation"
                    description={`This action will permanently delete Quotation ${quote.quotationNumber}.`}
                    showHint={false} 
                />
            </div>
        </td>
    </tr>
);


// --- MAIN PAGE COMPONENT ---
export default function QuotationListPage() {
    const { 
        quotations, 
        isLoading, 
        error, 
        deleteQuotation, 
        isMutating 
    } = useQuotations(); 

    // Handle delete action using the hook function
    const handleDelete = async (id: string) => {
        if (isMutating) return;

        const success = await deleteQuotation(id);
        if (!success) {
            // Using a more modern notification/toast system would be better here
            alert("Error deleting quotation. Please try again."); 
        }
    };

    // 3. HANDLE LOADING AND ERROR STATES
    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Quotations...</div>;
    }

    if (error) {
        return (
             <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
                <div className="p-8 text-center text-red-700 bg-red-50 border border-red-300 rounded-lg max-w-xl mx-auto mt-10">
                    <p className="font-semibold mb-2">Error Loading Data</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }
    
    // 4. HANDLE EMPTY STATE
    if (quotations.length === 0) {
        return (
            <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
                <HeaderComponent />
                <div className="p-10 text-center text-gray-500 bg-white shadow-xl rounded-xl mt-6">
                    <p className="text-lg font-medium mb-3">No quotations found.</p>
                    <p className="text-sm">Start by creating a new one to see it appear here.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
            <HeaderComponent />
            
            {/* --- MOBILE LIST VIEW (Visible on screens < sm) --- */}
            <div className="space-y-4 sm:hidden">
                {quotations.map((quote) => (
                    <QuotationCard 
                        key={quote.id} 
                        quote={quote} 
                        handleDelete={handleDelete} 
                        isMutating={isMutating}
                    />
                ))}
            </div>

            {/* --- DESKTOP TABLE VIEW (Visible on screens >= sm) --- */}
            <div className="hidden sm:block bg-white shadow-xl rounded-xl overflow-hidden">
                <div className="overflow-x-auto"> {/* Added to prevent overflow on slightly larger phones/small tablets */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    Quote #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/6">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    Created On
                                </th>
                                <th className="relative px-6 py-3 w-1/12">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quotations.map((quote) => (
                                <QuotationTableRow 
                                    key={quote.id} 
                                    quote={quote} 
                                    handleDelete={handleDelete} 
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Separate Header Component for cleanliness
const HeaderComponent = () => (
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
);