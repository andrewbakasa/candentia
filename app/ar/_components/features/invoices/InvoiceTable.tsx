'use client';

import React from 'react';
import Link from 'next/link';
// Assuming your types are defined here or imported correctly
// import { Invoice, InvoiceStatus, Customer } from '@/app/ar/types/finance'; 

// --- MOCK TYPES AND DATA (Keep these for demonstration if types file is missing) ---
enum InvoiceStatus { PAID = 'PAID', OVERDUE = 'OVERDUE', SENT = 'SENT', DRAFT = 'DRAFT', VOID = 'VOID' }
interface Customer { id: string; name: string; }
interface Invoice {
    id: string;
    invoiceNumber: string;
    customer: Customer;
    status: InvoiceStatus;
    invoiceDate: Date;
    dueDate: Date;
    totalAmount: any; // Using 'any' to match original code's mock implementation
    amountDue: any;   // Using 'any' to match original code's mock implementation
}

const mockInvoices: Invoice[] = [
    // { id: 'INV-2025-001', invoiceNumber: 'INV-2025-001', customer: { id: 'CUST001', name: 'Acme Corp' } as Customer, items: [], status: InvoiceStatus.PAID, invoiceDate: new Date('2025-11-01'), dueDate: new Date('2025-12-01'), totalAmount: 1250.00 as any, amountDue: 0.00 as any, subTotal: undefined, taxRate: 0, taxAmount: undefined },
    // { id: 'INV-2025-002', invoiceNumber: 'INV-2025-002', customer: { id: 'CUST002', name: 'Globex Ltd' } as Customer, items: [], status: InvoiceStatus.OVERDUE, invoiceDate: new Date('2025-11-15'), dueDate: new Date('2025-12-15'), totalAmount: 450.75 as any, amountDue: 450.75 as any, subTotal: undefined, taxRate: 0, taxAmount: undefined },
    // { id: 'INV-2025-003', invoiceNumber: 'INV-2025-003', customer: { id: 'CUST001', name: 'Acme Corp' } as Customer, items: [], status: InvoiceStatus.SENT, invoiceDate: new Date('2025-12-05'), dueDate: new Date('2026-01-05'), totalAmount: 899.00 as any, amountDue: 899.00 as any, subTotal: undefined, taxRate: 0, taxAmount: undefined },
    // { id: 'INV-2025-004', invoiceNumber: 'INV-2025-004', customer: { id: 'CUST003', name: 'Beta Systems' } as Customer, items: [], status: InvoiceStatus.DRAFT, invoiceDate: new Date('2025-12-10'), dueDate: new Date('2026-01-10'), totalAmount: 220.00 as any, amountDue: 220.00 as any, subTotal: undefined, taxRate: 0, taxAmount: undefined },
];
// --- END MOCK TYPES AND DATA ---


// Helper function to determine the visual style of the status pill
const getStatusClasses = (status: InvoiceStatus): string => {
    switch (status) {
        case InvoiceStatus.PAID: return 'bg-green-100 text-green-800';
        case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-800 animate-pulse';
        case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-800';
        case InvoiceStatus.DRAFT: return 'bg-gray-100 text-gray-800';
        case InvoiceStatus.VOID: return 'bg-yellow-100 text-yellow-800 line-through';
        default: return 'bg-gray-200 text-gray-700';
    }
};

// Helper to safely format numbers (assuming the Decimal type is handled or converted)
const formatCurrency = (amount: any): string => {
    const num = parseFloat(amount);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};


// --- MOBILE CARD VIEW COMPONENT ---
interface InvoiceCardProps {
    invoice: Invoice;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
    const amountDue = parseFloat(invoice.amountDue as any);
    const totalAmount = parseFloat(invoice.totalAmount as any);
    const isOverdue = amountDue > 0 && invoice.status === InvoiceStatus.OVERDUE;

    return (
        <Link 
            href={`/ar/invoices/${invoice.id}`} 
            className="block bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 border-indigo-500 hover:shadow-lg transition duration-150 ease-in-out"
        >
            <div className="flex justify-between items-start mb-2">
                {/* Invoice ID and Customer */}
                <div>
                    <p className="text-sm font-semibold text-indigo-600">{invoice.invoiceNumber}</p>
                    <p className="text-lg font-bold text-gray-900">{invoice.customer.name}</p>
                </div>
                {/* Status Pill */}
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(invoice.status)}`}>
                    {invoice.status.toLowerCase().replace('_', ' ')}
                </span>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-gray-100 pt-3 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500">Due Date</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex flex-col col-span-2">
                    <span className="text-gray-500">Amount Due</span>
                    <span className={`text-lg font-bold ${amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(amountDue)}
                    </span>
                </div>
            </div>
            
        </Link>
    );
};
// --- END MOBILE CARD VIEW COMPONENT ---


// --- MAIN INVOICE TABLE COMPONENT ---
interface InvoiceTableProps {
    invoices: Invoice[]; // Prop to pass in the list of invoices
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices = mockInvoices }) => {

    // Helper to render the common status pill
    const renderStatusPill = (status: InvoiceStatus) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(status)}`}>
            {status.toLowerCase().replace('_', ' ')}
        </span>
    );
    
    // --- DESKTOP TABLE VIEW ---
    const DesktopTable = (
        <div className="hidden sm:block shadow overflow-hidden border-b border-gray-200 rounded-lg">
            <div className="overflow-x-auto"> 
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Edit/View</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                {/* Invoice Number (Clickable link) */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                    <Link href={`/ar/invoices/${invoice.id}`} className="hover:text-indigo-900 transition duration-150">
                                        {invoice.invoiceNumber}
                                    </Link>
                                </td>

                                {/* Customer Name */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.customer.name}
                                </td>

                                {/* Total Amount */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                    {formatCurrency(invoice.totalAmount)}
                                </td>
                                
                                {/* Amount Due (Highlight if non-zero) */}
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${parseFloat(invoice.amountDue as any) > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                    {formatCurrency(invoice.amountDue)}
                                </td>

                                {/* Due Date */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </td>
                                
                                {/* Status Pill */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {renderStatusPill(invoice.status)}
                                </td>

                                {/* Action Link (View) */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/ar/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // --- MOBILE CARD LIST VIEW ---
    const MobileCards = (
        <div className="sm:hidden">
            {invoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
        </div>
    );
    
    return (
        <>
            {DesktopTable}
            {MobileCards}
        </>
    );
};

// Add default props for mock data in the list page component
InvoiceTable.defaultProps = {
    invoices: mockInvoices,
};

export default InvoiceTable;
// // src/components/features/invoices/InvoiceTable.tsx
// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { Invoice, InvoiceStatus, Customer } from '@/app/ar/types/finance';

// // Helper function to determine the visual style of the status pill
// const getStatusClasses = (status: InvoiceStatus): string => {
//     switch (status) {
//         case InvoiceStatus.PAID:
//             return 'bg-green-100 text-green-800';
//         case InvoiceStatus.OVERDUE:
//             return 'bg-red-100 text-red-800 animate-pulse';
//         case InvoiceStatus.SENT:
//             return 'bg-blue-100 text-blue-800';
//         case InvoiceStatus.DRAFT:
//             return 'bg-gray-100 text-gray-800';
//         case InvoiceStatus.VOID:
//             return 'bg-yellow-100 text-yellow-800 line-through';
//         default:
//             return 'bg-gray-200 text-gray-700';
//     }
// };

// // --- Mock Data (Replace with actual data fetching hook/API call) ---
// const mockInvoices: Invoice[] = [
//     {
//         id: 'INV-2025-001',
//         invoiceNumber: 'INV-2025-001',
//         customer: { id: 'CUST001', name: 'Acme Corp' } as Customer,
//         items: [],
//         status: InvoiceStatus.PAID,
//         invoiceDate: new Date('2025-11-01'),
//         dueDate: new Date('2025-12-01'),
//         totalAmount: 1250.00 as any, // Use `as any` or fix the Decimal type dependency
//         amountDue: 0.00 as any,
//         subTotal: undefined,
//         taxRate: 0,
//         taxAmount: undefined
//     },
//     {
//         id: 'INV-2025-002',
//         invoiceNumber: 'INV-2025-002',
//         customer: { id: 'CUST002', name: 'Globex Ltd' } as Customer,
//         items: [],
//         status: InvoiceStatus.OVERDUE,
//         invoiceDate: new Date('2025-11-15'),
//         dueDate: new Date('2025-12-15'),
//         totalAmount: 450.75 as any,
//         amountDue: 450.75 as any,
//         subTotal: undefined,
//         taxRate: 0,
//         taxAmount: undefined
//     },
//     {
//         id: 'INV-2025-003',
//         invoiceNumber: 'INV-2025-003',
//         customer: { id: 'CUST001', name: 'Acme Corp' } as Customer,
//         items: [],
//         status: InvoiceStatus.SENT,
//         invoiceDate: new Date('2025-12-05'),
//         dueDate: new Date('2026-01-05'),
//         totalAmount: 899.00 as any,
//         amountDue: 899.00 as any,
//         subTotal: undefined,
//         taxRate: 0,
//         taxAmount: undefined
//     },
// ];

// interface InvoiceTableProps {
//     invoices: Invoice[]; // Prop to pass in the list of invoices
// }

// const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices = mockInvoices }) => {

//     // Helper to safely format numbers (assuming the Decimal type is handled or converted)
//     const formatCurrency = (amount: any): string => {
//         const num = parseFloat(amount);
//         return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
//     };

//     return (
//         <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
//             <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                     <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                         <th className="relative px-6 py-3">
//                             <span className="sr-only">Edit</span>
//                         </th>
//                     </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                     {invoices.map((invoice) => (
//                         <tr key={invoice.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
//                             {/* Invoice Number (Clickable link) */}
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
//                                 <Link href={`/ar/invoices/${invoice.id}`} className="hover:text-indigo-900 transition duration-150">
//                                     {invoice.invoiceNumber}
//                                 </Link>
//                             </td>

//                             {/* Customer Name */}
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                 {invoice.customer.name}
//                             </td>

//                             {/* Total Amount */}
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
//                                 {formatCurrency(invoice.totalAmount)}
//                             </td>
                            
//                             {/* Amount Due (Highlight if non-zero) */}
//                             <td className={`px-6 py-4 whitespace-nowrap text-sm ${parseFloat(invoice.amountDue as any) > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
//                                 {formatCurrency(invoice.amountDue)}
//                             </td>

//                             {/* Due Date */}
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                 {new Date(invoice.dueDate).toLocaleDateString()}
//                             </td>
                            
//                             {/* Status Pill */}
//                             <td className="px-6 py-4 whitespace-nowrap">
//                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(invoice.status)}`}>
//                                     {invoice.status.toLowerCase().replace('_', ' ')}
//                                 </span>
//                             </td>

//                             {/* Action Link (View) */}
//                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                                 <Link href={`/ar/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900">
//                                     View
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// export default InvoiceTable;