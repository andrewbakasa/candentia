'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare, Clipboard, DollarSign, Loader2, XCircle, CornerUpLeft, X, Send, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Strategy } from '@prisma/client';
import { SafeUser } from '@/app/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// --- INLINED TYPES AND UTILITIES FOR SELF-CONTAINMENT ---

type ActivityStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
type ActivityType = 'MEETING' | 'TASK' | 'FOLLOW_UP' | 'REVIEW';


interface StrategyOutcomeModel {
    id: string;
    title: string;
    description: string;
}

interface StrategyDetailProps {
    strategyOutput: StrategyOutputModel;
    currentUser:SafeUser|null
}
interface StrategyActivityModel {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    status: ActivityStatus;
    progressPercent: number;
    activityType: string;// ActivityType;
    outputId: string;
    createdAt: string;
    updatedAt: string;
    // NEW: Include the Comments array with the relevant fields (similar to the Prisma model)
    comments?: {
        id: string;
        content: string;
        createdAt: Date;
        likesCount: number;
        authorId: string;
        author: { // Assuming you also want author details when fetching
            id: string;
            name: string;
            // ... other user details
        };
    }[];
}

interface StrategyOutputModel {
    id: string;
    title: string;
    description: string | null;
    responsible: string | null;
    costEstimate: number | null;
    isCompleted: boolean;
    completionDate: string | null;
    outcomeId: string;
    activities: StrategyActivityModel[]; // Corrected property name
    // Mock audit fields for display purposes
    createdAt: string;
    updatedAt: string;
   // outcome?: StrategyGoalModel; // Added parent goal
    outcome?: StrategyOutcomeFull | null; // Correct type for the nested outcome
}


// The top-level ancestor: The ACTUAL Strategy (parent of the Goal)
interface StrategyModel {
    id: string;
    title: string;
    description: string | null;
    // Assuming the full Strategy object has these fields
    submissionDate: string; 
    updatedAt: string;
}

// The Goal model, which contains the Strategy ancestor
interface StrategyGoalModel {
    id: string;
    title: string;
    description: string | null;
    targetYear: number;
    // The link to the actual Strategy (Backend sends this as goal.strategy)
    strategy: StrategyModel | null; 
    createdAt: string;
    updatedAt: string;
}

// The Outcome model, which contains the Goal
interface StrategyOutcomeFull {
    id: string;
    title: string;
    description: string | null;
    kpi: string | null;
    goal: StrategyGoalModel | null; // Goal is nested here
    createdAt: string;
    updatedAt: string;
}

// The Output model (the main object), which contains the Outcome


// Helper to format date for input[type="date"]
const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Format as YYYY-MM-DD
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error("Invalid date string for formatting:", dateString);
        return '';
    }
};

interface StrategyDetailProps {
    strategyOutput: StrategyOutputModel;
    currentUser:SafeUser|null
}

interface ActivityFormDataType {
    title: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    status: string; // Use string for form data before API conversion
    activityType: string; // Use string for form data before API conversion
}

// Minimal utility functions required
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = dateString.length > 10 ? new Date(dateString) : new Date(dateString + 'T00:00:00Z');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'Invalid Date';
    }
};

const formatCurrency = (amount: number | null): string => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getStatusClasses = (status: string): string => {
    switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-medium';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium';
        case 'OVERDUE': return 'bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-medium';
        case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full font-medium';
        default: return 'bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full font-medium';
    }
};


// NOTE: StrategyOutputModel definition is assumed to be available


const StrategyOutputUpdateForm: React.FC<{ strategy: StrategyOutputModel; onUpdateSuccess: (data: StrategyOutputModel) => void; isEditable:boolean}> = ({ strategy, onUpdateSuccess,isEditable }) => {
    // --- State Initialization (UPDATED) ---
    const [title, setTitle] = useState(strategy.title);
    const [description, setDescription] = useState(strategy.description || '');
    const [costEstimate, setCostEstimate] = useState(strategy.costEstimate || 0);
    const [responsible, setResponsible] = useState(strategy.responsible || '');
    const [isCompleted, setIsCompleted] = useState(strategy.isCompleted); // New State
    const [completionDate, setCompletionDate] = useState(formatDateForInput(strategy.completionDate)); // New State (formatted for input)
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // --- Effect to manage completionDate based on isCompleted ---
    useEffect(() => {
        if (isCompleted && !completionDate) {
            // Set today's date if completed is checked and date is empty
            setCompletionDate(formatDateForInput(new Date().toISOString()));
        } else if (!isCompleted) {
            // Clear date if completed is unchecked
            setCompletionDate('');
        }
    }, [isCompleted, completionDate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLocalError(null);

        // Determine the final completion date value for the payload
        let finalCompletionDate = null;
        if (isCompleted && completionDate) {
            // Convert YYYY-MM-DD input string back to ISO string for the backend
            // Set the time to midnight UTC for consistency, or adjust as needed
            finalCompletionDate = new Date(`${completionDate}T00:00:00.000Z`).toISOString();
        }

        const payload = {
            title,
            description: description.trim() || null,
            responsible: responsible.trim() || null,
            costEstimate: costEstimate,
            isCompleted: isCompleted, // Added to payload
            completionDate: finalCompletionDate, // Added to payload
        };

        try {
            // Mock API call for update
            const response = await fetch(`/api/outputs/${strategy.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Note: Assuming the API returns the updated StrategyOutputModel on success
            const result: StrategyOutputModel = await response.json();

            if (!response.ok) {
                // Assuming result.title might contain an error message
                setLocalError(result.title || 'Failed to update strategy.');
                return;
            }

            const updatedStrategy: StrategyOutputModel = {
                ...strategy,
                ...result,
                // Ensure the date fields reflect the latest data from the server or payload
                isCompleted: result.isCompleted, 
                completionDate: result.completionDate, 
                updatedAt: new Date().toISOString(),
            };
            
            // Re-sync local state with returned data to handle server-side processing
            setIsCompleted(updatedStrategy.isCompleted);
            setCompletionDate(formatDateForInput(updatedStrategy.completionDate));
            
            onUpdateSuccess(updatedStrategy);

        } catch (e) {
            console.error('Network or Parse Error:', e);
            setLocalError('A network error occurred during update.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">Edit Strategy Output Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                </div>
                
                {/* Responsible */}
                <div>
                    <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">Responsible Party (Name)</label>
                    <input
                        type="text"
                        id="responsible"
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                </div>
                
                {/* Cost Estimate */}
                <div className="md:col-span-1">
                    <label htmlFor="costEstimate" className="block text-sm font-medium text-gray-700">Cost Estimate (USD)</label>
                    <input
                        type="number"
                        id="costEstimate"
                        value={costEstimate || ''}
                        onChange={(e) => setCostEstimate(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                </div>

                {/* --- Completion Fields (NEW) --- */}
                
                {/* Is Completed Checkbox */}
                <div className="flex items-center pt-5">
                    <input
                        id="isCompleted"
                        name="isCompleted"
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => setIsCompleted(e.target.checked)}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isCompleted" className="ml-3 text-sm font-medium text-gray-700 flex items-center">
                        {isCompleted ? <CheckCircle className="w-5 h-5 mr-1 text-green-500" /> : <XCircle className="w-5 h-5 mr-1 text-red-500" />}
                        Output Finalized?
                    </label>
                </div>
                
                {/* Completion Date Picker (Conditional Visibility) */}
                {isCompleted && (
                    <div>
                        <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700">Completion Date</label>
                        <div className="mt-1 relative rounded-lg shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="date"
                                id="completionDate"
                                value={completionDate}
                                onChange={(e) => setCompletionDate(e.target.value)}
                                required={isCompleted} // Make required when checked
                                className="block w-full pl-10 pr-2 py-2 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 border text-sm"
                            />
                        </div>
                    </div>
                )}
                
                {/* --- End Completion Fields --- */}

            </div>
            
            {/* Description (Full Width) */}
            <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
            </div>

            {localError && <p className="mt-3 text-sm font-medium text-red-600">{localError}</p>}
            
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => onUpdateSuccess(strategy)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
                    disabled={!isEditable || isLoading || !title.trim() || (isCompleted && !completionDate)} // Disable if completed but date is missing
                >
                    {isLoading ? (<span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</span>) : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

// Simplified AddActivityForm
const AddActivityForm2: React.FC<{ onAdd: (data: ActivityFormDataType) => void; onCancel: () => void; isLoading: boolean; error: string | null,isEditable:boolean }> = ({ onAdd, onCancel, isLoading, error,isEditable }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [activityType, setActivityType] = useState('TASK');
    const [status, setStatus] = useState('SCHEDULED');
    const [localError, setLocalError] = useState<string | null>(null);

    const activityTypes: ActivityType[] = ['TASK', 'MEETING', 'FOLLOW_UP', 'REVIEW'];
    const statuses: ActivityStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!title.trim() || !dueDate.trim()) {
            setLocalError('Title and Due Date are required.');
            return;
        }

        const newActivity: ActivityFormDataType = {
            title: title.trim(),
            description: description.trim() || null,
            startDate: new Date().toISOString().slice(0, 10),
            dueDate: dueDate.trim() + 'T00:00:00.000Z',
            completionDate: status === 'COMPLETED' ? new Date().toISOString() : null,
            status,
            activityType,
        };

        onAdd(newActivity);
    };

    return (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 mb-6">
            <h4 className="text-lg font-bold text-indigo-800 mb-4">Add New Activity/Task</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title and Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {activityTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Due Date and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border"></textarea>
                </div>
                
                {(error || localError) && <p className="text-sm text-red-600">{error || localError}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={!isEditable || isLoading || !title.trim() || !dueDate.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                        {isLoading ? 'Adding...' : 'Add Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// Assuming ActivityFormDataType, ActivityStatus, and ActivityType are imported or defined here
// interface ActivityFormDataType { ... outputId: string; ... } 

// 🚨 UPDATED PROPS: The parent component must now provide the outputId.
const AddActivityForm: React.FC<{ 
    outputId: string; // <-- NEW REQUIRED PROP
    onAdd: (data: ActivityFormDataType & { outputId: string }) => void; 
    onCancel: () => void; 
    isLoading: boolean; 
    error: string | null;
    isEditable: boolean 
}> = ({ outputId, onAdd, onCancel, isLoading, error, isEditable }) => {
// Note: Changed the onAdd signature to explicitly show outputId being passed

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [activityType, setActivityType] = useState('TASK');
    const [status, setStatus] = useState('SCHEDULED');
    const [localError, setLocalError] = useState<string | null>(null);

    // Assuming these types are correctly imported
    const activityTypes: string[] = ['TASK', 'MEETING', 'FOLLOW_UP', 'REVIEW'];
    const statuses: string[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // 🚨 CRITICAL FIX: The API requires description to be non-empty/null
        if (!title.trim() || !dueDate.trim() || !description.trim()) {
            setLocalError('Title, Due Date, and Description are required.');
            return;
        }

        const newActivity = {
            title: title.trim(),
            description: description.trim(), // Now required and non-null
            startDate: new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z', // Send full ISO string
            dueDate: dueDate.trim() + 'T00:00:00.000Z',
            completionDate: status === 'COMPLETED' ? new Date().toISOString() : null,
            status,
            activityType,
            outputId, // 🚨 Pass the required outputId
        };

        // Note: The parent component's onAdd handler will need to accept this object
        onAdd(newActivity as any); // Cast as 'any' if ActivityFormDataType doesn't yet include outputId
    };

    return (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 mb-6">
            <h4 className="text-lg font-bold text-indigo-800 mb-4">Add New Activity/Task</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title and Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {activityTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Due Date and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    {/* 🚨 REQUIRED FIELD: Updated label and logic to enforce this */}
                    <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border"></textarea>
                </div>
                
                {(error || localError) && <p className="text-sm text-red-600">{error || localError}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={!isEditable || isLoading || !title.trim() || !dueDate.trim() || !description.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                        {isLoading ? 'Adding...' : 'Add Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Simplified EditActivityForm
const EditActivityForm: React.FC<{ activity: StrategyActivityModel; onUpdate: (id: string, data: ActivityFormDataType) => void; onCancel: () => void; isLoading: boolean; error: string | null,isEditable:boolean }> = ({ activity, onUpdate, onCancel, isLoading, error, isEditable }) => {
    
    const formatInputDate = (isoDate: string | null | undefined): string => {
        // Explicitly check for type string before calling .slice()
        return (isoDate && typeof isoDate === 'string' && isoDate.length >= 10) 
            ? isoDate.slice(0, 10) 
            : '';
    };

    const [title, setTitle] = useState(activity.title);
    const [description, setDescription] = useState(activity.description || '');
    const [dueDate, setDueDate] = useState(formatInputDate(activity.dueDate));
    const [status, setStatus] = useState<string>(activity.status);
    const [activityType, setActivityType] = useState<string>(activity.activityType);
    const [localError, setLocalError] = useState<string | null>(null);

    const activityTypes: ActivityType[] = ['TASK', 'MEETING', 'FOLLOW_UP', 'REVIEW'];
    const statuses: ActivityStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!title.trim() || !dueDate.trim()) {
            setLocalError('Title and Due Date are required.');
            return;
        }
        
        const updatedData: ActivityFormDataType = {
            title: title.trim(),
            description: description.trim() || null,
            startDate: formatInputDate(activity.startDate),
            dueDate: dueDate.trim() + 'T00:00:00.000Z',
            completionDate: status === 'COMPLETED' ? new Date().toISOString() : null,
            status,
            activityType,
        };
        ////// adddd api here
        onUpdate(activity.id, updatedData);
    };

    return (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-2">
            <h4 className="text-lg font-bold text-yellow-800 mb-4">Edit Activity: {activity.title}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title and Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {activityTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Due Date and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border"></textarea>
                </div>

                {(error || localError) && <p className="text-sm text-red-600">{error || localError}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={!isEditable || isLoading || !title.trim() || !dueDate.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- UI COMPONENTS ---
// Global Loading Overlay for API operations
const GlobalLoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center cursor-wait">
        <div className="flex items-center space-x-2 p-4 bg-white rounded-xl shadow-2xl">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent border-solid rounded-full animate-spin"></div>
            <p className="text-base font-semibold text-gray-800">Processing update...</p>
        </div>
    </div>
);

// Message Banner for success/error
const MessageBanner: React.FC<{ type: 'success' | 'error', message: string }> = ({ type, message }) => {
    const baseClasses = "fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl text-white font-semibold flex items-center space-x-2 transition-all duration-300 transform";
    const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';
    const Icon = type === 'success' ? CheckCircle : Zap;

    return (
        <div className={`${baseClasses} ${colorClasses} translate-x-0`}>
            <Icon className="w-5 h-5" />
            <span>{message}</span>
        </div>
    );
};
// --- NEW COMPONENT FOR PARENT CONTEXT ---
const ParentHierarchy: React.FC<{ outcome?: StrategyOutcomeFull|null; goal?: StrategyGoalModel|null }> = ({ outcome, goal }) => {
    const router = useRouter();

    const handleNavigation = useCallback((type: 'outcome' | 'goal' | 'list', id?: string) => {
        // Mock navigation logic
        if (type === 'list') {
            router.push('/outputs');
        } else if (id) {
            return
            //router.push(`/${type}s/${id}`); 
        }
    }, [router]);

    const ParentItem: React.FC<{ title: string; linkId: string; type: 'outcome' | 'goal', children?: React.ReactNode }> = ({ title, linkId, type, children }) => (
        <>
            <button
                onClick={() => handleNavigation(type, linkId)}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition truncate max-w-[150px] sm:max-w-none"
                title={title}
            >
                {title}
            </button>
            <span className="text-gray-400 mx-2">/</span>
            {children}
        </>
    );

    return (
        <div className="flex items-center text-sm mb-4">
            <button
                onClick={() => handleNavigation('list')}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition flex items-center"
            >
                <CornerUpLeft className="w-3.5 h-3.5 mr-1" /> All Strategy Outputs
            </button>
            <span className="text-gray-400 mx-2">/</span>

            {/* Check if Outcome and Goal exist before rendering the hierarchy */}
            {outcome && (
                <ParentItem title={outcome.title} linkId={outcome.id} type="outcome">
                    {goal && (
                        <ParentItem title={goal.title} linkId={goal.id} type="goal">

                           {goal.strategy && ( <ParentItem title={goal.strategy?.title|| "Title"} linkId={goal.strategy.id} type="goal">
                                <span className="font-semibold text-gray-700">Current Output</span>
                            </ParentItem>
                           )}
                            {/* <span className="font-semibold text-gray-700">{goal.goal?.title}</span> */}
                            {/* <span className="font-semibold text-gray-700">Current Output</span> */}
                        </ParentItem>
                    )}
                </ParentItem>
            )}
        </div>
    );
};

// --- CORE DETAIL ITEM COMPONENT ---
const DetailItem: React.FC<{ label: string, value: React.ReactNode, icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="p-4 flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 text-indigo-500 flex-shrink-0" />
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="text-base text-gray-900 font-semibold mt-0.5">{value}</dd>
        </div>
    </div>
);

// --- PARENT DETAIL BLOCK COMPONENT ---
const ParentDetailBlock: React.FC<{ title: string; description: string|null; linkId: string; type: 'outcome' | 'goal' }> = ({ title, description, linkId, type }) => {
    const router = useRouter();
    const Icon = type === 'outcome' ? CheckCircle : User; // Use relevant icon

    return (
        <div className="p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-300 bg-white">
            <div className='flex justify-between items-start'>
                <h4 className="text-lg font-bold text-gray-800 flex items-center">
                    <Icon className="w-4 h-4 mr-2 text-indigo-600" />
                    {type === 'outcome' ? 'Strategy Outcome' : 'Strategy Goal'}
                </h4>
                <button 
                    //  onClick={() => router.push(`/${type}s/${linkId}`)}
                     className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                    View Details
                </button>
            </div>
            <p className="mt-2 text-md font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>
    );
};



// interface EditCommentFormProps {
//     comment: Comment;
//     onUpdateSuccess: () => void;
//     onCancel: () => void;
// }

interface EditCommentFormProps {
    comment: CommentModel;
    // UPDATED: Now expects the updated comment object to be passed back.
    onUpdateSuccess: (updatedComment: CommentModel) => void; 
    onCancel: () => void;
}

interface AddCommentFormProps {
    activityId: string;
    currentUser: SafeUser | null;
    // UPDATED: Now expects the newly created comment object to be passed back.
    onCommentAdded: (newComment: CommentModel) => void;
    onCancel: () => void;
}


interface Comment { // Re-define model for local use
    id: string;
    content: string;
}
interface AuthorModel { 
    id: string;
    name: string;
}

interface CommentModel {
    id: string;
    content: string;
    createdAt:  string;
    likesCount: number;
    author: AuthorModel; 
    authorId: string;
}


// Models (Simplified for display)

// Placeholder for the Add Comment Form
export const AddActivityCommentForm: React.FC<AddCommentFormProps> = ({
    activityId,
    currentUser,
    onCommentAdded,
    onCancel,
}) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (!trimmedContent) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/outputs/activity/comment`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId, content: trimmedContent }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment.');
            }
            
            // Assuming the POST endpoint returns the newly created comment object
            const newComment = await response.json() as CommentModel; 
            
            toast.success('Comment added successfully!');
            onCommentAdded(newComment); // Pass the new comment back
            setContent('');
        } catch (error: any) {
            console.error('Comment addition error:', error);
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 mb-4">
            {/* Form elements for adding comment */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="Add a new comment..."
                className="w-full p-2 text-sm border border-indigo-400 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
                disabled={isLoading}
            />
            <div className="flex justify-end space-x-2">
                <Button type="button" onClick={onCancel} variant="ghost" disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading || !content.trim()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-1" />}
                    Post Comment
                </Button>
            </div>
        </form>
    );
};

export const EditActivityCommentForm: React.FC<EditCommentFormProps> = ({
    comment,
    onUpdateSuccess,
    onCancel,
}) => {
    const [content, setContent] = useState(comment.content);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (!trimmedContent || trimmedContent === comment.content.trim()) {
            onCancel(); // Close if no change
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/outputs/activity/comment/${comment.id}`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: trimmedContent }),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to update comment.');
            }
            
            // *** KEY CHANGE: Parse the updated comment from the response body ***
            // Assuming the PUT/PATCH endpoint returns the updated comment object.
            const updatedComment = await response.json() as CommentModel; 

            toast.success('Comment updated successfully!');
            onUpdateSuccess(updatedComment); // Pass the updated comment back
        } catch (error: any) {
            console.error('Comment update error:', error);
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-yellow-50/50 rounded-lg border border-yellow-200">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                className="w-full p-2 text-sm border border-yellow-400 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition"
                required
                disabled={isLoading}
            />
            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="ghost"
                    className="flex items-center text-sm text-gray-500 hover:bg-gray-200"
                    disabled={isLoading}
                >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex items-center bg-yellow-600 text-white hover:bg-yellow-700 text-sm"
                    disabled={isLoading || !content.trim() || content.trim() === comment.content.trim()} // Also disable if content is unchanged
                >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
};
interface ActivityCommentSectionProps {
    activityId: string;
    comments: any[];//CommentModel[];
    currentUser: SafeUser|null;
    onCommentAction: () => void; // Callback to tell parent (StrategyOutputDetailView) to refresh its state/comments
}

function ActivityCommentSection({ 
    activityId, 
    comments, 
    currentUser, 
    onCommentAction 
}: ActivityCommentSectionProps) {

    // 1. Initialize local state with comments prop
    const [commentsList, setCommentsList] = useState(comments);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

    // 2. Sync local state when the comments prop changes (i.e., when parent finishes refetching)
    useEffect(() => {
        setCommentsList(comments);
    }, [comments]);
    
    // --- Handlers for Comment Actions ---

    // Handler for successful ADDITION
    const handleAddSuccess = (newComment: CommentModel) => {
        setShowAddForm(false);
        // Optimistic update for addition: add new comment to the list
        // Note: For complex apps, relying on onCommentAction() might be safer if the backend 
        // applies pre-processing (like calculating the final timestamp or relationships).
        setCommentsList(prevList => [...prevList, newComment]);
        
        // Trigger parent refetch anyway for eventual consistency (if required by parent view)
        // If the parent only uses `comments` prop, this will trigger the useEffect above.
        onCommentAction(); 
    }
    
    // Handler for successful EDIT (Optimistic Update)
    const handleEditSuccess = (updatedComment: CommentModel) => {
        setEditingCommentId(null); 
        // Update the list optimistically with the new content
        setCommentsList(prevList =>
            prevList.map(c => (c.id === updatedComment.id ? updatedComment : c))
        );
        // Optional: onCommentAction(); // Could be called for eventual consistency/side effects
    }

    // Handler for DELETE (Optimistic Update)
    const handleDeleteComment = async (commentId: string) => {   
        const apiRoute = `/api/outputs/activity/comment/${commentId}`;
        console.log(`Attempting to delete comment: ${commentId}`);

        try {
            const response = await fetch(apiRoute, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status === 204) {
                console.log(`Comment ${commentId} successfully deleted.`);
                
                // *** OPTIMISTIC STATE UPDATE: Remove the comment from the list ***
                setCommentsList(prevList => prevList.filter(c => c.id !== commentId));
                
                // onCommentAction() is still called for the parent to update any other state or data it manages
                onCommentAction();
            } else if (response.status === 401 || response.status === 403 || response.status === 404) {
                const errorData = await response.json();
                console.error('Deletion failed:', errorData.message);
                toast.error(errorData.message || 'Deletion failed.');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Network or unexpected error while deleting comment ${commentId}:`, error);
            toast.error(`Error deleting comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-500" />
                    Activity Comments ({commentsList?.length || 0})
                </h4>
                <Button 
                    onClick={() => {
                        setShowAddForm(prev => !prev);
                        setEditingCommentId(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    {showAddForm ? 'Close Form' : 'Add Comment'}
                </Button>
            </div>
            
            {showAddForm && (
                <AddActivityCommentForm
                    activityId={activityId}
                    currentUser={currentUser}
                    onCommentAdded={handleAddSuccess} // Use the new handler
                    onCancel={() => setShowAddForm(false)}
                />
            )}
            
            {/* Render Comments using the local commentsList state */}
            <div className={`space-y-3 ${commentsList?.length > 0 ? 'mt-3' : ''}`}>
                {commentsList && commentsList.length > 0 ? (
                    commentsList
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Sort by oldest first
                        .map((comment) => (
                        <div key={comment.id} className="p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                            
                            {editingCommentId === comment.id ? (
                                // Show Edit Form
                                <EditActivityCommentForm
                                    comment={comment}
                                    onUpdateSuccess={handleEditSuccess} // Use the new handler
                                    onCancel={() => setEditingCommentId(null)}
                                />
                            ) : (
                                // Show Comment Content
                                <>
                                    <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                    <div className="mt-1 pt-1 border-t border-gray-100 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">
                                            by <span className="font-medium text-indigo-600">{comment?.author?.name}</span> on {formatDate(comment.createdAt)}
                                        </p>
                                        
                                        {/* Action Buttons (Only for the author) */}
                                        {currentUser?.id === comment.authorId && (
                                            <div className="flex space-x-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-6 h-6 text-gray-400 hover:text-indigo-600"
                                                    onClick={() => setEditingCommentId(comment.id)}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-6 h-6 text-gray-400 hover:text-red-600"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-500 italic ml-6">No comments yet. Be the first!</p>
                )}
            </div>
        </div>
    );
}
// --- IMPROVED StrategyOutputDetailView COMPONENT ---
function StrategyOutputDetailView({ strategyOutput: initialStrategy, currentUser }: StrategyDetailProps) {
      const mergedStrategy: StrategyOutputModel = { 
        ...initialStrategy, 
        outcome: initialStrategy.outcome 
    };
   // console.log("currentUser",currentUser)
     const allowedRoles: string[] = ['admin', 'executive'];
    
        const hasRequiredRole = useMemo(() => {
            if (!currentUser) {
                return false;
            }
    
            // Check 1: Is the user a global system admin?
            const isGlobalAdmin = currentUser.isAdmin === true;
    
            // Check 2: Does the user have a required role in their roles array?
            const hasRoleAccess = currentUser.roles 
                && currentUser.roles.some(role => 
                    allowedRoles.includes(role.toLowerCase())
                );
    
            // Access is granted if they are a global admin OR they have one of the required roles
            return isGlobalAdmin || hasRoleAccess;
    
        }, [currentUser]);
    
    //console.log("mergedStrategy",initialStrategy)
    const [strategyOutput, setStrategyOutput] = useState<StrategyOutputModel>(mergedStrategy);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };
    
    // --- API HANDLERS (Simplified for display) ---

    const handleUpdateActivity = async (
        activityId: string, 
        updatedData: ActivityFormDataType
    ) => {
        // 1. Initial State & Cleanup
        setIsLoading(true);
        clearMessages(); // Ensure this clears both error and success messages

        //console.log('Attempting to update activity:', activityId, updatedData);

        try {
                // 2. API Call with Resource Check
            const response = await fetch(`/api/outputs/activity/${activityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            // 3. Error Handling - HTTP Status Check
            if (!response.ok) {
                let errorDetail = 'Failed to update activity.';
                try {
                    // Try to parse JSON error message if available
                    const errorResult = await response.json();
                    errorDetail = errorResult.message || `${response.statusText} (${response.status})`;
                } catch {
                    // Handle case where response is not JSON
                    errorDetail = `${response.status} ${response.statusText || 'Unknown Error'}`;
                }
                setError(errorDetail);
                return;
            }

            // 4. Success Handling - Parse the Actual Updated Model
            // It is best practice for a PUT/PATCH endpoint to return the complete, 
            // updated resource object (StrategyActivityModel).
            const updatedActivityFromServer: StrategyActivityModel = await response.json(); 

            // 5. State Update - Use the Model from the Server (Most Reliable)
            setStrategyOutput((prevStrategy: StrategyOutputModel) => {
                // Find the index to ensure we are updating the correct item immutably
                const activityIndex = prevStrategy.activities.findIndex(a => a.id === activityId);
                
                if (activityIndex === -1) {
                    // Handle the case where the activity is not found in local state
                    console.error(`Activity with ID ${activityId} not found in local strategy list.`);
                    // You might choose to re-fetch the entire strategy here instead of returning prevStrategy
                    return prevStrategy; 
                }

                // Create a new array with the updated activity
                const newActivities = [
                    ...prevStrategy.activities.slice(0, activityIndex),
                    updatedActivityFromServer, // Use the server's authoritative data
                    ...prevStrategy.activities.slice(activityIndex + 1),
                ];

                return {
                    ...prevStrategy,
                    activities: newActivities,
                };
            });

            // 6. UI Feedback
            setEditingActivityId(null);
            setSuccessMessage('Activity updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (e) {
            // 7. Network/Parsing Error Handling
            console.error('Update activity error:', e);
            // Use an explicit type guard if 'e' is not automatically typed as Error
            const errorMessage = e instanceof Error ? e.message : 'A network error occurred during update. Please try again.';
            setError(errorMessage);

        } finally {
            // 8. Final Cleanup
            setIsLoading(false);
        }
    };
    
   

    const copyToClipboard = () => {
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl)
                .then(() => {
                    setCopied(true);
                    setSuccessMessage('Link copied to clipboard!'); // Show success message for copy
                    setTimeout(() => {setCopied(false); setSuccessMessage(null);}, 2000); 
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    setError('Failed to copy link.');
                });
        }
    };
    
    
    const handleAddActivity = async (newActivityData: ActivityFormDataType) => {
        setIsLoading(true);
        clearMessages();

        // 1. Initialize payload, including the outputId foreign key.
        const payload: Partial<ActivityFormDataType> & { outputId: string } = { 
            outputId: strategyOutput.id,
        };

        for (const key in newActivityData) {
            if (Object.prototype.hasOwnProperty.call(newActivityData, key)) {
                const k = key as keyof ActivityFormDataType;
                let value = newActivityData[k];

                if ((k === 'activityType' || k === 'status') && typeof value === 'string' && value.trim() !== '') {
                    (payload as any)[k] = value.toUpperCase();
                }
                else if (typeof value === 'string' && value.trim() === '') {
                    (payload as any)[k] = null;
                }
                else if (value !== undefined) {
                    (payload as any)[k] = value;
                }
            }
        }
        
        try {
            const response = await fetch('/api/outputs/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                setError(result.message || 'Failed to create strategy activity.');
                return;
            }
            const createdActivity: StrategyActivityModel = result; 
            setStrategyOutput((prevStrategy: StrategyOutputModel) => ({
                ...prevStrategy,
                activities: [createdActivity, ...(prevStrategy.activities || [])], // CORRECTED: `activities`
            }));

            setIsAddingActivity(false); 
            setSuccessMessage('Activity created successfully!'); 
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (e) {
            console.error('Network or Parse Error:', e);
            setError('A network error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = (updatedData: StrategyOutputModel) => { 
        setStrategyOutput(updatedData);
        setIsEditing(false);
        setSuccessMessage('Strategy details updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    function onCommentAction(): void {
       // throw new Error('Function not implemented.');
    }

    // --- RENDER ---
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl font-sans relative">
            
            {/* --- GLOBAL LOADING OVERLAY & MESSAGE BANNERS --- */}
            {isLoading && <GlobalLoadingOverlay />}
            {successMessage && <MessageBanner type="success" message={successMessage} />}
            {error && <MessageBanner type="error" message={error} />}
            
            {/* Top Navigation & Title Bar */}
            <div className="mb-8">
                
                {/* 1. Enhanced Hierarchy Display (Outcome > Goal > Output) */}
                <ParentHierarchy 
                    outcome={strategyOutput.outcome} 
                    goal={strategyOutput?.outcome?.goal} 
                />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-gray-200">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-3">
                        <span className="text-indigo-600">🎯</span> {strategyOutput.title}
                    </h1>
                    <div className="flex flex-row gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto">
                        {/* Action Buttons */}
                         <button
                            onClick={copyToClipboard}
                            className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap"
                            disabled={isLoading}
                        >
                            <Clipboard className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
                            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
                        </button>
                      { hasRequiredRole && <button
                            onClick={() => {
                                setIsEditing(!isEditing);
                                clearMessages();
                            }}
                            className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
                            disabled={isLoading}
                        >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Output'}</span>
                            <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
                        </button>
                        }
                    </div>
                </div>
            </div>

            {isEditing ? (
                <StrategyOutputUpdateForm strategy={strategyOutput} onUpdateSuccess={handleUpdate} isEditable={hasRequiredRole} />
            ) : (
                <div className="space-y-8">
                    
                    {/* 2. PARENT HIERARCHY DETAILS BLOCK */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {strategyOutput?.outcome && (
                            <ParentDetailBlock 
                                title={strategyOutput.outcome.title} 
                                description={strategyOutput.outcome.description}
                                linkId={strategyOutput.outcome.id}
                                type="outcome"
                            />
                        )}
                        {strategyOutput.outcome?.goal && (
                            <ParentDetailBlock 
                                title={strategyOutput.outcome?.goal.title} 
                                description={strategyOutput.outcome?.goal.description}
                                linkId={strategyOutput.outcome?.goal.id}
                                type="goal"
                            />
                        )}
                    </div>
                    
                    {/* --- Strategy Metadata & Summary Card --- */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 bg-indigo-50/50 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-indigo-800">Output Core Details</h3>
                        </div>

                        {/* Output Information Grid (4-Column Layout on Desktop) */}
                        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                            
                            <DetailItem 
                                label="Responsible Party" 
                                icon={User}
                                value={strategyOutput.responsible || 'Unassigned'} 
                            /> 
                            
                            <DetailItem 
                                label="Estimated Cost" 
                                icon={DollarSign}
                                value={formatCurrency(strategyOutput.costEstimate)} 
                            />
                            
                            <DetailItem
                                label="Status"
                                icon={CheckCircle}
                                value={strategyOutput.isCompleted ? 
                                    <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-medium flex items-center w-fit">
                                        COMPLETED
                                    </span>
                                    : 
                                    <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium w-fit">
                                        IN PROGRESS
                                    </span>
                                }
                            />

                            <DetailItem 
                                label="Completion Date" 
                                icon={Calendar}
                                value={strategyOutput.isCompleted ? formatDate(strategyOutput.completionDate) : 'Not Yet Finalized'} 
                            />
                            
                        </dl>

                        {/* Audit/Date Stamps - Below main grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t border-gray-200 bg-gray-50">
                            <DetailItem label="Created On" icon={Calendar} value={formatDate(strategyOutput.createdAt)} />
                            <DetailItem label="Last Updated" icon={Calendar} value={formatDate(strategyOutput.updatedAt)} />
                        </div>
                        
                        {/* --- Description / Summary (Full Width) --- */}
                        <div className="px-6 py-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                                <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Output Summary
                            </h3>
                            <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap leading-relaxed">{strategyOutput.description || 'No detailed summary provided.'}</p>
                            </div>
                        </div>

                    </div>


                    {/* --- Strategy Activities (Plans) Section --- */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200">
                            <h3 className="text-xl font-bold text-indigo-800 mb-2 sm:mb-0">
                                Related Activities/Plans ({strategyOutput?.activities?.length || 0})
                            </h3>
                            {hasRequiredRole && <button
                                onClick={() => {
                                    setIsAddingActivity(!isAddingActivity);
                                    clearMessages();
                                    setEditingActivityId(null);
                                }}
                                className="flex items-center justify-center text-sm font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-sm hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto sm:ml-0"
                                disabled={isLoading || !hasRequiredRole}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                {isAddingActivity ? 'Close Form' : 'Add Activity'}
                            </button>
                            }
                        </div>

                        {/* --- New Activity Form --- */}
                        {isAddingActivity && (
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <AddActivityForm
                                    outputId={strategyOutput.id}
                                    onAdd={handleAddActivity}
                                    onCancel={() => {
                                        setIsAddingActivity(false);
                                        clearMessages();
                                    }}
                                    isLoading={isLoading}
                                    error={error}
                                    isEditable={hasRequiredRole}
                                />
                            </div>
                        )}


                        <ul className="divide-y divide-gray-200">
                            {strategyOutput.activities && strategyOutput?.activities?.length > 0 ? (
                                strategyOutput?.activities?.map((activity: StrategyActivityModel, index: number) => (
                                    <li key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition">
                                        
                                        {/* CONDITIONAL RENDERING: Show Edit Form or Activity Details */}
                                        {editingActivityId === activity.id ? (
                                            <EditActivityForm
                                                activity={activity}
                                                onUpdate={handleUpdateActivity}
                                                onCancel={() => {
                                                    setEditingActivityId(null);
                                                    clearMessages();
                                                }}
                                                isLoading={isLoading}
                                                error={error}
                                                isEditable={hasRequiredRole}
                                            />
                                        ) : (
                                            <>
                                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                                    <p className="font-bold text-lg text-gray-900 leading-snug">
                                                        {index + 1}. {activity.title}
                                                    </p>
                                                    <div className="flex items-center space-x-3 mt-2 sm:mt-0 ml-auto sm:ml-0 flex-shrink-0">
                                                        {/* Status badge */}
                                                        <span className={`${getStatusClasses(activity.status)} text-xs sm:text-sm`}>
                                                            {activity?.status?.replace('_', ' ')}
                                                        </span>
                                                        {/* NEW EDIT BUTTON */}
                                                       {hasRequiredRole&& <button
                                                            onClick={() => {
                                                                setEditingActivityId(activity.id);
                                                                setIsAddingActivity(false); 
                                                                clearMessages();
                                                            }}
                                                            className="p-1 text-gray-500 hover:text-indigo-600 transition rounded-full hover:bg-gray-200"
                                                            disabled={isLoading||!hasRequiredRole}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                       }
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2 flex flex-col sm:flex-row sm:space-x-4">
                                                    
                                                    <span className="flex items-center">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                                                        Type: <span className='font-semibold ml-1'>{activity.activityType || 'N/A'}</span>
                                                    </span>
                                                    
                                                    <span className="flex items-center mt-1 sm:mt-0">
                                                        <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                                                        Due: <span className='font-semibold ml-1'>{formatDate(activity.dueDate)}</span>
                                                    </span>
                                                    
                                                </div>
                                                {activity.description && (
                                                    <p className="mt-2 text-xs italic text-gray-500 max-w-lg p-2 border-l-2 border-indigo-200 bg-white shadow-inner rounded-sm">
                                                        <span className='font-semibold text-gray-600'>Description</span>: {activity.description}
                                                    </p>
                                                )}
                                            {/* !!! INSERT COMMENT MODULE HERE !!! */}
                                            <ActivityCommentSection
                                                        activityId={activity.id}
                                                        comments={activity.comments || []} // Pass the comments array
                                                        currentUser={currentUser} // Pass the current user for form/permissions
                                                        onCommentAction={onCommentAction }                                            />
                                           
                                           
                                            </>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="p-6 text-gray-500 text-center bg-gray-50">
                                    No activities recorded for this output. Click **Add Activity** to create one.
                                </li>
                            )}
                        </ul>
                    </div>

                </div>
            )}
        </div>
    );
}


export default StrategyOutputDetailView;