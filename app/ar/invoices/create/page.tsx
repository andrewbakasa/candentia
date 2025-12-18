'use client'

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInvoices } from '../../hooks/useInvoice'; 
import InvoiceForm, { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';
import { ChevronLeft } from 'lucide-react';

const CreateInvoicePage = () => {
    const router = useRouter();
    const { createInvoice, isLoading: isHookLoading } = useInvoices();

    // Define the type for the final data structure expected by the createInvoice API
    type InvoiceSubmissionPayload = Omit<InvoiceFormData, 'id'> & {
        amountDue: number;
    };

    const handleFormSubmit = async (formData: InvoiceFormData) => { 
        const submissionData: InvoiceSubmissionPayload = {
            customerId: formData.customerId,
            invoiceDate: formData.invoiceDate,
            dueDate: formData.dueDate,
            taxRate: formData.taxRate,
            items: formData.items,
            subTotal: formData.subTotal, 
            taxAmount: formData.taxAmount,
            totalAmount: formData.totalAmount, 
            amountDue: formData.totalAmount, 
        };
                
        try {
            const newInvoice = await createInvoice(submissionData);
            if (newInvoice) {
                // Success is handled via onSubmitSuccess prop in InvoiceForm
            } else {
                alert('Failed to create invoice: The API did not return a new invoice object.');
            }
        } catch (error) {
            console.error("Invoice creation failed:", error);
            alert(`An unexpected error occurred during invoice creation. Check console.`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-5xl mx-auto p-6 md:p-10">
                
                {/* --- IMPROVED HEADER WITH BACK LINK --- */}
                <header className="mb-8">
                    <nav className="mb-4" aria-label="Breadcrumb">
                        <Link 
                            href="/ar/invoices" 
                            className="group inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors duration-200"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                            Back to Invoices
                        </Link>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                Create New Invoice
                            </h1>
                            <p className="mt-2 text-slate-600 max-w-2xl">
                                Generate a new tax invoice. Ensure all billing details and payment terms are 
                                accurate before submission.
                            </p>
                        </div>
                        
                        <div className="hidden md:block">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                                Invoice Draft
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-8 border-b border-slate-200" />
                </header>

                {/* --- FORM CONTAINER --- */}
                <main className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-1">
                        <InvoiceForm 
                            onSubmit={handleFormSubmit}
                            isSubmitting={isHookLoading} 
                            isEditing={false} 
                            onSubmitSuccess={() => router.push('/ar/invoices')} 
                        /> 
                    </div>
                </main>

                <footer className="mt-6 text-center text-xs text-slate-400 italic">
                    Refer to Ref: Guideline 1 of 2025 for standardized invoicing procedures.
                </footer>
            </div>
        </div>
    );
};

export default CreateInvoicePage;
// 'use client'

// import React from 'react';
// import { useRouter } from 'next/navigation';
// // Assuming useInvoices is an existing hook that provides createInvoice
// import { useInvoices } from '../../hooks/useInvoice'; 
// import InvoiceForm, { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';

// const CreateInvoicePage = () => {
//     const router = useRouter();
//     const { createInvoice, isLoading: isHookLoading } = useInvoices();

//     // Define the type for the final data structure expected by the createInvoice API
//     // This assumes your backend needs these fields, which come directly from the form.
//     type InvoiceSubmissionPayload = Omit<InvoiceFormData, 'id'> & {
//         amountDue: number;
//         // The subTotal, taxAmount, and totalAmount fields already exist in InvoiceFormData
//     };

//     // Use the correct TypeScript interface for the form data
//     const handleFormSubmit = async (formData: InvoiceFormData) => { 
        
//         // --- 1. Simplify Submission Data ---
//         // Trust the subTotal, taxAmount, and totalAmount calculated by the form component.
//         const submissionData: InvoiceSubmissionPayload = {
//             // Include all standard fields from the form data
//             customerId: formData.customerId,
//             invoiceDate: formData.invoiceDate,
//             dueDate: formData.dueDate,
//             taxRate: formData.taxRate,
//             items: formData.items,
            
//             // Include calculated totals directly from the form
//             subTotal: formData.subTotal, 
//             taxAmount: formData.taxAmount,
//             totalAmount: formData.totalAmount, 

//             // Add amountDue, which is typically the same as totalAmount for a new draft invoice
//             amountDue: formData.totalAmount, 
//         };
                
//         try {
//             const newInvoice = await createInvoice(submissionData);
            
//             if (newInvoice) {
//                 // Success will be handled by onSubmitSuccess
//             } else {
//                 // If createInvoice returns null/undefined but no error was thrown
//                 alert('Failed to create invoice: The API did not return a new invoice object.');
//             }
//         } catch (error) {
//             console.error("Invoice creation failed:", error);
//             alert(`An unexpected error occurred during invoice creation. Check console.`);
//         }
//     };
    
//     // --- 3. Corrected onSubmitSuccess Handler ---
//     const handleSubmissionSuccess = (newInvoice: any) => {
//         // You would typically use the actual newInvoice object returned by the API here.
//         // Assuming createInvoice returns the new invoice object.
//         if (newInvoice && newInvoice.id) {
//             alert(`Invoice ${newInvoice.invoiceNumber || newInvoice.id} created successfully!`);
//             router.push(`/ar/invoices/${newInvoice.id}`); 
//         } else {
//             // Handle case where API response is incomplete/unexpected
//             router.push('/ar/invoices');
//         }
//     }


//     return (
//         <div className="p-8">
//             <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
//             <InvoiceForm 
//                 onSubmit={handleFormSubmit}
//                 isSubmitting={isHookLoading} 
//                 isEditing={false} 
//                 // Pass the correct success handler
//                 onSubmitSuccess={() => router.push('/ar/invoices')} 
//             /> 
//         </div>
//     );
// };

// export default CreateInvoicePage;