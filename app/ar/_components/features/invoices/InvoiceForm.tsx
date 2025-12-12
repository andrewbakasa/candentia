// src/components/features/invoices/InvoiceForm.tsx (Updated)
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { InvoiceStatus, Customer, InvoiceItem } from '@/app/ar/types/finance'; 
import { useFormOptions } from '@/app/ar/hooks/useFormOptions';
//import { useFormOptions } from '@/hooks/useFormOptions'; // <-- NEW: Import the new hook

// Helper type for form items (using numbers for easy state management)
type FormInvoiceItem = Omit<InvoiceItem, 'id' | 'invoiceId' | 'lineTotal' | 'unitPrice' | 'skuSnapshot'> & {
    tempId: number; 
    unitPrice: number;
    lineTotal: number;
    productId: string;
    productName: string;
    discountRate: number;
};

// EXPORT this interface so the useInvoices hook and page component can use it
export interface InvoiceFormData {
    // We add subTotal and taxAmount here to satisfy the backend POST requirements
    subTotal: number;
    taxAmount: number; 
    totalAmount: number;
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    taxRate: number; 
    items: FormInvoiceItem[];
}

// NEW: Define the props the InvoiceForm component will accept
interface InvoiceFormProps {
    onSubmit: (data: InvoiceFormData) => Promise<void>;
    isSubmitting: boolean;
}

let nextTempItemId = 1;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, isSubmitting }) => {
    // --- NEW: Data Fetching ---
    const { customers, products, isLoading, error } = useFormOptions();

    // Find a default product to use in the initial state
    const defaultProduct = products.length > 0 ? products[0] : null;

    // --- State Initialization ---
    // Use an effect to set initial state once data is loaded
    const [formData, setFormData] = useState<Omit<InvoiceFormData, 'subTotal' | 'taxAmount' | 'totalAmount'> & { totalAmount: any }>({
        customerId: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), 
        taxRate: 0.05, 
        totalAmount: 0,
        items: [],
    });

    // Initialize form data when customers and products are loaded
    useEffect(() => {
        if (customers.length > 0 && products.length > 0 && formData.items.length === 0) {
            setFormData({
                customerId: customers[0].id,
                invoiceDate: new Date().toISOString().substring(0, 10),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), 
                taxRate: 0.05, 
                totalAmount: 0,
                items: [{
                    tempId: nextTempItemId++,
                    productId: products[0].id,
                    productName: products[0].name,
                    quantity: 1,
                    unitPrice: products[0].unitPrice,
                    lineTotal: parseFloat(products[0].unitPrice.toFixed(2)),
                    discountRate: 0,
                }],
            });
        }
    }, [customers, products]);


    // --- Calculations ---
    const { subTotal, taxAmount, totalAmount } = useMemo(() => {
        const subTotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0);
        const taxAmount = subTotal * formData.taxRate;
        const totalAmount = subTotal + taxAmount;
        return { 
            subTotal: parseFloat(subTotal.toFixed(2)), 
            taxAmount: parseFloat(taxAmount.toFixed(2)), 
            totalAmount: parseFloat(totalAmount.toFixed(2)) 
        };
    }, [formData.items, formData.taxRate]);


    // --- Handlers ---
    const handleProductSelect = useCallback((tempId: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.tempId === tempId) {
                    // Update all product-dependent fields
                    const quantity = item.quantity || 1;
                    const discountRate = item.discountRate || 0;
                    const calculatedLineTotal = (quantity * product.unitPrice) * (1 - discountRate);

                    return { 
                        ...item, 
                        productId: product.id,
                        productName: product.name,
                        unitPrice: product.unitPrice,
                        lineTotal: parseFloat(calculatedLineTotal.toFixed(2)),
                    };
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    }, [products]); // Re-create if products list changes
    
    // ... (handleItemChange, handleAddItem, handleRemoveItem remain the same) ...
    const handleItemChange = useCallback((tempId: number, field: keyof FormInvoiceItem, value: any) => {
        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.tempId === tempId) {
                    const updatedItem = { ...item, [field]: value };
                    
                    if (field === 'quantity' || field === 'unitPrice' || field === 'discountRate') {
                        const quantity = updatedItem.quantity || 0;
                        const unitPrice = updatedItem.unitPrice || 0;
                        const discountRate = updatedItem.discountRate || 0;
                        
                        const calculatedLineTotal = (quantity * unitPrice) * (1 - discountRate);
                        updatedItem.lineTotal = parseFloat(calculatedLineTotal.toFixed(2));
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    }, []);

    const handleAddItem = useCallback(() => {
        if (!defaultProduct) return;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                tempId: nextTempItemId++,
                productId: defaultProduct.id,
                productName: defaultProduct.name,
                quantity: 1,
                unitPrice: defaultProduct.unitPrice,
                lineTotal: defaultProduct.unitPrice,
                discountRate: 0,
            }]
        }));
    }, [defaultProduct]);

    const handleRemoveItem = useCallback((tempId: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.tempId !== tempId)
        }));
    }, []);


    // --- Form Submission ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final data structure including all calculated totals required by the backend
        const finalFormData: InvoiceFormData = {
            ...formData,
            subTotal: subTotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount, // The amount due is usually the total amount for a new invoice
        };
        
        onSubmit(finalFormData);
    };

    // --- Loading and Error States ---
    if (isLoading) {
        return <div className="text-center p-10 text-indigo-600 font-semibold">Loading customers and products...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-600 font-semibold">Error loading form data: {error}</div>;
    }
    
    if (!customers.length || !products.length) {
        return <div className="text-center p-10 text-yellow-600">No customers or products found. Cannot create invoice.</div>;
    }

    // --- Rendering ---
    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-2xl max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">Create New Invoice</h2>

            {/* --- Customer and Dates --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Select */}
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                        Customer
                    </label>
                    <select
                        id="customerId"
                        name="customerId"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} ({customer.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Invoice Date */}
                <div>
                    <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">
                        Invoice Date
                    </label>
                    <input
                        type="date"
                        id="invoiceDate"
                        name="invoiceDate"
                        value={formData.invoiceDate}
                        onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Due Date */}
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        Due Date
                    </label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            {/* --- Line Items --- */}
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Invoice Items</h3>
            <div className="space-y-4">
                {formData.items.map((item) => (
                    <div key={item.tempId} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg border">
                        
                        {/* Product Select */}
                        <div className="col-span-4">
                            <select
                                value={item.productId}
                                onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                                className="block w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.sku}) - ${product.unitPrice.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.tempId, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                            min="1"
                            required
                            className="col-span-1 p-2 border border-gray-300 rounded-md text-sm text-center"
                        />

                        {/* Unit Price */}
                        <input
                            type="number"
                            value={item.unitPrice.toFixed(2)}
                            onChange={(e) => handleItemChange(item.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="Price"
                            min="0.01"
                            step="0.01"
                            required
                            className="col-span-2 p-2 border border-gray-300 rounded-md text-sm text-right"
                        />
                        
                        {/* Discount Rate */}
                        <div className="col-span-2 flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <input
                                type="number"
                                value={(item.discountRate * 100).toFixed(0)}
                                onChange={(e) => handleItemChange(item.tempId, 'discountRate', (parseFloat(e.target.value) || 0) / 100)}
                                placeholder="Disc %"
                                min="0"
                                max="100"
                                step="1"
                                className="w-full p-2 text-sm text-right border-none focus:ring-0"
                            />
                            <span className="p-2 bg-gray-200 text-gray-600 text-xs">%</span>
                        </div>

                        {/* Line Total Display */}
                        <div className="col-span-2 text-right font-medium text-gray-700 text-sm">
                            ${item.lineTotal.toFixed(2)}
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-end">
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.tempId)}
                                className="text-red-500 hover:text-red-700 transition"
                                disabled={formData.items.length === 1} // Disable removal if only one item remains
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={handleAddItem}
                className="mt-4 px-4 py-2 text-sm font-medium border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition"
            >
                + Add Item
            </button>


            {/* --- Totals & Submission --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Tax Rate Input */}
                <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                        Tax Rate (%)
                    </label>
                    <div className="flex items-center mt-1">
                        <input
                            type="number"
                            id="taxRate"
                            value={(formData.taxRate * 100).toFixed(2)}
                            onChange={(e) => setFormData({ ...formData, taxRate: (parseFloat(e.target.value) || 0) / 100 })}
                            min="0"
                            max="100"
                            step="0.01"
                            className="block w-full p-2 border border-gray-300 rounded-l-md text-right"
                        />
                        <span className="p-2 bg-gray-200 text-gray-600 border border-gray-300 rounded-r-md">%</span>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="md:col-span-2 space-y-2 self-end">
                    <div className="flex justify-between text-lg text-gray-700">
                        <span>Subtotal:</span>
                        <span className="font-semibold">${subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg text-gray-700">
                        <span>Tax Amount:</span>
                        <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-2xl font-bold text-indigo-700">
                        <span>Total Amount:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.items.length || totalAmount <= 0} // Disable if no items or total is zero
                        className={`w-full mt-6 font-semibold py-3 rounded-lg transition duration-150 ${
                            isSubmitting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {isSubmitting ? 'Processing...' : 'Generate and Send Invoice (DRAFT)'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default InvoiceForm;
// // src/components/features/invoices/InvoiceForm.tsx (Top of file)
// import React, { useState, useMemo, useCallback } from 'react';
// // Assuming the path is correct based on your previous messages, but adjust if needed:
// import { InvoiceStatus, Customer, InvoiceItem } from '@/app/ar/types/finance'; 

// // Helper type for form items (using numbers for easy state management)
// type FormInvoiceItem = Omit<InvoiceItem, 'id' | 'invoiceId' | 'lineTotal' | 'unitPrice' | 'skuSnapshot'> & {
//     tempId: number; // Unique ID for keying in the UI before saving
//     unitPrice: number;
//     lineTotal: number;
//     productId: string;
//     productName: string;
//     discountRate: number;
// };

// // EXPORT this interface so the useInvoices hook and page component can use it
// export interface InvoiceFormData {
//     totalAmount: any;
//     customerId: string;
//     invoiceDate: string;
//     dueDate: string;
//     taxRate: number; // Storing tax rate as a simple percentage (e.g., 0.1 for 10%)
//     items: FormInvoiceItem[];
// }

// // NEW: Define the props the InvoiceForm component will accept
// interface InvoiceFormProps {
//     onSubmit: (data: InvoiceFormData) => Promise<void>;
//     isSubmitting: boolean;
// }

// // --- Mock Data (Replace with API calls) ---
// // ... (mockCustomers and mockProducts remain the same) ...
// const mockCustomers: Customer[] = [
//     { id: 'CUST001', name: 'Acme Corp', email: 'acme@corp.com' },
//     { id: 'CUST002', name: 'Globex Ltd', email: 'globex@ltd.com' },
// ];

// const mockProducts = [
//     { id: 'P001', sku: 'WGT-432', name: 'Widget Pro', unitPrice: 199.99 },
//     { id: 'P002', sku: 'ACC-101', name: 'Accessory Kit', unitPrice: 25.50 },
//     { id: 'P003', sku: 'SVC-H01', name: 'Hourly Consulting', unitPrice: 120.00 },
// ];

// let nextTempItemId = 1;

// // Update component signature to accept the defined props
// const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, isSubmitting }) => {
//     // [The state definition remains the same]
//     const [formData, setFormData] = useState<InvoiceFormData>({
//         customerId: mockCustomers[0].id,
//         invoiceDate: new Date().toISOString().substring(0, 10),
//         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 30 days out
//         taxRate: 0.05, // 5% tax rate
//         totalAmount: 0,
//         items: [{
//             tempId: nextTempItemId++,
//             productId: mockProducts[0].id,
//             productName: mockProducts[0].name,
//             quantity: 1,
//             unitPrice: mockProducts[0].unitPrice,
//             lineTotal: mockProducts[0].unitPrice,
//             discountRate: 0,
//         }],
//     });

//     // [Calculations and Handlers remain the same]
//     const { subTotal, taxAmount, totalAmount } = useMemo(() => {
//         const subTotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0);
//         const taxAmount = subTotal * formData.taxRate;
//         const totalAmount = subTotal + taxAmount;
//         return { subTotal, taxAmount, totalAmount };
//     }, [formData.items, formData.taxRate]);

//     const handleItemChange = useCallback((tempId: number, field: keyof FormInvoiceItem, value: any) => {
//         setFormData(prev => {
//             const newItems = prev.items.map(item => {
//                 if (item.tempId === tempId) {
//                     const updatedItem = { ...item, [field]: value };
                    
//                     if (field === 'quantity' || field === 'unitPrice' || field === 'discountRate') {
//                         const quantity = updatedItem.quantity || 0;
//                         const unitPrice = updatedItem.unitPrice || 0;
//                         const discountRate = updatedItem.discountRate || 0;
                        
//                         const calculatedLineTotal = (quantity * unitPrice) * (1 - discountRate);
//                         updatedItem.lineTotal = parseFloat(calculatedLineTotal.toFixed(2));
//                     }
//                     return updatedItem;
//                 }
//                 return item;
//             });
//             return { ...prev, items: newItems };
//         });
//     }, []);

//     const handleAddItem = useCallback(() => {
//         setFormData(prev => ({
//             ...prev,
//             items: [...prev.items, {
//                 tempId: nextTempItemId++,
//                 productId: mockProducts[0].id,
//                 productName: mockProducts[0].name,
//                 quantity: 0,
//                 unitPrice: 0.00,
//                 lineTotal: 0.00,
//                 discountRate: 0,
//             }]
//         }));
//     }, []);

//     const handleRemoveItem = useCallback((tempId: number) => {
//         setFormData(prev => ({
//             ...prev,
//             items: prev.items.filter(item => item.tempId !== tempId)
//         }));
//     }, []);

//     // --- Form Submission ---
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
        
//         // Prepare the final data structure, ensuring calculated totals are included
//         const finalFormData: InvoiceFormData = {
//             ...formData,
//             // Overwrite totalAmount placeholder with the calculated value
//             totalAmount: totalAmount, 
//         };
        
//         // Call the onSubmit prop passed from the parent component
//         onSubmit(finalFormData);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-2xl max-w-6xl mx-auto">
//             {/* [Form elements remain the same] */}
//             {/* ... */}
            
//             {/* --- Totals & Submission --- */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Notes/Comments (Optional) */}
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700">Notes/Terms</label>
//                     <textarea rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
//                 </div>

//                 {/* Financial Summary */}
//                 <div className="md:col-span-2 space-y-2">
//                     {/* ... (Subtotal, Tax Rate, Total Amount fields) ... */}
                    
//                     <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-xl font-bold text-indigo-700">
//                         <span>Total Amount:</span>
//                         <span>${totalAmount.toFixed(2)}</span>
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={isSubmitting} // Disable button during submission
//                         className={`w-full mt-6 font-semibold py-3 rounded-lg transition duration-150 ${
//                             isSubmitting 
//                                 ? 'bg-gray-400 cursor-not-allowed' 
//                                 : 'bg-indigo-600 hover:bg-indigo-700 text-white'
//                         }`}
//                     >
//                         {isSubmitting ? 'Processing...' : 'Generate and Send Invoice (DRAFT)'}
//                     </button>
//                 </div>
//             </div>
//         </form>
//     );
// };

// export default InvoiceForm;