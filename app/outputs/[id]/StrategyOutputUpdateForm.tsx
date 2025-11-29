// This file implements a form for updating a StrategyOutputModel, 
// using a fetch call to simulate the API interaction.

import React, { useState } from 'react';
import { StrategyOutputModel } from '../_components/types/output';

// Helper to format date strings for the input[type="date"] element (YYYY-MM-DD)
const formatDateForInput = (isoDate?: string | null): string => {
    if (!isoDate) return '';
    try {
        return new Date(isoDate).toISOString().split('T')[0];
    } catch {
        return '';
    }
};

/**
 * Interface for the component props.
 * @param strategy The current strategy data to be edited.
 * @param onUpdateSuccess Callback function to be executed upon successful update.
 */
interface StrategyUpdateFormProps {
    strategy: StrategyOutputModel;
    onUpdateSuccess: (updatedData: StrategyOutputModel) => void;
}

const StrategyUpdateForm: React.FC<StrategyUpdateFormProps> = ({ strategy, onUpdateSuccess }) => {
    
    // State initialization for all fields based on the provided StrategyOutputModel structure
    const [title, setTitle] = useState(strategy.title);
    const [description, setDescription] = useState(strategy.description || '');
    const [responsible, setResponsible] = useState(strategy.responsible || '');
    // Cost estimate is stored as a string to handle empty input easily
    const [costEstimate, setCostEstimate] = useState(strategy.costEstimate != null ? String(strategy.costEstimate) : '');
    const [isCompleted, setIsCompleted] = useState(strategy.isCompleted || false);
    const [completionDate, setCompletionDate] = useState(formatDateForInput(strategy.completionDate));
    
    // State for handling loading/API interaction status
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Handles form submission, performing an asynchronous API update call.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // 1. Prepare payload with data from form state
        // We ensure optional fields are passed as null if empty, and parse numbers/dates correctly.
        const payload = {
            title: title,
            description: description || null, 
            responsible: responsible || null,
            // Convert string/empty string to Float/null
            costEstimate: costEstimate === '' ? null : parseFloat(costEstimate),
            isCompleted: isCompleted,
            // Convert YYYY-MM-DD date input to ISO string or null
            completionDate: completionDate ? new Date(completionDate).toISOString() : null,
        };

        try {
            // 2. API Call (Using PUT method to /api/outputs/{id})
            const response = await fetch(`/api/outputs/${strategy.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            // 3. Handle non-ok response with error message parsing
            if (!response.ok) {
                let errorMessage = `Failed to update strategy: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // response was not JSON or failed to parse
                }
                throw new Error(errorMessage);
            }

            // 4. Handle success response
            // We assume the API returns the full, newly updated object
            const updatedStrategy: StrategyOutputModel = await response.json();
            
            // 5. Success Feedback and Parent State Update
            onUpdateSuccess(updatedStrategy); 
            console.log(`Strategy ID ${strategy.id} updated successfully. New Title: ${updatedStrategy.title}`);

        } catch (err) {
            // Catch network errors or specific errors thrown above
            const errorMessage = (err as Error).message || 'An unknown error occurred during update.';
            console.error(err);
            setError('Update failed: ' + errorMessage);
        } finally {
            // Finalize loading state
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-extrabold text-indigo-700 mb-8">Edit Strategy Output Details</h2>
            
            {/* Error Message Display */}
            {error && (
                <div className="p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg" role="alert">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="flex flex-col">
                    <label htmlFor="strategyTitle" className="text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                        type="text" 
                        id="strategyTitle" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        required 
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
                        disabled={isLoading}
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
                        disabled={isLoading}
                    />
                </div>

                {/* Responsible & Cost Estimate (Side-by-side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Responsible */}
                    <div className="flex flex-col">
                        <label htmlFor="responsible" className="text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
                        <input 
                            type="text" 
                            id="responsible" 
                            value={responsible} 
                            onChange={(e) => setResponsible(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
                            disabled={isLoading}
                        />
                    </div>
                    
                    {/* Cost Estimate */}
                    <div className="flex flex-col">
                        <label htmlFor="costEstimate" className="text-sm font-medium text-gray-700 mb-1">Cost Estimate ($)</label>
                        <input 
                            type="number" 
                            id="costEstimate" 
                            value={costEstimate} 
                            onChange={(e) => setCostEstimate(e.target.value)}
                            step="0.01"
                            placeholder="e.g., 5000.00"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Completion Status (Side-by-side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    {/* Completion Date */}
                    <div className="flex flex-col">
                        <label htmlFor="completionDate" className="text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                        <input 
                            type="date" 
                            id="completionDate" 
                            value={completionDate} 
                            onChange={(e) => setCompletionDate(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
                            disabled={isLoading}
                        />
                    </div>
                    
                    {/* Is Completed Checkbox */}
                    <div className="flex items-center pt-4">
                        <input
                            id="isCompleted"
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => setIsCompleted(e.target.checked)}
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <label htmlFor="isCompleted" className="ml-3 text-sm font-medium text-gray-700">
                            Mark as Completed
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition font-semibold 
                            ${isLoading 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        {isLoading ? 'Saving...' : 'Save Strategy Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default StrategyUpdateForm;
// // This file implements a form for updating a StrategyOutputModel, 
// // using a fetch call to simulate the API interaction.

// import React, { useState } from 'react';
// import { StrategyOutputModel } from '../_components/types/output';

// /**
//  * Interface for the component props.
//  * @param strategy The current strategy data to be edited.
//  * @param onUpdateSuccess Callback function to be executed upon successful update.
//  */
// interface StrategyUpdateFormProps {
//     strategy: StrategyOutputModel;
//     onUpdateSuccess: (updatedData: StrategyOutputModel) => void;
// }

// const StrategyUpdateForm: React.FC<StrategyUpdateFormProps> = ({ strategy, onUpdateSuccess }) => {
//     // State for form fields (only title is currently implemented as a controlled input)
//     const [title, setTitle] = useState(strategy.title);
    
//     // State for handling loading/API interaction status
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     /**
//      * Handles form submission, performing an asynchronous API update call.
//      */
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError(null);
//         setIsLoading(true);

//         // 1. Prepare payload with data from form state
//         const payload = {
//             title: title,
//             // Include other fields here if the form expanded
//         };

//         try {
//             // 2. API Call (Using PUT method as per the provided logic)
//             const response = await fetch(`/api/outputs/${strategy.id}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(payload),
//             });

//             // 3. Handle non-ok response with error message parsing
//             if (!response.ok) {
//                 let errorMessage = `Failed to update strategy: ${response.statusText}`;
//                 try {
//                     const errorData = await response.json();
//                     if (errorData.message) {
//                         errorMessage = errorData.message;
//                     }
//                 } catch (e) {
//                     // response was not JSON or failed to parse
//                 }
//                 throw new Error(errorMessage);
//             }

//             // 4. Handle success response
//             // We assume the API returns the full, newly updated object
//             const updatedStrategy: StrategyOutputModel = await response.json();
            
//             // 5. Success Feedback and Parent State Update
//             onUpdateSuccess(updatedStrategy); 
//             console.log(`Strategy ID ${strategy.id} updated successfully. New Title: ${updatedStrategy.title}`);

//         } catch (err) {
//             // Catch network errors or specific errors thrown above
//             const errorMessage = (err as Error).message || 'An unknown error occurred during update.';
//             console.error(err);
//             setError('Update failed: ' + errorMessage);
//         } finally {
//             // Finalize loading state
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-lg mx-auto">
//             <h2 className="text-2xl font-extrabold text-indigo-700 mb-6">Edit Strategy Details</h2>
            
//             {/* Error Message Display */}
//             {error && (
//                 <div className="p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg" role="alert">
//                     <p className="font-semibold">Error:</p>
//                     <p>{error}</p>
//                 </div>
//             )}
            
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 <div className="flex flex-col">
//                     <label htmlFor="strategyTitle" className="text-sm font-medium text-gray-700 mb-1">Strategy Title</label>
//                     <input 
//                         type="text" 
//                         id="strategyTitle" 
//                         value={title} 
//                         onChange={(e) => setTitle(e.target.value)}
//                         required 
//                         className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-4 py-2 border"
//                         disabled={isLoading}
//                     />
//                 </div>
                
//                 <div className="flex justify-end pt-4">
//                     <button 
//                         type="submit" 
//                         disabled={isLoading}
//                         className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition font-semibold 
//                             ${isLoading 
//                                 ? 'bg-indigo-400 cursor-not-allowed' 
//                                 : 'bg-indigo-600 text-white hover:bg-indigo-700'
//                             }`}
//                     >
//                         {isLoading ? (
//                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                             </svg>
//                         ) : null}
//                         {isLoading ? 'Saving...' : 'Save Strategy Changes'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }

// export default StrategyUpdateForm;
// // This file is a placeholder for the renamed form component.
// // In a real application, the internal logic here would also need to be updated
// // to handle StrategyOutputModel instead of ContractModel.

// import React from 'react';
// import { StrategyOutputModel } from '../_components/types/output';
// //import { StrategyOutputModel } from '../_components/types/strategy';

// interface StrategyUpdateFormProps {
//     strategy: StrategyOutputModel;
//     onUpdateSuccess: (updatedData: StrategyOutputModel) => void;
// }

// const StrategyUpdateForm: React.FC<StrategyUpdateFormProps> = ({ strategy, onUpdateSuccess }) => {
//     // NOTE: Implementation of the update logic is omitted for brevity.
//     // In a full application, this component would contain the form fields, 
//     // API submission logic (PUT to /api/strategies/{id}), and call onUpdateSuccess.
    
//     // Mock implementation for demonstration
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         // In reality, this would be an async function calling the API
//         const mockUpdatedData: StrategyOutputModel = {
//             ...strategy,
//             title: (document.getElementById('mockTitle') as HTMLInputElement)?.value || strategy.title,
//             // ... other updated fields
//             updatedAt: new Date().toISOString()
//         };

//          try {
//       const response = await fetch(`/api/contracts/${contract.id}`, {
//         method: 'PUT', // PATCH is generally better for partial updates
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         // Attempt to read error message from response body
//         let errorMessage = `Failed to update contract: ${response.statusText}`;
//         try {
//             const errorData = await response.json();
//             if (errorData.message) {
//                 errorMessage = errorData.message;
//             }
//         } catch (e) {
//             // response was not JSON
//         }
//         throw new Error(errorMessage);
//       }

//       const updatedContract: ContractModel = await response.json();
      
//       // 3. Update Parent Component State
//       // Use the returned data to ensure the parent component has the latest source of truth
//       onUpdateSuccess({ ...contract, ...updatedContract }); 
//       toast.success(`Contract "${updatedContract.title}" updated successfully.`);
      
//     } catch (err) {
//       console.error(err);
//       setError((err as Error).message || 'An unknown error occurred during update.');
//       toast.error('Update failed: ' + (err as Error).message);
//     } finally {
//       setIsLoading(false);
//     }
        
//         onUpdateSuccess(mockUpdatedData);
//     };

//     return (
//         <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
//             <h2 className="text-xl font-bold text-indigo-700 mb-6">Edit Strategy Output Details</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="flex flex-col">
//                     <label htmlFor="mockTitle" className="text-sm font-medium text-gray-700">Strategy Title</label>
//                     <input 
//                         type="text" 
//                         id="mockTitle" 
//                         defaultValue={strategy.title} 
//                         required 
//                         className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition px-3 py-2 border"
//                     />
//                 </div>
                
//                 <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-700">
//                     <p className="font-semibold">Placeholder Notice:</p>
//                     <p>The full update form logic is replaced by a simple title field here. All other fields would be present in a complete application.</p>
//                 </div>
                
//                 <div className="flex justify-end pt-4">
//                     <button 
//                         type="submit" 
//                         className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition font-semibold"
//                     >
//                         Save Strategy Changes
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }

// export default StrategyUpdateForm;