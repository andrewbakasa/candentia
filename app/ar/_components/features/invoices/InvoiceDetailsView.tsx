// src/components/features/invoices/InvoiceDetailView.tsx
import React from 'react';
import { Invoice, InvoiceStatus, Customer, InvoiceItem } from '@/app/ar/types/finance'; 

// Assuming Invoice, Customer, and InvoiceItem types are complete from '@/app/ar/types/finance'
// Added a placeholder for Customer phone/address for richer details in the view
type RichCustomer = Customer & { phone?: string; address?: string };
type RichInvoice = Omit<Invoice, 'customer'> & { customer: RichCustomer; taxRate: number };

interface InvoiceDetailViewProps {
    invoice: RichInvoice; // Use the enriched type
}

// Utility function to format dates
const formatDate = (date: Date | string) => {
    // Ensure the date object is created correctly
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
// Utility function for Status Badge styling - UPDATED
const getStatusClasses = (status: InvoiceStatus) => {
    switch (status) {
        case InvoiceStatus.PAID:
            return 'bg-green-100 text-green-800';
        case InvoiceStatus.DRAFT:
            return 'bg-gray-100 text-gray-800';
        case InvoiceStatus.SENT:
            return 'bg-indigo-100 text-indigo-800';
        case InvoiceStatus.OVERDUE:
            return 'bg-red-100 text-red-800';
        case InvoiceStatus.VOID:
            return 'bg-black text-white'; // VOID status should stand out
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// --- Mobile Line Item Card Component ---
const MobileLineItemCard: React.FC<{ item: InvoiceItem }> = ({ item }) => (
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
    
    // Ensure robust date handling, defaulting to current date if parsing fails
    const invoiceDate = new Date(invoice.invoiceDate);
    const dueDate = new Date(invoice.dueDate);
    
    // Fallback for taxRate if not explicitly available, though RichInvoice defines it
    const taxRate = invoice.taxRate ?? 0; 
   // console.log("taxRate:::", invoice)

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg space-y-8">
            
           
            {/* --- Section 1: Customer & Dates (Responsive Grid) --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 border-b pb-6">
                
                {/* Customer Information (Takes 1/2 width on mobile, 2/4 on desktop) */}
                <div className="col-span-full sm:col-span-2">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">Billed To</h3>
                    <p className="font-bold text-gray-800">{invoice.customer.name}</p>
                    {invoice.customer.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
                    {invoice.customer.phone && <p className="text-sm text-gray-600">Phone: {invoice.customer.phone}</p>}
                    {invoice.customer.address && <p className="text-sm text-gray-600 mt-2">{invoice.customer.address}</p>}
                </div>

                {/* Date Information (Takes 1/2 width on mobile, 2/4 on desktop, aligned right on desktop) */}
                <div className="col-span-full sm:col-span-2 grid grid-cols-2 gap-4 text-left sm:text-right">
                    <div className="col-span-1">
                        <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                        <p className="text-base font-semibold text-gray-800">{formatDate(invoiceDate)}</p>
                    </div>
                    <div className="col-span-1">
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className={`text-base font-semibold ${
                            invoice.status === 'OVERDUE' && invoice.amountDue > 0 ? 'text-red-600' : 'text-gray-800'
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
                {/* Summary box takes full width on mobile, then 2/3, then 1/3 on large screens */}
                <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 space-y-2">
                    
                    <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">${invoice.subTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-gray-700">Tax ({ (taxRate * 100).toFixed(2) }%):</span>
                        <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between border-t-2 border-indigo-500 pt-3 text-lg sm:text-xl font-bold text-indigo-700">
                        <span>Grand Total:</span>
                        <span>${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                        <span className="text-lg sm:text-xl font-bold text-gray-700">Amount Due:</span>
                        {/* Highlight amount due in red if positive, otherwise use black/default */}
                        <span className={`text-lg sm:text-xl font-bold ${
                            invoice.amountDue > 0 ? 'text-red-600' : 'text-gray-800'
                        }`}>
                            ${invoice.amountDue.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailView;