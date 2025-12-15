// CreateQuotationPage.tsx

'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuotations } from '../../hooks/useQuotations';
// Import the necessary types, including the new QuotationFormOutput
import { 
    QuotationFormData, 
    QuotationStatus, 
    QuotationFormOutput // <-- NEW IMPORT
} from '../../types/finance'; 
// Import the form component
import QuotationForm from '../../_components/features/invoices/QuotationForm'; 
import { toast } from 'sonner';

const CreateQuotationPage = () => {
    const router = useRouter();
    const { createQuotation, isLoading: isHookLoading } = useQuotations();

    // --- FIX 1: Redefine the Submission Payload ---
    // Use the exact same restricted type as the hook's expected payload
    type QuotationSubmissionPayload = QuotationFormOutput & { 
        status: QuotationStatus.DRAFT | QuotationStatus.PENDING; // <-- FIX: Restrict the status here
    };

    // FIX 2: Use the CORRECT TypeScript interface (QuotationFormOutput) for the form data
    const handleFormSubmit = async (formData: QuotationFormOutput) => { 
        
        // formData already contains all necessary fields from the form
        const submissionData: QuotationSubmissionPayload = {
            ...formData, // Spread all fields from the form (customerId, dates, totals, items, etc.)
            status: QuotationStatus.DRAFT, // Set the initial status here, not from the form
        };
        
        try {
            // The hook/API expects the SubmissionPayload, which has all required fields
           // console.log('be4 hook:submissionData====>', submissionData)
            const newQuotation = await createQuotation(submissionData); 
           // console.log('afte hook:newQuotation ', newQuotation)
            if (newQuotation) {
                handleSubmissionSuccess(newQuotation);
            } else {
                //alert('Failed to create quotation: The API did not return a new quotation object.');
            }
        } catch (error) {
            console.error("Quotation creation failed:", error);
           // alert(`An unexpected error occurred during quotation creation. Check console.`);
        }
    };
    
    const handleSubmissionSuccess = (newQuotation: any) => {
        if (newQuotation && newQuotation.id) {
            toast.success(`Quotation ${newQuotation.quotationNumber || newQuotation.id} created successfully!`);
            // Assuming the newQuotation object returned from the API has the ID
            router.push(`/ar/quotations/${newQuotation.id}`); 
        } else {
            router.push('/ar/quotations');
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Create New Quotation</h1>
            <QuotationForm 
                onSubmit={handleFormSubmit}
                isSubmitting={isHookLoading} 
                isEditing={false} 
                onSubmitSuccess={() => router.push('/ar/quotations')} 
            /> 
        </div>
    );
};

export default CreateQuotationPage;