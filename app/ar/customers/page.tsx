'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    ChevronLeft, Plus, Search, User, 
    Mail, Phone, CreditCard, ArrowUpRight, 
    MoreVertical, UserPlus, Filter
} from 'lucide-react'; 
import { useFetchData } from '../hooks/useFetchData';
import { CustomerForm } from '../_components/features/invoices/CustomerForm';
import { cn } from "@/lib/utils";

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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 active:scale-[0.98] transition-transform">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                    {customer.name.charAt(0)}
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">{customer.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {customer.id.slice(-6)}</span>
                </div>
            </div>
            <button className="p-2 text-slate-400">
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>

        <div className="grid grid-cols-1 gap-3 py-3 border-y border-slate-50">
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{customer.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone || 'No phone provided'}</span>
            </div>
        </div>

        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                <CreditCard className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{customer.paymentTerms || 'COD'}</span>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-black text-indigo-600 uppercase tracking-wider">
                View Profile <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
);

export default function CustomerManagementPage() {
    const { data: customers = [], loading, error, refetch } = useFetchData<CustomerOption[]>('/ar/api/customers');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers?.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    const handleCreationSuccess = () => {
        setIsFormOpen(false);
        refetch();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col gap-6 mb-8">
                    <div>
                        <Link 
                            href="/ar" 
                            className="inline-flex items-center text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors mb-4"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Return to Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">Manage accounts receivable and client billing details.</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm uppercase tracking-wider gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add New Customer
                            </button>
                        </div>
                    </div>

                    {/* --- SEARCH & FILTERS --- */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search customers by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-slate-300"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-100 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Records...</p>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                        <p className="text-red-600 font-bold">Failed to load customers. Please verify connection.</p>
                    </div>
                )}
                
                {!loading && !error && (
                    <>
                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden md:block bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200/60">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {filteredCustomers?.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900">{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                                                        <Mail className="w-3 h-3" /> {customer.email || '---'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-1 font-medium italic">{customer.phone || 'No phone'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
                                                    {customer.paymentTerms || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden space-y-2">
                            {filteredCustomers && filteredCustomers?.length > 0 ? (
                                filteredCustomers?.map((customer) => (
                                    <CustomerCard key={customer.id} customer={customer} />
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <User className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-sm uppercase">No Matching Clients</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* CREATION MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
                    <div className="bg-white rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">New Client Profile</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add a new entity to the AR system</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl p-2">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <CustomerForm onSuccess={handleCreationSuccess} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { ChevronLeft } from 'lucide-react'; // Import icon
// import { Customer } from '@prisma/client'; 
// import { useFetchData } from '../hooks/useFetchData';
// import { CustomerForm } from '../_components/features/invoices/CustomerForm';

// interface CustomerOption {
//     id: string;
//     name: string;
//     email?: string;
//     phone?: string;
//     address?: string;
//     paymentTerms?: string;
// }

// // --- Mobile Card Component ---
// const CustomerCard: React.FC<{ customer: CustomerOption }> = ({ customer }) => (
//     <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-3">
//         <div className="flex justify-between items-center mb-1">
//             <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
//             {/* Optional: Add an Edit/Action button here */}
//             {/* <button className="text-indigo-600 text-sm">Edit</button> */}
//         </div>
//         <div className="text-sm text-gray-600 space-y-1">
//             <p className="truncate"><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
//             <p><span className="font-medium">Phone:</span> {customer.phone || 'N/A'}</p>
//             <p><span className="font-medium">Terms:</span> {customer.paymentTerms || 'N/A'}</p>
//         </div>
//     </div>
// );


// export default function CustomerManagementPage() {
//     const { data: customers, loading, error, refetch } = useFetchData<CustomerOption[]>('/ar/api/customers');
//     const [isFormOpen, setIsFormOpen] = useState(false);

//     const handleCreationSuccess = () => {
//         setIsFormOpen(false); // Close modal on success
//         refetch(); // Fetch the updated list
//     };

//     return (
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
//             {/* --- IMPROVED RESPONSIVE HEADER --- */}
//             <div className="flex flex-col mb-6 sm:mb-8">
                
//                 {/* 1. TOP ROW: Back to Dashboard Link (Visible on all screens) */}
//                 <div className="mb-3"> 
//                     <Link 
//                         href="/ar" 
//                         className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit"
//                         aria-label="Return to AR Dashboard"
//                     >
//                         <ChevronLeft className="w-5 h-5 mr-1" />
//                         <span className="text-sm font-medium">Dashboard</span>
//                     </Link>
//                 </div>

//                 {/* 2. BOTTOM ROW: Title and Action Button */}
//                 <header className="flex justify-between items-center">
//                     <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Customer List</h1>
//                     <button
//                         onClick={() => setIsFormOpen(true)}
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base whitespace-nowrap"
//                     >
//                         + Add New Customer
//                     </button>
//                 </header>
//             </div>


//             {/* Creation Modal (Retained) */}
//             {isFormOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
//                         <div className="flex justify-between items-center mb-4 border-b pb-2">
//                              <h2 className="text-2xl font-semibold">Create New Customer</h2>
//                              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
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
//                 <>
//                     {/* DESKTOP TABLE VIEW (Visible on tablet/desktop) */}
//                     <div className="hidden md:block bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
//                         <table className="min-w-full divide-y divide-gray-200">
//                             <thead className="bg-gray-50">
//                                 <tr>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {customers.map((customer) => (
//                                     <tr key={customer.id} className="hover:bg-gray-50">
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || 'N/A'}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.paymentTerms || 'N/A'}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {customers.length === 0 && <p className="p-6 text-center text-gray-500">No customers found.</p>}
//                     </div>

//                     {/* MOBILE CARD VIEW (Visible on mobile/small tablet) */}
//                     <div className="md:hidden">
//                         {customers.length > 0 ? (
//                             customers.map((customer) => (
//                                 <CustomerCard key={customer.id} customer={customer} />
//                             ))
//                         ) : (
//                             <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
//                                 <p className="text-lg font-medium">No customers found.</p>
//                                 <p>Click + Add New Customer to create your first one.</p>
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }