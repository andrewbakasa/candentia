'use client';

import React, { useState } from 'react';
// Assuming ContractModel, ContractUpdateData, and ContractStatus are correctly imported
import { ContractModel, ContractUpdateData, ContractStatus } from '../_components/types/contract';
import { toast } from 'sonner';
// Assuming getISODate utility is available to format Date/ISO string to YYYY-MM-DD
import { getISODate } from '../_components/utils'; 

interface ContractUpdateFormProps {
  contract: ContractModel;
  onUpdateSuccess: (updatedData: ContractModel) => void;
}

// ContractUpdateForm Component
export default function ContractUpdateForm({ contract, onUpdateSuccess }: ContractUpdateFormProps) {
  
  // Safely format dates for input type="date", defaulting to '' if null
  const formatDateForInput = (date: Date | string | null | undefined): string => getISODate(date);

  // Initialize form state with existing contract data
  const [formData, setFormData] = useState<ContractUpdateData>({
    title: contract.title,
    status: contract.status,
    description: contract.description,
    counterpartyName: contract.counterpartyName,
    annualRevenueUsd: contract.annualRevenueUsd,
    annualizedCostUsd: contract.annualizedCostUsd,
    notes: contract.notes,

    // --- NEW FIELDS ---
    effectiveDate: formatDateForInput(contract.effectiveDate),
    expirationDate: formatDateForInput(contract.expirationDate),
    nextReviewDate: formatDateForInput(contract.nextReviewDate),
    autoRenew: contract.autoRenew, // Assuming this exists and is boolean
    paymentTerms: contract.paymentTerms,
    riskRating: contract.riskRating,
    // --- END NEW FIELDS ---

  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData(prev => {
      let newValue: string | number | boolean | null = value;

      if (type === 'number') {
        // Convert empty string to null, otherwise convert to number
        newValue = value === '' ? null : parseFloat(value);
      } else if (type === 'checkbox') {
        newValue = checked;
      }
      
      // Handle the change
      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Prepare Data for API
    // Filter out undefined/null only if they are not explicitly being set to null (like an empty number field)
    // const payload = {
    //     ...formData
    // }
    // 1. Prepare Data for API: Convert empty strings to NULL for database compatibility

    // 1. Prepare Data for API: Convert empty strings to NULL and format Dates for database compatibility
    const payload: ContractUpdateData = {};

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const k = key as keyof ContractUpdateData;
        let value = formData[k];

        // Identify date fields that require ISO formatting
        const isDateField = k === 'effectiveDate' || k === 'expirationDate' || k === 'nextReviewDate';

        if (isDateField && typeof value === 'string' && value.trim() !== '') {
            // FIX: Convert "YYYY-MM-DD" to full ISO-8601 string for Prisma/MongoDB
            (payload as any)[k] = value.trim() + 'T00:00:00.000Z';
        }
        else if (typeof value === 'string' && value.trim() === '') {
          // Rule 1: Convert empty strings from all nullable fields to null
          (payload as any)[k] = null; 
        } 
        else if (value !== undefined) {
          // Pass numbers, booleans, and non-empty strings/already null values as is
          (payload as any)[k] = value;
        }
      }
    }

 
    // 2. Call the Update API Endpoint (Example: /api/contracts/[id])
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT', // PATCH is generally better for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Attempt to read error message from response body
        let errorMessage = `Failed to update contract: ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // response was not JSON
        }
        throw new Error(errorMessage);
      }

      const updatedContract: ContractModel = await response.json();
      
      // 3. Update Parent Component State
      // Use the returned data to ensure the parent component has the latest source of truth
      onUpdateSuccess({ ...contract, ...updatedContract }); 
      toast.success(`Contract "${updatedContract.title}" updated successfully.`);
      
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'An unknown error occurred during update.');
      toast.error('Update failed: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Edit Contract Details</h2>
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        {/* Counterparty Name */}
        <div>
          <label htmlFor="counterpartyName" className="block text-sm font-medium text-gray-700">Counterparty Name</label>
          <input type="text" name="counterpartyName" id="counterpartyName" value={formData.counterpartyName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={formData.status || ContractStatus.DRAFT} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            {Object.values(ContractStatus).map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        
        {/* Payment Terms */}
        <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">Payment Terms</label>
          <input type="text" name="paymentTerms" id="paymentTerms" value={formData.paymentTerms || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Net 30, Quarterly" />
        </div>
        
        {/* --- DATES --- */}
        <div>
          <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">Effective Date</label>
          <input type="date" name="effectiveDate" id="effectiveDate" value={formData.effectiveDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        
        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <input type="date" name="expirationDate" id="expirationDate" value={formData.expirationDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        
        <div>
          <label htmlFor="nextReviewDate" className="block text-sm font-medium text-gray-700">Next Review Date</label>
          <input type="date" name="nextReviewDate" id="nextReviewDate" value={formData.nextReviewDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        {/* Risk Rating */}
        <div>
          <label htmlFor="riskRating" className="block text-sm font-medium text-gray-700">Risk Rating (0.0 - 5.0)</label>
          <input 
            type="number" 
            name="riskRating" 
            id="riskRating" 
            step="0.1" 
            min="0"
            max="5"
            value={formData.riskRating || ''} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" 
          />
        </div>

        {/* Annual Revenue Usd */}
        <div>
          <label htmlFor="annualRevenueUsd" className="block text-sm font-medium text-gray-700">Annual Revenue (USD)</label>
          <input type="number" name="annualRevenueUsd" id="annualRevenueUsd" value={formData.annualRevenueUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
        </div>
        
        {/* Annualized Cost Usd */}
        <div>
          <label htmlFor="annualizedCostUsd" className="block text-sm font-medium text-gray-700">Annualized Cost (USD)</label>
          <input type="number" name="annualizedCostUsd" id="annualizedCostUsd" value={formData.annualizedCostUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
        </div>
        
        {/* Auto Renew Checkbox */}
        <div className="flex items-center mt-6 md:col-span-2">
            <input 
                id="autoRenew"
                name="autoRenew"
                type="checkbox"
                checked={!!formData.autoRenew} // Ensure it's treated as boolean
                onChange={handleChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="autoRenew" className="ml-2 block text-base font-medium text-gray-900">
                Automatic Renewal
            </label>
        </div>
        
      </div>
      
      {/* Description */}
      <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" rows={3} value={formData.description || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
      </div>

      {/* Notes */}
      <div className="mt-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Internal Notes</label>
          <textarea name="notes" id="notes" rows={3} value={formData.notes || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-green-700 transition transform hover:scale-[1.01] active:scale-95 disabled:bg-gray-400 flex items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
// // app/contracts/[id]/ContractUpdateForm.tsx
// 'use client';

// import React, { useState } from 'react';
// import { ContractModel, ContractUpdateData, ContractStatus } from '../_components/types/contract';
// import { toast } from 'sonner';
// import { getISODate } from '../_components/utils';

// interface ContractUpdateFormProps {
//   contract: ContractModel;
//   onUpdateSuccess: (updatedData: ContractModel) => void;
// }

// export default function ContractUpdateForm({ contract, onUpdateSuccess }: ContractUpdateFormProps) {
//   // Initialize form state with existing contract data
//   const [formData, setFormData] = useState<ContractUpdateData>({
//     title: contract.title,
//     status: contract.status,
//     description: contract.description,
//     counterpartyName: contract.counterpartyName,
//     annualRevenueUsd: contract.annualRevenueUsd,
//     annualizedCostUsd: contract.annualizedCostUsd,
//     notes: contract.notes,
//     dueDate: getISODate(contract.dueDate)
//     // Add other fields you want to allow editing here
//     // Date fields need conversion if needed: expirationDate: contract.expirationDate?.split('T')[0] || '',
//   });

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'number' ? parseFloat(value) || null : value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);

//     // 1. Prepare Data for API
//     // Filter out null/undefined values if your API expects clean data
//     const payload = Object.fromEntries(
//       Object.entries(formData).filter(([, value]) => value !== null && value !== undefined)
//     );
   
//     // 2. Call the Update API Endpoint (Example: /api/contracts/[id])
//     try {
//       const response = await fetch(`/api/contracts/${contract.id}`, {
//         method: 'PUT', // or PATCH
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to update contract: ${response.statusText}`);
//       }

//       const updatedContract: ContractModel = await response.json();
      
//       // 3. Update Parent Component State
//       onUpdateSuccess({ ...contract, ...updatedContract }); // Merge the new data
      
//     } catch (err) {
//       console.error(err);
//       setError((err as Error).message || 'An unknown error occurred during update.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl">
//       <h2 className="text-xl font-semibold mb-4">Edit Contract Details</h2>
//       {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* Title */}
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
//           <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
//         </div>

//         {/* Status */}
//         <div>
//           <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
//           <select name="status" id="status" value={formData.status || ContractStatus.DRAFT} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
//             {Object.values(ContractStatus).map(status => (
//               <option key={status} value={status}>{status.replace('_', ' ')}</option>
//             ))}
//           </select>
//         </div>

//         {/* Counterparty Name */}
//         <div>
//           <label htmlFor="counterpartyName" className="block text-sm font-medium text-gray-700">Counterparty Name</label>
//           <input type="text" name="counterpartyName" id="counterpartyName" value={formData.counterpartyName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
//         </div>

//         {/* Annual Revenue Usd */}
//         <div>
//           <label htmlFor="annualRevenueUsd" className="block text-sm font-medium text-gray-700">Annual Revenue (USD)</label>
//           <input type="number" name="annualRevenueUsd" id="annualRevenueUsd" value={formData.annualRevenueUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
//         </div>
        
//         {/* Annualized Cost Usd */}
//         <div>
//           <label htmlFor="annualizedCostUsd" className="block text-sm font-medium text-gray-700">Annualized Cost (USD)</label>
//           <input type="number" name="annualizedCostUsd" id="annualizedCostUsd" value={formData.annualizedCostUsd || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
//         </div>
//       </div>
      
//       {/* Description */}
//       <div className="mt-4">
//           <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
//           <textarea name="description" id="description" rows={3} value={formData.description || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
//       </div>

//       <div className="mt-6 flex justify-end">
//         <button
//           type="submit"
//           disabled={isLoading}
//           className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
//         >
//           {isLoading ? 'Saving...' : 'Save Changes'}
//         </button>
//       </div>
//     </form>
//   );
// }