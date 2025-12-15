import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProductFormData } from '@/app/ar/types/finance'; // Assuming this defines the product data structure

// 1. UPDATED: Extend ProductFormData type to include all new fields (making them all optional in the payload structure for flexibility)
// NOTE: I am making the required fields from your original logic non-optional for required inputs.

// export interface ProductFormData {
//     id?: string;             // Optional ID for creation, present for updates
//     sku: string;             // REQUIRED
//     name: string;            // REQUIRED
//     stockQuantity: number;   // REQUIRED (Int)
//     unitCost: number;        // REQUIRED (Float)
    
//     // Core fields added from previous step and form logic
//     description?: string;    // Optional, based on earlier forms
//     unitPrice?: number;      // Optional, Selling Price
//     isActive?: boolean;      // Optional, Status flag
    
//     // New Optional Fields from Prisma Model
//     barcode?: string;
//     category?: string;
//     supplierId?: string;     // Should match Prisma's @db.ObjectId format
//     reorderPoint?: number;   // Int
//     location?: string;
// }

// 2. UPDATED: Initial State Setup
const INITIAL_STATE: ProductFormData = {
    sku: '',
    name: '',
    stockQuantity: 0,
    unitCost: 0,
    description: '',
    unitPrice: 0.00,
    isActive: true,
    barcode: '',
    category: '',
    supplierId: '',
    reorderPoint: 0,
    location: '',
};

// --- 3. Props Interface (Unchanged, but included for completeness) ---
interface ProductFormProps {
    onSubmit: (data: ProductFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing: boolean;
    initialData?: ProductFormData;
    onSubmitSuccess: () => void;
    // Added onCancel, as it's typically used with forms in a modal/edit view
    onCancel?: () => void; 
}


export const ProductForm: React.FC<ProductFormProps> = ({ 
    onSubmit, 
    isSubmitting, 
    isEditing, 
    initialData, 
    onSubmitSuccess,
    onCancel // Added to props
}) => {
    // Initialize form data, using initialData if editing
    const [formData, setFormData] = useState<ProductFormData>(initialData || INITIAL_STATE);
    const [error, setError] = useState<string | null>(null);

    // Effect to ensure initialData is loaded when component mounts or initialData changes
    useEffect(() => {
        if (isEditing && initialData) {
            setFormData(prev => ({ ...INITIAL_STATE, ...initialData }));
        }
    }, [isEditing, initialData]);

    // --- 4. Handlers ---

    // A single, optimized handler for all simple text/number/select inputs
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as any; // Cast to 'any' to easily access checked for checkbox
        
        let updatedValue: string | number | boolean;

        if (type === 'number') {
            const parsedValue = parseFloat(value);
            // Handle number inputs: save as number if valid, otherwise save the original string (e.g., empty string for visual input)
            updatedValue = isNaN(parsedValue) || value === '' ? value : parsedValue; 
        } else if (type === 'checkbox') {
            updatedValue = checked;
        } else {
            updatedValue = value;
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: updatedValue,
        }));
    }, []);


    // Helper to ensure numbers are correctly parsed before submission
    const getSanitizedPayload = useMemo(() => {
        return {
            ...formData,
            // Ensure all number fields are numbers or null/undefined for Prisma
            stockQuantity: typeof formData.stockQuantity === 'number' ? formData.stockQuantity : parseFloat(String(formData.stockQuantity) || '0'),
            unitCost: typeof formData.unitCost === 'number' ? formData.unitCost : parseFloat(String(formData.unitCost) || '0'),
            unitPrice: typeof formData.unitPrice === 'number' ? formData.unitPrice : parseFloat(String(formData.unitPrice) || '0'),
            reorderPoint: typeof formData.reorderPoint === 'number' ? formData.reorderPoint : (formData.reorderPoint ? parseFloat(String(formData.reorderPoint)) : undefined),
            
            // Clean up empty strings for optional string fields to be `undefined` (better for PATCH requests)
            barcode: formData.barcode?.trim() || undefined,
            category: formData.category?.trim() || undefined,
            supplierId: formData.supplierId?.trim() || undefined,
            location: formData.location?.trim() || undefined,
            description: formData.description?.trim() || undefined,
        };
    }, [formData]);


    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const payload = getSanitizedPayload;

            // Basic Required Field Validation
            if (payload.unitCost <= 0) {
                 throw new Error("Unit cost must be greater than zero.");
            }
            if (payload.name.trim() === '' || payload.sku.trim() === '') {
                 throw new Error("Product Name and SKU are required.");
            }

            // Call the passed onSubmit function
            await onSubmit(payload);
            
            // Success handling
            if (!isEditing) {
                setFormData(INITIAL_STATE);
            }
            onSubmitSuccess();

        } catch (err) {
            console.error('Product operation failed:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    }, [getSanitizedPayload, isEditing, onSubmit, onSubmitSuccess]);

    // Placeholder data for supplier selection (In a real app, this would be fetched)
    const suppliers = [
        { id: 'S001', name: 'Global Tech Supply' },
        { id: 'S002', name: 'Local Components Ltd' },
        { id: 'S003', name: 'Software Services Inc' },
    ];


    // --- 5. Render UI (Added new fields) ---
    return (
        <form 
            onSubmit={handleSubmit} 
            className="p-4 sm:p-6 bg-white rounded-xl shadow-2xl mx-auto max-w-lg md:max-w-xl space-y-6"
        >
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
                {isEditing ? `Edit Product: ${initialData?.name || ''}` : 'Create New Product'}
            </h2>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded transition-all duration-300 border border-red-300">{error}</div>}

            {/* --- CORE PRODUCT INFO --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Product Name (Required) */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                {/* 2. SKU (Required) */}
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU <span className="text-red-500">*</span></label>
                    <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>

            {/* --- PRICING & INVENTORY --- */}
            <div className="grid grid-cols-2 gap-4">
                {/* 3. Unit Cost (Required) */}
                <div>
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ($) <span className="text-red-500">*</span></label>
                    <input type="number" id="unitCost" name="unitCost" value={formData.unitCost} onChange={handleChange} min="0.01" step="0.01" required disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                {/* 4. Unit Price (Optional Selling Price) */}
                <div>
                    <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price ($)</label>
                    <input type="number" id="unitPrice" name="unitPrice" value={formData.unitPrice || ''} onChange={handleChange} min="0.00" step="0.01" disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                {/* 5. Initial Stock Quantity (Required) */}
                <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Initial Stock</label>
                    <input type="number" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} min="0" step="1" required disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                {/* 6. Reorder Point (Optional) */}
                <div>
                    <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700">Reorder Point</label>
                    <input type="number" id="reorderPoint" name="reorderPoint" value={formData.reorderPoint || ''} onChange={handleChange} min="0" step="1" disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>

            {/* --- OPTIONAL DETAILS --- */}
            <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t">Optional Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 7. Barcode (Optional) */}
                <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode</label>
                    <input type="text" id="barcode" name="barcode" value={formData.barcode || ''} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                {/* 8. Category (Optional) */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <input type="text" id="category" name="category" value={formData.category || ''} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                {/* 9. Location (Optional) */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Warehouse Location</label>
                    <input type="text" id="location" name="location" value={formData.location || ''} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                {/* 10. Supplier ID (Optional Select) */}
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Preferred Supplier</label>
                    <select
                        id="supplierId"
                        name="supplierId"
                        value={formData.supplierId || ''}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">-- Select Supplier (Optional) --</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 11. Description (Optional Text Area) */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                    id="description" 
                    name="description" 
                    rows={3}
                    value={formData.description || ''} 
                    onChange={handleChange} 
                    disabled={isSubmitting} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                />
            </div>

            {/* 12. Is Active Checkbox (Optional, Default True) */}
            <div className="relative flex items-start pt-4 border-t">
                <div className="flex items-center h-5">
                    <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive ?? true} // Default to true if undefined
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="isActive" className="font-medium text-gray-700">Product is Active</label>
                    <p className="text-gray-500">Uncheck to temporarily hide this product from sales lists.</p>
                </div>
            </div>
            
            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white transition duration-150 ease-in-out ${
                        isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isEditing ? 'Saving...' : 'Creating...'}
                        </span>
                    ) : (isEditing ? 'Save Changes' : 'Create Product')}
                </button>
            </div>
        </form>
    );
};
// import { ProductFormData } from '@/app/ar/types/finance'; // Assuming this defines the product data structure
// import React, { useState, useCallback, useMemo } from 'react';

// // --- 1. Define Form Types ---
// // ProductFormData is already imported. Assuming it looks something like this:
// // export interface ProductFormData { sku: string; name: string; stockQuantity: number; unitCost: number; }

// const INITIAL_STATE: ProductFormData = {
//     sku: '',
//     name: '',
//     stockQuantity: 0,
//     unitCost: 0,
// };

// // --- 2. Props Interface ---
// interface ProductFormProps {
//     onSubmit: (data: ProductFormData) => Promise<void>; // Use a proper onSubmit function
//     isSubmitting: boolean;
//     isEditing: boolean; // Added for potential future use (editing an existing product)
//     initialData?: ProductFormData & { id: string }; // Use a separate initial data if editing
//     onSubmitSuccess: () => void;
// }


// export const ProductForm: React.FC<ProductFormProps> = ({ 
//     onSubmit, 
//     isSubmitting, 
//     isEditing, 
//     initialData, 
//     onSubmitSuccess 
// }) => {
//     // Initialize form data, using initialData if editing
//     const [formData, setFormData] = useState<ProductFormData>(initialData || INITIAL_STATE);
//     const [error, setError] = useState<string | null>(null);

//     // --- 3. Handlers ---

//     // A single, optimized handler for all simple text/number inputs
//     const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value, type } = e.target;
        
//         let updatedValue: string | number;
//         if (type === 'number') {
//             // Handle number inputs, converting empty string to 0 or null for submission clarity
//             const parsedValue = parseFloat(value);
//             updatedValue = isNaN(parsedValue) || value === '' ? '' : parsedValue; 
//         } else {
//             updatedValue = value;
//         }

//         setFormData(prev => ({ 
//             ...prev, 
//             [name]: updatedValue,
//         }));
//     }, []);

//     // Helper to ensure numbers are correctly parsed before submission
//     const getSanitizedPayload = useMemo(() => {
//         return {
//             ...formData,
//             // Convert potential empty strings back to 0 for submission payload
//             stockQuantity: typeof formData.stockQuantity === 'number' 
//                            ? formData.stockQuantity 
//                            : parseFloat(String(formData.stockQuantity) || '0'),
//             unitCost: typeof formData.unitCost === 'number' 
//                       ? formData.unitCost 
//                       : parseFloat(String(formData.unitCost) || '0'),
//         };
//     }, [formData]);


//     const handleSubmit = useCallback(async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError(null);

//         try {
//             const payload = getSanitizedPayload;

//             if (payload.unitCost <= 0) {
//                  throw new Error("Unit cost must be greater than zero.");
//             }
//             if (payload.name.trim() === '' || payload.sku.trim() === '') {
//                  throw new Error("Product Name and SKU are required.");
//             }

//             // Call the passed onSubmit function
//             await onSubmit(payload);
            
//             // Only reset if creating a new product
//             if (!isEditing) {
//                 setFormData(INITIAL_STATE);
//             }
//             onSubmitSuccess();

//         } catch (err) {
//             console.error('Product operation failed:', err);
//             setError(err instanceof Error ? err.message : 'An unknown error occurred.');
//         }
//     }, [getSanitizedPayload, isEditing, onSubmit, onSubmitSuccess]);

//     // --- 4. Render UI ---
//     return (
//         <form 
//             onSubmit={handleSubmit} 
//             className="p-4 sm:p-6 bg-white rounded-xl shadow-2xl mx-auto max-w-lg md:max-w-xl space-y-6"
//         >
//             <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
//                 {isEditing ? `Edit Product: ${initialData?.name}` : 'Create New Product'}
//             </h2>

//             {error && <div className="p-3 bg-red-100 text-red-700 rounded transition-all duration-300 border border-red-300">{error}</div>}

//             {/* Layout: Single column on mobile, dual column on desktop */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
//                 {/* Product Name */}
//                 <div className="sm:col-span-1">
//                     <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
//                     <input 
//                         type="text" 
//                         id="name" 
//                         name="name" 
//                         value={formData.name} 
//                         onChange={handleChange} 
//                         required 
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                     />
//                 </div>
                
//                 {/* SKU */}
//                 <div className="sm:col-span-1">
//                     <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Stock Keeping Unit)</label>
//                     <input 
//                         type="text" 
//                         id="sku" 
//                         name="sku" 
//                         value={formData.sku} 
//                         onChange={handleChange} 
//                         required 
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                     />
//                 </div>
//             </div>

//             {/* Layout: Single column on mobile, dual column on desktop */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
//                 {/* Initial Stock Quantity */}
//                 <div className="sm:col-span-1">
//                     <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
//                     <input 
//                         type="number" 
//                         id="stockQuantity" 
//                         name="stockQuantity" 
//                         // Use 0 for display if the state value is an empty string
//                         value={formData.stockQuantity === 0 ? 0 : formData.stockQuantity} 
//                         onChange={handleChange} 
//                         min="0"
//                         step="1"
//                         required 
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500"
//                     />
//                 </div>
                
//                 {/* Unit Cost */}
//                 <div className="sm:col-span-1">
//                     <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
//                     <input 
//                         type="number" 
//                         id="unitCost" 
//                         name="unitCost" 
//                         // Use 0 for display if the state value is an empty string
//                         value={formData.unitCost === 0 ? 0 : formData.unitCost} 
//                         onChange={handleChange} 
//                         min="0.01"
//                         step="0.01"
//                         required 
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-right focus:ring-indigo-500 focus:border-indigo-500"
//                     />
//                 </div>
//             </div>

//             {/* Submit Button */}
//             <button 
//                 type="submit" 
//                 disabled={isSubmitting}
//                 className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white transition duration-150 ease-in-out ${
//                     isSubmitting 
//                         ? 'bg-gray-400 cursor-not-allowed' 
//                         : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
//                 }`}
//             >
//                 {isSubmitting ? (
//                     <span className="flex items-center justify-center">
//                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         {isEditing ? 'Saving Changes...' : 'Creating Product...'}
//                     </span>
//                 ) : (isEditing ? 'Save Changes' : 'Create Product')}
//             </button>
//         </form>
//     );
// };