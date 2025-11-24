'use client';

import { SafeUser } from '@/app/types';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; 
import { ArrowRight, Flag, Zap, Link2 } from 'lucide-react'; 
import { toast, Toaster } from 'sonner';
import { StrategyWithRBMFull } from './StrategyForm'; 

// --- TYPE DEFINITIONS ---
// Define a Voter structure that includes the email/name for the Admin view
interface VoterAudit {
    id: string; // The voter's ID
    email: string; // The voter's email (required for admin view)
    name: string | null; // The voter's name (optional but good for display)
    voteType: 'YES' | 'NO';
}

// UPDATE: StrategyWithUserVotes must now include the email/name details for auditing.
// export type StrategyWithUserVotes = StrategyWithRBMFull & {
//     // This array should now contain rich user data (name/email) fetched from the backend, 
//     // accessible only to the parent component and then passed to VotingSection conditionally.
//     individualVotes: VoterAudit[]; 
// };

export type StrategyWithUserVotes = StrategyWithRBMFull & {
   individualVotes: { 
    
    voterId: string; voteType: 'YES' | 'NO'
    id: string,
    email: string,
    name: string,

  }[];
 };
// ... (Your other type definitions StrategyOutput, StrategyOutcome, StrategyGoal, StrategyWithRBM remain unchanged)

// ... (StrategyOutput, StrategyOutcome, StrategyGoal, StrategyWithRBM, ProposalStatus remain unchanged) ...

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


// 1. UPDATE INTERFACE: Add onCancelVote
export interface StrategyCardProps {
    strategy: StrategyWithUserVotes;
    currentUser: SafeUser | null;
    onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
    // NEW PROP: Handler for deleting a vote
    onCancelVote: (strategyId: string) => Promise<void>;
    onStrategyClick: (strategy: StrategyWithUserVotes) => void;
    counter:number
}
const getStatusColor = (status: string) => {
    // ... (unchanged)
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

// 2. UPDATE COMPONENT: Destructure and use onCancelVote, and determine Admin status
export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter }: StrategyCardProps) {

    const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
    const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
    
    // --- NEW: ADMIN ROLE DETERMINATION ---
    // Assuming 'role' is a property on SafeUser, or that any user with a specific flag is an admin.
    // Based on the Teams Business Model Selection Guidelines, Executive Committee and Shareholders would likely be considered administrators for voting oversight.
    //const isAdmin = currentUser?.roles === 'ADMIN' || currentUser?.role === 'EXECUTIVE_COMMITTEE' || currentUser?.role === 'SHAREHOLDER'; 
  

   const allowedRoles = [ 'admin', 'executive'];
    const isAdmin:boolean = currentUser?.roles.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    )|| false;

    // 1. DETERMINE CURRENT USER'S VOTE
    let userCurrentVote: 'YES' | 'NO' | null = null;

    if (currentUser) {
        // Find the user's vote in the individualVotes array
        // We use the full individualVotes array (VoterAudit type) here since it contains voterId.
        const userVoteRecord = strategy?.individualVotes?.find(
            (vote) => vote.id === currentUser.id || vote.voterId === currentUser.id 
            // Note: If the backend uses 'voterId' consistently, only 'voterId' is needed. 
            // If the user object is merged, the key might be 'id'. Using both for robustness.
        );

        if (userVoteRecord) {
            userCurrentVote = userVoteRecord.voteType;
        }
    }
    // END OF VOTE DETERMINATION

    // Vote percentage calculation (using totalVotesYes for clean access)
    const votePercentage = totalVotes > 0 
        ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
        : 0;
    
    // Check if the current user is the author (unchanged)
    const isAuthor = currentUser?.id === strategy.authorId; 
    
    // Function to handle copying the strategy URL (unchanged)
    const handleCopyLink = () => {
        // ... (copy link logic remains unchanged) ...
        const link = `${window.location.origin}/strategies/${strategy.id}`;
        
        // Use a temporary input field for document.execCommand('copy') compatibility
        const dummyElement = document.createElement('input');
        dummyElement.value = link;
        document.body.appendChild(dummyElement);
        dummyElement.select();
        
        try {
            // Use modern navigator.clipboard API if available, otherwise fallback
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-1 sm:p-6 flex flex-col justify-between">
            <Toaster position="top-right" richColors />
            <div>
                {/* ... (rest of the card content - UNCHANGED) ... */}
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
                    // Pass the onVote handler, bound to this strategy's ID
                    onVote={(type: 'YES' | 'NO') => onVote(strategy.id, type)}
                    // Pass the new onCancelVote handler, bound to this strategy's ID
                    onCancelVote={() => onCancelVote(strategy.id)}
                    
                    // --- NEW PROPS FOR ADMIN VIEW ---
                    isAdmin={isAdmin}
                    voterList={strategy.individualVotes.map(v => ({
                        id: v.id,
                        email: v.email,
                        name: v.name,
                        voteType: v.voteType,
                    }))}
                    // --- END NEW PROPS ---
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

// // --- TYPE DEFINITIONS ---
// // Assuming StrategyWithRBMFull now includes the individualVotes array
// export type StrategyWithUserVotes = StrategyWithRBMFull & {
//     individualVotes: { voterId: string; voteType: 'YES' | 'NO' }[];
// };
// // ... (Your other type definitions StrategyOutput, StrategyOutcome, StrategyGoal, StrategyWithRBM remain unchanged)


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
//     DRAFT: 'DRAFT',
//     PENDING_REVIEW: 'PENDING_REVIEW',
//     VOTING_OPEN: 'VOTING_OPEN',
//     APPROVED: 'APPROVED',
//     REJECTED: 'REJECTED',
// } as const; 

// // 1. UPDATE INTERFACE: Add onCancelVote
// export interface StrategyCardProps {
//     strategy: StrategyWithUserVotes;
//     currentUser: SafeUser | null;
//     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
//     // NEW PROP: Handler for deleting a vote
//     onCancelVote: (strategyId: string) => Promise<void>;
//     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
//     counter:number
// }
// const getStatusColor = (status: string) => {
//     // ... (unchanged)
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

// // 2. UPDATE COMPONENT: Destructure and use onCancelVote
// export default function StrategyCard({ strategy, currentUser, onVote, onCancelVote, onStrategyClick, counter }: StrategyCardProps) {

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
//     
//     // 1. DETERMINE CURRENT USER'S VOTE
//     let userCurrentVote: 'YES' | 'NO' | null = null;

//     if (currentUser) {
//         // Find the user's vote in the individualVotes array
//         const userVoteRecord = strategy?.individualVotes?.find(
//             (vote) => vote.voterId === currentUser.id
//         );

//         if (userVoteRecord) {
//             userCurrentVote = userVoteRecord.voteType;
//         }
//     }
//     // END OF VOTE DETERMINATION

//     // Vote percentage calculation (using totalVotesYes for clean access)
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
//         : 0;
//     
//     // Check if the current user is the author (unchanged)
//     const isAuthor = currentUser?.id === strategy.authorId; 
//     
//     // Function to handle copying the strategy URL (unchanged)
//     const handleCopyLink = () => {
//         // ... (copy link logic remains unchanged) ...
//         const link = `${window.location.origin}/strategies/${strategy.id}`;
//         
//         // Use a temporary input field for document.execCommand('copy') compatibility
//         const dummyElement = document.createElement('input');
//         dummyElement.value = link;
//         document.body.appendChild(dummyElement);
//         dummyElement.select();
//         
//         try {
//             // Use modern navigator.clipboard API if available, otherwise fallback
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

//     return (
//         <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-1 sm:p-6 flex flex-col justify-between">
//              <Toaster position="top-right" richColors />
//              <div>
//                  {/* ... (rest of the card content - UNCHANGED) ... */}
//                  <div className="flex justify-between items-start mb-3">
//                      <StatusBadge status={strategy.status} />
//                      <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
//                          Target: {strategy.year}
//                      </span>
//                  </div>
                
//                  <h3 className="text-2xl font-extrabold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
//                      onClick={() => onStrategyClick(strategy)}
//                  >
//                      {counter+1}. {strategy.title}
//                  </h3>
                
//                  <p className="text-sm text-gray-600 mb-4 p-2 line-clamp-4 overflow-y-scroll">{strategy.content}</p>
                
//                  <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
//                      <div className='flex items-center gap-2'>
//                          <span className='flex items-center gap-1 font-medium'>
//                              <Zap className="w-4 h-4 text-indigo-500" />
//                              ID: {strategy.id}
//                          </span>
//                          {/* Copy Link Button */}
//                          <button 
//                              onClick={handleCopyLink}
//                              title="Copy Link to Proposal"
//                              className='text-gray-400 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-indigo-50'
//                          >
//                              <Link2 className='w-4 h-4' />
//                          </button>
//                      </div>
                    
//                      <span className='flex items-center gap-1 font-medium'>
//                          <Flag className="w-4 h-4 text-indigo-500" />
//                          Goals: {strategy?.goals?.length}
//                      </span>
//                  </div>
                
//                  {/* Expert Score */}
//                  {strategy.averageStrategicScore !== null && strategy.averageStrategicScore !== undefined && (
//                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-sm">
//                          <span className='font-semibold text-blue-800'>Expert Score:</span>
//                          <span className='font-extrabold text-blue-900 text-lg'>{strategy.averageStrategicScore.toFixed(1)} / 10</span>
//                      </div>
//                  )}
                
//                  {/* RBM Breakdown */}
//                  <RBMBreakdown goals={strategy.goals} pos={counter} /> 


//                 {/* Voting Indicators */}
//                 {totalVotes > 0 && (
//                     <div className="mt-4">
//                         <div className="flex justify-between text-xs font-semibold mb-1">
//                             <span className="text-green-600">YES ({strategy.totalVotesYes})</span>
//                             <span className="text-red-600">NO ({strategy.totalVotesNo})</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2.5">
//                             <div 
//                                 className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
//                                 style={{ width: `${votePercentage}%` }}
//                                 title={`${votePercentage}% voted YES`}
//                             ></div>
//                         </div>
//                         <p className='text-xs text-gray-500 mt-1 text-center font-medium'>
//                             Total Votes: {totalVotes}
//                         </p>
//                     </div>
//                 )}
//             </div>

//             
//             {isVotingOpen && currentUser && (
//                 // 2. PASS THE NEW HANDLER DOWN TO VOTING SECTION
//                 <VotingSection 
//                     strategyId={strategy.id} 
//                     userCurrentVote={userCurrentVote} 
//                     // Pass the onVote handler, bound to this strategy's ID
//                     onVote={(type: 'YES' | 'NO') => onVote(strategy.id, type)}
//                     // Pass the new onCancelVote handler, bound to this strategy's ID
//                     onCancelVote={() => onCancelVote(strategy.id)}
//                 />
//             )}

//             {/* Action Buttons (unchanged) */}
//             {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
//                 // Edit Button for DRAFT by Author
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     <ArrowRight className='w-4 h-4'/> Edit Draft
//                 </button>
//             ) : (
//                 // View Details for all others
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     View Details
//                 </button>
//             )}
//         </div>
//     );
// }
// 'use client';

// import { SafeUser } from '@/app/types';
// import RBMBreakdown from './RBMBreakdown';
// import VotingSection from './VotingSection';
// import Link from 'next/link'; 
// import { ArrowRight, Flag, Zap, Link2 } from 'lucide-react'; 
// import { toast, Toaster } from 'sonner';
// import { StrategyWithRBMFull } from './StrategyForm'; // Ensure this type includes individualVotes

// // Assuming StrategyWithRBMFull now includes the individualVotes array
// // For type safety, I'll redefine the relevant fields here:
// export type StrategyWithUserVotes = StrategyWithRBMFull & {
//     individualVotes: { voterId: string; voteType: 'YES' | 'NO' }[];
// };
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
//     DRAFT: 'DRAFT',
//     PENDING_REVIEW: 'PENDING_REVIEW',
//     VOTING_OPEN: 'VOTING_OPEN',
//     APPROVED: 'APPROVED',
//     REJECTED: 'REJECTED',
// } as const; 

// // interface StrategyCardProps {
// //     // Cast type to ensure individualVotes is present
// //     strategy: StrategyWithUserVotes; 
// //     currentUser: SafeUser | null;
// //     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
// //     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
// //     counter:number
// // }

// interface StrategyCardProps {
//     strategy: StrategyWithUserVotes;//StrategyWithRBMFull;
//     currentUser: SafeUser | null;
//     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
//     onStrategyClick: (strategy: StrategyWithUserVotes) => void;
//     counter:number
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
//     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
//         {status?.replace('_', ' ')}
//     </span>
// );

// export default function StrategyCard({ strategy, currentUser, onVote, onStrategyClick, counter }: StrategyCardProps) {

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.totalVotesNo + strategy.totalVotesYes;
//     
//     // 1. DETERMINE CURRENT USER'S VOTE
//     let userCurrentVote: 'YES' | 'NO' | null = null;
//     console.log("strategy?", strategy)
//     if (currentUser) {
//         // Find the user's vote in the individualVotes array
       
//         console.log("strategy?.individualVotes", strategy?.individualVotes)
//         const userVoteRecord = strategy?.individualVotes?.find(
//             (vote) => vote.voterId === currentUser.id
//         );
//          console.log("currentUser", currentUser)
//          console.log("userVoteRecord", userVoteRecord)

//         if (userVoteRecord) {
//             userCurrentVote = userVoteRecord.voteType;
//         }
//     }
//     // END OF VOTE DETERMINATION

//     // Vote percentage calculation (using totalVotesYes for clean access)
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy.totalVotesYes / totalVotes) * 100)
//         : 0;
//     
//     // Check if the current user is the author
//     const isAuthor = currentUser?.id === strategy.authorId; 
//     
//     // Function to handle copying the strategy URL (unchanged)
//     const handleCopyLink = () => {
//         // Assuming the structure is /strategies/[id]
//         const link = `${window.location.origin}/strategies/${strategy.id}`;
//         
//         // Use a temporary input field for document.execCommand('copy') compatibility
//         const dummyElement = document.createElement('input');
//         dummyElement.value = link;
//         document.body.appendChild(dummyElement);
//         dummyElement.select();
//         
//         try {
//             // Use modern navigator.clipboard API if available, otherwise fallback
//             if (navigator.clipboard && navigator.clipboard.writeText) {
//                 navigator.clipboard.writeText(link);
//             } else {
//                 document.execCommand('copy'); 
//             }
//             toast.success("Share link copied to clipboard!", { description: link });
//         } catch (err) {
//             toast.error("Failed to copy the link. Please copy it manually.");
//             console.error("Copy failed:", err);
//         }
//         
//         document.body.removeChild(dummyElement);
//     };

//     return (
//         <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 p-1 sm:p-6 flex flex-col justify-between">
//             <Toaster position="top-right" richColors />
//             <div>
//                 {/* ... (rest of the card content - UNCHANGED) ... */}
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
//                         Goals: {strategy.goals.length}
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
//             </div>

//             
//             {isVotingOpen && (
//                 // 2. PASS THE CALCULATED VOTE STATUS HERE
//                 <VotingSection 
//                     strategyId={strategy.id} 
//                     userCurrentVote={userCurrentVote} // <-- ADJUSTED
//                     onVote={(type: 'YES' | 'NO') => onVote(strategy.id, type)}
//                 />
//             )}

//             {/* Action Buttons (unchanged) */}
//             {strategy.status === ProposalStatus.DRAFT && isAuthor ? (
//                 // Edit Button for DRAFT by Author
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     <ArrowRight className='w-4 h-4'/> Edit Draft
//                 </button>
//             ) : (
//                 // View Details for all others
//                 <button 
//                     onClick={() => onStrategyClick(strategy)}
//                     className="mt-6 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 text-sm"
//                 >
//                     View Details
//                 </button>
//             )}
//         </div>
//     );
// }
// 'use client';

// import { SafeUser } from '@/app/types';
// import RBMBreakdown from './RBMBreakdown';
// import VotingSection from './VotingSection';
// import Link from 'next/link'; 
// import { ArrowRight, Flag, Zap, Link2 } from 'lucide-react'; // Added Link2
// import { toast, Toaster } from 'sonner';
// import { StrategyWithRBMFull } from './StrategyForm';

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
// } as const; // Use 'as const' for strong literal typing

// interface StrategyCardProps {
//     strategy: StrategyWithRBMFull;
//     currentUser: SafeUser | null;
//     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
//     onStrategyClick: (strategy: StrategyWithRBMFull) => void;
//     counter:number
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

// const StatusBadge: React.FC<{ status: string }> = ({ status }) => ( 
//     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
//         {status?.replace('_', ' ')}
//     </span>
// );

// export default function StrategyCard({ strategy, currentUser, onVote, onStrategyClick, counter }: StrategyCardProps) {

//     const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
//     const totalVotes = strategy.totalVotesNo + strategy?.totalVotesYes;
//     const votePercentage = totalVotes > 0 
//         ? Math.round((strategy?.votes?.YES / totalVotes) * 100)
//         : 0;
    
//     // Check if the current user is the author
//     const isAuthor = currentUser?.id === strategy.authorId; 
    
//     // Function to handle copying the strategy URL
//     const handleCopyLink = () => {
//         // Assuming the structure is /strategies/[id]
//         const link = `${window.location.origin}/strategies/${strategy.id}`;
        
//         // Use a temporary input field for document.execCommand('copy') compatibility
//         const dummyElement = document.createElement('input');
//         dummyElement.value = link;
//         document.body.appendChild(dummyElement);
//         dummyElement.select();
        
//         try {
//             document.execCommand('copy');
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
//                         <span className='font-extrabold text-blue-900 text-lg'>{strategy?.averageStrategicScore.toFixed(1)} / 10</span>
//                     </div>
//                 )}
                
//                 {/* RBM Breakdown - Correction Applied Here */}
//                 <RBMBreakdown goals={strategy.goals} pos={counter} /> 

//                 {/* Voting Indicators */}
//                 {totalVotes > 0 && (
//                     <div className="mt-4">
//                         <div className="flex justify-between text-xs font-semibold mb-1">
//                             <span className="text-green-600">YES ({strategy?.totalVotesYes})</span>
//                             <span className="text-red-600">NO ({strategy?.totalVotesNo})</span>
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

            
//             {isVotingOpen && (
//                 <VotingSection 
//                     strategyId={strategy.id} 
//                     onVote={(type: 'YES' | 'NO') => onVote(strategy.id, type)}
//                 />
//             )}

//             {/* Action Buttons */}
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