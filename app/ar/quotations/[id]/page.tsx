'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    PrinterIcon, 
    FileDownIcon, 
    MoreVerticalIcon, 
    ChevronLeft,
    CopyIcon,
    PencilIcon,
    FileTextIcon, 
    DollarSignIcon, 
    CalendarIcon,
    UserIcon,
    MapPinIcon,
    MailIcon,
    ClockIcon
} from 'lucide-react'; 

import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuLabel 
} from '@/components/ui/dropdown-menu'; 
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge'; // Using a standard UI Badge if available

// --- Enhanced Status Badge ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const variants: Record<string, string> = {
        ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
        REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${variants[status] || variants.DRAFT}`}>
            {status}
        </span>
    );
};

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [quotation, setQuotation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchQuotation = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/ar/api/quotations/${id}`); 
                if (!res.ok) throw new Error('Failed to fetch quote');
                const data = await res.json();
                setQuotation(data);
            } catch (error) {
                toast.error("Failed to load quotation details.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchQuotation();
    }, [id]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-medium">Loading professional quotation...</p>
        </div>
    );

    if (!quotation) return <div className="p-8 text-center text-red-500">Quotation not found.</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 bg-white rounded-xl shadow-lg mb-6">
            <div className="container mx-auto p-4 sm:p-8 max-w-6xl bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                
                {/* 1. TOP BREADCRUMB & PRIMARY ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <Link href="/ar/quotations" className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-2">
                            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Management</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Quote <span className="text-indigo-600">#{quotation.quotationNumber}</span>
                            </h1>
                            <StatusBadge status={quotation.status} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="hidden sm:flex" onClick={() => window.print()}>
                            <PrinterIcon className="w-4 h-4 mr-2" /> Print
                        </Button>
                        <Link href={`/ar/quotations/edit/${quotation.id}`}>
                            <Button variant="secondary" className="bg-white border-slate-200 shadow-sm">
                                <PencilIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        </Link>
                        {quotation.status === 'ACCEPTED' && !quotation.invoiceCreated && (
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100">
                                <DollarSignIcon className="w-4 h-4 mr-2" /> Convert to Invoice
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.open(`/ar/api/quotations/${id}/excel`, '_blank')}>
                                    <FileDownIcon className="w-4 h-4 mr-2 text-green-600" /> Export Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied");
                                }}>
                                    <CopyIcon className="w-4 h-4 mr-2 text-indigo-600" /> Share Link
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: Main Details */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Value</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(quotation.totalAmount)}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Items</p>
                                <p className="text-2xl font-black text-slate-900">{quotation.items.length} Lines</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tax Rate</p>
                                <p className="text-2xl font-black text-indigo-600">{(quotation.taxRate * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center">
                                    <FileTextIcon className="w-4 h-4 mr-2 text-indigo-500" /> Quotation Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-tight">
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-right">Qty</th>
                                            <th className="px-6 py-4 text-right">Price</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quotation.items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.productName}</td>
                                                <td className="px-6 py-4 text-sm text-right text-slate-600">{item.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">{formatCurrency(item.lineTotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-50/80 px-6 py-6 border-t border-slate-100">
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="flex justify-between w-full max-w-[240px] text-sm text-slate-500">
                                        <span>Subtotal:</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(quotation.subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-[240px] text-sm text-slate-500">
                                        <span>Tax Amount:</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(quotation.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-[240px] pt-3 border-t border-slate-200 text-lg">
                                        <span className="font-black text-slate-900">Total:</span>
                                        <span className="font-black text-indigo-600">{formatCurrency(quotation.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar Info */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Customer Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <UserIcon className="w-4 h-4 mr-2 text-indigo-500" /> Customer
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black text-slate-900">{quotation.customer.name}</p>
                                    <div className="flex items-center text-xs text-slate-500 mt-1">
                                        <MailIcon className="w-3 h-3 mr-1" /> {quotation.customer.email}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-start text-xs text-slate-600 leading-relaxed">
                                        <MapPinIcon className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                                        <span className="whitespace-pre-line">{quotation.customer.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History/Log Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <ClockIcon className="w-4 h-4 mr-2 text-indigo-500" /> Quote Activity
                            </h3>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                                <div className="relative pl-8">
                                    <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow-sm ring-1 ring-indigo-500"></span>
                                    <p className="text-xs font-bold text-slate-900">Quotation Created</p>
                                    <p className="text-[10px] text-slate-400">{new Date(quotation.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="relative pl-8">
                                    <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white bg-slate-300"></span>
                                    <p className="text-xs font-bold text-slate-500">Last Modified</p>
                                    <p className="text-[10px] text-slate-400">{new Date(quotation.updatedAt).toLocaleString()}</p>
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
//     PrinterIcon, 
//     FileDownIcon, 
//     MoreVerticalIcon, 
//     ChevronLeft,
//     CopyIcon, // <-- Import CopyIcon
//     PencilIcon
// } from 'lucide-react'; 

// // Assuming you have components like this (if not, you'd replace them with standard HTML/CSS)
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'; 
// import { Button } from '@/components/ui/button'; // Assuming a Button component

// import { 
//     FileTextIcon, 
//     DollarSignIcon, 
//     CalendarIcon,
// } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { toast } from 'sonner';

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
//     const baseStyle = "px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full";
//     switch (status) {
//         case 'ACCEPTED':
//             return <span className={`${baseStyle} bg-green-100 text-green-800`}>Accepted</span>;
//         case 'PENDING':
//             return <span className={`${baseStyle} bg-yellow-100 text-yellow-800`}>Pending</span>;
//         case 'DRAFT':
//             return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>Draft</span>;
//         case 'REJECTED':
//             return <span className={`${baseStyle} bg-red-100 text-red-800`}>Rejected</span>;
//         default:
//             return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>{status}</span>;
//     }
// };

// // --- NEW COMPONENT: Responsive Item Table ---
// interface QuotationItemsTableProps {
//     items: QuotationItemDetail[];
//     subTotal: number;
//     totalAmount: number;
// }

// const QuotationItemsTable: React.FC<QuotationItemsTableProps> = ({ items, subTotal, totalAmount }) => {
//     const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

//     // --- Mobile Item Card Component ---
//     const MobileItemCard: React.FC<{ item: QuotationItemDetail }> = ({ item }) => (
//         <div className="border-b p-4 last:border-b-0">
//             <div className="flex justify-between items-center mb-1">
//                 <p className="font-semibold text-gray-900">{item.productName}</p>
//                 <p className="text-lg font-bold text-indigo-600">{formatCurrency(item.lineTotal)}</p>
//             </div>
//             <div className="text-sm text-gray-600 flex justify-between">
//                 <span>{formatCurrency(item.unitPrice)} x {item.quantity} units</span>
//             </div>
//         </div>
//     );

//     // --- Totals Display Component ---
//     const TotalsDisplay: React.FC = () => (
//         <div className="p-4 pt-0">
//             <div className="flex justify-between text-base font-semibold text-gray-700 py-2">
//                 <span>Subtotal:</span>
//                 <span>{formatCurrency(subTotal)}</span>
//             </div>
//             {/* Tax/Discount rows would go here */}
//             <div className="flex justify-between text-xl font-extrabold text-gray-800 pt-3 border-t-2 border-indigo-500">
//                 <span>Total Amount:</span>
//                 <span className="text-indigo-600">{formatCurrency(totalAmount)}</span>
//             </div>
//         </div>
//     );


//     return (
//         <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//             <h2 className="text-xl font-semibold mb-4 text-gray-800">Items</h2>

//             {/* DESKTOP TABLE (Visible on screens >= lg) */}
//             <div className="hidden lg:block overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
//                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {items.map((item) => (
//                             <tr key={item.id}>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">{item.quantity}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">{formatCurrency(item.lineTotal)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                     <tfoot>
//                         <tr>
//                             <td colSpan={3} className="px-6 py-4 text-right text-base font-semibold text-gray-700">Subtotal:</td>
//                             <td className="px-6 py-4 text-right text-base font-bold text-gray-900">{formatCurrency(subTotal)}</td>
//                         </tr>
//                         <tr>
//                             <td colSpan={3} className="px-6 py-4 text-right text-xl font-bold text-gray-800 border-t-2 border-indigo-500">Total:</td>
//                             <td className="px-6 py-4 text-right text-xl font-extrabold text-indigo-600 border-t-2 border-indigo-500">{formatCurrency(totalAmount)}</td>
//                         </tr>
//                     </tfoot>
//                 </table>
//             </div>
            
//             {/* MOBILE CARD VIEW (Visible on screens < lg) */}
//             <div className="lg:hidden">
//                 <div className="border rounded-lg mb-4">
//                     {items.map((item) => (
//                         <MobileItemCard key={item.id} item={item} />
//                     ))}
//                 </div>
//                 <TotalsDisplay />
//             </div>
//         </div>
//     );
// };
// // --- END NEW COMPONENT ---


// export default function QuotationDetailPage({ params }: { params: { id: string } }) {
//     const { id } = params;
//     const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
//     const [loading, setLoading] = useState(true);
//     const router = useRouter();

    
//      const handleCopyUrl = async () => {
//             try {
//                 await navigator.clipboard.writeText(window.location.href);
//                 toast.success("Invoice link copied to clipboard.");
//             } catch (err) {
//                 console.error('Failed to copy URL:', err);
//                 toast.error("Could not copy link. Please try manually.");
//             }
//         };
    
//         const handlePrintPDF = () => {
//             // 1. **Client-side Print:** Opens the browser's native print dialog for the current page.
//             window.print();
//         };
    
//         const handleExportExcel = () => {
//             // Triggers the download by navigating the window to a dedicated API route.
//             window.open(`/ar/api/quotations/${id}/excel`, '_blank');
//             toast.success("Invoice export initiated.");
//         };
    
        
//         const handleReturnToList = () => {
//             // Navigate to the main invoice list page
//             router.push('/ar/quotations'); 
//         };

//     // Update your useEffect inside QuotationDetailPage
// useEffect(() => {
//     const fetchQuotation = async () => {
//         setLoading(true);
//         try {
//             const res = await fetch(`/ar/api/quotations/${id}`); 
//             if (!res.ok) throw new Error('Failed to fetch quote');
            
//             const data = await res.json();
//             setQuotation(data);
//         } catch (error) {
//             console.error("Failed to fetch quotation:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (id) fetchQuotation();
// }, [id]);

//     const handleCreateInvoice = () => {
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
//             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 border-b pb-4">
//                 <div>
//                     <Link href="/ar/quotations/list" className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit mb-2">
//                         <ChevronLeft className="w-5 h-5 mr-1" />
//                         <span className="text-sm font-medium">Back to List</span>
//                     </Link>
//                     <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
//                         Quotation #{quotation.quotationNumber}
//                     </h1>
//                 </div>
//                 {/* Actions: Use flex-wrap for small screens */}
//                 <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
//                     {quotation.status === 'ACCEPTED' && !quotation.invoiceCreated && (
//                             <button 
//                                 onClick={handleCreateInvoice}
//                                 className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 text-sm whitespace-nowrap"
//                             >
//                                 <DollarSignIcon className="w-5 h-5 mr-2" />
//                                 Create Invoice
//                             </button>
//                     )}
//                     <Link href={`/ar/quotations/edit/${quotation.id}`}>
//                         <button className="flex items-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-150 text-sm whitespace-nowrap">
//                             <PencilIcon className="w-5 h-5 mr-2" />
//                             Edit Quote
//                         </button>
//                     </Link>
//                      <DropdownMenu>
//                                     <DropdownMenuTrigger asChild>
//                                         <Button variant="outline" size="icon" disabled={false} className="border-gray-300">
//                                             <MoreVerticalIcon className="w-5 h-5" />
//                                         </Button>
//                                     </DropdownMenuTrigger>
//                                     <DropdownMenuContent align="end" className="w-56">
                                        
//                                         <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                                        
//                                         <DropdownMenuItem onClick={handleCopyUrl}>
//                                             <CopyIcon className="w-4 h-4 mr-2" /> Copy Current URL
//                                         </DropdownMenuItem>
                                        
//                                         <DropdownMenuSeparator /> {/* Optional separator for visual grouping */}
                                        
//                                         {/* Output Actions */}
//                                         <DropdownMenuItem onClick={handlePrintPDF}>
//                                             <PrinterIcon className="w-4 h-4 mr-2" /> Print/Export PDF
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem onClick={handleExportExcel}>
//                                             <FileDownIcon className="w-4 h-4 mr-2" /> Export to Excel
//                                         </DropdownMenuItem> 
//                                     </DropdownMenuContent>
//                                 </DropdownMenu>
//                 </div>
//             </div>
            
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
//                 {/* Column 1 & 2: Main Details & Items (Takes full width on mobile) */}
//                 <div className="lg:col-span-2 space-y-8">
                    
//                     {/* Status and Financials */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-800">Status & Summary</h2>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
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

//                     {/* Quotation Items Table (Now Responsive) */}
//                     <QuotationItemsTable 
//                         items={quotation.items}
//                         subTotal={quotation.subTotal}
//                         totalAmount={quotation.totalAmount}
//                     />
                    
//                 </div>

//                 {/* Column 3: Metadata (Stacks below main content on mobile) */}
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