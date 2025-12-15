import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Assuming the finance types are available in a shared file
// NOTE: You must update this path and the imported types (Quotation, QuotationItem, QuotationStatus)
import { QuotationStatus, Customer, QuotationItemClient, QuotationClient } from '@/app/ar/types/finance'; 
import { useFormOptions } from '@/app/ar/hooks/useFormOptions';

// --- 1. Define Full Quotation Type (Client-side view with relations) ---
// Assuming QuotationClient is the base type for display (using 'number' for money)
export type FullQuotation = QuotationClient & {
    customer: Customer;
    items: QuotationItemClient[]; // Use the client-friendly item type
};

// --- 2. Corrected Form Quotation Item Type ---
// Quotation items share the same calculation logic as invoice items
type FormQuotationItem = Omit<
    QuotationItemClient, 
    'id' | 'quotationId' | 'lineTotal' | 'unitPrice' | 'discountRate' 
> & {
    // These fields are necessary for form tracking and calculation
    tempId: number; 
    unitPrice: number;
    lineTotal: number;
    // NOTE: Adding discountRate here for form logic consistency, though it may not be in the base QuotationItem model
    discountRate: number; 
    id?: string; 
};

// --- 3. EXPORT Quotation Form Data (for API Submission) ---
export interface QuotationFormData {
    id?: string; 
    customerId: string;
    quotationDate: string; // Renamed from invoiceDate
    expiryDate: string;    // Renamed from dueDate
    taxRate: number; 
    items: FormQuotationItem[];
    
    // Calculated fields needed for final submission
    subTotal: number;
    taxAmount: number; 
    totalAmount: number;
}

// --- 4. Props Interface ---
interface QuotationFormProps {
    onSubmit: (data: QuotationFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing: boolean;
    initialData?: FullQuotation; 
    onSubmitSuccess: () => void;
}

let nextTempItemId = 1;

const QuotationForm: React.FC<QuotationFormProps> = ({ onSubmit, isSubmitting, isEditing, initialData, onSubmitSuccess }) => {
    const { customers, products, isLoading, error } = useFormOptions();
    const defaultProduct = products.length > 0 ? products[0] : null;

    // Default form state calculation
    const defaultQuotationDate = new Date().toISOString().substring(0, 10);
    // Quotations often expire in 30 days
    const defaultExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10); 

    const [formData, setFormData] = useState<Omit<QuotationFormData, 'subTotal' | 'taxAmount' | 'totalAmount'>>({
        customerId: '',
        quotationDate: defaultQuotationDate,
        expiryDate: defaultExpiryDate, 
        taxRate: 0.05, 
        items: [],
    });

    // --- EFFECT: Load Initial Data / Set Defaults ---
    useEffect(() => {
        if (initialData && isEditing && formData.items.length === 0) {
            // Load items from initialData
            const loadedItems: FormQuotationItem[] = initialData.items.map(item => ({
                id: item.id, 
                tempId: nextTempItemId++, 
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice as number, // Assuming client types use number
                lineTotal: item.lineTotal as number, // Assuming client types use number
                // Assuming discountRate is part of the client item model or a form default
                discountRate: (item as any).discountRate || 0, 
            }));
            
            // Recalculate taxRate from initial data, or use default
            const calculatedTaxRate = initialData.subTotal > 0 
                ? initialData.taxAmount / initialData.subTotal 
                : 0.05;
            
            setFormData({
                customerId: initialData.customer.id, 
                quotationDate: new Date(initialData.createdAt).toISOString().substring(0, 10), // Use creation date for quote date
                expiryDate: new Date((initialData as any).expiryDate || defaultExpiryDate).toISOString().substring(0, 10), // Use expiryDate if available
                taxRate: calculatedTaxRate,
                items: loadedItems,
            });
            // If editing, we stop here. The calculated total fields are handled by useMemo.
        } else if (!isEditing && customers.length > 0 && defaultProduct && formData.items.length === 0) {
            // Set initial values for new quote
            setFormData(prev => ({
                ...prev,
                customerId: customers[0].id,
                items: [{
                    tempId: nextTempItemId++,
                    productId: defaultProduct.id,
                    productName: defaultProduct.name,
                    quantity: 1,
                    unitPrice: defaultProduct.unitPrice!,
                    lineTotal: parseFloat(defaultProduct.unitPrice!.toFixed(2)),
                    discountRate: 0,
                }],
            }));
        }
    }, [customers, products, defaultProduct, initialData, isEditing]);


    // --- MEMO: Financial Calculation ---
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


    // --- CALLBACKS: Item Management ---

    const handleProductSelect = useCallback((tempId: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product || !product.unitPrice) return;

        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.tempId === tempId) {
                    const quantity = item.quantity || 1;
                    const discountRate = item.discountRate || 0;
                    const calculatedLineTotal = (quantity * product.unitPrice!) * (1 - discountRate);

                    return { 
                        ...item, 
                        productId: product.id,
                        productName: product.name,
                        unitPrice: product.unitPrice!,
                        lineTotal: parseFloat(calculatedLineTotal?.toFixed(2)),
                        discountRate: discountRate,
                    };
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    }, [products]);
    
    const handleItemChange = useCallback((tempId: number, field: keyof FormQuotationItem, value: any) => {
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
        if (!defaultProduct || !defaultProduct.unitPrice) return;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                tempId: nextTempItemId++,
                productId: defaultProduct.id,
                productName: defaultProduct.name,
                quantity: 1,
                unitPrice: defaultProduct.unitPrice!,
                lineTotal: defaultProduct.unitPrice!,
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


    // --- HANDLER: Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (totalAmount <= 0) {
            alert("Total amount must be greater than zero.");
            return;
        }

        const finalFormData: QuotationFormData = {
            ...formData,
            ...(isEditing && { id: initialData?.id }), 
            subTotal: subTotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount, 
        };
        
        await onSubmit(finalFormData);
        onSubmitSuccess(); 
    };

    // --- RENDER: Loading/Error States (same as InvoiceForm) ---

    if (isLoading) {
        return <div className="text-center p-10 text-indigo-600 font-semibold">Loading customers and products...</div>;
    }
    
    if (error) {
        return <div className="text-center p-10 text-red-600 font-semibold">Error loading form data: {error}</div>;
    }
    
    if (!customers.length || !products.length) {
        return <div className="text-center p-10 text-yellow-600">No customers or products found. Cannot create quotation.</div>;
    }
    
    if (isEditing && !formData.items.length) {
        return <div className="text-center p-10 text-indigo-600 font-semibold">Loading initial quotation data...</div>;
    }


    return (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-white rounded-xl shadow-2xl max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">
                {isEditing ? `Edit Quotation: ${initialData?.quotationNumber}` : 'Create New Quotation'}
            </h2>

            {/* Customer and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Select (Same logic) */}
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

                {/* Quotation Date (Renamed from Invoice Date) */}
                <div>
                    <label htmlFor="quotationDate" className="block text-sm font-medium text-gray-700">Quotation Date</label>
                    <input
                        type="date"
                        id="quotationDate"
                        name="quotationDate"
                        value={formData.quotationDate}
                        onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Expiry Date (Renamed from Due Date) */}
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            {/* Line Items (Kept the same structure as the logic is identical) */}
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Quotation Items</h3>
            
            {/* Desktop Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center mb-2 font-medium text-gray-600 text-sm border-b pb-1">
                <div className="col-span-4">Product</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Disc (%)</div>
                <div className="col-span-2 text-right">Line Total</div>
                <div className="col-span-1"></div>
            </div>

            <div className="space-y-4">
                {formData.items.map((item) => (
                    <div key={item.tempId} className="grid grid-cols-1 md:grid-cols-12 gap-y-3 md:gap-4 items-center bg-gray-50 p-3 rounded-lg border relative">
                        
                        {/* Product Select */}
                        <div className="col-span-full md:col-span-4">
                            <label className="block md:hidden text-xs font-medium text-gray-700 mb-1">Product</label>
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
                        
                        {/* INPUT ROW for Mobile (Q, P, D) */}
                        <div className="grid grid-cols-3 gap-3 col-span-full md:col-span-5">
                            
                            {/* Quantity */}
                            <div>
                                <label htmlFor={`qty-${item.tempId}`} className="block text-xs font-medium text-gray-700 mb-1 md:hidden">Quantity</label>
                                <input
                                    id={`qty-${item.tempId}`}
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(item.tempId, 'quantity', parseInt(e.target.value) || 0)}
                                    placeholder="Qty"
                                    min="1"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-center md:col-span-1" 
                                />
                            </div>

                            {/* Unit Price */}
                            <div>
                                <label htmlFor={`price-${item.tempId}`} className="block text-xs font-medium text-gray-700 mb-1 md:hidden">Unit Price</label>
                                <input
                                    id={`price-${item.tempId}`}
                                    type="number"
                                    value={item?.unitPrice?.toFixed(2)}
                                    onChange={(e) => handleItemChange(item.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    placeholder="Price"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-right md:col-span-2"
                                />
                            </div>
                            
                            {/* Discount Rate */}
                            <div>
                                <label htmlFor={`disc-${item.tempId}`} className="block text-xs font-medium text-gray-700 mb-1 md:hidden">Discount (%)</label>
                                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden md:col-span-2">
                                    <input
                                        id={`disc-${item.tempId}`}
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
                            </div>
                        </div>

                        {/* Line Total Display */}
                        <div className="col-span-full flex justify-between md:block md:col-span-2 text-right font-medium text-gray-700 text-base md:text-sm pt-2 md:pt-0 border-t md:border-t-0">
                            <span className="block md:hidden text-xs font-medium text-gray-700">Line Total:</span>
                            <span className="text-lg md:text-sm font-bold md:font-medium">${item?.lineTotal?.toFixed(2)}</span>
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-end absolute top-3 right-3 md:relative md:top-0 md:right-0">
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.tempId)}
                                className={`text-red-500 hover:text-red-700 transition ${formData.items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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


            {/* Totals & Submission */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Tax Rate Input (Same logic) */}
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
                            ? (isEditing ? 'Updating Quotation...' : 'Generating...') 
                            : (isEditing ? 'Save Changes' : 'Generate and Send Quotation (DRAFT)')
                        }
                    </button>
                </div>
            </div>
        </form>
    );
};

export default QuotationForm;