'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
// Assuming useInvoices is an existing hook that provides createInvoice
import { useInvoices } from '../../hooks/useInvoice'; 
import InvoiceForm, { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';

const CreateInvoicePage = () => {
    const router = useRouter();
    const { createInvoice, isLoading: isHookLoading } = useInvoices();

    // Define the type for the final data structure expected by the createInvoice API
    // This assumes your backend needs these fields, which come directly from the form.
    type InvoiceSubmissionPayload = Omit<InvoiceFormData, 'id'> & {
        amountDue: number;
        // The subTotal, taxAmount, and totalAmount fields already exist in InvoiceFormData
    };

    // Use the correct TypeScript interface for the form data
    const handleFormSubmit = async (formData: InvoiceFormData) => { 
        
        // --- 1. Simplify Submission Data ---
        // Trust the subTotal, taxAmount, and totalAmount calculated by the form component.
        const submissionData: InvoiceSubmissionPayload = {
            // Include all standard fields from the form data
            customerId: formData.customerId,
            invoiceDate: formData.invoiceDate,
            dueDate: formData.dueDate,
            taxRate: formData.taxRate,
            items: formData.items,
            
            // Include calculated totals directly from the form
            subTotal: formData.subTotal, 
            taxAmount: formData.taxAmount,
            totalAmount: formData.totalAmount, 

            // Add amountDue, which is typically the same as totalAmount for a new draft invoice
            amountDue: formData.totalAmount, 
        };
                
        try {
            const newInvoice = await createInvoice(submissionData);
            
            if (newInvoice) {
                // Success will be handled by onSubmitSuccess
            } else {
                // If createInvoice returns null/undefined but no error was thrown
                alert('Failed to create invoice: The API did not return a new invoice object.');
            }
        } catch (error) {
            console.error("Invoice creation failed:", error);
            alert(`An unexpected error occurred during invoice creation. Check console.`);
        }
    };
    
    // --- 3. Corrected onSubmitSuccess Handler ---
    const handleSubmissionSuccess = (newInvoice: any) => {
        // You would typically use the actual newInvoice object returned by the API here.
        // Assuming createInvoice returns the new invoice object.
        if (newInvoice && newInvoice.id) {
            alert(`Invoice ${newInvoice.invoiceNumber || newInvoice.id} created successfully!`);
            router.push(`/ar/invoices/${newInvoice.id}`); 
        } else {
            // Handle case where API response is incomplete/unexpected
            router.push('/ar/invoices');
        }
    }


    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
            <InvoiceForm 
                onSubmit={handleFormSubmit}
                isSubmitting={isHookLoading} 
                isEditing={false} 
                // Pass the correct success handler
                onSubmitSuccess={() => router.push('/ar/invoices')} 
            /> 
        </div>
    );
};

export default CreateInvoicePage;