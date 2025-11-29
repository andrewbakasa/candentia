'use client'
import React, { useState, useCallback } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare, Clipboard, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- INLINED TYPES AND UTILITIES FOR SELF-CONTAINMENT ---

type ActivityStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
type ActivityType = 'MEETING' | 'TASK' | 'FOLLOW_UP' | 'REVIEW';

interface StrategyActivityModel {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    status: ActivityStatus;
    progressPercent: number;
    activityType: ActivityType;
    outputId: string;
    createdAt: string;
    updatedAt: string;
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
}

interface StrategyDetailProps {
    strategyOutput: StrategyOutputModel;
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

// Simplified StrategyUpdateForm
const StrategyUpdateForm: React.FC<{ strategy: StrategyOutputModel; onUpdateSuccess: (data: StrategyOutputModel) => void; }> = ({ strategy, onUpdateSuccess }) => {
    const [title, setTitle] = useState(strategy.title);
    const [description, setDescription] = useState(strategy.description || '');
    const [costEstimate, setCostEstimate] = useState(strategy.costEstimate || 0);
    const [responsible, setResponsible] = useState(strategy.responsible || '');
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLocalError(null);

        const payload = {
            title,
            description: description.trim() || null,
            responsible: responsible.trim() || null,
            costEstimate: costEstimate,
        };

        try {
            // Mock API call for update
            const response = await fetch(`/api/outputs/${strategy.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result: StrategyOutputModel = await response.json();

            if (!response.ok) {
                setLocalError(result.title || 'Failed to update strategy.');
                return;
            }

            const updatedStrategy: StrategyOutputModel = {
                ...strategy,
                ...result,
                updatedAt: new Date().toISOString(),
            };
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
            </div>
            
            {/* Description */}
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
                    disabled={isLoading || !title.trim()}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

// Simplified AddActivityForm
const AddActivityForm: React.FC<{ onAdd: (data: ActivityFormDataType) => void; onCancel: () => void; isLoading: boolean; error: string | null }> = ({ onAdd, onCancel, isLoading, error }) => {
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
                    <button type="submit" disabled={isLoading || !title.trim() || !dueDate.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                        {isLoading ? 'Adding...' : 'Add Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Simplified EditActivityForm
const EditActivityForm: React.FC<{ activity: StrategyActivityModel; onUpdate: (id: string, data: ActivityFormDataType) => void; onCancel: () => void; isLoading: boolean; error: string | null }> = ({ activity, onUpdate, onCancel, isLoading, error }) => {
    
    const formatInputDate = (isoDate: string | null) => isoDate ? isoDate.slice(0, 10) : '';

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
                    <button type="submit" disabled={isLoading || !title.trim() || !dueDate.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
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

function StrategyOutputDetailView({ strategyOutput: initialStrategy }: StrategyDetailProps) {
    // Corrected type for initial state
    const [strategy, setStrategy] = useState<StrategyOutputModel>(initialStrategy as StrategyOutputModel); 
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    // Mocking useRouter for self-containment, replace with actual import in a Next.js environment
    const router = { push: (path: string) => console.log(`Navigating to ${path}`) };
    const [copied, setCopied] = useState(false);
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const handleUpdateActivity = async (activityId: string, updatedData: ActivityFormDataType) => {
        setIsLoading(true);
        clearMessages();

        const payload: Partial<ActivityFormDataType> = {};

        for (const key in updatedData) {
            if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
                const k = key as keyof ActivityFormDataType;
                let value = updatedData[k];

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
            // API route changed to reflect new structure: /api/outputs/activity/{id}
            const response = await fetch(`/api/outputs/activity/${activityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || 'Failed to update strategy activity.');
                return;
            }

            const updatedActivity: StrategyActivityModel = result; 
            
            // SUCCESS: Update the local state (activities)
            setStrategy((prevStrategy: StrategyOutputModel) => ({
                ...prevStrategy,
                activities: prevStrategy.activities.map(activity => // CORRECTED: `activities`
                    activity.id === activityId ? updatedActivity : activity
                ),
            }));

            setEditingActivityId(null); 
            setSuccessMessage('Activity updated successfully!'); 
            setTimeout(() => setSuccessMessage(null), 3000); 

        } catch (e) {
            console.error('Network or Parse Error:', e);
            setError('A network error occurred during update. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if (typeof document.execCommand === 'function') { // Fallback for execCommand
            const currentUrl = window.location.href;
            const tempInput = document.createElement('textarea');
            tempInput.value = currentUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            setCopied(true);
            setSuccessMessage('Link copied to clipboard!');
            setTimeout(() => {setCopied(false); setSuccessMessage(null);}, 2000); 
        } else if (typeof window.navigator.clipboard !== 'undefined') { // Preferred modern method
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl)
                .then(() => {
                    setCopied(true);
                    setSuccessMessage('Link copied to clipboard!'); 
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
            outputId: strategy.id,
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
            // API route changed to reflect new structure: /api/outputs/activity
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
            
            // Update the local state (activities)
            setStrategy((prevStrategy: StrategyOutputModel) => ({
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
        setStrategy(updatedData);
        setIsEditing(false);
        setSuccessMessage('Strategy details updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <div className="p-4"> 
            <dt className="text-sm font-medium text-gray-500 mb-0.5">{label}</dt>
            <dd className="text-base text-gray-900 font-semibold">{value}</dd>
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl font-sans relative">
            
            {/* --- GLOBAL LOADING OVERLAY & MESSAGE BANNERS --- */}
            {isLoading && <GlobalLoadingOverlay />}
            {successMessage && <MessageBanner type="success" message={successMessage} />}
            {error && <MessageBanner type="error" message={error} />}
            
            {/* Top Navigation & Title Bar */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/outputs')}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
                    disabled={isLoading}
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Return to All Strategy Outputs
                </button>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-gray-200">
                    <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <span className="text-indigo-600">🎯</span> {strategy.title}
                    </h1>
                    <div className="flex flex-row gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap"
                            disabled={isLoading}
                        >
                            <Clipboard className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
                            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
                        </button>
                        <button
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
                    </div>
                </div>
            </div>

            {isEditing ? (
                <StrategyUpdateForm strategy={strategy} onUpdateSuccess={handleUpdate} />
            ) : (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 divide-y divide-gray-200 overflow-hidden">

                    {/* --- Strategy Metadata Section --- */}
                    <div className="px-6 py-4 bg-indigo-50/50">
                        <h3 className="text-lg font-semibold text-indigo-800">Output Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-600">Key details about this strategic deliverable.</p>
                    </div>

                    {/* --- Output Information Grid (2 Columns) --- */}
                    <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-200">
                        
                        {/* Row 1: Responsible & Cost Estimate */}
                        <div className="md:border-r border-gray-200 flex items-center">
                            <DetailItem 
                                label="Responsible Party" 
                                value={
                                    <span className="flex items-center">
                                        <User className="w-4 h-4 mr-1 text-gray-500" />
                                        {strategy.responsible || 'Unassigned'}
                                    </span>
                                } 
                            /> 
                        </div>
                        <div className="flex items-center">
                            <DetailItem 
                                label="Estimated Cost" 
                                value={
                                    <span className="flex items-center">
                                        <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                                        {formatCurrency(strategy.costEstimate)}
                                    </span>
                                } 
                            />
                        </div>

                        {/* Row 2: Status & Completion Date */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem
                                label="Status"
                                value={strategy.isCompleted ? 
                                    <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-medium flex items-center w-fit">
                                        <CheckCircle className="w-4 h-4 mr-1" /> COMPLETED
                                    </span>
                                    : 
                                    <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium w-fit">
                                        IN PROGRESS
                                    </span>
                                }
                            />
                        </div>
                        <DetailItem 
                            label="Completion Date" 
                            value={strategy.isCompleted ? formatDate(strategy.completionDate) : 'Not Yet Finalized'} 
                        />

                        {/* Row 3 (Audit/Date Stamps) - Spans both columns */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 border-t border-gray-200">
                            <div className="md:border-r border-gray-200">
                                <DetailItem label="Created On" value={formatDate(strategy.createdAt)} />
                            </div>
                            <DetailItem label="Last Updated" value={formatDate(strategy.updatedAt)} />
                        </div>
                    </dl>

                    {/* --- Description / Summary --- */}
                    <div className="px-6 py-4 bg-indigo-50/50">
                        <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Output Summary
                        </h3>
                    </div>
                    <div className="px-6 py-6 text-gray-700">
                        <p className="whitespace-pre-wrap leading-relaxed">{strategy.description || 'No detailed summary provided.'}</p>
                    </div>

                    
                    {/* --- Strategy Activities (Plans) Section --- */}
                    <div className="px-6 py-4 bg-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-indigo-800 mb-2 sm:mb-0">
                            Related Activities/Plans ({strategy?.activities?.length || 0}) {/* CORRECTED: `activities` */}
                        </h3>
                        <button
                            onClick={() => {
                                setIsAddingActivity(!isAddingActivity);
                                clearMessages();
                                setEditingActivityId(null);
                            }}
                            className="flex items-center justify-center text-sm font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-sm hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto sm:ml-0"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            {isAddingActivity ? 'Close Form' : 'Add Activity'}
                        </button>
                    </div>

                    {/* --- New Activity Form --- */}
                    {isAddingActivity && (
                        <div className="p-4">
                            <AddActivityForm
                                onAdd={handleAddActivity}
                                onCancel={() => {
                                    setIsAddingActivity(false);
                                    clearMessages();
                                }}
                                isLoading={isLoading}
                                error={error}
                            />
                        </div>
                    )}


                    <ul className="divide-y divide-gray-200">
                        {strategy.activities && strategy?.activities?.length > 0 ? ( // CORRECTED: `activities`
                            strategy?.activities?.map((activity: StrategyActivityModel, index: number) => ( // CORRECTED: `activities`
                                <li key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                                    
                                    {/* CONDITIONAL RENDERING: Show Edit Form or Activity Details */}
                                    {editingActivityId === activity.id ? (
                                        // SHOW EDIT FORM
                                        <EditActivityForm
                                            activity={activity}
                                            onUpdate={handleUpdateActivity}
                                            onCancel={() => {
                                                setEditingActivityId(null);
                                                clearMessages();
                                            }}
                                            isLoading={isLoading}
                                            error={error}
                                        />
                                    ) : (
                                        // SHOW ACTIVITY DETAILS
                                        <>
                                            <div className="flex flex-col sm:flex-row justify-between items-start">
                                                <p className="font-bold text-lg text-gray-900 leading-snug">
                                                    {index + 1}. {activity.title}
                                                </p>
                                                <div className="flex items-center space-x-3 mt-2 sm:mt-0 ml-auto sm:ml-0">
                                                    {/* NEW EDIT BUTTON */}
                                                    <button
                                                        onClick={() => {
                                                            setEditingActivityId(activity.id);
                                                            setIsAddingActivity(false); 
                                                            clearMessages();
                                                        }}
                                                        className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
                                                        disabled={isLoading}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {/* Status badge */}
                                                    <span className={`${getStatusClasses(activity.status)} text-xs sm:text-sm`}>
                                                        {activity?.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2 flex flex-col sm:flex-row sm:space-x-4">
                                                
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1 text-indigo-500" />
                                                    Due: {formatDate(activity.dueDate)}
                                                </span>
                                                
                                            </div>
                                            {activity.description && (
                                                <p className="mt-2 text-xs italic text-gray-500 max-w-lg">
                                                    <span className='font-semibold'>Description</span>: {activity.description}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className="p-6 text-gray-500 text-center bg-gray-50">
                                No activities recorded for this output. Click Add Activity to create one.
                            </li>
                        )}
                    </ul>



                </div>
            )}
        </div>
    );
}

export default StrategyOutputDetailView;
// 'use client'
// import React, { useState, useCallback } from 'react';
// import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare, Clipboard } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import StrategyUpdateForm from './StrategyOutputUpdateForm';
// import { StrategyActivityModel, StrategyOutputModel } from '../_components/types/output';
// import { ActivityFormDataType } from '../_components/types/general';
// import { StrategyDetailProps } from '../_components/types/strategy';
// import { AddActivityForm, EditActivityForm, formatCurrency, formatDate, getStatusClasses } from '../_components/utils';

// // --- UI COMPONENTS ---
// // Global Loading Overlay for API operations
// const GlobalLoadingOverlay: React.FC = () => (
//     <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center cursor-wait">
//         <div className="flex items-center space-x-2 p-4 bg-white rounded-xl shadow-2xl">
//             <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent border-solid rounded-full animate-spin"></div>
//             <p className="text-base font-semibold text-gray-800">Processing update...</p>
//         </div>
//     </div>
// );

// // Message Banner for success/error
// const MessageBanner: React.FC<{ type: 'success' | 'error', message: string }> = ({ type, message }) => {
//     const baseClasses = "fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl text-white font-semibold flex items-center space-x-2 transition-all duration-300 transform";
//     const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';
//     const Icon = type === 'success' ? CheckCircle : Zap;

//     return (
//         <div className={`${baseClasses} ${colorClasses} translate-x-0`}>
//             <Icon className="w-5 h-5" />
//             <span>{message}</span>
//         </div>
//     );
// };

// function StrategyOutputDetailView({ strategyOutput: initialStrategy }: StrategyDetailProps) { // Renamed component and prop
//     const [strategy, setStrategy] = useState<any>(initialStrategy); // Renamed state
//     const [isEditing, setIsEditing] = useState(false);
//     const [isAddingActivity, setIsAddingActivity] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [successMessage, setSuccessMessage] = useState<string | null>(null);
//     const router = useRouter();
//     const [copied, setCopied] = useState(false);
//     const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

//     const clearMessages = () => {
//         setError(null);
//         setSuccessMessage(null);
//     };

//     const handleUpdateActivity = async (activityId: string, updatedData: ActivityFormDataType) => {
//         setIsLoading(true);
//         clearMessages();

//         const payload: Partial<ActivityFormDataType> = {};

//         for (const key in updatedData) {
//             if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
//                 const k = key as keyof ActivityFormDataType;
//                 let value = updatedData[k];

//                 // 1. Identify Date Fields for ISO-8601 Fix
//                 // const isDateField = k === 'completedAt' || k === 'dueDate' || k === 'updatedAt';

//                 // if (isDateField && typeof value === 'string' && value.trim() !== '') {
//                 //     // FIX: Convert "YYYY-MM-DD" to full ISO-8601 format (T00:00:00.000Z)
//                 //     (payload as any)[k] = value.trim() + 'T00:00:00.000Z';
//                 // }
//                 // 2. Handle Case Conversion for Enums (activityType, status)
//                 if ((k === 'activityType' || k === 'status') && typeof value === 'string' && value.trim() !== '') {
//                     // Apply uppercase conversion directly
//                     (payload as any)[k] = value.toUpperCase();
//                 }
//                 // 3. Convert Empty Strings to Null for all other nullable string fields
//                 else if (typeof value === 'string' && value.trim() === '') {
//                     (payload as any)[k] = null;
//                 }
//                 // 4. Pass all other valid values (numbers, booleans, already formatted data)
//                 else if (value !== undefined) {
//                     (payload as any)[k] = value;
//                 }
//             }
//         }
        
//         try {
//             // API route changed from /api/contracts/activity/{id} to /api/strategies/activity/{id}
//             const response = await fetch(`/api/outputs/activity/${activityId}`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload), // Send the fully corrected payload
//             });

//             const result = await response.json();

//             if (!response.ok) {
//                 setError(result.message || 'Failed to update strategy activity.');
//                 return;
//             }

//             const updatedActivity: StrategyActivityModel = result; // Updated model type
            
//             // SUCCESS: Update the local state (strategyActivityModels)
//             setStrategy((prevStrategy: { strategyActivityModels: any[]; }) => ({
//                 ...prevStrategy,
//                 strategyActivityModels: prevStrategy.strategyActivityModels.map(activity => // Updated property name
//                     activity.id === activityId ? updatedActivity : activity
//                 ),
//             }));

//             setEditingActivityId(null); // Close the edit form
//             setSuccessMessage('Activity updated successfully!'); // Show success message
//             setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds

//         } catch (e) {
//             console.error('Network or Parse Error:', e);
//             setError('A network error occurred during update. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };
    
//     const copyToClipboard = () => {
//         if (typeof window !== 'undefined') {
//             const currentUrl = window.location.href;
//             navigator.clipboard.writeText(currentUrl)
//                 .then(() => {
//                     setCopied(true);
//                     setSuccessMessage('Link copied to clipboard!'); // Show success message for copy
//                     setTimeout(() => {setCopied(false); setSuccessMessage(null);}, 2000); 
//                 })
//                 .catch(err => {
//                     console.error('Failed to copy: ', err);
//                     setError('Failed to copy link.');
//                 });
//         }
//     };
    
//     const handleAddActivity = async (newActivityData: ActivityFormDataType) => {
//         setIsLoading(true);
//         clearMessages();

//         // 1. Initialize payload, including the outputId foreign key.
//         const payload: Partial<ActivityFormDataType> & { outputId: string } = { // Updated foreign key
//             outputId: strategy.id, // Ensure this field is added
//         };

//         for (const key in newActivityData) {
//             if (Object.prototype.hasOwnProperty.call(newActivityData, key)) {
//                 const k = key as keyof ActivityFormDataType;
//                 let value = newActivityData[k];

//                 // Identify Date Fields for ISO-8601 Fix
//                 // const isDateField = k === 'completedAt' || k === 'dueDate'|| k === 'updatedAt';

//                 // if (isDateField && typeof value === 'string' && value.trim() !== '') {
//                 //     // FIX: Convert "YYYY-MM-DD" to full ISO-8601 format (T00:00:00.000Z)
//                 //     (payload as any)[k] = value.trim() + 'T00:00:00.000Z';
//                 // }
//                 // Handle Case Conversion for Enums (activityType, status)
//                 if ((k === 'activityType' || k === 'status') && typeof value === 'string' && value.trim() !== '') {
//                     // Apply uppercase conversion directly
//                     (payload as any)[k] = value.toUpperCase();
//                 }
//                 // Convert Empty Strings to Null for all other nullable string fields
//                 else if (typeof value === 'string' && value.trim() === '') {
//                     (payload as any)[k] = null;
//                 }
//                 // Pass all other valid values (numbers, booleans, already null data)
//                 else if (value !== undefined) {
//                     (payload as any)[k] = value;
//                 }
//             }
//         }
        
//         try {
//             // API route changed from /api/contracts/activity to /api/strategies/activity
//             const response = await fetch('/api/outputs/activity', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload), // Send the fully corrected payload
//             });

//             const result = await response.json();

//             if (!response.ok) {
//                 setError(result.message || 'Failed to create strategy activity.');
//                 return;
//             }

//             const createdActivity: StrategyActivityModel = result; // Updated model type
            
//             // Update the local state (strategyActivityModels)
//             setStrategy((prevStrategy: { strategyActivityModels: any; }) => ({
//                 ...prevStrategy,
//                 strategyActivityModels: [createdActivity, ...(prevStrategy.strategyActivityModels || [])], // Updated property name
//             }));

//             setIsAddingActivity(false); // Close the form
//             setSuccessMessage('Activity created successfully!'); // Show success message
//             setTimeout(() => setSuccessMessage(null), 3000);

//         } catch (e) {
//             console.error('Network or Parse Error:', e);
//             setError('A network error occurred. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleUpdate = (updatedData: StrategyOutputModel) => { // Updated model type
//         setStrategy(updatedData); // Updated state setter
//         setIsEditing(false);
//         setSuccessMessage('Strategy details updated successfully!'); // Updated message
//         setTimeout(() => setSuccessMessage(null), 3000);
//     };

//     const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
//         <div className="p-4"> 
//             <dt className="text-sm font-medium text-gray-500 mb-0.5">{label}</dt>
//             <dd className="text-base text-gray-900 font-semibold">{value}</dd>
//         </div>
//     );

//     return (
//         <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl font-sans relative">
            
//             {/* --- GLOBAL LOADING OVERLAY & MESSAGE BANNERS --- */}
//             {isLoading && <GlobalLoadingOverlay />}
//             {successMessage && <MessageBanner type="success" message={successMessage} />}
//             {error && <MessageBanner type="error" message={error} />}
            
//             {/* Top Navigation & Title Bar */}
//             <div className="mb-6">
//                 <button
//                     onClick={() => router.push('/outputs')} // Updated route
//                     className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
//                     disabled={isLoading}
//                 >
//                     <ArrowLeft className="w-4 h-4 mr-1" />
//                     Return to All StrategyOutputs {/* Updated text */}
//                 </button>

//                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-gray-200">
//                     <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 flex items-center gap-3">
//                         <span className="text-indigo-600">🎯</span> {strategy.title} {/* Using strategy.title */}
//                     </h1>
//                     <div className="flex flex-row gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto">
//                         <button
//                             onClick={copyToClipboard}
//                             className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap"
//                             disabled={isLoading}
//                         >
//                             <Clipboard className="w-4 h-4 mr-1" />
//                             <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
//                             <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
//                         </button>
//                         <button
//                             onClick={() => {
//                                 setIsEditing(!isEditing);
//                                 clearMessages();
//                             }}
//                             className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
//                             disabled={isLoading}
//                         >
//                             <Edit2 className="w-4 h-4 mr-1" />
//                             <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Strategy'}</span> {/* Updated text */}
//                             <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {isEditing ? (
//                 <StrategyUpdateForm strategy={strategy} onUpdateSuccess={handleUpdate} />
//             ) : (
//                 <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 divide-y divide-gray-200 overflow-hidden">

//                     {/* --- Strategy Metadata Section --- */}
//                     <div className="px-6 py-4 bg-indigo-50/50">
//                         <h3 className="text-lg font-semibold text-indigo-800">Strategy Information</h3> {/* Updated text */}
//                         <p className="mt-1 max-w-2xl text-sm text-gray-600">Key details and term dates for the strategy output.</p> {/* Updated text */}
//                     </div>

//                     {/* --- Strategy Information Grid (1 Column Mobile, 2 Columns Desktop) --- */}
//                     <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-200">
                        
//                         {/* Row 1 */}
//                         <div className="md:border-r border-gray-200">
//                             <DetailItem label="Strategy Type" value={strategy.contractType || 'N/A'} /> {/* Using existing field names for simplicity */}
//                         </div>
//                         <DetailItem label="Counterparty" value={strategy.counterpartyName} /> 
                        
//                         {/* Row 2 */}
//                         <div className="md:border-r border-gray-200">
//                             <DetailItem
//                                 label="Status"
//                                 value={<span className={getStatusClasses(strategy.status)}>{strategy?.status?.replace('_', ' ')}</span>}
//                             />
//                         </div>
//                         <DetailItem label="Auto Renew" value={strategy.autoRenew ? 'Yes' : 'No'} />

//                         {/* Row 3 (Dates) */}
//                         <div className="md:border-r border-gray-200">
//                             <DetailItem label="Effective Date" value={formatDate(strategy.effectiveDate)} />
//                         </div>
//                         <DetailItem label="Expiration Date" value={formatDate(strategy.expirationDate)} />

//                         {/* Row 4 - Next Review spans both columns on desktop */}
//                         <div className="md:col-span-2 border-t md:border-t-0 border-gray-200">
//                             <DetailItem label="Next Review Date" value={formatDate(strategy.nextReviewDate)} />
//                         </div>
//                     </dl>

//                     {/* --- Financial Metrics Section --- */}
//                     <div className="px-6 py-4 bg-indigo-50/50">
//                         <h3 className="text-lg font-semibold text-indigo-800">Financial Metrics & Risk</h3>
//                     </div>

//                     {/* --- Financial Metrics Grid (1 Column Mobile, 2 Columns Desktop) --- */}
//                     <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-200">
                        
//                         {/* Row 1 */}
//                         <div className="md:border-r border-gray-200">
//                             <DetailItem label="Annual Revenue (USD)" value={formatCurrency(strategy.annualRevenueUsd)} />
//                         </div>
//                         <DetailItem label="Annual Cost (USD)" value={formatCurrency(strategy.annualizedCostUsd)} />
                        
//                         {/* Row 2 (Risk Rating Spans Two Columns) */}
//                         <div className="md:col-span-2 border-t md:border-t-0 border-gray-200">
//                             <DetailItem
//                                 label="Risk Rating"
//                                 value={strategy.riskRating ? <span className="font-mono text-lg font-bold text-red-600">{strategy.riskRating.toFixed(1)}</span> : 'N/A'}
//                             />
//                         </div>
                        
//                         {/* Row 3 (Audit/Date Stamps) */}
//                         <div className="md:border-r border-gray-200">
//                             <DetailItem label="Created On" value={formatDate(strategy.createdAt)} />
//                         </div>
//                         <DetailItem label="Last Updated" value={formatDate(strategy.updatedAt)} />
//                     </dl>

//                     {/* --- Description / Summary --- */}
//                     <div className="px-6 py-4 bg-indigo-50/50">
//                         <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
//                             <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Strategy Summary {/* Updated text */}
//                         </h3>
//                     </div>
//                     <div className="px-6 py-6 text-gray-700">
//                         <p className="whitespace-pre-wrap leading-relaxed">{strategy.description || 'No detailed summary provided.'}</p>
//                     </div>

                    
//                     {/* --- Strategy Activities (Plans) Section --- */}
//                     <div className="px-6 py-4 bg-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-gray-200">
//                         <h3 className="text-lg font-semibold text-indigo-800 mb-2 sm:mb-0">
//                             Related Activities/Plans ({strategy?.strategyActivityModels?.length}) {/* Updated property name */}
//                         </h3>
//                         <button
//                             onClick={() => {
//                                 setIsAddingActivity(!isAddingActivity);
//                                 clearMessages(); // Clear messages when opening/closing Add form
//                                 setEditingActivityId(null); // Close any open edit form
//                             }}
//                             className="flex items-center justify-center text-sm font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-sm hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto sm:ml-0"
//                             disabled={isLoading} // Disable while processing
//                         >
//                             <Plus className="w-4 h-4 mr-1" />
//                             {isAddingActivity ? 'Close Form' : 'Add Activity'}
//                         </button>
//                     </div>

//                     {/* --- New Activity Form --- */}
//                     {isAddingActivity && (
//                         <div className="p-4">
//                             <AddActivityForm
//                                 onAdd={handleAddActivity}
//                                 onCancel={() => {
//                                     setIsAddingActivity(false);
//                                     clearMessages();
//                                 }}
//                                 isLoading={isLoading}
//                                 error={error}
//                             />
//                         </div>
//                     )}


//                     <ul className="divide-y divide-gray-200">
//                         {strategy.strategyActivityModels && strategy?.strategyActivityModels?.length > 0 ? ( // Updated property name
//                             strategy?.strategyActivityModels?.map((activity: StrategyActivityModel, index: number) => ( // Updated model type
//                                 <li key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                                    
//                                     {/* CONDITIONAL RENDERING: Show Edit Form or Activity Details */}
//                                     {editingActivityId === activity.id ? (
//                                         // SHOW EDIT FORM
//                                         <EditActivityForm
//                                             activity={activity}
//                                             onUpdate={handleUpdateActivity}
//                                             onCancel={() => {
//                                                 setEditingActivityId(null);
//                                                 clearMessages();
//                                             }}
//                                             isLoading={isLoading}
//                                             error={error}
//                                         />
//                                     ) : (
//                                         // SHOW ACTIVITY DETAILS
//                                         <>
//                                             <div className="flex flex-col sm:flex-row justify-between items-start">
//                                                 <p className="font-bold text-lg text-gray-900 leading-snug">
//                                                     {index + 1}. {activity.title}
//                                                 </p>
//                                                 <div className="flex items-center space-x-3 mt-2 sm:mt-0 ml-auto sm:ml-0">
//                                                     {/* NEW EDIT BUTTON */}
//                                                     <button
//                                                         onClick={() => {
//                                                             setEditingActivityId(activity.id);
//                                                             setIsAddingActivity(false); // Hide Add Form if open
//                                                             clearMessages();
//                                                         }}
//                                                         className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
//                                                         disabled={isLoading}
//                                                     >
//                                                         <Edit2 className="w-4 h-4" />
//                                                     </button>
//                                                     {/* Status badge */}
//                                                     <span className={`${getStatusClasses(activity.status)} text-xs sm:text-sm`}>
//                                                         {activity?.status?.replace('_', ' ')}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                             <div className="text-sm text-gray-600 mt-2 flex flex-col sm:flex-row sm:space-x-4">
                                              
//                                                 <span className="flex items-center">
//                                                     <Calendar className="w-3 h-3 mr-1 text-indigo-500" />
//                                                     Due: {formatDate(activity.dueDate)}
//                                                 </span>
                                              
//                                             </div>
//                                             {activity.description && (
//                                                 <p className="mt-2 text-xs italic text-gray-500 max-w-lg">
//                                                     <span className='text-red-500'>Description</span>: {activity.description}
//                                                 </p>
//                                             )}
//                                         </>
//                                     )}
//                                 </li>
//                             ))
//                         ) : (
//                             <li className="p-6 text-gray-500 text-center bg-gray-50">
//                                 No activities recorded for this strategy. Click Add Activity to create one.
//                             </li>
//                         )}
//                     </ul>



//                 </div>
//             )}
//         </div>
//     );
// }

// export default StrategyOutputDetailView;