'use client'

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuotations } from '../../hooks/useQuotations';
import { 
    QuotationStatus, 
    QuotationFormOutput 
} from '../../types/finance'; 
import QuotationForm from '../../_components/features/invoices/QuotationForm'; 
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

/**
 * CreateQuotationPage
 * Following Guideline 1 of 2025: Standardized Documentation & Financial Analysis
 */
const CreateQuotationPage = () => {
    const router = useRouter();
    const { createQuotation, isLoading: isHookLoading } = useQuotations();

    // Redefine the Submission Payload to restrict status to valid initial states
    type QuotationSubmissionPayload = QuotationFormOutput & { 
        status: QuotationStatus.DRAFT | QuotationStatus.PENDING;
    };

    const handleFormSubmit = async (formData: QuotationFormOutput) => { 
        const submissionData: QuotationSubmissionPayload = {
            ...formData,
            status: QuotationStatus.DRAFT, // Defaulting to Draft per standard operating procedure
        };
        
        try {
            const newQuotation = await createQuotation(submissionData); 
            if (newQuotation) {
                handleSubmissionSuccess(newQuotation);
            }
        } catch (error) {
            console.error("Quotation creation failed:", error);
            toast.error("Failed to create quotation. Please check the details and try again.");
        }
    };
    
    const handleSubmissionSuccess = (newQuotation: any) => {
        if (newQuotation && newQuotation.id) {
            toast.success(`Quotation ${newQuotation.quotationNumber || 'created'} successfully!`);
            router.push(`/ar/quotations/${newQuotation.id}`); 
        } else {
            router.push('/ar/quotations');
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-5xl mx-auto p-6 md:p-10">
                
                {/* --- IMPROVED HEADER SECTION --- */}
                <header className="mb-8">
                    <nav className="mb-4" aria-label="Breadcrumb">
                        <Link 
                            href="/ar/quotations" 
                            className="group inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors duration-200"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                            Back to Quotations
                        </Link>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                Create New Quotation
                            </h1>
                            <p className="mt-2 text-slate-600 max-w-2xl">
                                Prepare a new professional quotation. 
                            </p>
                        </div>
                        
                        <div className="hidden md:block">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                New Document
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-8 border-b border-slate-200" />
                </header>

                {/* --- FORM CONTAINER --- */}
                <main className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-1"> {/* Subtle padding to prevent internal border clipping */}
                        <QuotationForm 
                            onSubmit={handleFormSubmit}
                            isSubmitting={isHookLoading} 
                            isEditing={false} 
                            onSubmitSuccess={() => router.push('/ar/quotations')} 
                        /> 
                    </div>
                </main>

                {/* --- FOOTER HINT --- */}
                <footer className="mt-6 text-center text-xs text-slate-400">
                    All quotations are subject to Executive Committee Review as per Ref: Guideline 1 of 2025.
                </footer>
            </div>
        </div>
    );
};

export default CreateQuotationPage;
// // CreateQuotationPage.tsx

// 'use client'

// import React from 'react';
// import { useRouter } from 'next/navigation';
// import { useQuotations } from '../../hooks/useQuotations';
// // Import the necessary types, including the new QuotationFormOutput
// import { 
//     QuotationFormData, 
//     QuotationStatus, 
//     QuotationFormOutput // <-- NEW IMPORT
// } from '../../types/finance'; 
// // Import the form component
// import QuotationForm from '../../_components/features/invoices/QuotationForm'; 
// import { toast } from 'sonner';
// import { ChevronLeft, Link } from 'lucide-react';

// const CreateQuotationPage = () => {
//     const router = useRouter();
//     const { createQuotation, isLoading: isHookLoading } = useQuotations();

//     // --- FIX 1: Redefine the Submission Payload ---
//     // Use the exact same restricted type as the hook's expected payload
//     type QuotationSubmissionPayload = QuotationFormOutput & { 
//         status: QuotationStatus.DRAFT | QuotationStatus.PENDING; // <-- FIX: Restrict the status here
//     };

//     // FIX 2: Use the CORRECT TypeScript interface (QuotationFormOutput) for the form data
//     const handleFormSubmit = async (formData: QuotationFormOutput) => { 
        
//         // formData already contains all necessary fields from the form
//         const submissionData: QuotationSubmissionPayload = {
//             ...formData, // Spread all fields from the form (customerId, dates, totals, items, etc.)
//             status: QuotationStatus.DRAFT, // Set the initial status here, not from the form
//         };
        
//         try {
//             // The hook/API expects the SubmissionPayload, which has all required fields
//            // console.log('be4 hook:submissionData====>', submissionData)
//             const newQuotation = await createQuotation(submissionData); 
//            // console.log('afte hook:newQuotation ', newQuotation)
//             if (newQuotation) {
//                 handleSubmissionSuccess(newQuotation);
//             } else {
//                 //alert('Failed to create quotation: The API did not return a new quotation object.');
//             }
//         } catch (error) {
//             console.error("Quotation creation failed:", error);
//            // alert(`An unexpected error occurred during quotation creation. Check console.`);
//         }
//     };
    
//     const handleSubmissionSuccess = (newQuotation: any) => {
//         if (newQuotation && newQuotation.id) {
//             toast.success(`Quotation ${newQuotation.quotationNumber || newQuotation.id} created successfully!`);
//             // Assuming the newQuotation object returned from the API has the ID
//             router.push(`/ar/quotations/${newQuotation.id}`); 
//         } else {
//             router.push('/ar/quotations');
//         }
//     }

//     return (
//         <div className="p-8">
//             {/* <h1 className="text-3xl font-bold mb-6">Create New Quotation</h1> */}
//              {/* --- IMPROVED RESPONSIVE HEADER --- */}
//                         <div className="flex flex-col mb-6 sm:mb-8">
                            
//                             {/* 1. TOP ROW: Back to Dashboard Link */}
//                             <div className="mb-3"> 
//                                 <Link 
//                                     href="/ar/quotations" 
//                                     className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit"
//                                     aria-label="Return to AR Dashboard"
//                                 >
//                                     <ChevronLeft className="w-5 h-5 mr-1" />
//                                     <span className="text-sm font-medium">Quoations Dashboard</span>
//                                 </Link>
//                             </div>
            
//                             {/* 2. BOTTOM ROW: Title and Action Button */}
//                             <header className="flex justify-between items-center">
//                                 <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
//                                     Create New Quotation
//                                 </h1>
                                
                               
//                             </header>
//                         </div>
                        
//             <QuotationForm 
//                 onSubmit={handleFormSubmit}
//                 isSubmitting={isHookLoading} 
//                 isEditing={false} 
//                 onSubmitSuccess={() => router.push('/ar/quotations')} 
//             /> 
//         </div>
//     );
// };

// export default CreateQuotationPage;