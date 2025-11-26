'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Flag, Loader2, Plus, Save, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { SafeUser } from '@/app/types';
import { StrategyWithUserVotes } from './StrategyCard';
//import { StrategyWithRBM } from './StrategyCard'; 

// interface SafeUser {
//     id: string;
//     name: string | null;
//     email: string | null;
// }

// Full RBM Structure for API submission (without client-side tempId)
interface StrategyOutput {
    id?: string;
    title: string;
    responsible: string;
    isCompleted: boolean;
}

interface StrategyOutcome {
    id?: string;
    title: string;
    kpi: string;
    outputs: StrategyOutput[];
}

interface StrategyGoal {
    id?: string;
    title: string;
    targetYear: number;
    outcomes: StrategyOutcome[]; // Added outcomes array
}
export interface StrategyWithRBM {
    id: string;
    title: string;
    content: string;
    year: string;
    status: string;//'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
    averageStrategicScore: number | null;
    //goals: any[];
    goals: StrategyGoal[]; // ⬅️ Must be present
    votes: { YES: number; NO: number };
    authorId: string;
    rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
    averageScore: number | null; // Changed to allow null if scoring is not complete
    totalVotesYes: number;
    totalVotesNo: number;
}

// Updated StrategyWithRBM structure (using the full Goal type)
export interface StrategyWithRBMFull extends Omit<StrategyWithRBM, 'goals'> {
    goals: StrategyGoal[];
}

// --- RBM Form Types (Full Nested Structure for Client State) ---

interface StrategyOutputForm extends StrategyOutput {
    tempId: string; // Required for React keys and local state manipulation
}

interface StrategyOutcomeForm extends StrategyOutcome {
    tempId: string;
    outputs: StrategyOutputForm[]; // Use Form types for nested data
}

interface StrategyGoalForm extends StrategyGoal {
    tempId: string;
    outcomes: StrategyOutcomeForm[]; // Use Form types for nested data
}

// --- CONSTANTS & STATUS LOGIC ---

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    VOTING_OPEN_AMENDED: 'VOTING_OPEN_AMENDED', 
} as const;

type ProposalStatusKey = keyof typeof ProposalStatus;

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

// --- Helper Functions for RBM Initialization/Manipulation ---

const getEmptyOutput = (): StrategyOutputForm => ({
    tempId: crypto.randomUUID(),
    title: "",
    responsible: "",
    isCompleted: false,
});

const getEmptyOutcome = (): StrategyOutcomeForm => ({
    tempId: crypto.randomUUID(),
    title: "",
    kpi: "",
    outputs: [getEmptyOutput()]
});

const getEmptyGoal = (): StrategyGoalForm => ({
    tempId: crypto.randomUUID(),
    title: "",
    targetYear: new Date().getFullYear() + 2,
    outcomes: [getEmptyOutcome()]
});

// Utility to map incoming API data to client form data, ensuring tempIds and structure.
const mapApiToForm = (apiGoals: StrategyGoal[]): StrategyGoalForm[] => {
    return apiGoals.map(g => {
        const outcomes = (g.outcomes || []).map(o => {
            const outputs = (o.outputs || []).map(p => ({
                ...p,
                tempId: p.id || crypto.randomUUID(),
            }));
            
            return {
                ...o,
                tempId: o.id || crypto.randomUUID(),
                outputs: (outputs.length > 0 ? outputs : [getEmptyOutput()])
            };
        }) as StrategyOutcomeForm[];

        if (outcomes.length === 0) {
            outcomes.push(getEmptyOutcome());
        }

        return {
            ...g,
            tempId: g.id || crypto.randomUUID(), 
            outcomes: outcomes
        } as StrategyGoalForm;
    });
};

// --- Outcome Editor Component (Sub-Component for rendering the Outcome/Output hierarchy) ---

interface OutcomeEditorProps {
    goalId: string;
    outcome: StrategyOutcomeForm;
    handleOutcomeChange: (goalId: string, outcomeId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    addOutput: (goalId: string, outcomeId: string) => void;
    removeOutcome: (goalId: string, outcomeId: string) => void;
    handleOutputChange: (goalId: string, outcomeId: string, outputId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    removeOutput: (goalId: string, outcomeId: string, outputId: string) => void;
    isRemovable: boolean;
    isDisabled: boolean;
}

const OutcomeEditor: React.FC<OutcomeEditorProps> = React.memo(({
    goalId,
    outcome,
    handleOutcomeChange,
    addOutput,
    removeOutcome,
    handleOutputChange,
    removeOutput,
    isRemovable,
    isDisabled,
}) => {
    // Only allow removal if there is more than one outcome in the parent goal
    const isRemoveDisabled = !isRemovable || isDisabled;

    return (
        <div key={outcome.tempId} className="p-1 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            {/* Outcome Header & Remove Button */}
            <div className="flex justify-between items-start mb-2 border-b pb-2 border-gray-100">
                <h5 className="text-md font-semibold text-gray-700 pt-1">Outcome:</h5>
                <button
                    type="button"
                    onClick={() => removeOutcome(goalId, outcome.tempId)}
                    className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition duration-150 disabled:opacity-50"
                    title="Remove Outcome"
                    disabled={isRemoveDisabled}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Outcome Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Outcome Title */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Outcome Title</label>
                    <input
                        type="text"
                        name="title"
                        placeholder='Define Outcome Title'
                        value={outcome.title}
                        onChange={(e) => handleOutcomeChange(goalId, outcome.tempId, e)}
                        required
                        disabled={isDisabled}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm focus:border-indigo-500 focus:ring-1 disabled:bg-white"
                    />
                </div>
                {/* KPI */}
                <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Key Performance Indicator (KPI)</label>
                    <input
                        type="text"
                        name="kpi"
                        value={outcome.kpi}
                        placeholder='Define kpi as % e.g. 15%'
                        onChange={(e) => handleOutcomeChange(goalId, outcome.tempId, e)}
                        required
                        disabled={isDisabled}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm focus:border-indigo-500 focus:ring-1 disabled:bg-white"
                    />
                </div>
            </div>

            {/* Outputs Section */}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                <h6 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                    <Plus className='w-3 h-3 text-indigo-500'/> Outputs (Activities & Deliverables)
                </h6>
                
                {/* Output List */}
                <div className="space-y-2">
                    {outcome.outputs.map((output) => (
                        <div key={output.tempId} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-inner">
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-4 gap-2">
                                {/* Output Title */}
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        name="title"
                                        value={output.title}
                                        placeholder="Deliverable/Activity"
                                        onChange={(e) => handleOutputChange(goalId, outcome.tempId, output.tempId, e)}
                                        required
                                        disabled={isDisabled}
                                        className="w-full rounded-md border-gray-300 p-1.5 text-xs focus:border-indigo-500 focus:ring-1 disabled:bg-gray-50"
                                    />
                                </div>
                                {/* Responsible */}
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        name="responsible"
                                        value={output.responsible}
                                        placeholder="Responsible Party"
                                        onChange={(e) => handleOutputChange(goalId, outcome.tempId, output.tempId, e)}
                                        disabled={isDisabled}
                                        className="w-full rounded-md border-gray-300 p-1.5 text-xs focus:border-indigo-500 focus:ring-1 disabled:bg-gray-50"
                                    />
                                </div>
                                {/* Completed Checkbox (using `isCompleted` boolean) */}
                                <div className="col-span-1 flex items-center justify-center">
                                    <label className="flex items-center space-x-2 text-xs text-gray-600">
                                        <input
                                            type="checkbox"
                                            name="isCompleted"
                                            checked={output.isCompleted}
                                            // The change event value needs special handling for checkboxes
                                            onChange={(e) => handleOutputChange(goalId, outcome.tempId, output.tempId, {
                                                target: { 
                                                    name: 'isCompleted', 
                                                    value: e.target.checked.toString(), // Pass as string to generalize handler
                                                }
                                            } as React.ChangeEvent<HTMLInputElement>)} 
                                            disabled={isDisabled}
                                            className="rounded text-indigo-600 shadow-sm focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span>Done</span>
                                    </label>
                                </div>
                            </div>
                            {/* Remove Output Button */}
                            <button
                                type="button"
                                onClick={() => removeOutput(goalId, outcome.tempId, output.tempId)}
                                className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition duration-150 disabled:opacity-50"
                                title="Remove Output"
                                disabled={outcome.outputs.length <= 1 || isDisabled}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Output Button */}
                <button
                    type="button"
                    onClick={() => addOutput(goalId, outcome.tempId)}
                    disabled={isDisabled}
                    className="flex items-center gap-1 py-1 px-3 text-xs text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 transition disabled:opacity-50 mt-2 font-semibold"
                >
                    <Plus className="w-3 h-3" /> Add Output
                </button>
            </div>
        </div>
    );
});
// Add this line after the definition
OutcomeEditor.displayName = 'OutcomeEditor';

// --- Main StrategyForm Component ---

interface FormState {
    title: string;
    content: string;
    year: string;
    status: ProposalStatusKey;
    goals: StrategyGoalForm[]; // Use the nested Form type
}

interface StrategyFormProps {
    initialStrategy: StrategyWithUserVotes | null; 
    currentUser:SafeUser|null;
    authorId: string | null; 
    onSave: (data: StrategyWithUserVotes) => void;
    onCancel: () => void;
}

export default function StrategyForm({ initialStrategy, currentUser, authorId, onSave, onCancel }: StrategyFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialStrategy;
    const initialStatus = initialStrategy?.status || ProposalStatus.DRAFT; 
    const isVotingOpen = initialStatus === ProposalStatus.VOTING_OPEN;
    
    //allow button to be enable only if user is allowed to edit
    //let AI correct here 
   // const isReady = !!authorId 
   // console.log("isReady",isReady)
    // console.log("currentUser.id === authorId , currentUser.isAdmin, !!authorId", currentUser.id === authorId , currentUser.isAdmin, !!authorId)
    const isReady = (!!authorId && (currentUser?.id === authorId || currentUser?.isAdmin));
    console.log("isReady",isReady)
    // --- State Initialization (using RBM Helpers) ---
    const initialData: FormState = useMemo(() => {
        if (initialStrategy && initialStrategy.goals.length > 0) {
            return {
                title: initialStrategy.title,
                content: initialStrategy.content,
                year: initialStrategy.year || new Date().getFullYear().toString(),
                status: initialStrategy.status as ProposalStatusKey, 
                goals: mapApiToForm(initialStrategy.goals),
            };
        }
        
        // Default initial state
        return {
            title: '',
            content: '',
            year: new Date().getFullYear().toString(),
            status: ProposalStatus.DRAFT, 
            goals: [getEmptyGoal()], // Start with one complete nested goal
        };
    }, [initialStrategy]);

    const [formData, setFormData] = useState<FormState>(initialData);

    // --- Handlers for Core Strategy Fields ---

    const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, status: value as ProposalStatusKey }));
    };
    
    // --- Handlers for Goals, Outcomes, and Outputs ---
    
    // 1. Goal Handlers
    const handleGoalChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal =>
                goal.tempId === id ? { 
                    ...goal, 
                    [name]: name === 'targetYear' ? parseInt(value) || 0 : value 
                } : goal
            ),
        }));
    };

    const addGoal = () => {
        setFormData(prev => ({
            ...prev,
            goals: [...prev.goals, getEmptyGoal()],
        }));
    };

    const removeGoal = (id: string) => {
        if (formData.goals.length <= 1) {
            toast.warning("You must have at least one goal in your strategy.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter(goal => goal.tempId !== id),
        }));
    };
    
    // 2. Outcome Handlers
    const handleOutcomeChange = useCallback((goalId: string, outcomeId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => 
                goal.tempId === goalId ? {
                    ...goal,
                    outcomes: goal.outcomes.map(outcome => 
                        outcome.tempId === outcomeId ? { ...outcome, [name]: value } : outcome
                    )
                } : goal
            )
        }));
    }, []);

    const addOutcome = useCallback((goalId: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => 
                goal.tempId === goalId ? {
                    ...goal,
                    outcomes: [...goal.outcomes, getEmptyOutcome()]
                } : goal
            )
        }));
    }, []);

    const removeOutcome = useCallback((goalId: string, outcomeId: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => {
                if (goal.tempId === goalId) {
                    const filteredOutcomes = goal.outcomes.filter(o => o.tempId !== outcomeId);
                    if (filteredOutcomes.length === 0) {
                        toast.warning("Goal must have at least one outcome. Adding default outcome.");
                        return { ...goal, outcomes: [getEmptyOutcome()] };
                    }
                    return { ...goal, outcomes: filteredOutcomes };
                }
                return goal;
            })
        }));
    }, []);

    // 3. Output Handlers
    const handleOutputChange = useCallback((goalId: string, outcomeId: string, outputId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => 
                goal.tempId === goalId ? {
                    ...goal,
                    outcomes: goal.outcomes.map(outcome => 
                        outcome.tempId === outcomeId ? { 
                            ...outcome, 
                            outputs: outcome.outputs.map(output => 
                                output.tempId === outputId ? { 
                                    ...output, 
                                    // Handle checkbox boolean vs text input string
                                    [name]: name === 'isCompleted' ? value === 'true' : value 
                                } : output
                            )
                        } : outcome
                    )
                } : goal
            )
        }));
    }, []);

    const addOutput = useCallback((goalId: string, outcomeId: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => 
                goal.tempId === goalId ? {
                    ...goal,
                    outcomes: goal.outcomes.map(outcome => 
                        outcome.tempId === outcomeId ? { 
                            ...outcome, 
                            outputs: [...outcome.outputs, getEmptyOutput()] 
                        } : outcome
                    )
                } : goal
            )
        }));
    }, []);

    const removeOutput = useCallback((goalId: string, outcomeId: string, outputId: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map(goal => {
                if (goal.tempId === goalId) {
                    return {
                        ...goal,
                        outcomes: goal.outcomes.map(outcome => {
                            if (outcome.tempId === outcomeId) {
                                const filteredOutputs = outcome.outputs.filter(p => p.tempId !== outputId);
                                if (filteredOutputs.length === 0) {
                                    toast.warning("Outcome must have at least one output. Adding default output.");
                                    return { ...outcome, outputs: [getEmptyOutput()] };
                                }
                                return { ...outcome, outputs: filteredOutputs };
                            }
                            return outcome;
                        })
                    };
                }
                return goal;
            })
        }));
    }, []);

    // --- Submission Logic ---

    // Utility to strip tempIds and convert StrategyGoalForm to API-ready StrategyGoal
    const mapFormToApi = (formGoals: StrategyGoalForm[]): StrategyGoal[] => {
        return formGoals.map(goal => {
            // Map Outputs
            const outputs: StrategyOutput[] = goal.outcomes.flatMap(outcome => 
                outcome.outputs.map(({ tempId, ...rest }) => ({ ...rest, id: rest.id || undefined }))
            );

            // Map Outcomes
            const outcomes: StrategyOutcome[] = goal.outcomes.map(outcome => ({
                id: outcome.id || undefined,
                title: outcome.title,
                kpi: outcome.kpi,
                // Assign mapped outputs to the outcome
                outputs: outcome.outputs.map(({ tempId, ...rest }) => ({ ...rest, id: rest.id || undefined }))
            }));

            // Map Goal
            const apiGoal: StrategyGoal = {
                id: goal.id || undefined,
                title: goal.title,
                targetYear: goal.targetYear,
                outcomes: outcomes,
            };
            return apiGoal;
        });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isReady) {
            toast.error("User authentication is required to submit a strategy.");
            return;
        }

        // Basic validation for core fields and goals
        if (!formData.title || !formData.content) {
            toast.error("Strategy Title and Content are required.");
            return;
        }
        if (formData.goals.some(g => !g.title || g.targetYear < new Date().getFullYear())) {
            toast.error("Please ensure all goals have a title and a valid target year.");
            return;
        }

        // Proposed Fix for the comparison part:
         const isAuthor = authorId?.toString().trim() === currentUser.id?.toString().trim();
         if (isEditing && ( !isAuthor || !currentUser?.isAdmin) ) {
            toast.error(`You dont have the right to change this ,see Admin or Owner ${currentUser.email}. authoutId:${authorId}== loggedinUserId:${currentUser.id}`);
            return;
        }

        setIsLoading(true);

        let submissionStatus = formData.status;
        let successMessage = `Strategy successfully saved! 🎉`;
        
        // Prepare the nested payload for the API
        const apiGoals = mapFormToApi(formData.goals);

        const payload: Omit<StrategyWithRBMFull, 'id' | 'votes' | 'averageStrategicScore' | 'rbm' | 'averageScore' | 'totalVotesYes' | 'totalVotesNo'> = {
            title: formData.title,
            content: formData.content,
            year: formData.year,
            status: submissionStatus,
            authorId: authorId!, 
            goals: apiGoals,
        };

        // --- Next.js API Submission Logic ---       
        let strategyId = initialStrategy?.id || '';        
        try {
            const method = isEditing && strategyId ? 'PUT' : 'POST';
            const url = isEditing && strategyId 
                ? `/api/strategies/${strategyId}` 
                : '/api/strategies';

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
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }
    
            const result = await response.json() as StrategyWithUserVotes//StrategyWithRBMFull;
            toast.success(successMessage);
            onSave(result); 
        } catch (error) {
            toast.error(`Submission Error: Failed to save strategy`);
            console.error("API Submission failed:", error);
        }
        setIsLoading(false);
    };


    // Determine the main title 
    let mainTitle = '🚀 New Strategy Proposal (DRAFT)';
    if (isEditing) {
        if (isVotingOpen) {
            mainTitle = '✍️ AMEND Active Voting Strategy';
        } else {
            mainTitle = `✏️ Edit Strategy (${formData.status.replace('_', ' ')})`;
        }
    }


    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-1 sm:p-4 bg-white rounded-xl shadow-2xl my-4 sm:my-10 font-sans">
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
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 border-b pb-4 border-gray-100">
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
            <div className="space-y-6 mb-8 p-1 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
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
                        placeholder='Enter your strategic title here.'
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
                        placeholder='Content here'
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
                            placeholder='Enter Year 2027'
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
            <div className="space-y-6 mb-8 p-1 sm:p-4 border border-indigo-300 rounded-lg bg-indigo-50 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Flag className="w-5 h-5" /> 2. RBM Goals, Outcomes, & Outputs
                </h3>
                <p className="text-sm text-indigo-600">Define the measurable, long-term impacts (Goals), the key results (Outcomes), and the required activities (Outputs).</p>

                {formData.goals.map((goal, index) => (
                    <div key={goal.tempId} className="p-4 border border-indigo-200 rounded-xl bg-white shadow-md space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                            <h4 className="font-bold text-lg text-indigo-700">Goal {index + 1}</h4>
                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeGoal(goal.tempId)} 
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove Goal"
                                disabled={formData.goals.length <= 1 || isLoading || !isReady}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Goal Title and Target Year */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label htmlFor={`goal-title-${goal.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">Goal Title/Description</label>
                                <input
                                    type="text"
                                    id={`goal-title-${goal.tempId}`}
                                    name="title"
                                    value={goal.title}
                                    placeholder='Enter your strategic goal here (Goal).'
                                    onChange={(e) => handleGoalChange(goal.tempId, e)}
                                    required
                                    disabled={isLoading || !isReady}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <label htmlFor={`goal-year-${goal.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                                <input
                                    type="number"
                                    id={`goal-year-${goal.tempId}`}
                                    name="targetYear"
                                    value={goal.targetYear}
                                    placeholder='Target Year'
                                    onChange={(e) => handleGoalChange(goal.tempId, e)}
                                    required
                                    disabled={isLoading || !isReady}
                                    min={new Date().getFullYear()}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Outcomes Section (Nested Loop) */}
                        <div className="mt-4 pt-4 border-t border-indigo-100 space-y-4">
                            <h5 className="text-lg font-bold text-indigo-600">
                                Outcomes for Goal {index + 1}
                            </h5>
                            {goal.outcomes.map((outcome) => (
                                <OutcomeEditor
                                    key={outcome.tempId}
                                    goalId={goal.tempId}
                                    outcome={outcome}
                                    handleOutcomeChange={handleOutcomeChange}
                                    addOutput={addOutput}
                                    removeOutcome={removeOutcome}
                                    handleOutputChange={handleOutputChange}
                                    removeOutput={removeOutput}
                                    isRemovable={goal.outcomes.length > 1}
                                    isDisabled={isLoading || !isReady}
                                />
                            ))}
                            {/* Add Outcome Button */}
                            <button
                                type="button"
                                onClick={() => addOutcome(goal.tempId)}
                                disabled={isLoading || !isReady}
                                className="flex items-center gap-1.5 py-1.5 px-3 text-indigo-700 bg-indigo-200 rounded-full hover:bg-indigo-300 transition duration-150 font-semibold text-sm shadow-md disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" /> Add Outcome
                            </button>
                        </div>

                    </div>
                ))}

                {/* Add Goal Button */}
                <button
                    type="button"
                    onClick={addGoal}
                    disabled={isLoading || !isReady}
                    className="mt-4 flex items-center gap-1.5 py-2 px-4 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition duration-150 font-bold text-sm shadow-xl disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add New Goal
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
