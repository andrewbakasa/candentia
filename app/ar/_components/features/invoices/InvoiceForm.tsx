import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Assuming your types are defined here, e.g., Invoice, InvoiceItem, Customer, Decimal
import { InvoiceStatus, Customer, InvoiceItem, Invoice } from '@/app/ar/types/finance'; 
import { useFormOptions } from '@/app/ar/hooks/useFormOptions';

// --- 1. Define Full Invoice Type (for initialData) ---
export type FullInvoice = Invoice & {
    customer: Customer;
    items: InvoiceItem[];
};

// --- 2. Corrected Form Invoice Item Type ---
type FormInvoiceItem = Omit<
    InvoiceItem, 
    'id' | 'invoiceId' | 'lineTotal' | 'unitPrice' | 'discountRate' | 'skuSnapshot' 
> & {
    tempId: number; 
    unitPrice: number;
    lineTotal: number;
    discountRate: number;
    id?: string; 
};

// --- 3. EXPORT Invoice Form Data (for API Submission) ---
export interface InvoiceFormData {
    id?: string; 
    subTotal: number;
    taxAmount: number; 
    totalAmount: number;
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    taxRate: number; 
    items: FormInvoiceItem[];
}

// --- 4. Props Interface ---
interface InvoiceFormProps {
    onSubmit: (data: InvoiceFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing: boolean;
    initialData?: FullInvoice; 
    onSubmitSuccess: () => void;
}

let nextTempItemId = 1;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, isSubmitting, isEditing, initialData, onSubmitSuccess }) => {
    
    // --- Data Fetching ---
    const { customers, products, isLoading, error } = useFormOptions();
    const defaultProduct = products.length > 0 ? products[0] : null;

    // --- State Initialization ---
    const [formData, setFormData] = useState<Omit<InvoiceFormData, 'subTotal' | 'taxAmount' | 'totalAmount'> & { totalAmount: any }>({
        customerId: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), 
        taxRate: 0.05, 
        totalAmount: 0,
        items: [],
    });

    // --- EFFECT: Initialize Form Data (Creation vs. Editing) ---
    useEffect(() => {
        if (initialData && isEditing && formData.items.length === 0) {
            // EDIT MODE: Load data from initialData
            const loadedItems: FormInvoiceItem[] = initialData.items.map(item => ({
                id: item.id, 
                tempId: nextTempItemId++, 
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice as unknown as number, // Retaining as number assertion for safety
                lineTotal: item.lineTotal as unknown as number, // Retaining as number assertion for safety
                discountRate: item.discountRate as number,
            }));
            
            // Recalculate tax rate based on loaded data
            const calculatedTaxRate = initialData.subTotal > 0 
                ? initialData.taxAmount / initialData.subTotal 
                : 0.05;
            
            setFormData({
                // FIX: Access customerId from the nested 'customer' object
                customerId: initialData.customer.id, 
                invoiceDate: new Date(initialData.invoiceDate).toISOString().substring(0, 10),
                dueDate: new Date(initialData.dueDate).toISOString().substring(0, 10),
                taxRate: calculatedTaxRate,
                totalAmount: initialData.totalAmount,
                items: loadedItems,
            });
        } else if (!isEditing && customers.length > 0 && defaultProduct && formData.items.length === 0) {
            // CREATION MODE: Initialize with default values
            setFormData(prev => ({
                ...prev,
                customerId: customers[0].id,
                items: [{
                    tempId: nextTempItemId++,
                    productId: defaultProduct.id,
                    productName: defaultProduct.name,
                    quantity: 1,
                    unitPrice: defaultProduct.unitPrice,
                    lineTotal: parseFloat(defaultProduct.unitPrice?.toFixed(2)),
                    discountRate: 0,
                }],
            }));
        }
    }, [customers, products, defaultProduct, initialData, isEditing]);


    // --- Calculations ---
    const { subTotal, taxAmount, totalAmount } = useMemo(() => {
        const subTotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0);
        const taxAmount = subTotal * formData.taxRate;
        const totalAmount = subTotal + taxAmount;
        return { 
            subTotal: parseFloat(subTotal?.toFixed(2)), 
            taxAmount: parseFloat(taxAmount?.toFixed(2)), 
            totalAmount: parseFloat(totalAmount?.toFixed(2)) 
        };
    }, [formData.items, formData.taxRate]);


    // --- Handlers ---
    const handleProductSelect = useCallback((tempId: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.tempId === tempId) {
                    const quantity = item.quantity || 1;
                    const discountRate = item.discountRate || 0;
                    const calculatedLineTotal = (quantity * product.unitPrice) * (1 - discountRate);

                    return { 
                        ...item, 
                        productId: product.id,
                        productName: product.name,
                        unitPrice: product.unitPrice,
                        lineTotal: parseFloat(calculatedLineTotal?.toFixed(2)),
                    };
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    }, [products]);
    
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
                        updatedItem.lineTotal = parseFloat(calculatedLineTotal?.toFixed(2));
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalFormData: InvoiceFormData = {
            ...formData,
            ...(isEditing && { id: initialData?.id }), 
            
            subTotal: subTotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount, 
        };
        
        await onSubmit(finalFormData);
        onSubmitSuccess(); 
    };

    // --- Loading and Error States (Unchanged) ---
    if (isLoading) {
        return <div className="text-center p-10 text-indigo-600 font-semibold">Loading customers and products...</div>;
    }
    
    if (error) {
        return <div className="text-center p-10 text-red-600 font-semibold">Error loading form data: {error}</div>;
    }
    
    if (!customers.length || !products.length) {
        return <div className="text-center p-10 text-yellow-600">No customers or products found. Cannot create invoice.</div>;
    }
    
    if (isEditing && !formData.items.length) {
        return <div className="text-center p-10 text-indigo-600 font-semibold">Loading initial invoice data...</div>;
    }


    // --- Rendering (Unchanged) ---
    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-2xl max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">
                {isEditing ? `Edit Invoice: ${initialData?.invoiceNumber}` : 'Create New Invoice'}
            </h2>

            {/* --- Customer and Dates --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Select */}
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
                    <select
                        id="customerId"
                        name="customerId"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        disabled={isEditing} 
                    >
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} ({customer.email})
                            </option>
                        ))}
                    </select>
                    {isEditing && <p className="text-xs text-gray-500 mt-1">Customer is locked during editing.</p>}
                </div>

                {/* Invoice Date */}
                <div>
                    <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">Invoice Date</label>
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
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
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
                                        {product.name} ({product.sku}) - ${product?.unitPrice?.toFixed(2)}
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
                            value={item?.unitPrice?.toFixed(2)}
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
                            ${item?.lineTotal?.toFixed(2)}
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-end">
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.tempId)}
                                className="text-red-500 hover:text-red-700 transition"
                                disabled={formData.items.length === 1} 
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
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
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
                        disabled={isSubmitting || !formData.items.length || totalAmount <= 0}
                        className={`w-full mt-6 font-semibold py-3 rounded-lg transition duration-150 ${
                            isSubmitting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {isSubmitting 
                            ? (isEditing ? 'Updating Invoice...' : 'Processing...') 
                            : (isEditing ? 'Save Changes' : 'Generate and Send Invoice (DRAFT)')
                        }
                    </button>
                </div>
            </div>
        </form>
    );
};

export default InvoiceForm;