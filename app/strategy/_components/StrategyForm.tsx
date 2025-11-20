'use client'
import React, { useState, useEffect } from 'react';
import { BookOpen, Flag, Loader2, Plus, Save, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { StrategyWithRBM } from './StrategyCard';

// --- Type Definitions (Keeping these for TypeScript context) ---

interface SafeUser {
    id: string;
    name: string | null;
    email: string | null;
}

interface StrategyGoal {
    id?: string; // Optional for new goals before DB assignment
    title: string;
    targetYear: number;
}

interface StrategyWithRBM2 {
    id: string;
    title: string;
    content: string;
    year: string;//|number;
    status: string; // Note: This is a generic string in the external interface
    goals: StrategyGoal[];
    authorId: string;
}

// FIX: Added 'as const' to ensure TypeScript infers the narrowest literal types for the values.
const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    // Added for clear client-side status signaling during an amendment
    VOTING_OPEN_AMENDED: 'VOTING_OPEN_AMENDED', 
} as const;

// Array of all standard statuses for the select input
const allStatuses = Object.keys(ProposalStatus).filter(s => s !== 'VOTING_OPEN_AMENDED');


// Helper function for status badge styling (kept for UI consistency)
const getStatusBadge = (status: string | undefined) => {
    switch (status) {
        case ProposalStatus.APPROVED:
            return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Approved</span>;
        case ProposalStatus.PENDING_REVIEW:
            return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">Pending Review</span>;
        case ProposalStatus.VOTING_OPEN:
            return <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">Voting Open</span>;
        case ProposalStatus.REJECTED:
            return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Rejected</span>;
        case ProposalStatus.VOTING_OPEN_AMENDED:
            return <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-700/30">Amended (Vote Reset)</span>;
        case ProposalStatus.DRAFT:
        default:
            return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">Draft</span>;
    }
};


// --- Form Props ---

interface StrategyFormProps {
    initialStrategy: StrategyWithRBM | null; 
    authorId: string | null; 
    onSave: (data: StrategyWithRBM) => void;
    onCancel: () => void;
}

// --- Main StrategyForm Component ---

export default function StrategyForm({ initialStrategy, authorId, onSave, onCancel }: StrategyFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // FIX START: Explicitly define the types for the form state
    type ProposalStatusKey = keyof typeof ProposalStatus;

    interface FormState {
        title: string;
        content: string;
        year: string;
        status: ProposalStatusKey; // Now using the strict union type
        goals: StrategyGoal[];
    }
    // FIX END

    // Determine status and editing mode
    const isEditing = !!initialStrategy;
    // initialStatus will be the generic string, which is fine for comparison
    const initialStatus = initialStrategy?.status || ProposalStatus.DRAFT; 
    const isVotingOpen = initialStatus === ProposalStatus.VOTING_OPEN;
    
    // We assume the component is ready if we have an authorId to submit data with
    const isReady = !!authorId;


    // --- State Initialization ---
    // The previous error occurred here because ProposalStatus.DRAFT was inferred as 'string'.
    // With 'as const', it is now inferred as the literal 'DRAFT', which matches FormState.status.
    const initialFormState: FormState = {
        title: '',
        content: '',
        year: new Date().getFullYear().toString(),
        status: ProposalStatus.DRAFT, 
        goals: [
            { id: Date.now().toString(), title: 'Core objective 1: Increase user participation.', targetYear: new Date().getFullYear() + 2 },
        ],
    };

    // When loading existing data, we must cast the status string to our strict union type.
    const initialData: FormState = initialStrategy
        ? {
            title: initialStrategy.title,
            content: initialStrategy.content,
            year: initialStrategy.year || new Date().getFullYear().toString(),
            // We assert the type here to satisfy FormState
            status: initialStrategy.status as ProposalStatusKey, 
            goals: initialStrategy.goals?.map((g) => ({
                id: g.id || Date.now().toString() + Math.random(),
                title: g.title,
                targetYear: g.targetYear,
            })) ?? [],
        }
        : initialFormState;

    const [formData, setFormData] = useState<FormState>(initialData); // Applied strict type here

    // --- Handlers ---

    const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        // Assertion here is now safe because the component state requires this strict type
        setFormData(prev => ({ ...prev, status: value as ProposalStatusKey }));
    };

    const handleGoalChange = (id: string | undefined, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!id) return; // Guard against undefined ID during change
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal =>
                // Ensure targetYear is always treated as a number
                goal.id === id ? { ...goal, [name]: name === 'targetYear' ? parseInt(value) || 0 : value } : goal
            ),
        }));
    };

    const addGoal = () => {
        setFormData(prev => ({
            ...prev,
            goals: [
                ...prev.goals,
                { id: Date.now().toString(), title: '', targetYear: new Date().getFullYear() + 3 },
            ],
        }));
    };

    const removeGoal = (id: string) => {
        if (formData.goals.length <= 1) {
            toast.warning("You must have at least one goal in your strategy.");
            return;
        }

        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter(goal => goal.id !== id),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isReady) {
            toast.error("User authentication is required to submit a strategy.");
            return;
        }

        // Basic validation
        if (formData.goals.some(g => !g.title || g.targetYear < new Date().getFullYear())) {
            toast.error("Please ensure all goals have a title and a valid target year.");
            return;
        }

        setIsLoading(true);

        // submissionStatus is implicitly ProposalStatusKey
        let submissionStatus = formData.status;
        let successMessage = `Strategy successfully saved! 🎉`;
        
        // Special handling for amending a VOTING_OPEN strategy
        // if (isVotingOpen) {
        //     submissionStatus = ProposalStatus.VOTING_OPEN_AMENDED as ProposalStatusKey; // Signals vote reset
        //     successMessage = `Amendment for ${initialStrategy?.id || 'new'} saved! The vote will be reset. ⚠️`;
        // }

        // Prepare the payload for the API
        // NOTE: StrategyWithRBM.status is type string, but here we pass the strict ProposalStatusKey which is acceptable.
        const payload: Omit<StrategyWithRBM2, 'id'> = {
            ...formData,
            authorId: authorId!, 
            status: submissionStatus,
            // Remove temporary client-side IDs before submission
            goals: formData.goals.map(({ id, ...rest }) => rest),
        };

        // --- Next.js API Submission Logic ---
        let attempt = 0;
        const maxRetries = 3; 
        let strategyId = initialStrategy?.id || '';

        // while (attempt < maxRetries) {
            try {
                const method = isEditing && strategyId ? 'PUT' : 'POST';
                const url = isEditing && strategyId 
                    ? `/api/strategies/${strategyId}` 
                    : '/api/strategies';

                // Implement fetch with exponential backoff logic
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
        
                if (!response.ok) {
                    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.message) {
                            errorMessage += ` - ${errorData.message}`;
                        }
                    } catch (e) {
                        // Ignore JSON parsing errors if response body is not JSON
                    }
                    throw new Error(errorMessage);
                }
        
                // The API should return the saved/updated object with the final ID
                const result = await response.json() as StrategyWithRBM;
                strategyId = result.id; 
        
                toast.success(successMessage);
                onSave(result); 
              //  break; // Exit loop on success

            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    toast.error(`Submission Error: Failed to save strategy after ${maxRetries} attempts.`);
                    console.error("API Submission failed:", error);
                //    break;
                }
                
                // Exponential backoff delay (2^attempt * 1000ms)
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        // }
        setIsLoading(false);
    };


    // Determine the main title (using current form status for display consistency)
    let mainTitle = '🚀 New Strategy Proposal (DRAFT)';
    if (isEditing) {
        if (isVotingOpen) {
            mainTitle = '✍️ AMEND Active Voting Strategy';
        } else {
            mainTitle = `✏️ Edit Strategy (${formData.status.replace('_', ' ')})`;
        }
    }


    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-2xl my-4 sm:my-10 font-sans">
            <Toaster position="top-right" richColors />
            
            {!isReady && (
                <div className="p-4 mb-4 text-center text-red-700 bg-red-50 rounded-lg shadow-inner">
                    <AlertTriangle className="w-5 h-5 inline-block mr-2" /> Waiting for user session/Author ID...
                </div>
            )}

            <div className='mb-6'>
                <button onClick={onCancel} type="button" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Go back to Strategies List
                </button>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 border-b pb-4 border-gray-100">
                    {mainTitle}
                </h2>

                {/* Conditional Warning Banner for VOTING_OPEN */}
                {isVotingOpen && (
                    <div className="mt-4 p-4 flex items-start gap-3 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-md">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">WARNING: Strategy is currently under active vote!</h4>
                            <p className="text-xs mt-1">
                                Saving changes will update the proposal mid-vote and **reset the vote**. The strategy status will be set to **AMENDED**.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 1. Strategy Core Fields */}
            <div className="space-y-6 mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-600" /> 1. Core Strategy Details
                </h3>

                {/* Input: Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1">Strategy Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleStrategyChange}
                        required
                        disabled={isLoading || !isReady}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                    />
                </div>

                {/* Input: Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-1">Strategy Content & Analysis</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleStrategyChange}
                        required
                        rows={6}
                        disabled={isLoading || !isReady}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                    />
                </div>

                {/* Strategy Year and Status side-by-side */}
                <div className='flex flex-col sm:flex-row gap-6'>
                    
                    {/* Input: Overall Strategy Year */}
                    <div className='w-full sm:w-1/3'>
                        <label htmlFor="year" className="block text-sm font-bold text-gray-700 mb-1">Strategy Target Year</label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleStrategyChange}
                            required
                            disabled={isLoading || !isReady}
                            min={new Date().getFullYear()}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                        />
                    </div>
                   
                    {/* Status Select Input */}
                    <div className='w-full sm:w-1/3'>
                         <label htmlFor="status" className="block text-sm font-bold text-gray-700 mb-1">Change Status</label>
                         <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleStatusChange}
                            // Lock status if voting is open or if final/rejected
                            disabled={isLoading || !isReady || isVotingOpen || formData.status === ProposalStatus.APPROVED || formData.status === ProposalStatus.REJECTED}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100 disabled:opacity-70"
                        >
                            {allStatuses.map(s => (
                                <option 
                                    key={s} 
                                    value={s} 
                                >
                                    {s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {isVotingOpen ? 'Status locked during active vote.' : 'Status changes are usually restricted after DRAFT.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Strategy Goals (RBM) */}
            <div className="space-y-6 mb-8 p-4 sm:p-6 border border-indigo-300 rounded-lg bg-indigo-50 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Flag className="w-5 h-5" /> 2. RBM Goals (Long-Term Impact)
                </h3>
                <p className="text-sm text-indigo-600">Define the measurable, long-term impacts your strategy aims to achieve. You must have at least one goal.</p>

                {formData.goals.map((goal, index) => (
                    <div key={goal.id} className="p-4 border border-indigo-200 rounded-xl bg-white shadow-md space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                            <h4 className="font-bold text-lg text-indigo-700">Goal {index + 1}</h4>
                            {/* Remove Button */}
                            <button
                                type="button"
                                // FIX: Use the non-null assertion operator '!' to confirm 'goal.id' is a string.
                                onClick={() => removeGoal(goal.id!)} 
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove Goal"
                                disabled={formData.goals.length <= 1 || isLoading || !isReady}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Input: Goal Title */}
                            <div className="sm:col-span-2">
                                <label htmlFor={`goal-title-${goal.id}`} className="block text-sm font-medium text-gray-700 mb-1">Goal Title/Description</label>
                                <input
                                    type="text"
                                    id={`goal-title-${goal.id}`}
                                    name="title"
                                    value={goal.title}
                                    // FIX: Change goal.id to goal.id! to satisfy the string requirement
                                    onChange={(e) => handleGoalChange(goal.id!, e)}
                                    required
                                    disabled={isLoading || !isReady}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                                />
                            </div>

                            {/* Input: Goal Target Year */}
                            <div className="sm:col-span-1">
                                <label htmlFor={`goal-year-${goal.id}`} className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                                <input
                                    type="number"
                                    id={`goal-year-${goal.id}`}
                                    name="targetYear"
                                    value={goal.targetYear}
                                    // FIX: Change goal.id to goal.id! to satisfy the string requirement
                                    onChange={(e) => handleGoalChange(goal.id!, e)}
                                    required
                                    disabled={isLoading || !isReady}
                                    min={new Date().getFullYear()}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Goal Button */}
                <button
                    type="button"
                    onClick={addGoal}
                    disabled={isLoading || !isReady}
                    className="mt-4 flex items-center gap-1.5 py-2 px-4 text-indigo-700 bg-indigo-200 rounded-full hover:bg-indigo-300 transition duration-150 font-semibold text-sm shadow-md disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add Another Goal
                </button>
            </div>

            {/* 3. Submission */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center gap-2 disabled:bg-indigo-400"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Communicating with API...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            {isVotingOpen ? 'Save Amendment (Reset Vote)' : (initialStrategy ? 'Save Changes' : 'Submit New Strategy')}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}