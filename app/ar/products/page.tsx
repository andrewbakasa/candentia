'use client';

import React, { useState } from 'react';
//import { useFetchData } from '@/hooks/useFetchData';
//import { ProductForm } from '@/components/forms/ProductForm';
import { Product } from '@prisma/client'; // Use the full Prisma type for the list view
import { useFetchData } from '../hooks/useFetchData';
import { ProductForm } from '../_components/features/invoices/ProductForm';

// Re-using the ProductOption interface structure from the previous response
interface ProductOption {
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    unitCost: number;
}

export default function ProductManagementPage() {
    // The GET endpoint /ar/api/products returns ProductOption[]
    const { data: products, loading, error, refetch } = useFetchData<ProductOption[]>('/ar/api/products');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleCreationSuccess = () => {
        setIsFormOpen(false); // Close modal on success
        refetch(); // Fetch the updated list
    };

    return (
        <div className="container mx-auto p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-green-700">Product Inventory</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
                >
                    + Add New Product
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
                        <ProductForm onSuccess={handleCreationSuccess} />
                    </div>
                </div>
            )}

            {/* List View */}
            {loading && <p className="text-center py-10">Loading inventory...</p>}
            {error && <p className="text-center py-10 text-red-600">Error loading products: {error}</p>}
            
            {!loading && !error && products && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {product.stockQuantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        ${product.unitCost.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && <p className="p-6 text-center text-gray-500">No products found.</p>}
                </div>
            )}
        </div>
    );
}