'use client';
import { useCallback, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, MessageSquare, Percent, Clipboard } from 'lucide-react';

// =======================================================
// --- ENUMS & TYPES (Consolidated) ---
// =======================================================

// Placeholder Enums (Assuming these are the standard Prisma values used client-side)
export const activityTypes = [ 'FOLLOW_UP', 'MEETING', 'DRAWING_APPROVAL', 'RESOURCE_ALLOCATION', 'SUPPLIER_ENGAGEMENT', 'DOCUMENT_SUBMISSION', 'OTHER'];
export const activityStatuses = ['SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED'];

/**
 * Interface representing the StrategyActivity model fields used in the form.
 * Note: Dates are strings for form handling, progressPercent is a number.
 */
interface ActivityFormDataType {
    title: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    status: (typeof activityStatuses)[number]; // Use string literal union for status
    activityType: (typeof activityTypes)[number]; // Added missing activityType
    progressPercent: number;
}

interface InputFieldProps {
    label: string;
    name: keyof ActivityFormDataType;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    icon: React.ElementType;
    required?: boolean;
}

interface SelectFieldProps {
    label: string;
    name: keyof ActivityFormDataType;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    icon: React.ElementType;
}

interface ActivityModelStub {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    status: (typeof activityStatuses)[number];
    activityType: (typeof activityTypes)[number]; // Must be present in the model coming in
    progressPercent: number;
}

interface AddActivityFormProps {
    onAdd: (newActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}

interface EditActivityFormProps {
    activity: ActivityModelStub;
    onUpdate: (activityId: string, updatedActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}

// =======================================================
// --- Utility Functions (Consolidated and Cleaned) ---
// =======================================================

/**
 * Ensures a date is formatted as 'YYYY-MM-DD' for HTML input type='date'.
 * Returns an empty string if null or invalid, which is correct for optional date inputs.
 */
const getISODate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return '';
    }
};


// Utility Functions (minimal set required by the main component)
export const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDate = (dateValue: Date | string | null | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Determines Tailwind classes for display based on status (or type, as in the original code).
 */
export const getStatusClasses = (status: string) => {
    const base = "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm inline-block";
    switch (status) {
        case 'COMPLETED':
        case 'DOCUMENT_SUBMISSION':
            return `${base} bg-green-100 text-green-700 border border-green-200`;
        case 'SCHEDULED':
        case 'FOLLOW_UP':
        case 'PENDING_REVIEW':
            return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
        case 'CANCELLED':
        case 'RESOURCE_ALLOCATION':
            return `${base} bg-red-100 text-red-700 border border-red-200`;
        case 'IN_PROGRESS':
        case 'DRAWING_APPROVAL':
            return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
        default:
            return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
    }
};

// =======================================================
// --- InputField Component ---
// =======================================================
export const InputField: React.FC<InputFieldProps> = ({ label, name, type = 'text', value, onChange, icon: Icon, required = true }) => (
    <div className="space-y-1">
        <label htmlFor={name as string} className="block text-sm font-medium text-gray-700 flex items-center">
            {Icon && <Icon className="w-4 h-4 mr-1 text-indigo-500" />}
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea
                name={name as string}
                id={name as string}
                value={String(value)}
                onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                required={required}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
            />
        ) : (
            <input
                type={type}
                name={name as string}
                id={name as string}
                value={String(value)}
                onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                required={required}
                min={type === 'number' ? 0 : undefined}
                max={type === 'number' ? 100 : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
        )}
    </div>
);

// =======================================================
// --- SelectField Component ---
// =======================================================
export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, icon: Icon }) => (
    <div className="space-y-1">
        <label htmlFor={name as string} className="block text-sm font-medium text-gray-700 flex items-center">
            {Icon && <Icon className="w-4 h-4 mr-1 text-indigo-500" />}
            {label}
        </label>
        <select
            name={name as string}
            id={name as string}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
        >
            {options.map((option) => (
                <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
            ))}
        </select>
    </div>
);

// =======================================================
// --- AddActivityForm Component ---
// =======================================================
export function AddActivityForm({ onAdd, onCancel, isLoading, error }: AddActivityFormProps) {
    const today = getISODate(new Date());

    const [formData, setFormData] = useState<ActivityFormDataType>({
        title: '',
        dueDate: today,
        description: null,
        startDate: null,
        completionDate: null,
        status: 'SCHEDULED', // Default from Prisma schema
        activityType: 'FOLLOW_UP', // Defaulting to the first type
        progressPercent: 0,
    });

    // Unified change handler for all form fields
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const fieldName = name as keyof ActivityFormDataType;

        setFormData(prevData => ({
            ...prevData,
            [fieldName]: type === 'number' ? Number(value) : (value || null), // Set empty string dates/optional text to null
        }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic required field check
        if (!formData.title || !formData.dueDate) {
            // Using console.error instead of alert
            console.error("Validation Error: Title, Responsible User ID, and Due Date are required.");
            return;
        }

        // Clean up: convert empty strings for optional dates/fields to null
        const cleanedData: ActivityFormDataType = {
            ...formData,
            description: formData.description || null,
       
            startDate: formData.startDate || null,
            completionDate: formData.completionDate || null,
        };

        onAdd(cleanedData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white border border-indigo-200 rounded-xl shadow-2xl mb-6 max-w-2xl mx-auto">
            <h3 className="text-2xl font-extrabold text-indigo-700 mb-6 border-b-4 border-indigo-100 pb-3 flex items-center">
                <Plus className="w-6 h-6 mr-3 text-indigo-500" />
                New Strategy Activity
            </h3>

            {error && (
                <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm font-medium">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <InputField
                        label="Activity Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        icon={Edit2}
                    />
                </div>
                <div className="md:col-span-2">
                    <InputField
                        label="Description (Optional)"
                        name="description"
                        type="textarea"
                        value={formData.description || ''}
                        onChange={handleChange}
                        icon={MessageSquare}
                        required={false}
                    />
                </div>

                <SelectField 
                    label="Activity Type"
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                    options={activityTypes}
                    icon={Clipboard}
                />

              

                <InputField
                    label="Start Date (Optional)"
                    name="startDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    icon={Calendar}
                    required={false}
                />
                <InputField
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={handleChange}
                    icon={Calendar}
                />

                <div className="md:col-span-2">
                    <InputField
                        label="Progress (%) (0-100)"
                        name="progressPercent"
                        type="number"
                        value={formData.progressPercent}
                        onChange={handleChange}
                        icon={Percent}
                        required={false}
                    />
                </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-between space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition ring-1 ring-gray-300 disabled:opacity-50 flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-xl hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center disabled:opacity-50"
                >
                    {isLoading ? (
                         <>
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Saving...
                         </>
                    ) : (
                         <>
                             <Plus className="w-4 h-4 mr-1" />
                             Save Activity
                         </>
                    )}
                </button>
            </div>
        </form>
    );
}

// =======================================================
// --- EditActivityForm Component ---
// =======================================================
export function EditActivityForm({ activity, onUpdate, onCancel, isLoading, error }: EditActivityFormProps) {
    // Initialize form data with the existing activity data
    const [formData, setFormData] = useState<ActivityFormDataType>({
        title: activity.title,
        startDate: getISODate(activity.startDate),
        dueDate: getISODate(activity.dueDate),
        completionDate: getISODate(activity.completionDate),
        status: activity.status,
        activityType: activity.activityType, // Initialize with existing type
        description: activity.description,
        progressPercent: activity.progressPercent,
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const fieldName = name as keyof ActivityFormDataType;

        setFormData(prevData => ({
            ...prevData,
            [fieldName]: type === 'number' ? Number(value) : (value || null),
        }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up: convert empty strings for optional dates/fields to null
        const cleanedData: ActivityFormDataType = {
            ...formData,
            description: formData.description || null,
            startDate: formData.startDate || null,
            completionDate: formData.completionDate || null,
        };
        
        onUpdate(activity.id, cleanedData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white border border-yellow-300 rounded-xl shadow-2xl mb-6 max-w-2xl mx-auto">
            <h3 className="text-2xl font-extrabold text-yellow-800 mb-6 border-b-4 border-yellow-100 pb-3 flex items-center">
                <Edit2 className="w-6 h-6 mr-3 text-yellow-600" />
                Edit Activity: {activity.title}
            </h3>

            {error && (
                <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm font-medium">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <InputField label="Activity Title" name="title" value={formData.title} onChange={handleChange} icon={Edit2} />
                </div>
                <div className="md:col-span-2">
                    <InputField 
                        label="Description (Optional)" 
                        name="description" 
                        type="textarea" 
                        value={formData.description || ''} 
                        onChange={handleChange} 
                        icon={MessageSquare} 
                        required={false} 
                    />
                </div>
                
                <SelectField 
                    label="Activity Type"
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                    options={activityTypes}
                    icon={Clipboard}
                />
                
               
                <InputField 
                    label="Start Date (Optional)" 
                    name="startDate" 
                    type="date" 
                    value={formData.startDate || ''} 
                    onChange={handleChange} 
                    icon={Calendar}
                    required={false}
                />
                
                <InputField 
                    label="Due Date" 
                    name="dueDate" 
                    type="date" 
                    value={formData.dueDate || ''} 
                    onChange={handleChange} 
                    icon={Calendar} 
                />
                
                <InputField 
                    label="Completion Date (Optional)" 
                    name="completionDate" 
                    type="date" 
                    value={formData.completionDate || ''} 
                    onChange={handleChange} 
                    icon={Calendar}
                    required={false}
                />
                
                <SelectField 
                    label="Current Status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>} 
                    options={activityStatuses} 
                    icon={CheckCircle} 
                />

                <div className="md:col-span-2">
                    <InputField
                        label="Progress (%) (0-100)"
                        name="progressPercent"
                        type="number"
                        value={formData.progressPercent}
                        onChange={handleChange}
                        icon={Percent}
                        required={false}
                    />
                </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-between space-x-3">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isLoading} 
                    className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition ring-1 ring-gray-300 disabled:opacity-50 flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </button>
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="px-6 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-xl shadow-xl hover:bg-yellow-700 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center disabled:opacity-50"
                >
                    {isLoading ? 
                        (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : 
                        (
                            <>
                                <Edit2 className="w-4 h-4 mr-1" />
                                Save Changes
                            </>
                        )
                    }
                </button>
            </div>
        </form>
    );
}