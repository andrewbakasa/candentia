// src/components/features/invoices/InvoiceDetailView.tsx
import React from 'react';
// import { Invoice, InvoiceLineItem } from '@/app/ar/types/finance'; 

// --- Mock Types (Remove if imported correctly) ---
interface InvoiceLineItem {
    productName: string;
    skuSnapshot: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    lineTotal: number;
}
enum InvoiceStatus { PAID = 'PAID', OVERDUE = 'OVERDUE', SENT = 'SENT', DRAFT = 'DRAFT', VOID = 'VOID' }
interface Customer { name: string; email: string; }
interface Invoice {
    customer: Customer;
    invoiceDate: Date;
    dueDate: Date;
    status: InvoiceStatus | string;
    invoiceNumber: string;
    items: InvoiceLineItem[];
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    amountDue: number;
}
// Mock data for line items if needed for testing (assuming server provided the invoice object):
/*
const mockInvoice: Invoice = {
    // ... other fields
    items: [
        { productName: 'Pro Service Plan', skuSnapshot: 'PS-100', quantity: 1, unitPrice: 500.00, discountRate: 0.1, lineTotal: 450.00 },
        { productName: 'Consulting Hour', skuSnapshot: 'CS-001', quantity: 5, unitPrice: 150.00, discountRate: 0, lineTotal: 750.00 },
    ],
    subTotal: 1200.00, taxRate: 0.05, taxAmount: 60.00, totalAmount: 1260.00, amountDue: 1260.00
};
*/
// --- End Mock Types ---

interface InvoiceDetailViewProps {
    invoice: Invoice; 
}

// Utility function to format dates
const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// --- Mobile Line Item Card Component ---
const MobileLineItemCard: React.FC<{ item: InvoiceLineItem }> = ({ item }) => (
    <div className="p-4 bg-white border-b last:border-b-0">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">SKU: {item.skuSnapshot}</p>
            </div>
            <p className="font-bold text-indigo-700">${item.lineTotal.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs mt-2 text-gray-600 border-t pt-2">
            <div>Qty: <span className="font-medium text-gray-900">{item.quantity}</span></div>
            <div>Unit: <span className="font-medium text-gray-900">${item.unitPrice.toFixed(2)}</span></div>
            <div>Disc: <span className="font-medium text-gray-900">{(item.discountRate * 100).toFixed(0)}%</span></div>
        </div>
    </div>
);
// --- End Mobile Line Item Card Component ---


const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice }) => {
    
    const invoiceDate = typeof invoice.invoiceDate === 'string' ? new Date(invoice.invoiceDate) : invoice.invoiceDate;
    const dueDate = typeof invoice.dueDate === 'string' ? new Date(invoice.dueDate) : invoice.dueDate;
    
    return (
        <div className="space-y-8">
            
            {/* --- Section 1: Customer & Dates (Responsive Grid) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 border-b pb-6">
                
                {/* Customer Information (Takes full width on mobile, 1/3 on desktop) */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">Billed To</h3>
                    <p className="font-bold text-gray-800">{invoice.customer.name}</p>
                    {/* Optional check for email field, assuming it exists */}
                    {invoice.customer.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
                </div>

                {/* Date Information (Takes full width on mobile, 2/3 on desktop) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 text-left sm:text-right">
                    <div className="col-span-1">
                        <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                        <p className="text-base font-semibold text-gray-800">{formatDate(invoiceDate)}</p>
                    </div>
                    <div className="col-span-1">
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className={`text-base font-semibold ${
                            invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-800'
                        }`}>
                            {formatDate(dueDate)}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Section 2: Line Items --- */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Itemized Charges</h3>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto shadow-inner rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-5/12">Product/Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-1/12">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-2/12">Unit Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-2/12">Discount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-2/12">Line Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
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

            {/* Mobile Card View */}
            <div className="md:hidden border rounded-lg overflow-hidden divide-y divide-gray-100">
                {invoice.items.map((item, index) => (
                    <MobileLineItemCard key={index} item={item} />
                ))}
            </div>


            {/* --- Section 3: Financial Summary (Responsive Alignment) --- */}
            <div className="flex justify-end pt-6">
                <div className="w-full sm:w-2/3 md:w-1/3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">${invoice.subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">Tax ({ (invoice.taxRate * 100).toFixed(2) }%):</span>
                        <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-lg sm:text-xl font-bold text-indigo-700">
                        <span>Grand Total:</span>
                        <span>${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="text-lg sm:text-xl font-bold text-gray-700">Amount Due:</span>
                        <span className="text-lg sm:text-xl font-bold text-red-600">${invoice.amountDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailView;
// // src/components/features/invoices/InvoiceDetailView.tsx
// import React from 'react';
// import { Invoice } from '@/app/ar/types/finance'; 

// interface InvoiceDetailViewProps {
//     // Note: Since this component is likely rendered by a Server Component, 
//     // we must ensure the `invoice` data structure is correctly passed.
//     invoice: Invoice; 
// }

// // Utility function to format dates
// const formatDate = (date: Date) => {
//     // Ensure it's a Date object (if passed as string from the server component props)
//     const d = date instanceof Date ? date : new Date(date);
//     return d.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//     });
// };

// const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice }) => {
//     return (
//         <div className="space-y-8">
//             {/* --- Section 1: Customer & Dates --- */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b pb-6">
                
//                 {/* Customer Information */}
//                 <div className="md:col-span-1">
//                     <h3 className="text-lg font-semibold text-indigo-700 mb-2">Billed To</h3>
//                     <p className="font-bold text-gray-800">{invoice.customer.name}</p>
//                     <p className="text-sm text-gray-600">{invoice.customer.email}</p>
//                     {/* Add address fields if available on customer model */}
//                 </div>

//                 {/* Date Information */}
//                 <div className="md:col-span-2 grid grid-cols-2 gap-4 text-right">
//                     <div>
//                         <p className="text-sm font-medium text-gray-500">Invoice Date</p>
//                         <p className="text-base font-semibold text-gray-800">{formatDate(invoice.invoiceDate)}</p>
//                     </div>
//                     <div>
//                         <p className="text-sm font-medium text-gray-500">Due Date</p>
//                         <p className={`text-base font-semibold ${
//                             invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-800'
//                         }`}>
//                             {formatDate(invoice.dueDate)}
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* --- Section 2: Line Items Table --- */}
//             <h3 className="text-xl font-semibold text-gray-800 mb-4">Itemized Charges</h3>
//             <div className="overflow-x-auto shadow-inner rounded-lg border">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">Product/Description</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {invoice.items.map((item, index) => (
//                             <tr key={index}>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                                     {item.productName}
//                                     <p className="text-xs text-gray-500 mt-1">SKU: {item.skuSnapshot}</p>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.quantity}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${item.unitPrice.toFixed(2)}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{(item.discountRate * 100).toFixed(0)}%</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">${item.lineTotal.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* --- Section 3: Financial Summary --- */}
//             <div className="flex justify-end pt-6">
//                 <div className="w-full md:w-1/3 space-y-2">
//                     <div className="flex justify-between">
//                         <span className="text-gray-700">Subtotal:</span>
//                         <span className="font-medium">${invoice.subTotal.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                         <span className="text-gray-700">Tax ({ (invoice.taxRate * 100).toFixed(2) }%):</span>
//                         <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-xl font-bold text-indigo-700">
//                         <span>Grand Total:</span>
//                         <span>${invoice.totalAmount.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between pt-2">
//                         <span className="text-xl font-bold text-gray-700">Amount Due:</span>
//                         <span className="text-xl font-bold text-red-600">${invoice.amountDue.toFixed(2)}</span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default InvoiceDetailView;