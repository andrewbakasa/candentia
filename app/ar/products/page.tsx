'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
    ChevronLeft, 
    ShoppingCart, 
    DollarSign, 
    Archive, 
    Tag, 
    Eye,
    Zap, // Added for Unit Price/Selling Price
    CheckCircle, // Added for Active Status
    XCircle // Added for Inactive Status
} from 'lucide-react'; 
import { useFetchData } from '../hooks/useFetchData';
import { ProductForm } from '../_components/features/invoices/ProductForm';
import { ProductFormData } from '../types/finance';

// 💡 UPDATED INTERFACE: Includes unitPrice and isActive based on API fetch
interface ProductOption {
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    unitCost: number;
    unitPrice: number; // New: Selling Price
    isActive: boolean; // New: Status
    // category?: string; // We can add this if the GET handler is updated to fetch it
}

// --- Mobile Card Component ---
const ProductCard: React.FC<{ product: ProductOption }> = ({ product }) => (
    // Wrap the card content in a Link for the mobile view
    <Link href={`/ar/products/${product.id}`} passHref className="block">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-3 transition duration-150 hover:shadow-lg hover:border-indigo-400 cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{product.name}</h3>
                {/* Status and Stock Quantity Badges */}
                <div className="flex flex-col items-end space-y-1">
                    {/* Active Status Badge */}
                    <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${product.isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}
                    >
                        {product.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {/* Stock Quantity Badge */}
                    <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                        <Archive className="w-3 h-3 mr-1" />
                        {product.stockQuantity} in Stock
                    </span>
                </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-gray-400" /> <span className="font-medium">SKU:</span> {product.sku}</p>
                <p className="flex items-center text-red-700"><DollarSign className="w-4 h-4 mr-2 text-red-400" /> <span className="font-medium">Cost:</span> ${product.unitCost?.toFixed(2)}</p>
                {/* 💡 NEW DETAIL: Unit Price/Selling Price */}
                <p className="flex items-center text-green-700"><Zap className="w-4 h-4 mr-2 text-green-400" /> <span className="font-medium">Price:</span> ${product.unitPrice?.toFixed(2)}</p>
            </div>
            <div className="mt-3 text-right">
                <span className="text-indigo-600 text-xs font-medium flex items-center justify-end">
                    View Details <Eye className="w-4 h-4 ml-1" />
                </span>
            </div>
        </div>
    </Link>
);


export default function ProductManagementPage() {
    // Corrected fetch path to remove unnecessary '/ar' prefix if the API route is correctly defined at /api/products
    // Assuming the path is correct as provided in the original code:
    const { data: products, loading, error, refetch } = useFetchData<ProductOption[]>('/ar/api/products');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleCreationSuccess = () => {
        setIsFormOpen(false); // Close modal on success
        refetch(); // Fetch the updated list
    };
    
    // Placeholder for the form submission logic (if using the modal)
    const handleFormSubmit = async (data: ProductFormData): Promise<void> => {
        // This logic remains the same for the placeholder, but in real use, 
        // it would call the POST /api/products handler.
        console.log("Submitting new product:", data);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        handleCreationSuccess();
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* --- IMPROVED RESPONSIVE HEADER --- */}
            <div className="flex flex-col mb-6 sm:mb-8">
                
                {/* 1. TOP ROW: Back to Dashboard Link */}
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
                    <Link
                        // Using a Link to a dedicated creation page is cleaner than the modal
                        href="/ar/products/create"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base whitespace-nowrap flex items-center"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        + New Product
                    </Link>
                </header>
            </div>


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
                                    {/* 💡 NEW COLUMN: Status */}
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                                    {/* 💡 NEW COLUMN: Unit Price */}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-6 py-3"></th> {/* Action column */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
                                        
                                        {/* 💡 NEW CELL: Status */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {product.stockQuantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            ${product.unitCost.toFixed(2)}
                                        </td>
                                        {/* 💡 NEW CELL: Unit Price */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700">
                                            ${product.unitPrice?.toFixed(2)}
                                        </td>
                                        
                                        {/* View Link Column for Desktop */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link 
                                                href={`/ar/products/${product.id}`}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center justify-end"
                                                title={`View ${product.name} details`}
                                            >
                                                View <Eye className="w-4 h-4 ml-1" />
                                            </Link>
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
// import Link from 'next/link';
// import { ChevronLeft, ShoppingCart, DollarSign, Archive, Tag, Eye } from 'lucide-react'; // Added Eye icon
// import { useFetchData } from '../hooks/useFetchData';
// import { ProductForm } from '../_components/features/invoices/ProductForm';
// import { ProductFormData } from '../types/finance';

// interface ProductOption {
//     id: string;
//     sku: string;
//     name: string;
//     stockQuantity: number;
//     unitCost: number;
// }

// // --- Mobile Card Component ---
// const ProductCard: React.FC<{ product: ProductOption }> = ({ product }) => (
//     // Wrap the card content in a Link for the mobile view
//     <Link href={`/ar/products/${product.id}`} passHref className="block">
//         <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-3 transition duration-150 hover:shadow-lg hover:border-indigo-400 cursor-pointer">
//             <div className="flex justify-between items-start mb-2">
//                 <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{product.name}</h3>
//                 {/* Stock Quantity Badge */}
//                 <span 
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
//                     ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
//                 >
//                     <Archive className="w-3 h-3 mr-1" />
//                     {product.stockQuantity} in Stock
//                 </span>
//             </div>
//             <div className="text-sm text-gray-600 space-y-1">
//                 <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-gray-400" /> <span className="font-medium">SKU:</span> {product.sku}</p>
//                 <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-gray-400" /> <span className="font-medium">Cost:</span> ${product.unitCost.toFixed(2)}</p>
//             </div>
//             <div className="mt-3 text-right">
//                 <span className="text-indigo-600 text-xs font-medium flex items-center justify-end">
//                     View Details <Eye className="w-4 h-4 ml-1" />
//                 </span>
//             </div>
//         </div>
//     </Link>
// );


// export default function ProductManagementPage() {
//     const { data: products, loading, error, refetch } = useFetchData<ProductOption[]>('/ar/api/products');
//     const [isFormOpen, setIsFormOpen] = useState(false);

//     const handleCreationSuccess = () => {
//         setIsFormOpen(false); // Close modal on success
//         refetch(); // Fetch the updated list
//     };

//     // Note: The original ProductForm usage inside the modal had an issue:
//     // It was calling onSubmitSuccess instead of passing it to the onSubmit prop.
//     // I'll keep the required props for ProductForm as defined previously, assuming a fix to the ProductForm component itself.
    
//     // Placeholder for the form submission logic
//     const handleFormSubmit = async (data: ProductFormData): Promise<void> => {
//         // In a real application, you would call your API here (e.g., axios.post('/ar/api/products', data))
//         console.log("Submitting new product:", data);
//         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
//         // Check if submission was successful and call handleCreationSuccess
//         // For this example, we'll assume success.
//         handleCreationSuccess();
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
//                     <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Product Inventory</h1>
//                     <Link
//                        // onClick={() => setIsFormOpen(true)}
//                         href="/ar/products/create"
//                         className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base whitespace-nowrap flex items-center"
//                     >
//                         <ShoppingCart className="w-5 h-5 mr-2" />
//                         + New Product
//                     </Link>
//                 </header>
//             </div>


//             {/* Creation Modal */}
//             {isFormOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
//                         <div className="flex justify-between items-center mb-4 border-b pb-2">
//                              <h2 className="text-2xl font-semibold">Create New Product</h2>
//                              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
//                                 &times;
//                             </button>
//                         </div>
//                         {/* Corrected ProductForm Props */}
//                         <ProductForm 
//                             onSubmit={handleFormSubmit} 
//                             isSubmitting={false} 
//                             isEditing={false} 
//                             onSubmitSuccess={handleCreationSuccess}
//                             //onCancel={() => setIsFormOpen(false)}
//                         />
//                     </div>
//                 </div>
//             )}

//             {/* List View */}
//             {loading && <p className="text-center py-10">Loading inventory...</p>}
//             {error && <p className="text-center py-10 text-red-600">Error loading products: {error}</p>}
            
//             {!loading && !error && products && (
//                 <>
//                     {/* DESKTOP TABLE VIEW (Visible on tablet/desktop) */}
//                     <div className="hidden md:block bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
//                         <table className="min-w-full divide-y divide-gray-200">
//                             <thead className="bg-gray-50">
//                                 <tr>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
//                                     <th className="px-6 py-3"></th> {/* Action column */}
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {products.map((product) => (
//                                     <tr key={product.id} className="hover:bg-gray-50 group">
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
//                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
//                                                 {product.stockQuantity}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
//                                             ${product.unitCost.toFixed(2)}
//                                         </td>
                                        
//                                         {/* View Link Column for Desktop */}
//                                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                                             <Link 
//                                                 href={`/ar/products/${product.id}`}
//                                                 className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center justify-end"
//                                                 title={`View ${product.name} details`}
//                                             >
//                                                 View <Eye className="w-4 h-4 ml-1" />
//                                             </Link>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {products.length === 0 && <p className="p-6 text-center text-gray-500">No products found.</p>}
//                     </div>

//                     {/* MOBILE CARD VIEW (Visible on mobile/small tablet) */}
//                     <div className="md:hidden">
//                         {products.length > 0 ? (
//                             products.map((product) => (
//                                 <ProductCard key={product.id} product={product} /> // This component is now a Link
//                             ))
//                         ) : (
//                             <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg mt-8 p-6">
//                                 <p className="text-lg font-medium">No products found.</p>
//                                 <p>Click + New Product to create your first one.</p>
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }