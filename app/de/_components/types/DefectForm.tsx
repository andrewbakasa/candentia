'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';

// === EMBEDDED TYPE DEFINITIONS TO RESOLVE COMPILATION ERRORS ===
// Note: These definitions were moved here from '../types/Defect'
// to ensure the component is fully self-contained and compiles successfully.

export enum Priority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum DefectStatus {
    IDENTIFIED = 'IDENTIFIED',
    IN_ANALYSIS = 'IN_ANALYSIS',
    ACTION_DEFINED = 'ACTION_DEFINED',
    ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
    CLOSED_VERIFIED = 'CLOSED_VERIFIED',
}

export interface NewDefectPayload {
    title: string;
    description: string;
    area: string;
    equipmentTag: string;
    priority: Priority;
    breakdownRelated: boolean;
    identificationDate: string; // ISO string format (YYYY-MM-DDThh:mm)
}

export interface DefectResponse {
    id: string;
    title: string;
    equipmentTag: string;
    status: DefectStatus;
}
// ===============================================================

// Define the type for the form state. Since NewDefectPayload matches
// the shape of the state (string date format), we can use it directly.
type DefectFormState = NewDefectPayload;

// Helper for dynamic enum key/value access
const PriorityOptions = Object.keys(Priority) as Array<keyof typeof Priority>;

// Initial state for the new defect form
const initialFormState: DefectFormState = {
    title: '',
    description: '',
    area: '',
    equipmentTag: '',
    priority: Priority.MEDIUM,
    breakdownRelated: false,
    identificationDate: new Date().toISOString().substring(0, 16), // YYYY-MM-DDThh:mm format
};

export default function NewDefectForm(): JSX.Element {
    // Apply type to useState
    const [formData, setFormData] = useState<DefectFormState>(initialFormState);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);

    // Handles changes for all input fields (text, number, select, checkbox)
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;
        
        // Handle checkbox separately
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoading(true);

        // Basic Front-End Validation
        if (!formData.title || !formData.description || !formData.equipmentTag) {
            setMessage('Please fill in the Title, Description, and Equipment Tag.');
            setIsError(true);
            setLoading(false);
            return;
        }

        try {
            // The payload is already typed as DefectFormState (NewDefectPayload)
            const payload: NewDefectPayload = {
                ...formData,
                // Ensure date is handled correctly (API expects ISO string)
                identificationDate: new Date(formData.identificationDate).toISOString(), 
            };
            
            // --- API CALL ---
            // In a real application, this would call your backend (e.g., Next.js API route)
            const response: Response = await fetch('/api/defects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // The result can either be the DefectResponse or an error object { message: string }
            const result: DefectResponse | { message: string, id?: string, title?: string } = await response.json();

            if (response.ok) {
                // Assert result as DefectResponse for safety
                const successResult = result as DefectResponse;
                setMessage(`Defect "${successResult.title}" (ID: ${successResult.id}) successfully logged!`);
                setFormData(initialFormState); // Clear form on success
            } else {
                setIsError(true);
                // Display the specific error message from the API Route
                setMessage(`Failed to log defect: ${result.title || 'Unknown error.'}`);
            }
        } catch (error) {
            setIsError(true);
            setMessage('Network error or server connection failed.');
            console.error('Submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-xl mt-10">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-3">
                Log New Defect
            </h2>

            {/* Notification Area */}
            {message && (
                <div className={`p-4 mb-4 rounded-lg ${isError ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Defect Title and Tag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Defect Title (Short Summary) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="equipmentTag" className="block text-sm font-medium text-gray-700">Equipment Tag <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="equipmentTag"
                            id="equipmentTag"
                            value={formData.equipmentTag}
                            onChange={handleChange}
                            required
                            placeholder="e.g., PUMP-101-A"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Detailed Description <span className="text-red-500">*</span></label>
                    <textarea
                        name="description"
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>

                {/* Priority, Area, and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                            name="priority"
                            id="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {PriorityOptions.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area/Location</label>
                        <input
                            type="text"
                            name="area"
                            id="area"
                            value={formData.area}
                            onChange={handleChange}
                            placeholder="e.g., Line 5, Workshop"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="identificationDate" className="block text-sm font-medium text-gray-700">Identification Date</label>
                        <input
                            type="datetime-local"
                            name="identificationDate"
                            id="identificationDate"
                            value={formData.identificationDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Breakdown Checkbox */}
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="breakdownRelated"
                            name="breakdownRelated"
                            type="checkbox"
                            checked={formData.breakdownRelated}
                            onChange={handleChange}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="breakdownRelated" className="font-medium text-gray-700">
                            Breakdown Related?
                        </label>
                        <p className="text-gray-500">
                            Check if this defect has caused or is causing an immediate operational shutdown.
                        </p>
                    </div>
                </div>
                
                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                    >
                        {loading ? 'Logging Defect...' : 'Log Defect'}
                    </button>
                </div>
            </form>
        </div>
    );
}