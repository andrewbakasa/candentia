'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    PencilIcon, 
    FileTextIcon, 
    DollarSignIcon, 
    CalendarIcon,
    ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Type definitions for Quotation Details
interface QuotationItemDetail {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

interface QuotationDetail {
    id: string;
    quotationNumber: string;
    customer: { id: string; name: string; email: string; address: string; }; // More customer details
    status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    subTotal: number;
    totalAmount: number;
    items: QuotationItemDetail[];
    createdAt: string;
    updatedAt: string;
    // Assume invoice relation can be checked for creation
    invoiceCreated: boolean; 
}

// Helper to style status badge (reused from List View)
const StatusBadge: React.FC<{ status: QuotationDetail['status'] }> = ({ status }) => {
    const baseStyle = "px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full";
    switch (status) {
        case 'ACCEPTED':
            return <span className={`${baseStyle} bg-green-100 text-green-800`}>Accepted</span>;
        case 'PENDING':
            return <span className={`${baseStyle} bg-yellow-100 text-yellow-800`}>Pending</span>;
        case 'DRAFT':
            return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>Draft</span>;
        case 'REJECTED':
            return <span className={`${baseStyle} bg-red-100 text-red-800`}>Rejected</span>;
        default:
            return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>{status}</span>;
    }
};

// --- NEW COMPONENT: Responsive Item Table ---
interface QuotationItemsTableProps {
    items: QuotationItemDetail[];
    subTotal: number;
    totalAmount: number;
}

const QuotationItemsTable: React.FC<QuotationItemsTableProps> = ({ items, subTotal, totalAmount }) => {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    // --- Mobile Item Card Component ---
    const MobileItemCard: React.FC<{ item: QuotationItemDetail }> = ({ item }) => (
        <div className="border-b p-4 last:border-b-0">
            <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-gray-900">{item.productName}</p>
                <p className="text-lg font-bold text-indigo-600">{formatCurrency(item.lineTotal)}</p>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
                <span>{formatCurrency(item.unitPrice)} x {item.quantity} units</span>
            </div>
        </div>
    );

    // --- Totals Display Component ---
    const TotalsDisplay: React.FC = () => (
        <div className="p-4 pt-0">
            <div className="flex justify-between text-base font-semibold text-gray-700 py-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(subTotal)}</span>
            </div>
            {/* Tax/Discount rows would go here */}
            <div className="flex justify-between text-xl font-extrabold text-gray-800 pt-3 border-t-2 border-indigo-500">
                <span>Total Amount:</span>
                <span className="text-indigo-600">{formatCurrency(totalAmount)}</span>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Items</h2>

            {/* DESKTOP TABLE (Visible on screens >= lg) */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right text-base font-semibold text-gray-700">Subtotal:</td>
                            <td className="px-6 py-4 text-right text-base font-bold text-gray-900">{formatCurrency(subTotal)}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right text-xl font-bold text-gray-800 border-t-2 border-indigo-500">Total:</td>
                            <td className="px-6 py-4 text-right text-xl font-extrabold text-indigo-600 border-t-2 border-indigo-500">{formatCurrency(totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            {/* MOBILE CARD VIEW (Visible on screens < lg) */}
            <div className="lg:hidden">
                <div className="border rounded-lg mb-4">
                    {items.map((item) => (
                        <MobileItemCard key={item.id} item={item} />
                    ))}
                </div>
                <TotalsDisplay />
            </div>
        </div>
    );
};
// --- END NEW COMPONENT ---


export default function QuotationDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchQuotation = async () => {
            // Simulated Data for demonstration
            const mockData: QuotationDetail = {
                id: '123',
                quotationNumber: 'Q-2025-0012',
                customer: { 
                    id: 'C-045', 
                    name: 'Acme Corp Solutions', 
                    email: 'sales@acmecorp.com', 
                    address: '123 Tech Park Rd\nSilicon Valley, CA 94000' 
                },
                status: 'ACCEPTED',
                subTotal: 9800.00,
                totalAmount: 10780.00,
                items: [
                    { id: 'i1', productName: 'Enterprise License (Annual)', unitPrice: 5000.00, quantity: 1, lineTotal: 5000.00 },
                    { id: 'i2', productName: 'Custom Integration Service (Hours)', unitPrice: 80.00, quantity: 60, lineTotal: 4800.00 },
                ],
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                updatedAt: new Date().toISOString(),
                invoiceCreated: false, 
            };
            
            setLoading(true);
            try {
                // In a real app, replace the simulated data with this fetch:
                // const res = await fetch(`/ar/api/quotations/${id}`); 
                // if (!res.ok) throw new Error('Failed to fetch quote');
                // const data = await res.json();
                // setQuotation(data);

                // SIMULATION:
                await new Promise(resolve => setTimeout(resolve, 500));
                setQuotation(mockData);

            } catch (error) {
                console.error("Failed to fetch quotation:", error);
                // Handle error state
            } finally {
                setLoading(false);
            }
        };

        fetchQuotation();
    }, [id]);

    const handleCreateInvoice = () => {
        alert(`Action: Create Invoice for Quote #${quotation?.quotationNumber}. (API call needed to create invoice record)`);
        // router.push(`/ar/invoices/create?quoteId=${id}`);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Quotation Details...</div>;
    }

    if (!quotation) {
        return <div className="p-8 text-center text-red-500">Quotation not found.</div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
            
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 border-b pb-4">
                <div>
                    <Link href="/ar/quotations/list" className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit mb-2">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Back to List</span>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Quotation #{quotation.quotationNumber}
                    </h1>
                </div>
                {/* Actions: Use flex-wrap for small screens */}
                <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                    {quotation.status === 'ACCEPTED' && !quotation.invoiceCreated && (
                            <button 
                                onClick={handleCreateInvoice}
                                className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 text-sm whitespace-nowrap"
                            >
                                <DollarSignIcon className="w-5 h-5 mr-2" />
                                Create Invoice
                            </button>
                    )}
                    <Link href={`/ar/quotations/edit/${quotation.id}`}>
                        <button className="flex items-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-150 text-sm whitespace-nowrap">
                            <PencilIcon className="w-5 h-5 mr-2" />
                            Edit Quote
                        </button>
                    </Link>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1 & 2: Main Details & Items (Takes full width on mobile) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Status and Financials */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Status & Summary</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Current Status</p>
                                <StatusBadge status={quotation.status} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold text-indigo-600">${quotation.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Customer Details */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer</h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{quotation.customer.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{quotation.customer.email}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{quotation.customer.address}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Quotation Items Table (Now Responsive) */}
                    <QuotationItemsTable 
                        items={quotation.items}
                        subTotal={quotation.subTotal}
                        totalAmount={quotation.totalAmount}
                    />
                    
                </div>

                {/* Column 3: Metadata (Stacks below main content on mobile) */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Metadata</h3>
                        <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-700">
                                <CalendarIcon className="w-5 h-5 mr-3 text-indigo-500" />
                                <div>
                                    <span className="font-medium">Created:</span> {new Date(quotation.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                                <CalendarIcon className="w-5 h-5 mr-3 text-indigo-500" />
                                <div>
                                    <span className="font-medium">Last Updated:</span> {new Date(quotation.updatedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { 
//     PencilIcon, 
//     FileTextIcon, 
//     DollarSignIcon, 
//     CalendarIcon,
//     ChevronLeft
// } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// // Type definitions for Quotation Details
// interface QuotationItemDetail {
//     id: string;
//     productName: string;
//     unitPrice: number;
//     quantity: number;
//     lineTotal: number;
// }

// interface QuotationDetail {
//     id: string;
//     quotationNumber: string;
//     customer: { id: string; name: string; email: string; address: string; }; // More customer details
//     status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
//     subTotal: number;
//     totalAmount: number;
//     items: QuotationItemDetail[];
//     createdAt: string;
//     updatedAt: string;
//     // Assume invoice relation can be checked for creation
//     invoiceCreated: boolean; 
// }

// // Helper to style status badge (reused from List View)
// const StatusBadge: React.FC<{ status: QuotationDetail['status'] }> = ({ status }) => {
//     // ... (Same StatusBadge implementation as in List View)
//     const baseStyle = "px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full";
//     switch (status) {
//         case 'ACCEPTED':
//             return <span className={`${baseStyle} bg-green-100 text-green-800`}>Accepted</span>;
//         case 'PENDING':
//         case 'DRAFT':
//         // ... other statuses
//         default:
//             return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>{status}</span>;
//     }
// };


// export default function QuotationDetailPage({ params }: { params: { id: string } }) {
//     const { id } = params;
//     const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
//     const [loading, setLoading] = useState(true);
//     const router = useRouter();

//     useEffect(() => {
//         // Fetch specific quotation details
//         const fetchQuotation = async () => {
//             try {
//                 // Placeholder fetch: Replace with your actual API call
//                 const res = await fetch(`/ar/api/quotations/${id}`); 
//                 if (!res.ok) throw new Error('Failed to fetch quote');
//                 const data = await res.json();
//                 setQuotation(data);
//             } catch (error) {
//                 console.error("Failed to fetch quotation:", error);
//                 // Handle error state
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchQuotation();
//     }, [id]);

//     const handleCreateInvoice = () => {
//         // Logic to transition the quote status to 'ACCEPTED' (if pending)
//         // and then navigate to the invoice creation form, pre-filling data.
//         alert(`Action: Create Invoice for Quote #${quotation?.quotationNumber}. (API call needed to create invoice record)`);
//         // router.push(`/ar/invoices/create?quoteId=${id}`);
//     };

//     if (loading) {
//         return <div className="p-8 text-center text-gray-500">Loading Quotation Details...</div>;
//     }

//     if (!quotation) {
//         return <div className="p-8 text-center text-red-500">Quotation not found.</div>;
//     }

//     return (
//         <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
            
//             {/* Header & Actions */}
//             <div className="flex justify-between items-center mb-6 sm:mb-8 border-b pb-4">
//                 <div>
//                     <Link href="/ar/quotations/list" className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit mb-2">
//                         <ChevronLeft className="w-5 h-5 mr-1" />
//                         <span className="text-sm font-medium">Back to List</span>
//                     </Link>
//                     <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
//                         Quotation #{quotation.quotationNumber}
//                     </h1>
//                 </div>
//                 <div className="flex space-x-3">
//                     {quotation.status === 'ACCEPTED' && !quotation.invoiceCreated && (
//                          <button 
//                             onClick={handleCreateInvoice}
//                             className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 text-sm whitespace-nowrap"
//                         >
//                             <DollarSignIcon className="w-5 h-5 mr-2" />
//                             Create Invoice
//                         </button>
//                     )}
//                     <Link href={`/ar/quotations/edit/${quotation.id}`}>
//                         <button className="flex items-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-150 text-sm whitespace-nowrap">
//                             <PencilIcon className="w-5 h-5 mr-2" />
//                             Edit Quote
//                         </button>
//                     </Link>
//                 </div>
//             </div>
            
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
//                 {/* Column 1 & 2: Main Details & Items */}
//                 <div className="lg:col-span-2 space-y-8">
                    
//                     {/* Status and Financials */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-800">Status & Summary</h2>
//                         <div className="grid grid-cols-2 gap-4">
//                              <div>
//                                 <p className="text-sm font-medium text-gray-500">Current Status</p>
//                                 <StatusBadge status={quotation.status} />
//                             </div>
//                             <div>
//                                 <p className="text-sm font-medium text-gray-500">Total Amount</p>
//                                 <p className="text-2xl font-bold text-indigo-600">${quotation.totalAmount.toFixed(2)}</p>
//                             </div>
//                         </div>
//                     </div>
                    
//                     {/* Customer Details */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer</h2>
//                         <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
//                             <div>
//                                 <dt className="text-sm font-medium text-gray-500">Name</dt>
//                                 <dd className="mt-1 text-sm text-gray-900">{quotation.customer.name}</dd>
//                             </div>
//                             <div>
//                                 <dt className="text-sm font-medium text-gray-500">Email</dt>
//                                 <dd className="mt-1 text-sm text-gray-900">{quotation.customer.email}</dd>
//                             </div>
//                             <div className="sm:col-span-2">
//                                 <dt className="text-sm font-medium text-gray-500">Address</dt>
//                                 <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{quotation.customer.address}</dd>
//                             </div>
//                         </dl>
//                     </div>

//                     {/* Quotation Items Table */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-800">Items</h2>
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
//                                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
//                                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {quotation.items.map((item) => (
//                                         <tr key={item.id}>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">${item.unitPrice.toFixed(2)}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">{item.quantity}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">${item.lineTotal.toFixed(2)}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                                 <tfoot>
//                                     <tr>
//                                         <td colSpan={3} className="px-6 py-4 text-right text-base font-semibold text-gray-700">Subtotal:</td>
//                                         <td className="px-6 py-4 text-right text-base font-bold text-gray-900">${quotation.subTotal.toFixed(2)}</td>
//                                     </tr>
//                                     {/* Add Tax/Discount rows if applicable */}
//                                     <tr>
//                                         <td colSpan={3} className="px-6 py-4 text-right text-xl font-bold text-gray-800 border-t-2 border-indigo-500">Total:</td>
//                                         <td className="px-6 py-4 text-right text-xl font-extrabold text-indigo-600 border-t-2 border-indigo-500">${quotation.totalAmount.toFixed(2)}</td>
//                                     </tr>
//                                 </tfoot>
//                             </table>
//                         </div>
//                     </div>
                    
//                 </div>

//                 {/* Column 3: Metadata */}
//                 <div className="space-y-6">
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h3 className="text-lg font-semibold mb-4 text-gray-800">Metadata</h3>
//                         <div className="space-y-3">
//                             <div className="flex items-center text-sm text-gray-700">
//                                 <CalendarIcon className="w-5 h-5 mr-3 text-indigo-500" />
//                                 <div>
//                                     <span className="font-medium">Created:</span> {new Date(quotation.createdAt).toLocaleString()}
//                                 </div>
//                             </div>
//                             <div className="flex items-center text-sm text-gray-700">
//                                 <CalendarIcon className="w-5 h-5 mr-3 text-indigo-500" />
//                                 <div>
//                                     <span className="font-medium">Last Updated:</span> {new Date(quotation.updatedAt).toLocaleString()}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }