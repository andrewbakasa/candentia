import React, { useState } from 'react';
import { BookOpen, Flag, Loader2, Plus, Save, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { StrategyWithRBM } from './StrategyCard';

// --- Placeholder Type Definitions ---
// These interfaces replace external imports to make the code runnable.

interface SafeUser {
    id: string;
    name: string | null;
    email: string | null;
}

interface StrategyGoal {
    id: string; // client-side or DB ID
    title: string;
    targetYear: number;
}

// interface StrategyWithRBMExample {
//     id: string;
//     title: string;
//     content: string;
//     year: string;
//     status: string; // Should be one of ProposalStatus
//     goals: StrategyGoal[];
// }

// Mock Enum definitions for client side (using string literals for simplicity)
const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};


// --- Form Props ---

interface StrategyFormProps {
    initialStrategy: StrategyWithRBM | null; // Allow null for creating a new strategy
    authorId: string | null; // Assuming we only need the ID from SafeUser for the form logic
    onSave: (data: any) => void; // Corrected type: Function to handle save/submission result
    onCancel: () => void; // Corrected type: Function to handle cancellation
}

// --- Main StrategyForm Component ---

export default function StrategyForm({ initialStrategy, authorId, onSave, onCancel }: StrategyFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Determine status and editing mode
    const isEditing = !!initialStrategy;
    const currentStatus = initialStrategy?.status;
    const isVotingOpen = currentStatus === ProposalStatus.VOTING_OPEN;

    // --- State Initialization ---
    const initialFormState = {
        title: '',
        content: '',
        year: new Date().getFullYear().toString(),
        goals: [
            { id: Date.now().toString(), title: 'Core objective 1: Increase user participation.', targetYear: new Date().getFullYear() + 2 },
        ],
    };

    const initialData = initialStrategy
        ? {
            title: initialStrategy.title,
            content: initialStrategy.content,
            year: initialStrategy.year || new Date().getFullYear().toString(),
            goals: initialStrategy.goals?.map((g) => ({
                // Ensure client-side ID for list keying
                id: g.id || Date.now().toString() + Math.random(),
                title: g.title,
                targetYear: g.targetYear,
            })) ?? [],
        }
        : initialFormState;

    const [formData, setFormData] = useState(initialData);

    // --- Handlers ---

    const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGoalChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal =>
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

        // Basic validation
        if (formData.goals.some(g => !g.title || g.targetYear < new Date().getFullYear())) {
            toast.error("Please ensure all goals have a title and a valid target year.");
            return;
        }

        setIsLoading(true);

        // Simulate API call delay with exponential backoff logic (since we're using fetch mock)
        let attempt = 0;
        const maxRetries = 3;
        
        while (attempt < maxRetries) {
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 500 + attempt * 1000));
        
                const payload = {
                    ...formData,
                    authorId: authorId,
                    // Remove temporary client-side IDs before submission
                    goals: formData.goals.map(({ id, ...rest }) => rest),
                    // Mock status update for the successful save
                    status: isVotingOpen ? 'VOTING_OPEN_AMENDED' : ProposalStatus.PENDING_REVIEW,
                };
        
                // Mock successful save result
                const result = { 
                    id: initialStrategy?.id || `strat-${Date.now().toString().slice(-4)}`, 
                    ...payload 
                };
        
                let successMessage = isVotingOpen
                    ? `Amendment for ${result.id} saved! The vote will be restarted. ⚠️`
                    : `Strategy ID: ${result.id} successfully saved! 🎉`;
        
                toast.success(successMessage);
                onSave(result); // Pass the updated/new strategy back to App
                break; // Exit loop on success
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    toast.error(`Submission Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
                    console.error("Submission failed:", error);
                    break;
                }
                // Log and wait before next retry (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        setIsLoading(false);
    };


    // Determine the main title and status label
    let mainTitle = '🚀 New Strategy Proposal (DRAFT)';
    if (isEditing) {
        mainTitle = '✏️ Edit Draft Strategy';
        if (isVotingOpen) {
            mainTitle = '✍️ AMEND Active Voting Strategy';
        } else {
            mainTitle = `✏️ Edit Strategy (${currentStatus})`;
        }
    }


    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-2xl my-4 sm:my-10">
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
                                Saving changes will update the proposal mid-vote. This action may automatically void existing votes or reset the voting period. Proceed with caution.
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                    />
                </div>

                {/* Input: Overall Strategy Year */}
                <div>
                    <label htmlFor="year" className="block text-sm font-bold text-gray-700 mb-1">Strategy Target Year</label>
                    <input
                        type="number"
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleStrategyChange}
                        required
                        disabled={isLoading}
                        min={new Date().getFullYear()}
                        className="mt-1 block w-full sm:w-1/3 rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                    />
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
                                onClick={() => removeGoal(goal.id)}
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove Goal"
                                disabled={formData.goals.length <= 1 || isLoading}
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
                                    onChange={(e) => handleGoalChange(goal.id, e)}
                                    required
                                    disabled={isLoading}
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
                                    onChange={(e) => handleGoalChange(goal.id, e)}
                                    required
                                    disabled={isLoading}
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
                    disabled={isLoading}
                    className="mt-4 flex items-center gap-1.5 py-2 px-4 text-indigo-700 bg-indigo-200 rounded-full hover:bg-indigo-300 transition duration-150 font-semibold text-sm shadow-md disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add Another Goal
                </button>
            </div>

            {/* 3. Submission */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center gap-2 disabled:bg-indigo-400"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            {isVotingOpen ? 'Save Amendment to Active Proposal' : (initialStrategy ? 'Save Changes to Draft' : 'Submit Concept (DRAFT)')}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}