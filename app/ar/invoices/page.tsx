'use client'
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useInvoices } from '../hooks/useInvoice';
import InvoiceTable from '../_components/features/invoices/InvoiceTable';
import { ChevronLeft } from 'lucide-react';

const InvoiceListPage = () => {
   const { invoices, isLoading, error, fetchInvoices } = useInvoices();

   useEffect(() => {
       fetchInvoices();
   }, [fetchInvoices]);

   return (
       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
           
           {/* Responsive Header Container */}
           <div className="flex flex-col mb-6 sm:mb-8">
               
               {/* 1. TOP ROW (Always Visible): Back to Dashboard Link */}
               {/* On mobile, this link stands alone (w-full). On desktop (sm:), it shrinks to fit content. */}
               <div className="mb-3"> 
                   <Link 
                       href="/ar" 
                       // Ensure link is clean and tappable
                       className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit" 
                       aria-label="Return to AR Dashboard"
                   >
                       <ChevronLeft className="w-5 h-5 mr-1" />
                       <span className="text-sm font-medium">Dashboard</span>
                   </Link>
               </div>

               {/* 2. BOTTOM ROW (Always Visible): Title and Action Button */}
               <header className="flex justify-between items-center">
                   
                   {/* Title Area */}
                   <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Invoices</h1>
                   
                   {/* New Invoice Button */}
                   <Link 
                       href="/ar/invoices/create" 
                       className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg shadow-lg hover:bg-indigo-700 transition duration-150 ease-in-out font-medium"
                   >
                       + New Invoice
                   </Link>
               </header>
           </div>
           
           {isLoading && <p className="text-center text-indigo-500 py-12">Loading invoices...</p>}
           {error && <p className="text-center text-red-500 py-12">Error: {error}</p>}
           
           {!isLoading && !error && (
               <>
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

// // Assume useInvoices, InvoiceTable, and types are correctly imported/defined.

// const InvoiceListPage = () => {
//    const { invoices, isLoading, error, fetchInvoices } = useInvoices();

// //     // Fetch data on component mount
//     useEffect(() => {
//         fetchInvoices();
//     }, [fetchInvoices]);

//     return (
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
//             <header className="flex justify-between items-center mb-6 sm:mb-8">
//                 <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Invoices</h1>
//                 <Link 
//                     href="/ar/invoices/create" 
//                     className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg shadow-lg hover:bg-indigo-700 transition duration-150 ease-in-out font-medium"
//                 >
//                     + New Invoice
//                 </Link>
//             </header>
            
//             {isLoading && <p className="text-center text-indigo-500 py-12">Loading invoices...</p>}
//             {error && <p className="text-center text-red-500 py-12">Error: {error}</p>}
            
//             {!isLoading && !error && (
//                 <>
//                     {/* InvoiceTable component handles both desktop (default) and mobile (card view) */}
//                     <InvoiceTable invoices={invoices} />
                    
//                     {invoices.length === 0 && (
//                         <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
//                             <p className="text-lg font-medium">No invoices found.</p>
//                             <p>Click + New Invoice to create your first one.</p>
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// export default InvoiceListPage;