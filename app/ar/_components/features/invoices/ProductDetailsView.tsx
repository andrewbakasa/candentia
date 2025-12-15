import React from 'react';
import { Product } from '@/app/ar/types/finance'; 

// Use the complete Product type, assuming dates are passed as Date objects or ISO strings
interface ProductDetailViewProps {
    product: Product; 
}

// Utility function to format dates (kept for Created/Updated metadata)
const formatDate = (date: Date | string) => {
    // Ensure the date object is created correctly
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * @component ProductDetailView
 * Displays the core information for a single product, including all new optional fields.
 */
const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product }) => {
    
    // Helper component for a single detail row
    const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div className="flex justify-between border-b border-gray-100 py-3">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-800">{value}</span>
        </div>
    );
    
    // Ensure dates are correctly parsed for display
    const createdAt = new Date(product.createdAt);
    const updatedAt = new Date(product.updatedAt);

    // FIX: Use nullish coalescing to ensure a number fallback for comparison
    const reorderPointValue = product.reorderPoint ?? 10;
    const isLowStock = product.stockQuantity < reorderPointValue;
    
    // Helper to format currency safely, handling optional unitPrice
    const formatCurrency = (value: number | undefined) => {
        return value !== undefined && value !== null
            ? `$${value.toFixed(2)}`
            : 'N/A';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-lg space-y-8">
            
            {/* --- Section 1: Product Overview and Description --- */}
            <div className="border-b pb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-lg text-indigo-700 font-semibold mb-4">SKU: {product.sku}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 italic whitespace-pre-line">
                    {product.description || "No detailed description provided for this product."}
                </p>
            </div>

            {/* --- Section 2: Core Details (2-Column Grid) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                
                {/* Left Column: Financial Details */}
                <div className="md:border-r md:pr-12">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">Financial Details</h3>
                    <div className="space-y-2">
                        <DetailRow 
                            label="Unit Selling Price" 
                            value={<span className="text-lg font-bold text-green-700">{formatCurrency(product.unitPrice)}</span>} 
                        />
                        <DetailRow 
                            label="Unit Cost (COGS)" 
                            value={formatCurrency(product.unitCost)} 
                        />
                        <DetailRow 
                            label="Gross Margin" 
                            value={
                                formatCurrency((product.unitPrice ?? 0) - product.unitCost)
                            } 
                        />
                        <DetailRow 
                            label="Product Active" 
                            value={
                                <span className={`font-bold ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {product.isActive ? 'Yes' : 'No'}
                                </span>
                            } 
                        />
                    </div>
                </div>

                {/* Right Column: Inventory & Logistics */}
                <div>
                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">Inventory & Logistics</h3>
                    <div className="space-y-2">
                        <DetailRow 
                            label="Stock Quantity" 
                            value={
                                <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                                    {product.stockQuantity} Units
                                </span>
                            } 
                        />
                        <DetailRow 
                            label="Reorder Point" 
                            value={`${product.reorderPoint ?? 'N/A'} Units`} 
                        />
                        <DetailRow 
                            label="Warehouse Location" 
                            value={product.location || 'N/A'}
                        />
                        <DetailRow 
                            label="Category" 
                            value={product.category || 'N/A'}
                        />
                        <DetailRow 
                            label="Barcode" 
                            value={product.barcode || 'N/A'} 
                        />
                        <DetailRow 
                            label="Preferred Supplier ID" 
                            value={product.supplierId || 'N/A'}
                        />
                    </div>
                </div>
            </div>
            
            {/* --- Section 3: Metadata --- */}
            <div className="pt-4 border-t">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">System Metadata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
                    <DetailRow 
                        label="Created Date" 
                        value={formatDate(createdAt)} 
                    />
                    <DetailRow 
                        label="Last Updated" 
                        value={formatDate(updatedAt)} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductDetailView;