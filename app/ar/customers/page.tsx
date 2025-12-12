'use client';

import React, { useState } from 'react';
//import { useFetchData } from '@/hooks/useFetchData';
//import { CustomerForm } from '@/components/forms/CustomerForm';
import { Customer } from '@prisma/client'; // Use the full Prisma type for the list view
import { useFetchData } from '../hooks/useFetchData';
import { CustomerForm } from '../_components/features/invoices/CustomerForm';

// Re-using the ProductOption interface structure from the previous response
interface CustomerOption {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: string;
}

export default function CustomerManagementPage() {
    const { data: customers, loading, error, refetch } = useFetchData<CustomerOption[]>('/ar/api/customers');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleCreationSuccess = () => {
        setIsFormOpen(false); // Close modal on success
        refetch(); // Fetch the updated list
    };

    return (
        <div className="container mx-auto p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-indigo-700">Customer List</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
                >
                    + Add New Customer
                </button>
            </header>

            {/* Creation Modal (Simple implementation) */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                        <div className="flex justify-end">
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">
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
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
            )}
        </div>
    );
}