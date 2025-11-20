'use client';

import { SafeUser } from '@/app/types';
//import { StrategyWithRBM } from '../types/strategy';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; 
import { ArrowRight, Flag, Zap } from 'lucide-react';
import { Toaster } from 'sonner';

// --- 3. StrategyCard COMPONENT (Your requested component) ---
export interface StrategyWithRBM {
    id: string;
    title: string;
    content: string;
    year: number|string;
    status: string;//'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
    score: number | null;
    goals: any[];
    votes: { YES: number; NO: number };
    authorId: string;
    rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
      averageScore: number | null; // Changed to allow null if scoring is not complete
}
const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const; // Use 'as const' for strong literal typing

interface StrategyCardProps {
    strategy: StrategyWithRBM;
    currentUser: SafeUser | null;
    onVote: (strategyId: string, type: 'YES' | 'NO') => void; 
    onStrategyClick: (strategy: StrategyWithRBM) => void;
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
        {status.replace('_', ' ')}
    </span>
);

export default function StrategyCard({ strategy, currentUser, onVote, onStrategyClick }: StrategyCardProps) {

    const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
    const totalVotes = strategy?.votes?.YES + strategy?.votes?.NO;
    const votePercentage = totalVotes > 0 
        ? Math.round((strategy?.votes?.YES / totalVotes) * 100)
        : 0;
    
    // Check if the current user is the author
    const isAuthor = currentUser?.id === strategy.authorId; 
    
    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-6 flex flex-col justify-between">
            <Toaster position="top-right" richColors />
            <div>
                <div className="flex justify-between items-start mb-3">
                    <StatusBadge status={strategy.status} />
                    <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                        Target: {strategy.year}
                    </span>
                </div>
                
                <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
                    onClick={() => onStrategyClick(strategy)}
                >
                    {strategy.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{strategy.content}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
                    <span className='flex items-center gap-1 font-medium'>
                        <Zap className="w-4 h-4 text-indigo-500" />
                        ID: {strategy.id}
                    </span>
                    <span className='flex items-center gap-1 font-medium'>
                        <Flag className="w-4 h-4 text-indigo-500" />
                        Goals: {strategy.goals.length}
                    </span>
                </div>
                
                {/* Expert Score */}
                {strategy.score !== null && strategy.score !== undefined && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
                        <span className='font-semibold text-blue-800'>Expert Score:</span>
                        <span className='font-extrabold text-blue-900 text-lg'>{strategy?.score.toFixed(1)} / 10</span>
                    </div>
                )}
                
                {/* RBM Breakdown - Correction Applied Here */}
                {/* We pass the goals array which contains the full RBM results chain structure */}
                <RBMBreakdown goals={strategy.goals} />

                {/* Voting Indicators */}
                {totalVotes > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-green-600">YES ({strategy?.votes?.YES})</span>
                            <span className="text-red-600">NO ({strategy?.votes?.NO})</span>
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

            {/* Voting Section (only if VOTING_OPEN) */}
            {isVotingOpen && (
                <VotingSection 
                    strategyId={strategy.id} 
                    onVote={async (type) => onVote(strategy.id, type as 'YES' | 'NO')}
                />
            )}

            {/* Action Buttons */}
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
// interface StrategyCardProps {
//     strategy: StrategyWithRBM;
//     currentUser: SafeUser | null;
//     // FIX 1: Corrected onVote type to be a function, not void.
//     onVote: (strategyId: string, type: 'YES' | 'NO') => void; 
//     // FIX 2: Corrected onStrategyClick argument type from 'any' to 'StrategyWithRBM' for safety.
//     onStrategyClick: (strategy: StrategyWithRBM) => void;
// }

// const getStatusColor = (status: string) => {
//     switch (status) {
//         case ProposalStatus.DRAFT: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//         case ProposalStatus.VOTING_OPEN: return 'bg-indigo-100 text-indigo-800 border-indigo-300';
//         case ProposalStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-300';
//         case ProposalStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-300';
//         case ProposalStatus.PENDING_REVIEW:
//         default: return 'bg-gray-100 text-gray-800 border-gray-300';
//     }
// };

// // FIX 3: Explicitly typed the status prop for the nested functional component
// const StatusBadge: React.FC<{ status: string }> = ({ status }) => ( 
//     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
//         {status.replace('_', ' ')}
//     </span>
// );

// // FIX 4: Destructured all required props from StrategyCardProps
// export default function StrategyCard({ strategy, currentUser, onVote, onStrategyClick }: StrategyCardProps) {

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.votes.YES + strategy.votes.NO;
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy.votes.YES / totalVotes) * 100)
//         : 0;
    
//     // Check if the current user is the author
//     const isAuthor = currentUser?.id === strategy.authorId; 
    
//     return (
//         <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-6 flex flex-col justify-between">
//             <div>
//                 <div className="flex justify-between items-start mb-3">
//                     <StatusBadge status={strategy.status} />
//                     <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
//                         Target: {strategy.year}
//                     </span>
//                 </div>
                
//                 <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
//                     onClick={() => onStrategyClick(strategy)}
//                 >
//                     {strategy.title}
//                 </h3>
                
//                 <p className="text-sm text-gray-600 mb-4 line-clamp-3">{strategy.content}</p>
                
//                 <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
//                     <span className='flex items-center gap-1 font-medium'>
//                         <Zap className="w-4 h-4 text-indigo-500" />
//                         ID: {strategy.id}
//                     </span>
//                     <span className='flex items-center gap-1 font-medium'>
//                         <Flag className="w-4 h-4 text-indigo-500" />
//                         Goals: {strategy.goals.length}
//                     </span>
//                 </div>
                
//                 {/* Expert Score */}
//                 {strategy.score !== null && (
//                     <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
//                         <span className='font-semibold text-blue-800'>Expert Score:</span>
//                         <span className='font-extrabold text-blue-900 text-lg'>{strategy.score.toFixed(1)} / 10</span>
//                     </div>
//                 )}
                
//                 {/* RBM Breakdown */}
//                 <RBMBreakdown goals={strategy.rbm} />

//                 {/* Voting Indicators */}
//                 {totalVotes > 0 && (
//                     <div className="mt-4">
//                         <div className="flex justify-between text-xs font-semibold mb-1">
//                             <span className="text-green-600">YES ({strategy.votes.YES})</span>
//                             <span className="text-red-600">NO ({strategy.votes.NO})</span>
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

//             {/* Voting Section (only if VOTING_OPEN) */}
//             {isVotingOpen && (
//                 <VotingSection 
//                     strategyId={strategy.id} 
//                     onVote={async (type) => onVote(strategy.id, type as 'YES' | 'NO')}
//                 />
//             )}

//             {/* Edit Button for DRAFT */}
//             {strategy.status === ProposalStatus.DRAFT && isAuthor && (
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     <ArrowRight className='w-4 h-4'/> Edit Draft
//                 </button>
//             )}

//             {/* View Details for other statuses */}
//             {(strategy.status !== ProposalStatus.DRAFT || !isAuthor) && !isVotingOpen && (
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
// export default function StrategyCard({ strategy,currentUser }: StrategyCardProps) {

//     // Logic to determine if the Edit button should be visible
//     const isAuthor = currentUser && strategy.authorId === currentUser.id;
//     const isDraft = strategy.status === 'DRAFT'; 
//     const canEdit = isAuthor && isDraft;

//     const handleVote = async (voteType: 'YES' | 'NO') => {
//         try {
//             const response = await fetch(`/api/strategies/${strategy.id}/vote`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     voterId: currentUser?.id,
//                     voteType: voteType,
//                 }),
//             });

//             if (response.status === 409) {
//                 throw new Error("You have already cast a vote for this proposal. 🛑");
//             }
//             
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to submit vote due to a server error.');
//             }

//             // FIX: Replace alert() with non-blocking message
//             displayNonBlockingMessage(`Vote ${voteType} successfully recorded! ✅`);
//         } catch (error) {
//             // FIX: Replace alert() with non-blocking message
//             displayNonBlockingMessage(`Error submitting vote: ${error instanceof Error ? error.message : 'An unknown error occurred'}`, true);
//         }
//     };

//   return (
//     <div className="bg-white shadow-xl rounded-lg p-6 border-t-4 border-indigo-500">
//       <h2 className="text-2xl font-semibold mb-2">{strategy.title}</h2>
//       <p className="text-sm text-gray-500 mb-4">
//         Submitted by **{strategy.author.name || 'N/A'}** on {new Date(strategy.submissionDate).toLocaleDateString()}
//       </p>
//       <div className="flex justify-between items-center text-sm mb-4">
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//           strategy.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
//         }`}>
//           Status: **{strategy.status}**
//         </span>
//         <span className="text-gray-700">
//           Current Votes: **{strategy.totalVotesYes} YES / {strategy.totalVotesNo} NO**
//         </span>
//       </div>
//       
//       <p className="text-gray-800 mt-4">{strategy.content.substring(0, 200)}...</p>

//       {/* RBM Hierarchy Breakdown */}
//       <RBMBreakdown goals={strategy.goals} />

//       {/* ✏️ EDIT BUTTON (New Feature) */}
//       {canEdit && (
//           <Link
//               href={`/strategies/${strategy.id}/edit`}
//               className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition duration-150 shadow-sm"
//           >
//               ✏️ Edit Strategy Proposal
//           </Link>
//       )}

//       {/* Voting Section (Only visible if status is VOTING_OPEN) */}
//       {strategy.status === 'VOTING_OPEN' && (
//         <VotingSection strategyId={strategy.id} onVote={handleVote} />
//       )}
//     </div>
//   );
// }
