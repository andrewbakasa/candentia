'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Import necessary types and hook
import { 
    QuotationFormData, 
    QuotationStatus, 
    QuotationFormOutput, // Minimal data from the form
    QuotationClient // Client-side Quotation model for initial data
} from '../../../types/finance'; 
import { useQuotations } from '../../../hooks/useQuotations'; 
// Import the form component
import QuotationForm from '../../../_components/features/invoices/QuotationForm'; 

// --- Props Interface (For Next.js App Router) ---
interface EditQuotationPageProps {
    params: {
        id: string; // ID of the QUOTATION to edit
    };
}

// --- Component Definition ---
// Note: Changed function name to match the file's purpose
export default function EditQuotationPage({ params }: EditQuotationPageProps) {
    const { id } = params;
    const router = useRouter();
    // Assuming useQuotations provides both update and fetch functionality
    const { updateQuotation, fetchQuotationById, isLoading: isHookLoading } = useQuotations(); 

    // State for holding fetched initial data
    const [initialData, setInitialData] = useState<QuotationClient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- 1. Fetch Existing Quotation Data ---
    useEffect(() => {
        const fetchExistingData = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                // Use the hook function to fetch the existing quotation
                // Assuming fetchQuotationById returns QuotationClient
                const data = await fetchQuotationById(id); 
                
                if (data) {
                    setInitialData(data);
                } else {
                    throw new Error('Quotation not found.');
                }
            } catch (err) {
                console.error("Error fetching quotation:", err);
                setError('Could not load quotation data.');
            } finally {
                setLoading(false);
            }
        };

        fetchExistingData();
    }, [id, fetchQuotationById]);
    
    // --- Submission Payload Definition (for update) ---
    // Update payload requires the ID, QuotationNumber, and Status (as they are required by Prisma)
    type QuotationUpdatePayload = QuotationFormOutput & { 
        id: string;
        quotationNumber: string;
        status: QuotationStatus.DRAFT | QuotationStatus.PENDING; 
    };

    /**
     * Handles the data returned from the QuotationForm component.
     * @param formData The data collected from the form inputs.
     */
    const handleFormSubmit = async (formData: QuotationFormOutput) => { 
        if (!initialData) {
            toast.error("Cannot submit: Initial data is missing.");
            return;
        }

        // When editing, we include the required fields for the full model
        // which were returned with the initialData.
        const submissionData: QuotationUpdatePayload = {
            ...formData, 
            id: initialData.id, // Pass the ID for the API PATCH route
            quotationNumber: initialData.quotationNumber, // Pass the existing number
            status: initialData.status as QuotationStatus.DRAFT | QuotationStatus.PENDING, // Use the current status
        };
        
        try {
            // --- CONVERSION: Use updateQuotation hook ---
            const updatedQuotation = await updateQuotation(id, submissionData); 
            
            if (updatedQuotation) {
                handleSubmissionSuccess();
            } else {
                toast.error('Failed to update quotation: The API did not return an updated object.');
            }
        } catch (error) {
            console.error("Quotation update failed:", error);
            toast.error(`An unexpected error occurred during quotation update. Check console.`);
        }
    };
    
    /**
     * Handles navigation and feedback after successful update.
     * @param updatedQuotation The quotation object returned from the API.
     */
    const handleSubmissionSuccess = useCallback(() => {
        if (id) {
            toast.success(`Quotation ${id} updated successfully!`);
            // Navigate to the detail page
            router.push(`/ar/quotations/${id}`); 
        } else {
            router.push('/ar/quotations');
        }
    }, [router]);

    // --- Loading, Error, and Not Found States ---
    if (loading) {
        return <div className="p-8 text-center text-indigo-600">Loading Quotation #{id}...</div>;
    }

    if (error || !initialData) {
        return <div className="p-8 text-center text-red-600 font-semibold">{error || 'Quotation not found.'}</div>;
    }

    // --- Cancel/Back Navigation Handler ---
    const handleCancel = () => {
        router.back(); 
    };

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Edit Quotation: #{initialData.quotationNumber}
                </h1>
                <button
                    onClick={handleCancel} 
                    className="flex items-center text-gray-600 hover:text-gray-800 transition duration-150 text-sm sm:text-base font-medium p-2 rounded-md hover:bg-gray-100"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Cancel
                </button>
            </div>
            
            <QuotationForm 
                initialData={initialData} // --- PASS INITIAL DATA ---
                onSubmit={handleFormSubmit}
                isSubmitting={isHookLoading} 
                isEditing={true} // --- SET TO EDITING MODE ---
                onSubmitSuccess={handleSubmissionSuccess} 
            /> 
        </div>
    );
}