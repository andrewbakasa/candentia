'use client';

import React, { useState } from 'react';
import { Loader2, ThumbsUp, ThumbsDown, RefreshCw, XCircle, Users } from 'lucide-react'; // Import Users icon
import { timeAgo } from '@/app/bp/[id]/_components/utility';
import { Hint } from '@/app/components/hint';

/**
 * Interface for a simplified Voter object containing display information.
 * NOTE: This assumes the parent component fetches this list.
 */
interface Voter {
    id: string;
    email: string;
    voteType: 'YES' | 'NO';
    name: string | null;
    timestamp: Date | string // Change to allow Date or string 
    updatedAt: Date | string | null; // Use Date/string/null for updatedAt
}

/**
 * Renders the voting and vote management interface for a strategy.
 */
interface VotingSectionProps {
    strategyId: string;
    // The current user's vote ('YES', 'NO', or null if not voted).
    userCurrentVote: 'YES' | 'NO' | null;
   // Handler for casting a new vote or changing vote.
    // The 'action' parameter tells the parent whether to use POST (NEW) or PUT (SWITCH).
    onVote: (voteType: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => Promise<void>; 
    // Handler for canceling/deleting the existing vote (API: DELETE)
    onCancelVote: () => Promise<void>;
    // --- NEW ADMIN PROPS ---
    isAdmin: boolean; // Flag to check if the current user is an admin
    voterList: Voter[]; // The list of all voters for this strategy
    // --- END NEW ADMIN PROPS ---

  
}

// --- Helper Component: Confirmation Message (Unchanged) ---
const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
    if (!message) return null;
    
    const baseClasses = "mt-4 p-4 rounded-xl text-base font-semibold shadow-md opacity-100 transition-opacity duration-500 ease-in-out";
    const successClasses = "bg-green-50 border border-green-300 text-green-700";
    const errorClasses = "bg-red-50 border border-red-300 text-red-700";

    return (
        <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
            {message}
        </div>
    );
};

// --- Helper Component: Confirmed Vote Display (Unchanged) ---
interface ConfirmedVoteDisplayProps {
    vote: 'YES' | 'NO';
    onCancel: () => void;
    onSwitch: (newVote: 'YES' | 'NO') => void;
    isProcessing: boolean;
}

const ConfirmedVoteDisplay: React.FC<ConfirmedVoteDisplayProps> = ({ vote, onCancel, onSwitch, isProcessing }) => {
    const isYes = vote === 'YES';
    const otherVote: 'YES' | 'NO' = isYes ? 'NO' : 'YES';
    const bgColor = isYes ? 'bg-green-50' : 'bg-red-50';
    const textColor = isYes ? 'text-green-700' : 'text-red-700';
    const borderColor = isYes ? 'border-green-300' : 'border-red-300';
    const Icon = isYes ? ThumbsUp : ThumbsDown;

    return (
        <div className={`p-5 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-lg mt-5 transition-all duration-500`}>
            <div className="flex items-start justify-between">
                <div className='flex items-center'>
                    <Icon className={`w-8 h-8 ${isYes ? 'text-green-500' : 'text-red-500'} mr-4 flex-shrink-0`} />
                    <div className='flex flex-col'>
                        <p className={`text-xl font-extrabold ${textColor}`}>
                            Your Vote: <span className="uppercase">{vote}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Your decision is recorded. You may change or cancel it below.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3 mt-4 pt-3 border-t border-gray-200'>
                <button
                    onClick={() => onSwitch(otherVote)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50"
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Switch to {otherVote}
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                        <>
                            <XCircle className="w-4 h-4" />
                            Cancel Vote
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Updated Component: Voter List Display (formerly AdminVoterList) ---
const VoterListDisplay: React.FC<{ voterList: Voter[] }> = ({ voterList }) => {
    
    const yesVoters = voterList.filter(v => v.voteType === 'YES');
    const noVoters = voterList.filter(v => v.voteType === 'NO');
    // Helper function to determine the time to display
    const getDisplayTime = (voter: Voter) => {
        // 🚨 FIX: Use updatedAt if it's not null/undefined, otherwise use timestamp (creation time)
        const relevantTime = voter.updatedAt ? voter.updatedAt : voter.timestamp;
        
        // Ensure the input to timeAgo is a valid Date object or string for conversion
        // Note: timeAgo usually expects a Date object or ISO string. Assuming timeAgo handles conversion.
        return timeAgo(new Date(relevantTime).toLocaleDateString());
    };

    // Helper function to determine the time to display
    const getDisplayTimeFull = (voter: Voter) => {
        // 🚨 FIX: Use updatedAt if it's not null/undefined, otherwise use timestamp (creation time)
        const relevantTime = voter.updatedAt ? voter.updatedAt : voter.timestamp;
        
        // This is a common way to ensure the string is treated as UTC/ISO, avoiding browser timezone issues.
        const dateObj = new Date(relevantTime);
        
        // Decide label based on which field was used
        const label = voter.updatedAt ? 'Switched' : 'Voted';
        
        // Use timeAgo for relative display
        return `${label} ${timeAgo(dateObj.toISOString())}`; 
    };

    return (
        <div className="mt-4 p-6 bg-indigo-50 border-t-4 border-indigo-300 rounded-xl shadow-inner animate-in fade-in duration-500">
            <h5 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                <Users className='w-5 h-5'/> Voter Audit Log ({voterList.length} Total Votes)
            </h5>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* YES Voters */}
                <div className='p-3 bg-white rounded-lg border border-green-200'>
                    <p className='font-bold text-green-700 flex items-center mb-2'>
                        <ThumbsUp className='w-4 h-4 mr-2'/> YES Votes ({yesVoters.length})
                    </p>
                    <ul className='space-y-1 text-sm text-gray-700 max-h-40 overflow-y-auto'>
                        {yesVoters.map(voter => (
                            <li key={voter.id} className='truncate'>
                                {/* Use name first, fall back to email if name is null */}
                                
                                 <Hint sideOffset={2} description={voter.email}>
                                    <span className='font-medium'>{voter.name || voter.email}</span>
                                </Hint> - 
                                <span className='text-blue-500 ml-1'>({getDisplayTimeFull(voter)})</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* NO Voters */}
                <div className='p-3 bg-white rounded-lg border border-red-200'>
                    <p className='font-bold text-red-700 flex items-center mb-2'>
                        <ThumbsDown className='w-4 h-4 mr-2'/> NO Votes ({noVoters.length})
                    </p>
                    <ul className='space-y-1 text-sm text-gray-700 max-h-40 overflow-y-auto'>
                        {noVoters.map(voter => (
                            <li key={voter.id} className='truncate'>
                                {/* Use name first, fall back to email if name is null */}
                                <Hint sideOffset={2} description={voter.email}>
                                    <span className='font-medium'>{voter.name || voter.email}</span>
                                </Hint> - 
                                <span className='text-blue-500 ml-1'>({getDisplayTimeFull(voter)})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
// --- END Updated Component ---


export default function VotingSection({ strategyId, onVote, onCancelVote, userCurrentVote, isAdmin, voterList }: VotingSectionProps) {
    // Tracks which vote type is currently processing ('YES', 'NO', 'CANCEL', or null)
    const [processingAction, setProcessingAction] = useState<'YES' | 'NO' | 'CANCEL' | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });
    // NEW STATE: Toggle visibility for the voter list
    const [showVoterList, setShowVoterList] = useState(false);

    // --- Adjusted handleActionClick function in VotingSection component ---

  
    const handleActionClick = async (type: 'YES' | 'NO' | 'CANCEL') => {
        if (processingAction) return;

        setProcessingAction(type); 
        setMessage({ text: '', type: null });

        try {
            if (type === 'CANCEL') {
                await onCancelVote();
            } else {
                 // POST or PUT logic
                const action: 'NEW' | 'SWITCH' = userCurrentVote ? 'SWITCH' : 'NEW';
                await onVote(type, action); // <-- ADJUSTED CALL
            }

              // Success message logic here (optional, depending on where success is handled)
            setMessage({ 
                text: type === 'CANCEL' 
                    ? 'Vote successfully canceled.' 
                    : `Vote successfully submitted/switched to ${type}.`, 
                type: 'success' 
            });
        } catch (error) {
            console.error('Voting failed:', error);
            // Assuming onVote/onCancelVote throws an error object with a message
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the action.';
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setProcessingAction(null); 
            // Clear the message after a few seconds
            setTimeout(() => setMessage({ text: '', type: null }), 5000);
        }
    };

    const isAnyProcessing = processingAction !== null;
    const hasVoted = userCurrentVote !== null;

    const buttonBaseClasses = "flex-1 font-bold py-3 px-5 rounded-2xl transition duration-300 shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 text-lg";

    // Re-styling logic, now checking against the generic `processingAction`
    const isYesProcessing = processingAction === 'YES';
    const yesButtonClasses = isYesProcessing
      ? `bg-green-600 text-white` 
      : `bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`;

    const isNoProcessing = processingAction === 'NO';
    const noButtonClasses = isNoProcessing
      ? `bg-red-600 text-white` 
      : `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`;

    const getDisabledClass = (isCurrentProcessing: boolean) => {
        if (isCurrentProcessing) return ''; 
        if (isAnyProcessing || hasVoted) return 'opacity-60 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none'; 
        return ''; 
    }

    return (
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-xl font-extrabold mb-5 text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600 text-2xl">🗳️</span> 
                {hasVoted ? 'Manage Your Decision' : 'Cast Your Decision'} 
            </h4>
            
            {/* --- CONDITIONAL RENDERING --- */}
            {hasVoted ? (
                <ConfirmedVoteDisplay 
                    vote={userCurrentVote!} 
                    onCancel={() => handleActionClick('CANCEL')} // Pass CANCEL action
                    onSwitch={(newVote) => handleActionClick(newVote)} // Pass YES/NO action
                    isProcessing={isAnyProcessing}
                />
            ) : (
                <div className="flex space-x-5">
                    <button
                        onClick={() => handleActionClick('YES')}
                        disabled={isAnyProcessing || hasVoted} 
                        className={`${buttonBaseClasses} ${yesButtonClasses} ${getDisabledClass(isYesProcessing)}`}
                    >
                        {isYesProcessing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-5 w-5" /> Processing
                            </span>
                        ) : (
                            <>
                                👍 Vote YES
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleActionClick('NO')}
                        disabled={isAnyProcessing || hasVoted} 
                        className={`${buttonBaseClasses} ${noButtonClasses} ${getDisabledClass(isNoProcessing)}`}
                    >
                        {isNoProcessing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-5 w-5" /> Processing
                            </span>
                        ) : (
                            <>
                                👎 Vote NO
                            </>
                        )}
                    </button>
                </div>
            )}

            <ConfirmationMessage message={message.text} type={message.type} />
            
            <p className="text-sm text-gray-500 mt-4 italic">
                Your vote can be changed or canceled at any time while the voting period is open.
            </p>

            {/* --- ADMIN VIEW ADDITION (Toggle/Click to show/hide) --- */}
            {isAdmin && voterList.length > 0 && (
                <div className="mt-8">
                    {/* Toggle Button */}
                    <button
                        onClick={() => setShowVoterList(prev => !prev)}
                        className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition duration-150 shadow-md ring-1 ring-indigo-200"
                    >
                        <Users className='w-4 h-4'/> 
                        {showVoterList ? 'Hide Voter Audit Log' : `Show Voter Audit Log (${voterList.length} total)`}
                    </button>
                    
                    {/* Conditional Voter List Display */}
                    {showVoterList && <VoterListDisplay voterList={voterList} />}
                </div>
            )}
            {/* --- END ADMIN VIEW ADDITION --- */}
        </div>
    );
}