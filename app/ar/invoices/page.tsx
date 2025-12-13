'use client'
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useInvoices } from '../hooks/useInvoice';
import InvoiceTable from '../_components/features/invoices/InvoiceTable';

// Assume useInvoices, InvoiceTable, and types are correctly imported/defined.

const InvoiceListPage = () => {
   const { invoices, isLoading, error, fetchInvoices } = useInvoices();

//     // Fetch data on component mount
    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="flex justify-between items-center mb-6 sm:mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Invoices</h1>
                <Link 
                    href="/ar/invoices/create" 
                    className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg shadow-lg hover:bg-indigo-700 transition duration-150 ease-in-out font-medium"
                >
                    + New Invoice
                </Link>
            </header>
            
            {isLoading && <p className="text-center text-indigo-500 py-12">Loading invoices...</p>}
            {error && <p className="text-center text-red-500 py-12">Error: {error}</p>}
            
            {!isLoading && !error && (
                <>
                    {/* InvoiceTable component handles both desktop (default) and mobile (card view) */}
                    <InvoiceTable invoices={invoices} />
                    
                    {invoices.length === 0 && (
                        <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
                            <p className="text-lg font-medium">No invoices found.</p>
                            <p>Click + New Invoice to create your first one.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InvoiceListPage;
// 'use client'
// import React, { useEffect } from 'react';
// import Link from 'next/link';
// import { useInvoices } from '../hooks/useInvoice';
// import InvoiceTable from '../_components/features/invoices/InvoiceTable';

// const InvoiceListPage = () => {
//     const { invoices, isLoading, error, fetchInvoices } = useInvoices();

//     // Fetch data on component mount
//     useEffect(() => {
//         fetchInvoices();
//     }, [fetchInvoices]);

//     return (
//         <div className="container mx-auto p-8">
//             <header className="flex justify-between items-center mb-8">
//                 <h1 className="text-4xl font-bold text-gray-800">Invoices</h1>
//                 <Link href="/ar/invoices/create" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition">
//                     + New Invoice
//                 </Link>
//             </header>
            
//             {isLoading && <p className="text-center text-indigo-500">Loading invoices...</p>}
//             {error && <p className="text-center text-red-500">Error: {error}</p>}
            
//             {!isLoading && !error && <InvoiceTable invoices={invoices} />}
//         </div>
//     );
// };

// export default InvoiceListPage;