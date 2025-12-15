'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react'; // Import icon
import { Customer } from '@prisma/client'; 
import { useFetchData } from '../hooks/useFetchData';
import { CustomerForm } from '../_components/features/invoices/CustomerForm';

interface CustomerOption {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: string;
}

// --- Mobile Card Component ---
const CustomerCard: React.FC<{ customer: CustomerOption }> = ({ customer }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-3">
        <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
            {/* Optional: Add an Edit/Action button here */}
            {/* <button className="text-indigo-600 text-sm">Edit</button> */}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
            <p className="truncate"><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {customer.phone || 'N/A'}</p>
            <p><span className="font-medium">Terms:</span> {customer.paymentTerms || 'N/A'}</p>
        </div>
    </div>
);


export default function CustomerManagementPage() {
    const { data: customers, loading, error, refetch } = useFetchData<CustomerOption[]>('/ar/api/customers');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleCreationSuccess = () => {
        setIsFormOpen(false); // Close modal on success
        refetch(); // Fetch the updated list
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* --- IMPROVED RESPONSIVE HEADER --- */}
            <div className="flex flex-col mb-6 sm:mb-8">
                
                {/* 1. TOP ROW: Back to Dashboard Link (Visible on all screens) */}
                <div className="mb-3"> 
                    <Link 
                        href="/ar" 
                        className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit"
                        aria-label="Return to AR Dashboard"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                </div>

                {/* 2. BOTTOM ROW: Title and Action Button */}
                <header className="flex justify-between items-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Customer List</h1>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base whitespace-nowrap"
                    >
                        + Add New Customer
                    </button>
                </header>
            </div>


            {/* Creation Modal (Retained) */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                             <h2 className="text-2xl font-semibold">Create New Customer</h2>
                             <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
                                &times;
                            </button>
                        </div>
                        <CustomerForm onSuccess={handleCreationSuccess} />
                    </div>
                </div>
            )}

            {/* List View */}
            {loading && <p className="text-center py-10">Loading customers...</p>}
            {error && <p className="text-center py-10 text-red-600">Error loading customers: {error}</p>}
            
            {!loading && !error && customers && (
                <>
                    {/* DESKTOP TABLE VIEW (Visible on tablet/desktop) */}
                    <div className="hidden md:block bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.paymentTerms || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {customers.length === 0 && <p className="p-6 text-center text-gray-500">No customers found.</p>}
                    </div>

                    {/* MOBILE CARD VIEW (Visible on mobile/small tablet) */}
                    <div className="md:hidden">
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <CustomerCard key={customer.id} customer={customer} />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
                                <p className="text-lg font-medium">No customers found.</p>
                                <p>Click + Add New Customer to create your first one.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
// 'use client';

// import React, { useState } from 'react';
// //import { useFetchData } from '@/hooks/useFetchData';
// //import { CustomerForm } from '@/components/forms/CustomerForm';
// import { Customer } from '@prisma/client'; // Use the full Prisma type for the list view
// import { useFetchData } from '../hooks/useFetchData';
// import { CustomerForm } from '../_components/features/invoices/CustomerForm';

// // Re-using the ProductOption interface structure from the previous response
// interface CustomerOption {
//     id: string;
//     name: string;
//     email?: string;
//     phone?: string;
//     address?: string;
//     paymentTerms?: string;
// }

// export default function CustomerManagementPage() {
//     const { data: customers, loading, error, refetch } = useFetchData<CustomerOption[]>('/ar/api/customers');
//     const [isFormOpen, setIsFormOpen] = useState(false);

//     const handleCreationSuccess = () => {
//         setIsFormOpen(false); // Close modal on success
//         refetch(); // Fetch the updated list
//     };

//     return (
//         <div className="container mx-auto p-8">
//             <header className="flex justify-between items-center mb-6">
//                 <h1 className="text-3xl font-bold text-indigo-700">Customer List</h1>
//                 <button
//                     onClick={() => setIsFormOpen(true)}
//                     className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
//                 >
//                     + Add New Customer
//                 </button>
//             </header>

//             {/* Creation Modal (Simple implementation) */}
//             {isFormOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                     <div className="bg-white p-6 rounded-lg max-w-lg w-full">
//                         <div className="flex justify-end">
//                             <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">
//                                 &times;
//                             </button>
//                         </div>
//                         <CustomerForm onSuccess={handleCreationSuccess} />
//                     </div>
//                 </div>
//             )}

//             {/* List View */}
//             {loading && <p className="text-center py-10">Loading customers...</p>}
//             {error && <p className="text-center py-10 text-red-600">Error loading customers: {error}</p>}
            
//             {!loading && !error && customers && (
//                 <div className="bg-white shadow-lg rounded-lg overflow-hidden">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                             <tr>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {customers.map((customer) => (
//                                 <tr key={customer.id} className="hover:bg-gray-50">
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || 'N/A'}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.paymentTerms || 'N/A'}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                     {customers.length === 0 && <p className="p-6 text-center text-gray-500">No customers found.</p>}
//                 </div>
//             )}
//         </div>
//     );
// }