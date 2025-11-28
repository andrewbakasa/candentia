'use client';

import React, { useMemo } from 'react';
import { SafeUser } from '@/app/types';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link';
import { ArrowRight, Flag, Zap, Link2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { StrategyWithRBMFull } from './StrategyForm';
import { Hint } from '@/app/components/hint';

/**
 * Utility function to highlight all occurrences of a search query in a text string.
 * It returns an array of JSX elements, alternating between plain text and highlighted spans.
 * This is the safest way to render rich text in React without using dangerouslySetInnerHTML.
 *
 * @param {string} text The full text content.
 * @param {string} query The search string to highlight.
 * @returns {Array<React.ReactNode>} Array of text strings and <span> elements.
 */
const highlightText = (text: string, query: string) => {
    // Basic guard: If no valid query is present or text is empty, return the text as is.
    if (!text || !query || query.trim().length < 2) {
        return text;
    }

    const effectiveQuery = query.trim();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Create a global, case-insensitive RegExp
    const regex = new RegExp(effectiveQuery, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
        // 1. Add text segment before the current match
        const precedingText = text.substring(lastIndex, match.index);
        if (precedingText) {
            parts.push(precedingText);
        }

        // 2. Add the highlighted match segment
        const matchedText = match[0];
        // Using `p-[1px] -m-[1px]` to ensure highlight background fills the entire text area cleanly.
        parts.push(
            <span 
                key={`${match.index}-${lastIndex}`} 
                className="bg-yellow-300 rounded-sm p-[1px] -m-[1px] inline-block"
            >
                {matchedText}
            </span>
        );
        
        // Update the index for the next segment search
        lastIndex = match.index + matchedText.length;
    }

    // 3. Add any remaining text after the last match
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
        parts.push(remainingText);
    }
    
    // React automatically handles rendering the mixed array of strings and elements
    return parts;
};


// [All interface definitions remain unchanged]
export type StrategyWithUserVotes = StrategyWithRBMFull & {
    author: { 
        id: string; 
        name: string | null; 
        email: string | null;
    };
    individualVotes: { 
        voterId: string; voteType: 'YES' | 'NO'
        id: string,
        email: string,
        name: string,
        timestamp: string,
        updatedAt:string
    }[];
};

export interface StrategyOutput {
    id: string;
    title: string;
    responsible: string;
    isCompleted: boolean;
}

export interface StrategyOutcome {
    id: string;
    title: string;
    kpi: string;
    outputs: StrategyOutput[];
}

export interface StrategyGoal {
    id: string;
    title: string;
    targetYear: number;
    outcomes: StrategyOutcome[];
}
export interface StrategyWithRBM {
    id: string;
    title: string;
    content: string;
    year: string;
    status: string;//'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
    averageStrategicScore: number | null;
    goals: StrategyGoal[]; // ⬅️ Must be present
    votes: { YES: number; NO: number };
    authorId: string;
    rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
    averageScore: number | null; // Changed to allow null if scoring is not complete
    totalVotesYes: number;
    totalVotesNo: number;
}
const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const; 

export interface StrategyCardProps {
    strategy: StrategyWithUserVotes;
    currentUser: SafeUser | null;
    onVote: (strategyId: string, type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => Promise<void>; 
    onCancelVote: (strategyId: string) => Promise<void>;
    onStrategyClick: (strategy: StrategyWithUserVotes) => void;
    counter:number;
    // 💡 Prop to control the expanded state
    isExpanded: boolean; 
    // 💡 Prop to handle toggling (updates state in parent)
    onToggleExpand: (id: string) => void;
    // 💡 NEW: Prop for search text to be highlighted
    searchText: string;
}
const getStatusColor = (status: string) => {
    switch (status) {
        case ProposalStatus.DRAFT: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case ProposalStatus.VOTING_OPEN: return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        case ProposalStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-300';
        case ProposalStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-300';
        case ProposalStatus.PENDING_REVIEW:
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => ( 
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
        {status?.replace('_', ' ')}
    </span>
);

export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter, isExpanded, onToggleExpand, searchText }: StrategyCardProps) {

    // 💡 NEW: Use useMemo and highlightText for the title and content
    const highlightedTitle = useMemo(() => 
        highlightText(strategy.title, searchText), 
    [strategy.title, searchText]);

    const highlightedContent = useMemo(() => 
        highlightText(strategy.content, searchText), 
    [strategy.content, searchText]);

   const authDesp= strategy.author.name || strategy.author.email || 'N/A'
    const highlightedAuthorName = useMemo(() => 
        highlightText(authDesp, searchText), 
    [authDesp, searchText]);

    // 💡 UPDATED: Use the prop instead of local state
    const isCollapsed = !isExpanded;

    const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
    const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
    
    // --- DETERMINE AUTHOR & ADMIN STATUS ---
    const allowedRoles = [ 'admin', 'executive'];
    const isAdmin:boolean = currentUser?.roles?.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    ) || false;

    // Check if the current user is the author
    const isAuthor = currentUser?.id === strategy.author.id; 
    
    // --- CONDITIONAL CARD STYLING ---
    const authorCardStyle = isAuthor 
        ? "bg-white border-yellow-500 shadow-xl ring-2 ring-yellow-300" 
        : "bg-white border-gray-100 shadow-xl";

    // 1. DETERMINE CURRENT USER'S VOTE
    let userCurrentVote: 'YES' | 'NO' | null = null;

    if (currentUser) {
        const userVoteRecord = strategy?.individualVotes?.find(
            (vote) => vote.id === currentUser.id || vote.voterId === currentUser.id 
        );

        if (userVoteRecord) {
            userCurrentVote = userVoteRecord.voteType;
        }
    }
    // END OF VOTE DETERMINATION

    // Vote percentage calculation
    const votePercentage = totalVotes > 0 
        ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
        : 0;
    
    // Function to handle copying the strategy URL (unchanged)
    const handleCopyLink = () => {
        const link = `${window.location.origin}/strategies/${strategy.id}`;
        const dummyElement = document.createElement('input');
        dummyElement.value = link;
        document.body.appendChild(dummyElement);
        dummyElement.select();
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(link);
            } else {
                document.execCommand('copy'); 
            }
            toast.success("Share link copied to clipboard!", { description: link });
        } catch (err) {
            toast.error("Failed to copy the link. Please copy it manually.");
            console.error("Copy failed:", err);
        }
        
        document.body.removeChild(dummyElement);
    };

    // Helper component for the collapse/expand button
    const ExpandCollapseButton: React.FC<{ isCollapsed: boolean, id: string, onToggle: (id: string) => void }> = ({ isCollapsed, id, onToggle }) => (
        <button
            onClick={() => onToggle(id)}
            className="w-full py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-xs border border-gray-200"
        >
            {isCollapsed ? (
                <>
                    <ChevronDown className='w-4 h-4'/> Expand Details
                </>
            ) : (
                <>
                    <ChevronUp className='w-4 h-4'/> Collapse Details
                </>
            )}
        </button>
    );

    return (<div className={`rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 p-1 sm:p-4 flex flex-col justify-between ${authorCardStyle}`}>
        <Toaster position="top-right" richColors />
        <div className='gap-0'> 
            <div className="flex justify-between items-center text-sm mb-1 pb-1 border-b border-indigo-200">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                    <User className="w-4 h-4 text-indigo-500" />
                    <Hint sideOffset={2} description={strategy.author?.email||" No email provided"}>Author: {highlightedAuthorName}</Hint>
                </span>
                {isAuthor && (
                    <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-md">
                        YOUR PROPOSAL
                    </span>
                )}
            </div>
            {/* --- END AUTHOR DETAIL SECTION --- */}
            <div className="flex justify-between items-start mb-1">
                <StatusBadge status={strategy.status} />
                <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    Target: {strategy.year}
                </span>
            </div> 
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
                onClick={() => onStrategyClick(strategy)}
            > {counter+1}. {highlightedTitle} </h3>
            {/* 💡 Collapse Summary and TOP Toggle Button */}
            <div className='flex justify-between items-center text-sm text-gray-500 mt-1 mb-1'>
                {isCollapsed ? (
                    <>
                        {/* Summary of key collapsed info */}
                        <span className='flex items-center gap-1 font-medium'>
                            <Flag className="w-4 h-4 text-indigo-500" />
                            Goals: {strategy?.goals?.length}
                        </span>
                        {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
                            <span className='font-semibold text-blue-800'>Score: {strategy.averageStrategicScore.toFixed(1)} / 10</span>
                        )}
                        {totalVotes > 0 && (
                            <span className='font-medium text-green-700'>
                                {votePercentage}% YES ({totalVotes} votes)
                            </span>
                        )}
                    </>
                ) : (
                    // Placeholder for alignment when expanded
                    <div />
                )}
            </div>
            <div className="mt-0 pb-0 border-b border-gray-200">
                <ExpandCollapseButton 
                    isCollapsed={isCollapsed} 
                    id={strategy.id} 
                    onToggle={onToggleExpand} 
                />
            </div>
            <div className={`transition-max-height ease-in-out duration-500 overflow-hidden ${isCollapsed ? 'max-h-0' : ''}`} >
                {/* 💡 UPDATED: Render highlighted content */}
                <p className="text-sm text-gray-600 mb-1 p-1">{highlightedContent}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1 border-t pt-1">
                    <div className='flex items-center gap-2'>
                        <span className='flex items-center gap-1 font-medium'>
                            <Zap className="w-4 h-4 text-indigo-500" />
                            ID: {strategy.id}
                        </span>
                        {/* Copy Link Button */}
                        <button 
                            onClick={handleCopyLink}
                            title="Copy Link to Proposal"
                            className='text-gray-400 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-indigo-50'
                        >
                            <Link2 className='w-4 h-4' />
                        </button>
                    </div>
                    
                    <span className='flex items-center gap-1 font-medium'>
                        <Flag className="w-4 h-4 text-indigo-500" />
                        Goals: {strategy?.goals?.length}
                    </span>
                </div>
                
                
               {/* Expert Score */}
                {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
                    <div className="mt-2 p-1 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
                        <span className='font-semibold text-blue-800'>Expert Score:</span>
                        <span className='font-extrabold text-blue-900 text-lg'>{strategy.averageStrategicScore.toFixed(1)} / 10</span>
                    </div>
                )}
                    
                {/* RBM Breakdown */}
                <RBMBreakdown goals={strategy.goals} pos={counter} searchText={searchText} /> 


                {/* Voting Indicators */}
                {totalVotes > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-green-600">YES ({strategy.totalVotesYes})</span>
                            <span className="text-red-600">NO ({strategy.totalVotesNo})</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
                                style={{ width: `${votePercentage}%` }}
                                title={`${votePercentage}% voted YES`}
                            ></div>
                        </div>
                        <p className='text-xs text-gray-500 mt-1 text-center font-medium'>
                            Total Votes: {totalVotes}
                        </p>
                    </div>
                )}

                
                {isVotingOpen && currentUser && (
                    <VotingSection 
                        strategyId={strategy.id} 
                        userCurrentVote={userCurrentVote} 
                        onVote={(type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => onVote(strategy.id, type, action)}
                        onCancelVote={() => onCancelVote(strategy.id)}
                        isAdmin={isAdmin}
                        voterList={strategy.individualVotes.map(v => ({
                            id: v.id,
                            email: v.email,
                            name: v.name,
                            voteType: v.voteType,
                            timestamp: v.timestamp,
                            updatedAt:v.updatedAt
                        }))}
                    />
                )}
                
                {/* 2. BOTTOM Collapse/Expand Button (Inside Collapsible Content) */}
                <div className="mt-0 pb-0 border-b border-gray-200">
                    <ExpandCollapseButton 
                        isCollapsed={isCollapsed} 
                        id={strategy.id} 
                        onToggle={onToggleExpand} 
                    />
                </div>
            </div>
            {/* End of collapsible content */}
        </div>

        {/* 💡 FINAL ACTION BUTTONS (Kept as they offer navigation/editing) */}
        {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
            // Edit Button for DRAFT by Author
            <button 
                onClick={() => onStrategyClick(strategy)}
                className="mt-1 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
            >
                <ArrowRight className='w-4 h-4'/> Edit Draft
            </button>
        ) : (
            // View Details for all others
            <button 
                onClick={() => onStrategyClick(strategy)}
                className="mt-1 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
            >
                View Details
            </button>
        )}
    </div>
    );
}
// 'use client';

// import React, { useMemo } from 'react'; // Import useMemo for performance
// import { SafeUser } from '@/app/types';
// import RBMBreakdown from './RBMBreakdown';
// import VotingSection from './VotingSection';
// import Link from 'next/link'; 
// import { ArrowRight, Flag, Zap, Link2, User, ChevronDown, ChevronUp } from 'lucide-react'; 
// import { toast, Toaster } from 'sonner';
// import { StrategyWithRBMFull } from './StrategyForm'; 
// import { Hint } from '@/app/components/hint';

// /**
//  * Utility function to highlight all occurrences of a search query in a text string.
//  * It returns an array of JSX elements, alternating between plain text and highlighted spans.
//  * This is the safest way to render rich text in React without using dangerouslySetInnerHTML.
//  *
//  * @param {string} text The full text content.
//  * @param {string} query The search string to highlight.
//  * @returns {Array<React.ReactNode>} Array of text strings and <span> elements.
//  */
// const highlightText = (text: string, query: string) => {
//     // Basic guard: If no valid query is present or text is empty, return the text as is.
//     if (!text || !query || query.trim().length < 2) {
//         return text;
//     }

//     const effectiveQuery = query.trim();
//     const parts: React.ReactNode[] = [];
//     let lastIndex = 0;
    
//     // Create a global, case-insensitive RegExp
//     const regex = new RegExp(effectiveQuery, 'gi');
//     let match;

//     while ((match = regex.exec(text)) !== null) {
//         // 1. Add text segment before the current match
//         const precedingText = text.substring(lastIndex, match.index);
//         if (precedingText) {
//             parts.push(precedingText);
//         }

//         // 2. Add the highlighted match segment
//         const matchedText = match[0];
//         // Using `p-[1px] -m-[1px]` to ensure highlight background fills the entire text area cleanly.
//         parts.push(
//             <span 
//                 key={`${match.index}-${lastIndex}`} 
//                 className="bg-yellow-300 rounded-sm p-[1px] -m-[1px] inline-block"
//             >
//                 {matchedText}
//             </span>
//         );
        
//         // Update the index for the next segment search
//         lastIndex = match.index + matchedText.length;
//     }

//     // 3. Add any remaining text after the last match
//     const remainingText = text.substring(lastIndex);
//     if (remainingText) {
//         parts.push(remainingText);
//     }
    
//     // React automatically handles rendering the mixed array of strings and elements
//     return parts;
// };


// // [All interface definitions remain unchanged]
// export type StrategyWithUserVotes = StrategyWithRBMFull & {
//     author: { 
//         id: string; 
//         name: string | null; 
//         email: string | null;
//     };
//     individualVotes: { 
//         voterId: string; voteType: 'YES' | 'NO'
//         id: string,
//         email: string,
//         name: string,
//         timestamp: string,
//         updatedAt:string
//     }[];
// };

// export interface StrategyOutput {
//     id: string;
//     title: string;
//     responsible: string;
//     isCompleted: boolean;
// }

// export interface StrategyOutcome {
//     id: string;
//     title: string;
//     kpi: string;
//     outputs: StrategyOutput[];
// }

// export interface StrategyGoal {
//     id: string;
//     title: string;
//     targetYear: number;
//     outcomes: StrategyOutcome[];
// }
// export interface StrategyWithRBM {
//     id: string;
//     title: string;
//     content: string;
//     year: string;
//     status: string;//'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
//     averageStrategicScore: number | null;
//     goals: StrategyGoal[]; // ⬅️ Must be present
//     votes: { YES: number; NO: number };
//     authorId: string;
//     rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
//     averageScore: number | null; // Changed to allow null if scoring is not complete
//     totalVotesYes: number;
//     totalVotesNo: number;
// }
// const ProposalStatus = {
//     DRAFT: 'DRAFT',
//     PENDING_REVIEW: 'PENDING_REVIEW',
//     VOTING_OPEN: 'VOTING_OPEN',
//     APPROVED: 'APPROVED',
//     REJECTED: 'REJECTED',
// } as const; 

// export interface StrategyCardProps {
//     strategy: StrategyWithUserVotes;
//     currentUser: SafeUser | null;
//     onVote: (strategyId: string, type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => Promise<void>; 
//     onCancelVote: (strategyId: string) => Promise<void>;
//     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
//     counter:number;
//     // 💡 Prop to control the expanded state
//     isExpanded: boolean; 
//     // 💡 Prop to handle toggling (updates state in parent)
//     onToggleExpand: (id: string) => void;
//     // 💡 NEW: Prop for search text to be highlighted
//     searchText: string;
// }
// const getStatusColor = (status: string) => {
//     switch (status) {
//         case ProposalStatus.DRAFT: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//         case ProposalStatus.VOTING_OPEN: return 'bg-indigo-100 text-indigo-800 border-indigo-300';
//         case ProposalStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-300';
//         case ProposalStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-300';
//         case ProposalStatus.PENDING_REVIEW:
//         default: return 'bg-gray-100 text-gray-800 border-gray-300';
//     }
// };

// const StatusBadge: React.FC<{ status: string }> = ({ status }) => ( 
//     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
//         {status?.replace('_', ' ')}
//     </span>
// );

// export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter, isExpanded, onToggleExpand, searchText }: StrategyCardProps) {

//     // 💡 NEW: Use useMemo and highlightText for the title and content
//     const highlightedTitle = useMemo(() => 
//         highlightText(strategy.title, searchText), 
//     [strategy.title, searchText]);

//     const highlightedContent = useMemo(() => 
//         highlightText(strategy.content, searchText), 
//     [strategy.content, searchText]);

//    const authDesp= strategy.author.name || strategy.author.email || 'N/A'
//     const highlightedAuthorName = useMemo(() => 
//         highlightText(authDesp, searchText), 
//     [authDesp, searchText]);

     


//     // 💡 UPDATED: Use the prop instead of local state
//     const isCollapsed = !isExpanded;

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
//     
//     // --- DETERMINE AUTHOR & ADMIN STATUS ---
//     const allowedRoles = [ 'admin', 'executive'];
//     const isAdmin:boolean = currentUser?.roles?.some(role => 
//         allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
//     ) || false;

//     // Check if the current user is the author
//     const isAuthor = currentUser?.id === strategy.author.id; 
//     
//     // --- CONDITIONAL CARD STYLING ---
//     const authorCardStyle = isAuthor 
//         ? "bg-white border-yellow-500 shadow-xl ring-2 ring-yellow-300" 
//         : "bg-white border-gray-100 shadow-xl";

//     // 1. DETERMINE CURRENT USER'S VOTE
//     let userCurrentVote: 'YES' | 'NO' | null = null;

//     if (currentUser) {
//         const userVoteRecord = strategy?.individualVotes?.find(
//             (vote) => vote.id === currentUser.id || vote.voterId === currentUser.id 
//         );

//         if (userVoteRecord) {
//             userCurrentVote = userVoteRecord.voteType;
//         }
//     }
//     // END OF VOTE DETERMINATION

//     // Vote percentage calculation
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
//         : 0;
//     
//     // Function to handle copying the strategy URL (unchanged)
//     const handleCopyLink = () => {
//         const link = `${window.location.origin}/strategies/${strategy.id}`;
//         const dummyElement = document.createElement('input');
//         dummyElement.value = link;
//         document.body.appendChild(dummyElement);
//         dummyElement.select();
//         
//         try {
//             if (navigator.clipboard && navigator.clipboard.writeText) {
//                 navigator.clipboard.writeText(link);
//             } else {
//                 document.execCommand('copy'); 
//             }
//             toast.success("Share link copied to clipboard!", { description: link });
//         } catch (err) {
//             toast.error("Failed to copy the link. Please copy it manually.");
//             console.error("Copy failed:", err);
//         }
//         
//         document.body.removeChild(dummyElement);
//     };

//     // Helper component for the collapse/expand button
//     const ExpandCollapseButton: React.FC<{ isCollapsed: boolean, id: string, onToggle: (id: string) => void }> = ({ isCollapsed, id, onToggle }) => (
//         <button
//             onClick={() => onToggle(id)}
//             className="w-full py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-xs border border-gray-200"
//         >
//             {isCollapsed ? (
//                 <>
//                     <ChevronDown className='w-4 h-4'/> Expand Details
//                 </>
//             ) : (
//                 <>
//                     <ChevronUp className='w-4 h-4'/> Collapse Details
//                 </>
//             )}
//         </button>
//     );

//  
//   return (<div className={`rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 p-1 sm:p-4 flex flex-col justify-between ${authorCardStyle}`}>
//             <Toaster position="top-right" richColors />
//             <div className='gap-0'> 
//                <div className="flex justify-between items-center text-sm mb-1 pb-1 border-b border-indigo-200">
//                      <span className="flex items-center gap-2 font-semibold text-gray-700">
//                          <User className="w-4 h-4 text-indigo-500" />
//                          <Hint sideOffset={2} description={strategy.author?.email||" No email provided"}>Author: {highlightedAuthorName}</Hint>
//                      </span>
//                      {isAuthor && (
//                          <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-md">
//                              YOUR PROPOSAL
//                          </span>
//                      )}
//                  </div>
//                 {/* --- END AUTHOR DETAIL SECTION --- */}
//                <div className="flex justify-between items-start mb-1">
//                       <StatusBadge status={strategy.status} />
//                       <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
//                           Target: {strategy.year}
//                       </span>
//                 </div>                
//                 <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
//                       onClick={() => onStrategyClick(strategy)}
//                   > {counter+1}. {highlightedTitle} </h3>
//                 {/* 💡 Collapse Summary and TOP Toggle Button */}
//                 <div className='flex justify-between items-center text-sm text-gray-500 mt-1 mb-1'>
//                      {isCollapsed ? (
//                          <>
//                              {/* Summary of key collapsed info */}
//                              <span className='flex items-center gap-1 font-medium'>
//                                  <Flag className="w-4 h-4 text-indigo-500" />
//                                  Goals: {strategy?.goals?.length}
//                              </span>
//                              {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
//                                  <span className='font-semibold text-blue-800'>Score: {strategy.averageStrategicScore.toFixed(1)} / 10</span>
//                              )}
//                              {totalVotes > 0 && (
//                                  <span className='font-medium text-green-700'>
//                                      {votePercentage}% YES ({totalVotes} votes)
//                                  </span>
//                              )}
//                          </>
//                      ) : (
//                         //  Placeholder for alignment when expanded
//                          <div />
//                      )}
//                 </div>
//                 <div className="mt-0 pb-0">
//                         <ExpandCollapseButton 
//                             isCollapsed={isCollapsed} 
//                             id={strategy.id} 
//                             onToggle={onToggleExpand} 
//                         />
//                 </div>
//                 <div className={`transition-max-height ease-in-out duration-500 overflow-hidden ${isCollapsed ? 'max-h-0' : ''}`} >
//                     {/* 💡 UPDATED: Render highlighted content */}
//                   <p className="text-sm text-gray-600 mb-1 p-1">{highlightedContent}</p>
//                  
//                 <div className="flex justify-between items-center text-xs text-gray-500 mt-1 border-t pt-1">
//                       <div className='flex items-center gap-2'>
//                           <span className='flex items-center gap-1 font-medium'>
//                               <Zap className="w-4 h-4 text-indigo-500" />
//                               ID: {strategy.id}
//                           </span>
//                           {/* Copy Link Button */}
//                           <button 
//                               onClick={handleCopyLink}
//                               title="Copy Link to Proposal"
//                               className='text-gray-400 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-indigo-50'
//                           >
//                               <Link2 className='w-4 h-4' />
//                           </button>
//                       </div>
                    
//                       <span className='flex items-center gap-1 font-medium'>
//                           <Flag className="w-4 h-4 text-indigo-500" />
//                           Goals: {strategy?.goals?.length}
//                       </span>
//                 </div>
//                     
//                 
//                {/* Expert Score */}
//                  {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
//                      <div className="mt-2 p-1 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
//                          <span className='font-semibold text-blue-800'>Expert Score:</span>
//                          <span className='font-extrabold text-blue-900 text-lg'>{strategy.averageStrategicScore.toFixed(1)} / 10</span>
//                      </div>
//                 )}
//                     
//                     {/* RBM Breakdown */}
//                     <RBMBreakdown goals={strategy.goals} pos={counter} searchText={searchText} /> 


//                     {/* Voting Indicators */}
//                     {totalVotes > 0 && (
//                         <div className="mt-4">
//                             <div className="flex justify-between text-xs font-semibold mb-1">
//                                 <span className="text-green-600">YES ({strategy.totalVotesYes})</span>
//                                 <span className="text-red-600">NO ({strategy.totalVotesNo})</span>
//                             </div>
//                             <div className="w-full bg-gray-200 rounded-full h-2.5">
//                                 <div 
//                                     className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
//                                     style={{ width: `${votePercentage}%` }}
//                                     title={`${votePercentage}% voted YES`}
//                                 ></div>
//                             </div>
//                             <p className='text-xs text-gray-500 mt-1 text-center font-medium'>
//                                 Total Votes: {totalVotes}
//                             </p>
//                         </div>
//                     )}

//                     
//                     {isVotingOpen && currentUser && (
//                         <VotingSection 
//                             strategyId={strategy.id} 
//                             userCurrentVote={userCurrentVote} 
//                             onVote={(type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => onVote(strategy.id, type, action)}
//                             onCancelVote={() => onCancelVote(strategy.id)}
//                             isAdmin={isAdmin}
//                             voterList={strategy.individualVotes.map(v => ({
//                                 id: v.id,
//                                 email: v.email,
//                                 name: v.name,
//                                 voteType: v.voteType,
//                                 timestamp: v.timestamp,
//                                 updatedAt:v.updatedAt
//                             }))}
//                         />
//                     )}
//                     
//                     {/* 2. BOTTOM Collapse/Expand Button (Inside Collapsible Content) */}
//                     <div className="mt-0 pb-0 border-b border-gray-200">
//                         <ExpandCollapseButton 
//                             isCollapsed={isCollapsed} 
//                             id={strategy.id} 
//                             onToggle={onToggleExpand} 
//                         />
//                     </div>
//                 </div>
//                 {/* End of collapsible content */}
//             </div>

//             {/* 💡 FINAL ACTION BUTTONS (Kept as they offer navigation/editing) */}
//             {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
//                 // Edit Button for DRAFT by Author
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-1 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     <ArrowRight className='w-4 h-4'/> Edit Draft
//                 </button>
//             ) : (
//                 // View Details for all others
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-1 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     View Details
//                 </button>
//             )}
//         </div>
//     );

// }