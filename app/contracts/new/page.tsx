'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Assuming @prisma/client is correctly set up for types (ideally use a separate type file)
import { ContractModel, ContractStatus } from '@prisma/client'; 
import { ArrowLeft, Loader2 } from 'lucide-react';

// --- Type Definition Refinement to fix TS Error ---

// 1. Define the base structure by omitting fields that must be strings in the form (like dates)
type BaseContractData = Partial<Omit<ContractModel, 
  | 'id' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'internalOwner' 
  | 'relatedProject'
  | 'contractActivityModels'
  | 'internalOwnerId'
  | 'effectiveDate' // Omit the original Date type
  | 'expirationDate' // Omit the original Date type
  | 'nextReviewDate' // Omit the original Date type
>>;

// 2. Define the Form State by combining the base data with string-based dates for HTML input compatibility
type ContractFormState = BaseContractData & {
    effectiveDate: string | null;
    expirationDate: string | null;
    nextReviewDate: string | null;
};

// --- Component Start ---

export default function NewContractPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContractFormState>({
    title: '',
    contractType: '',
    counterpartyName: '',
    description: '',
    status: ContractStatus.DRAFT, // Default status for new contracts
    autoRenew: false,
    annualRevenueUsd: null,
    annualizedCostUsd: null,
    riskRating: null,
    
    // Explicitly use string | null for state to match HTML input value expectations
    effectiveDate: null, 
    expirationDate: null,
    nextReviewDate: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: 
        type === 'checkbox' ? checked :
        // Date input value is already a string ('YYYY-MM-DD')
        type === 'date' ? (value || null) : 
        // Convert numbers, allowing empty string to be null
        type === 'number' ? (value === '' ? null : parseFloat(value)) :
        value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation check
    if (!formData.title || !formData.counterpartyName) {
        setError('Contract Title and Counterparty Name are required.');
        setIsLoading(false);
        return;
    }

    // 1. Prepare Data for API (the API route handles the date conversion from string to Date object)
    // We send the string/null values directly.
    const payload = {
        ...formData,
    };

    // 2. Call the Create API Endpoint
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create contract: ${response.status}`);
      }

      const newContract: ContractModel = await response.json();
      
      // 3. Redirect to the newly created contract's detail page
      router.push(`/contracts/${newContract.id}`);
      
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'An unknown error occurred during contract creation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header with Back Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-800">
          <span className="text-indigo-600">✍️</span> New Business Contract
        </h1>
        <button
          onClick={() => router.push('/contracts')}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Return to All Contracts
        </button>
      </div>
      
      {/* Contract Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 space-y-8">
        {error && <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg font-medium">{error}</div>}

        {/* --- Contract Details Section --- */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2 text-indigo-700">Contract Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>

            {/* Contract Type */}
            <div>
              <label htmlFor="contractType" className="block text-sm font-medium text-gray-700">Contract Type</label>
              <input type="text" name="contractType" id="contractType" value={formData.contractType || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., Vendor Agreement, MSA" />
            </div>

            {/* Counterparty Name */}
            <div>
              <label htmlFor="counterpartyName" className="block text-sm font-medium text-gray-700">Counterparty Name <span className="text-red-500">*</span></label>
              <input type="text" name="counterpartyName" id="counterpartyName" value={formData.counterpartyName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>

            {/* Status (Default DRAFT, but allow selection) */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status</label>
              <select name="status" id="status" value={formData.status || ContractStatus.DRAFT} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white appearance-none">
                {Object.values(ContractStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* --- Term Details Section --- */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2 text-indigo-700">Term Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">Effective Date</label>
              <input 
                type="date" 
                name="effectiveDate" 
                id="effectiveDate" 
                // Date input value must be a simple string (YYYY-MM-DD)
                value={formData.effectiveDate || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" 
              />
            </div>
            
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
              <input 
                type="date" 
                name="expirationDate" 
                id="expirationDate" 
                value={formData.expirationDate || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" 
              />
            </div>

            <div>
              <label htmlFor="nextReviewDate" className="block text-sm font-medium text-gray-700">Next Review Date</label>
              <input 
                type="date" 
                name="nextReviewDate" 
                id="nextReviewDate" 
                value={formData.nextReviewDate || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" 
              />
            </div>

            <div className="flex items-center h-full pb-1">
              <input type="checkbox" name="autoRenew" id="autoRenew" checked={formData.autoRenew} onChange={handleChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="autoRenew" className="ml-3 block text-sm font-medium text-gray-700 select-none">Auto Renew?</label>
            </div>
          </div>
        </section>

        {/* --- Financial Projections Section --- */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2 text-indigo-700">Financial Projections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div>
              <label htmlFor="annualRevenueUsd" className="block text-sm font-medium text-gray-700">Annual Revenue (USD)</label>
              <input type="number" name="annualRevenueUsd" id="annualRevenueUsd" value={formData.annualRevenueUsd || ''} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="0.00" />
            </div>
            
            <div>
              <label htmlFor="annualizedCostUsd" className="block text-sm font-medium text-gray-700">Annualized Cost (USD)</label>
              <input type="number" name="annualizedCostUsd" id="annualizedCostUsd" value={formData.annualizedCostUsd || ''} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="0.00" />
            </div>
            
            <div>
              <label htmlFor="riskRating" className="block text-sm font-medium text-gray-700">Risk Rating (1.0 - 5.0)</label>
              <input type="number" name="riskRating" id="riskRating" value={formData.riskRating || ''} onChange={handleChange} min="1" max="5" step="0.1" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., 3.5" />
            </div>
          </div>
        </section>

        {/* Description & Notes */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Contract Summary / Notes</label>
          <textarea name="description" id="description" rows={4} value={formData.description || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"></textarea>
        </div>
        
        {/* --- Action Buttons --- */}
        <div className="pt-4 flex justify-end space-x-4 border-t">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => router.push('/contracts')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-semibold transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold transition transform hover:scale-[1.01] active:scale-95"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? 'Saving Contract...' : 'Create Contract'}
          </button>
        </div>
      </form>
    </div>
  );
}