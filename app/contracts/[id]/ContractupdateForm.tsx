// app/contracts/[id]/ContractUpdateForm.tsx
'use client';

import React, { useState } from 'react';
import { ContractModel, ContractUpdateData, ContractStatus } from '../_components/types/contract';
// import { ContractModel, ContractStatus, ContractUpdateData } from './_components/types/contract';
//import { ContractModel, ContractUpdateData, ContractStatus } from '@/types/contract';

interface ContractUpdateFormProps {
  contract: ContractModel;
  onUpdateSuccess: (updatedData: ContractModel) => void;
}

export default function ContractUpdateForm({ contract, onUpdateSuccess }: ContractUpdateFormProps) {
  // Initialize form state with existing contract data
  const [formData, setFormData] = useState<ContractUpdateData>({
    title: contract.title,
    status: contract.status,
    description: contract.description,
    counterpartyName: contract.counterpartyName,
    annualRevenueUsd: contract.annualRevenueUsd,
    annualizedCostUsd: contract.annualizedCostUsd,
    notes: contract.notes,
    // Add other fields you want to allow editing here
    // Date fields need conversion if needed: expirationDate: contract.expirationDate?.split('T')[0] || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Prepare Data for API
    // Filter out null/undefined values if your API expects clean data
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== null && value !== undefined)
    );

    // 2. Call the Update API Endpoint (Example: /api/contracts/[id])
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT', // or PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contract: ${response.statusText}`);
      }

      const updatedContract: ContractModel = await response.json();
      
      // 3. Update Parent Component State
      onUpdateSuccess({ ...contract, ...updatedContract }); // Merge the new data
      
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'An unknown error occurred during update.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-semibold mb-4">Edit Contract Details</h2>
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={formData.status || ContractStatus.DRAFT} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            {Object.values(ContractStatus).map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Counterparty Name */}
        <div>
          <label htmlFor="counterpartyName" className="block text-sm font-medium text-gray-700">Counterparty Name</label>
          <input type="text" name="counterpartyName" id="counterpartyName" value={formData.counterpartyName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        {/* Annual Revenue Usd */}
        <div>
          <label htmlFor="annualRevenueUsd" className="block text-sm font-medium text-gray-700">Annual Revenue (USD)</label>
          <input type="number" name="annualRevenueUsd" id="annualRevenueUsd" value={formData.annualRevenueUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        
        {/* Annualized Cost Usd */}
        <div>
          <label htmlFor="annualizedCostUsd" className="block text-sm font-medium text-gray-700">Annualized Cost (USD)</label>
          <input type="number" name="annualizedCostUsd" id="annualizedCostUsd" value={formData.annualizedCostUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" rows={3} value={formData.description || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}