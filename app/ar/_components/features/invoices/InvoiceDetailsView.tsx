// src/components/features/invoices/InvoiceDetailView.tsx
import React from 'react';
import { Invoice } from '@/app/ar/types/finance'; 

interface InvoiceDetailViewProps {
    // Note: Since this component is likely rendered by a Server Component, 
    // we must ensure the `invoice` data structure is correctly passed.
    invoice: Invoice; 
}

// Utility function to format dates
const formatDate = (date: Date) => {
    // Ensure it's a Date object (if passed as string from the server component props)
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice }) => {
    return (
        <div className="space-y-8">
            {/* --- Section 1: Customer & Dates --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b pb-6">
                
                {/* Customer Information */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">Billed To</h3>
                    <p className="font-bold text-gray-800">{invoice.customer.name}</p>
                    <p className="text-sm text-gray-600">{invoice.customer.email}</p>
                    {/* Add address fields if available on customer model */}
                </div>

                {/* Date Information */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 text-right">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                        <p className="text-base font-semibold text-gray-800">{formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className={`text-base font-semibold ${
                            invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-800'
                        }`}>
                            {formatDate(invoice.dueDate)}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Section 2: Line Items Table --- */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Itemized Charges</h3>
            <div className="overflow-x-auto shadow-inner rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">Product/Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.productName}
                                    <p className="text-xs text-gray-500 mt-1">SKU: {item.skuSnapshot}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{(item.discountRate * 100).toFixed(0)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">${item.lineTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Section 3: Financial Summary --- */}
            <div className="flex justify-end pt-6">
                <div className="w-full md:w-1/3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">${invoice.subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">Tax ({ (invoice.taxRate * 100).toFixed(2) }%):</span>
                        <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-xl font-bold text-indigo-700">
                        <span>Grand Total:</span>
                        <span>${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="text-xl font-bold text-gray-700">Amount Due:</span>
                        <span className="text-xl font-bold text-red-600">${invoice.amountDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailView;