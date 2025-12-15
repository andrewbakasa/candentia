'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, DollarSign, Archive, Tag } from 'lucide-react'; // Import icons
import { Product } from '@prisma/client'; 
import { useFetchData } from '../hooks/useFetchData';
import { ProductForm } from '../_components/features/invoices/ProductForm';

interface ProductOption {
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    unitCost: number;
}

// --- Mobile Card Component ---
const ProductCard: React.FC<{ product: ProductOption }> = ({ product }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-3 transition duration-150 hover:shadow-lg">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            {/* Stock Quantity Badge */}
            <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
            >
                <Archive className="w-3 h-3 mr-1" />
                {product.stockQuantity} in Stock
            </span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-gray-400" /> <span className="font-medium">SKU:</span> {product.sku}</p>
            <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-gray-400" /> <span className="font-medium">Cost:</span> ${product.unitCost.toFixed(2)}</p>
        </div>
    </div>
);


export default function ProductManagementPage() {
    const { data: products, loading, error, refetch } = useFetchData<ProductOption[]>('/ar/api/products');
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
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Product Inventory</h1>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base whitespace-nowrap flex items-center"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        + New Product
                    </button>
                </header>
            </div>


            {/* Creation Modal (Adjusted styling for better mobile fit) */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                             <h2 className="text-2xl font-semibold">Create New Product</h2>
                             <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
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
                <>
                    {/* DESKTOP TABLE VIEW (Visible on tablet/desktop) */}
                    <div className="hidden md:block bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
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

                    {/* MOBILE CARD VIEW (Visible on mobile/small tablet) */}
                    <div className="md:hidden">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
                                <p className="text-lg font-medium">No products found.</p>
                                <p>Click + New Product to create your first one.</p>
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
// //import { ProductForm } from '@/components/forms/ProductForm';
// import { Product } from '@prisma/client'; // Use the full Prisma type for the list view
// import { useFetchData } from '../hooks/useFetchData';
// import { ProductForm } from '../_components/features/invoices/ProductForm';

// // Re-using the ProductOption interface structure from the previous response
// interface ProductOption {
//     id: string;
//     sku: string;
//     name: string;
//     stockQuantity: number;
//     unitCost: number;
// }

// export default function ProductManagementPage() {
//     // The GET endpoint /ar/api/products returns ProductOption[]
//     const { data: products, loading, error, refetch } = useFetchData<ProductOption[]>('/ar/api/products');
//     const [isFormOpen, setIsFormOpen] = useState(false);

//     const handleCreationSuccess = () => {
//         setIsFormOpen(false); // Close modal on success
//         refetch(); // Fetch the updated list
//     };

//     return (
//         <div className="container mx-auto p-8">
//             <header className="flex justify-between items-center mb-6">
//                 <h1 className="text-3xl font-bold text-green-700">Product Inventory</h1>
//                 <button
//                     onClick={() => setIsFormOpen(true)}
//                     className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
//                 >
//                     + Add New Product
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
//                         <ProductForm onSuccess={handleCreationSuccess} />
//                     </div>
//                 </div>
//             )}

//             {/* List View */}
//             {loading && <p className="text-center py-10">Loading inventory...</p>}
//             {error && <p className="text-center py-10 text-red-600">Error loading products: {error}</p>}
            
//             {!loading && !error && products && (
//                 <div className="bg-white shadow-lg rounded-lg overflow-hidden">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                             <tr>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {products.map((product) => (
//                                 <tr key={product.id} className="hover:bg-gray-50">
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
//                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
//                                             {product.stockQuantity}
//                                         </span>
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
//                                         ${product.unitCost.toFixed(2)}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                     {products.length === 0 && <p className="p-6 text-center text-gray-500">No products found.</p>}
//                 </div>
//             )}
//         </div>
//     );
// }