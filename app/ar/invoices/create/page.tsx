'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '../../hooks/useInvoice';
import InvoiceForm, { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';

const CreateInvoicePage = () => {
    const router = useRouter();
    const { createInvoice, isLoading: isHookLoading } = useInvoices();

    // Use the correct TypeScript interface for the form data
    const handleFormSubmit = async (formData: InvoiceFormData) => { 
       // Calculate the numerical values
            const calculatedSubTotal = formData.totalAmount - formData.totalAmount / (1 + formData.taxRate);
            const calculatedTaxAmount = formData.totalAmount / (1 + formData.taxRate) * formData.taxRate;
            
            // We pass the necessary data with the calculated numerical totals
            const submissionData = {
                ...formData,
                // *** FIX: Remove .toFixed(2) to keep them as numbers ***
                subTotal: calculatedSubTotal, 
                taxAmount: calculatedTaxAmount,
                amountDue: formData.totalAmount, // Assuming this is the 'totalAmount' from the form
                totalAmount: formData.totalAmount, 
            };
                
        const newInvoice = await createInvoice(submissionData);
        if (newInvoice) {
            alert(`Invoice ${newInvoice.invoiceNumber} created successfully!`);
            router.push(`/ar/invoices/${newInvoice.id}`); 
        } else {
            alert('Failed to create invoice....');
            console.log(",,,,,,,,",newInvoice)
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
            {/* The error is fixed by updating the InvoiceForm component */}
            <InvoiceForm 
                onSubmit={handleFormSubmit} 
                isSubmitting={isHookLoading} 
            /> 
        </div>
    );
};

export default CreateInvoicePage;