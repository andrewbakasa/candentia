'use client';

import { SafeUser } from '@/app/types';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; 
import { ArrowRight, Flag, Zap, Link2, User } from 'lucide-react'; // Added User icon
import { toast, Toaster } from 'sonner';
import { StrategyWithRBMFull } from './StrategyForm'; 
import { Hint } from '@/app/components/hint';

// Assuming the Strategy fetch includes the Author object
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
// [Other interfaces (StrategyOutput, StrategyOutcome, StrategyGoal, StrategyWithRBM) remain unchanged]

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
    counter:number
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

export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter }: StrategyCardProps) {

    const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
    const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
    
    // --- DETERMINE AUTHOR & ADMIN STATUS ---
    const allowedRoles = [ 'admin', 'executive'];
    const isAdmin:boolean = currentUser?.roles?.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    ) || false;

    // Check if the current user is the author
    const isAuthor = currentUser?.id === strategy.author.id; // Changed to use strategy.author.id
    
    // --- CONDITIONAL CARD STYLING ---
    const authorCardStyle = isAuthor 
        ? "bg-indigo-50 border-indigo-500 shadow-xl ring-2 ring-indigo-300" 
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

    return (
        <div className={`rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 p-1 sm:p-6 flex flex-col justify-between ${authorCardStyle}`}>
            <Toaster position="top-right" richColors />
            <div>
                {/* --- NEW: AUTHOR DETAIL SECTION --- */}
                <div className="flex justify-between items-center text-sm mb-3 pb-2 border-b border-indigo-200">
                    <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <User className="w-4 h-4 text-indigo-500" />
                        <Hint sideOffset={2} description={strategy.author?.email||" No email provided"}>Author: {strategy.author.name || strategy.author.email || 'N/A'}</Hint>
                    </span>
                    {isAuthor && (
                        <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-md">
                            YOUR PROPOSAL
                        </span>
                    )}
                </div>
                {/* --- END AUTHOR DETAIL SECTION --- */}

                <div className="flex justify-between items-start mb-3">
                    <StatusBadge status={strategy.status} />
                    <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                        Target: {strategy.year}
                    </span>
                </div>
                
                <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
                    onClick={() => onStrategyClick(strategy)}
                >
                    {counter+1}. {strategy.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 p-2 line-clamp-4 overflow-y-scroll">{strategy.content}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
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
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
                        <span className='font-semibold text-blue-800'>Expert Score:</span>
                        <span className='font-extrabold text-blue-900 text-lg'>{strategy.averageStrategicScore.toFixed(1)} / 10</span>
                    </div>
                )}
                
                {/* RBM Breakdown */}
                <RBMBreakdown goals={strategy.goals} pos={counter} /> 


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
            </div>

            
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

            {/* Action Buttons (unchanged) */}
            {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
                // Edit Button for DRAFT by Author
                <button 
                    onClick={() => onStrategyClick(strategy)}
                    className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
                >
                    <ArrowRight className='w-4 h-4'/> Edit Draft
                </button>
            ) : (
                // View Details for all others
                <button 
                    onClick={() => onStrategyClick(strategy)}
                    className="mt-6 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
                >
                    View Details
                </button>
            )}
        </div>
    );
}
// 'use client';

// import { SafeUser } from '@/app/types';
// import RBMBreakdown from './RBMBreakdown';
// import VotingSection from './VotingSection';
// import Link from 'next/link'; 
// import { ArrowRight, Flag, Zap, Link2 } from 'lucide-react'; 
// import { toast, Toaster } from 'sonner';
// import { StrategyWithRBMFull } from './StrategyForm'; 

// export type StrategyWithUserVotes = StrategyWithRBMFull & {
//    individualVotes: { 
    
//     voterId: string; voteType: 'YES' | 'NO'
//     id: string,
//     email: string,
//     name: string,
//     timestamp: string,
//     updatedAt:string

//   }[];
//  };
// export interface StrategyOutput {
//     id: string;
//     title: string;
//     responsible: string;
//     isCompleted: boolean;
// }

// export interface StrategyOutcome {
//     id: string;
//     title: string;
//     kpi: string;
//     outputs: StrategyOutput[];
// }

// export interface StrategyGoal {
//     id: string;
//     title: string;
//     targetYear: number;
//     outcomes: StrategyOutcome[];
// }
// export interface StrategyWithRBM {
//     id: string;
//     title: string;
//     content: string;
//     year: string;
//     status: string;//'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
//     averageStrategicScore: number | null;
//     goals: StrategyGoal[]; // ⬅️ Must be present
//     votes: { YES: number; NO: number };
//     authorId: string;
//     rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
//     averageScore: number | null; // Changed to allow null if scoring is not complete
//     totalVotesYes: number;
//     totalVotesNo: number;
// }
// const ProposalStatus = {
//     DRAFT: 'DRAFT',
//     PENDING_REVIEW: 'PENDING_REVIEW',
//     VOTING_OPEN: 'VOTING_OPEN',
//     APPROVED: 'APPROVED',
//     REJECTED: 'REJECTED',
// } as const; 


// // 1. UPDATE INTERFACE: Add onCancelVote
// // export interface StrategyCardProps {
// //     strategy: StrategyWithUserVotes;
// //     currentUser: SafeUser | null;
// //     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
// //     // NEW PROP: Handler for deleting a vote
// //     onCancelVote: (strategyId: string) => Promise<void>;
// //     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
// //     counter:number
// // }

// export interface StrategyCardProps {
//     strategy: StrategyWithUserVotes;
//     currentUser: SafeUser | null;
//     // CORRECTION: Add 'action' parameter here.
//     onVote: (strategyId: string, type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => Promise<void>; 
//     // Handler for deleting a vote
//     onCancelVote: (strategyId: string) => Promise<void>;
//     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
//     counter:number
// }
// const getStatusColor = (status: string) => {
//     // ... (unchanged)
//     switch (status) {
//         case ProposalStatus.DRAFT: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//         case ProposalStatus.VOTING_OPEN: return 'bg-indigo-100 text-indigo-800 border-indigo-300';
//         case ProposalStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-300';
//         case ProposalStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-300';
//         case ProposalStatus.PENDING_REVIEW:
//         default: return 'bg-gray-100 text-gray-800 border-gray-300';
//     }
// };

// const StatusBadge: React.FC<{ status: string }> = ({ status }) => ( 
//     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
//         {status?.replace('_', ' ')}
//     </span>
// );

// // 2. UPDATE COMPONENT: Destructure and use onCancelVote, and determine Admin status
// export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter }: StrategyCardProps) {

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
    
//     // --- NEW: ADMIN ROLE DETERMINATION ---
//     // Assuming 'role' is a property on SafeUser, or that any user with a specific flag is an admin.
//     // Based on the Teams Business Model Selection Guidelines, Executive Committee and Shareholders would likely be considered administrators for voting oversight.
//     //const isAdmin = currentUser?.roles === 'ADMIN' || currentUser?.role === 'EXECUTIVE_COMMITTEE' || currentUser?.role === 'SHAREHOLDER'; 
  

//    const allowedRoles = [ 'admin', 'executive'];
//     const isAdmin:boolean = currentUser?.roles.some(role => 
//         allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
//     )|| false;

//     // 1. DETERMINE CURRENT USER'S VOTE
//     let userCurrentVote: 'YES' | 'NO' | null = null;

//     if (currentUser) {
//         // Find the user's vote in the individualVotes array
//         // We use the full individualVotes array (VoterAudit type) here since it contains voterId.
//         const userVoteRecord = strategy?.individualVotes?.find(
//             (vote) => vote.id === currentUser.id || vote.voterId === currentUser.id 
//             // Note: If the backend uses 'voterId' consistently, only 'voterId' is needed. 
//             // If the user object is merged, the key might be 'id'. Using both for robustness.
//         );

//         if (userVoteRecord) {
//             userCurrentVote = userVoteRecord.voteType;
//         }
//     }
//     // END OF VOTE DETERMINATION

//     // Vote percentage calculation (using totalVotesYes for clean access)
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
//         : 0;
    
//     // Check if the current user is the author (unchanged)
//     const isAuthor = currentUser?.id === strategy.authorId; 
    
//     // Function to handle copying the strategy URL (unchanged)
//     const handleCopyLink = () => {
//         // ... (copy link logic remains unchanged) ...
//         const link = `${window.location.origin}/strategies/${strategy.id}`;
        
//         // Use a temporary input field for document.execCommand('copy') compatibility
//         const dummyElement = document.createElement('input');
//         dummyElement.value = link;
//         document.body.appendChild(dummyElement);
//         dummyElement.select();
        
//         try {
//             // Use modern navigator.clipboard API if available, otherwise fallback
//             if (navigator.clipboard && navigator.clipboard.writeText) {
//                 navigator.clipboard.writeText(link);
//             } else {
//                 document.execCommand('copy'); 
//             }
//             toast.success("Share link copied to clipboard!", { description: link });
//         } catch (err) {
//             toast.error("Failed to copy the link. Please copy it manually.");
//             console.error("Copy failed:", err);
//         }
        
//         document.body.removeChild(dummyElement);
//     };

//     return (
//         <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-1 sm:p-6 flex flex-col justify-between">
//             <Toaster position="top-right" richColors />
//             <div>
//                 {/* ... (rest of the card content - UNCHANGED) ... */}
//                 <div className="flex justify-between items-start mb-3">
//                     <StatusBadge status={strategy.status} />
//                     <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
//                         Target: {strategy.year}
//                     </span>
//                 </div>
                
//                 <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
//                     onClick={() => onStrategyClick(strategy)}
//                 >
//                     {counter+1}. {strategy.title}
//                 </h3>
                
//                 <p className="text-sm text-gray-600 mb-4 p-2 line-clamp-4 overflow-y-scroll">{strategy.content}</p>
                
//                 <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
//                     <div className='flex items-center gap-2'>
//                         <span className='flex items-center gap-1 font-medium'>
//                             <Zap className="w-4 h-4 text-indigo-500" />
//                             ID: {strategy.id}
//                         </span>
//                         {/* Copy Link Button */}
//                         <button 
//                             onClick={handleCopyLink}
//                             title="Copy Link to Proposal"
//                             className='text-gray-400 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-indigo-50'
//                         >
//                             <Link2 className='w-4 h-4' />
//                         </button>
//                     </div>
                    
//                     <span className='flex items-center gap-1 font-medium'>
//                         <Flag className="w-4 h-4 text-indigo-500" />
//                         Goals: {strategy?.goals?.length}
//                     </span>
//                 </div>
                
//                 {/* Expert Score */}
//                 {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
//                     <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
//                         <span className='font-semibold text-blue-800'>Expert Score:</span>
//                         <span className='font-extrabold text-blue-900 text-lg'>{strategy.averageStrategicScore.toFixed(1)} / 10</span>
//                     </div>
//                 )}
                
//                 {/* RBM Breakdown */}
//                 <RBMBreakdown goals={strategy.goals} pos={counter} /> 


//                 {/* Voting Indicators */}
//                 {totalVotes > 0 && (
//                     <div className="mt-4">
//                         <div className="flex justify-between text-xs font-semibold mb-1">
//                             <span className="text-green-600">YES ({strategy.totalVotesYes})</span>
//                             <span className="text-red-600">NO ({strategy.totalVotesNo})</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2.5">
//                             <div 
//                                 className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
//                                 style={{ width: `${votePercentage}%` }}
//                                 title={`${votePercentage}% voted YES`}
//                             ></div>
//                         </div>
//                         <p className='text-xs text-gray-500 mt-1 text-center font-medium'>
//                             Total Votes: {totalVotes}
//                         </p>
//                     </div>
//                 )}
//             </div>

            
//             {isVotingOpen && currentUser && (
//                 <VotingSection 
//                     strategyId={strategy.id} 
//                     userCurrentVote={userCurrentVote} 
//                     // Pass the onVote handler, bound to this strategy's ID
//                    // CORRECTION: Accept 'action' from VotingSection and pass it to the parent onVote handler
//                     onVote={(type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => onVote(strategy.id, type, action)}
//                     
//                     // Pass the new onCancelVote handler, bound to this strategy's ID
//                     onCancelVote={() => onCancelVote(strategy.id)}
//                     // --- NEW PROPS FOR ADMIN VIEW ---
//                     isAdmin={isAdmin}
//                     voterList={strategy.individualVotes.map(v => ({
//                         id: v.id,
//                         email: v.email,
//                         name: v.name,
//                         voteType: v.voteType,
//                         timestamp: v.timestamp,
//                         updatedAt:v.updatedAt
//                     }))}
//                     // --- END NEW PROPS ---
//                 />
//             )}

//             {/* Action Buttons (unchanged) */}
//             {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
//                 // Edit Button for DRAFT by Author
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     <ArrowRight className='w-4 h-4'/> Edit Draft
//                 </button>
//             ) : (
//                 // View Details for all others
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     View Details
//                 </button>
//             )}
//         </div>
//     );
// }