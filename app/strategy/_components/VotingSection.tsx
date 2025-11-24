'use client';

import React, { useState } from 'react';
import { Loader2, ThumbsUp, ThumbsDown, RefreshCw, XCircle } from 'lucide-react';

/**
 * Renders the voting and vote management interface for a strategy.
 */
interface VotingSectionProps {
  strategyId: string;
  // The current user's vote ('YES', 'NO', or null if not voted).
  userCurrentVote: 'YES' | 'NO' | null;
  // Handler for casting a new vote or changing vote (API: POST or PUT)
  onVote: (voteType: 'YES' | 'NO') => Promise<void>;
  // Handler for canceling/deleting the existing vote (API: DELETE)
  onCancelVote: () => Promise<void>; 
}

// --- Helper Component: Confirmation Message ---
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

// --- Helper Component: Confirmed Vote Display (Now includes action buttons) ---
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


export default function VotingSection({ strategyId, onVote, onCancelVote, userCurrentVote }: VotingSectionProps) {
    // Tracks which vote type is currently processing ('YES', 'NO', 'CANCEL', or null)
    const [processingAction, setProcessingAction] = useState<'YES' | 'NO' | 'CANCEL' | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

    const handleActionClick = async (type: 'YES' | 'NO' | 'CANCEL') => {
        if (processingAction) return;

        setProcessingAction(type); 
        setMessage({ text: '', type: null });

        try {
            if (type === 'CANCEL') {
                await onCancelVote();
                setMessage({ text: 'Vote successfully canceled. You can now vote again.', type: 'success' });
            } else {
                // If the user has already voted, this 'YES' or 'NO' action performs the switch (PUT/UPDATE)
                // If the user hasn't voted, this performs the initial vote (POST/CREATE)
                await onVote(type); 
                setMessage({ text: `Vote successfully cast as ${type}.`, type: 'success' });
            }
        } catch (error) {
            console.error('Voting failed:', error);
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
                    vote={userCurrentVote} 
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
        </div>
    );
}
// 'use client';

// import React, { useState } from 'react';
// import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'; // Added ThumbsUp and ThumbsDown icons

// /**
//  * Renders the voting buttons for a strategy.
//  * This component is only rendered if the strategy status is VOTING_OPEN.
//  */
// interface VotingSectionProps {
//   strategyId: string;
//   // NEW PROP: The current user's vote for this strategy ('YES', 'NO', or null if not voted).
//   userCurrentVote: 'YES' | 'NO' | null;
//   // Handler function passed from the parent component (StrategyCard) to manage the API call.
//   onVote: (voteType: 'YES' | 'NO') => Promise<void>;
// }

// // Helper component for displaying the temporary confirmation message with better UI
// const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
//     if (!message) return null;
    
//     // 💡 UI Improvement: Added transition classes
//     const baseClasses = "mt-4 p-4 rounded-xl text-base font-semibold shadow-md opacity-100 transition-opacity duration-500 ease-in-out";
//     const successClasses = "bg-green-50 border border-green-300 text-green-700";
//     const errorClasses = "bg-red-50 border border-red-300 text-red-700";

//     return (
//         <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
//             {message}
//         </div>
//     );
// };

// // NEW: Component to display the user's confirmed vote
// const ConfirmedVoteDisplay = ({ vote }: { vote: 'YES' | 'NO' }) => {
//     const isYes = vote === 'YES';
//     const bgColor = isYes ? 'bg-green-50' : 'bg-red-50';
//     const textColor = isYes ? 'text-green-700' : 'text-red-700';
//     const borderColor = isYes ? 'border-green-300' : 'border-red-300';
//     const Icon = isYes ? ThumbsUp : ThumbsDown;

//     return (
//         <div className={`flex items-center p-5 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-lg mt-5 transition-all duration-500`}>
//             <Icon className={`w-8 h-8 ${isYes ? 'text-green-500' : 'text-red-500'} mr-4 flex-shrink-0`} />
//             <div className='flex flex-col'>
//                 <p className={`text-xl font-extrabold ${textColor}`}>
//                     Your Vote: <span className="uppercase">{vote}</span>
//                 </p>
//                 <p className="text-sm text-gray-600 mt-1">
//                     Thank you. Your vote has been officially recorded for this Business Model Strategy.
//                 </p>
//             </div>
//         </div>
//     );
// };


// export default function VotingSection({ strategyId, onVote, userCurrentVote }: VotingSectionProps) {
//   // Tracks which vote type is currently processing ('YES', 'NO', or null for neither)
//   const [processingVoteType, setProcessingVoteType] = useState<'YES' | 'NO' | null>(null);
//   const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  
//   const handleVoteClick = async (type: 'YES' | 'NO') => {
//     if (processingVoteType || userCurrentVote) return; // Prevent voting if already processing or already voted

//     setProcessingVoteType(type); 
//     setMessage({ text: '', type: null });

//     try {
//       await onVote(type);
//       // NOTE: For best practice, the parent component should now re-fetch the
//       // strategy data (including the updated userCurrentVote status) and pass it down.
//       // If the parent doesn't update, the UI won't reflect the new vote instantly.
      
//     } catch (error) {
//       console.error('Voting failed:', error);
//       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during voting.';
//       setMessage({ text: errorMessage, type: 'error' });
//     } finally {
//       setProcessingVoteType(null); 
//       // Clear the message after a few seconds
//       setTimeout(() => setMessage({ text: '', type: null }), 5000);
//     }
//   };

//   const isAnyProcessing = processingVoteType !== null;
//   const hasVoted = userCurrentVote !== null;

//   // 💡 UI Improvement: Slightly refined base classes
//   const buttonBaseClasses = "flex-1 font-bold py-3 px-5 rounded-2xl transition duration-300 shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 text-lg";

//   // --- YES Button Specific Logic and Styling ---
//   const isYesProcessing = processingVoteType === 'YES';
//   const yesButtonClasses = isYesProcessing
//     ? `bg-green-600 text-white` // Solid color while processing
//     : `bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`;

//   // --- NO Button Specific Logic and Styling ---
//   const isNoProcessing = processingVoteType === 'NO';
//   const noButtonClasses = isNoProcessing
//     ? `bg-red-600 text-white` // Solid color while processing
//     : `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`;

//   // 💡 UI Improvement: Styling for the disabled, non-processing/non-voted button
//   const getDisabledClass = (isCurrentProcessing: boolean) => {
//       if (isCurrentProcessing) return ''; // Processing button maintains its color
//       if (isAnyProcessing || hasVoted) return 'opacity-60 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none'; // Grayed out when other is active OR user has voted
//       return ''; // Default
//   }

//   return (
//     <div className="mt-8 pt-6 border-t border-gray-200">
//       <h4 className="text-xl font-extrabold mb-5 text-gray-800 flex items-center gap-2">
//         <span className="text-indigo-600 text-2xl">🗳️</span> 
//         {hasVoted ? 'Decision Recorded' : 'Cast Your Decision'} 
//       </h4>
      
//       {/* --- CONDITIONAL RENDERING: Show confirmed vote or voting buttons --- */}
//       {hasVoted ? (
//         <ConfirmedVoteDisplay vote={userCurrentVote} />
//       ) : (
//         <div className="flex space-x-5">
//           <button
//             onClick={() => handleVoteClick('YES')}
//             disabled={isAnyProcessing || hasVoted} // Disable both when one is processing or when already voted
//             className={`${buttonBaseClasses} ${yesButtonClasses} ${getDisabledClass(isYesProcessing)}`}
//           >
//             {isYesProcessing ? (
//               <span className="flex items-center gap-2">
//                 <Loader2 className="animate-spin h-5 w-5" /> Processing
//               </span>
//             ) : (
//               <>
//                 👍 Vote YES
//               </>
//             )}
//           </button>
//           <button
//             onClick={() => handleVoteClick('NO')}
//             disabled={isAnyProcessing || hasVoted} // Disable both when one is processing or when already voted
//             className={`${buttonBaseClasses} ${noButtonClasses} ${getDisabledClass(isNoProcessing)}`}
//           >
//             {isNoProcessing ? (
//               <span className="flex items-center gap-2">
//                 <Loader2 className="animate-spin h-5 w-5" /> Processing
//               </span>
//             ) : (
//               <>
//                 👎 Vote NO
//               </>
//             )}
//           </button>
//         </div>
//       )}

//       <ConfirmationMessage message={message.text} type={message.type} />
      
//       <p className="text-sm text-gray-500 mt-4 italic">
//         Only authorized members can vote. Your decision is final upon submission.
//       </p>
//     </div>
//   );
// }
// 'use client';

// import React, { useState } from 'react';
// import { Loader2 } from 'lucide-react'; // Example import for a spinner icon (you'll need to install `lucide-react`)

// /**
//  * Renders the voting buttons for a strategy.
//  * This component is only rendered if the strategy status is VOTING_OPEN.
//  */
// interface VotingSectionProps {
//   strategyId: string;
//   // Handler function passed from the parent component (StrategyCard) to manage the API call.
//   onVote: (voteType: 'YES' | 'NO') => Promise<void>;
// }

// // Helper component for displaying the temporary confirmation message with better UI
// const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
//     if (!message) return null;
    
//     // 💡 UI Improvement: Added transition classes
//     const baseClasses = "mt-4 p-4 rounded-xl text-base font-semibold shadow-md opacity-100 transition-opacity duration-500 ease-in-out";
//     const successClasses = "bg-green-50 border border-green-300 text-green-700";
//     const errorClasses = "bg-red-50 border border-red-300 text-red-700";

//     return (
//         <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
//             {message}
//         </div>
//     );
// };

// export default function VotingSection({ strategyId, onVote }: VotingSectionProps) {
//   // Tracks which vote type is currently processing ('YES', 'NO', or null for neither)
//   const [processingVoteType, setProcessingVoteType] = useState<'YES' | 'NO' | null>(null);
//   const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  
//   const handleVoteClick = async (type: 'YES' | 'NO') => {
//     if (processingVoteType) return; 

//     setProcessingVoteType(type); 
//     setMessage({ text: '', type: null });

//     try {
//       await onVote(type);
//       // Removed success message here to keep the UI clean, 
//       // but you can add it back if the API returns immediately.
//     } catch (error) {
//       console.error('Voting failed:', error);
//       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during voting.';
//       setMessage({ text: errorMessage, type: 'error' });
//     } finally {
//       setProcessingVoteType(null); 
//       // Clear the message after a few seconds
//       setTimeout(() => setMessage({ text: '', type: null }), 5000);
//     }
//   };

//   const isAnyProcessing = processingVoteType !== null;

//   // 💡 UI Improvement: Slightly refined base classes
//   const buttonBaseClasses = "flex-1 font-bold py-3 px-5 rounded-2xl transition duration-300 shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 text-lg";

//   // --- YES Button Specific Logic and Styling ---
//   const isYesProcessing = processingVoteType === 'YES';
//   const yesButtonClasses = isYesProcessing
//     ? `bg-green-600 text-white` // Solid color while processing
//     : `bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`;

//   // --- NO Button Specific Logic and Styling ---
//   const isNoProcessing = processingVoteType === 'NO';
//   const noButtonClasses = isNoProcessing
//     ? `bg-red-600 text-white` // Solid color while processing
//     : `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`;

//   // 💡 UI Improvement: Styling for the disabled, non-processing button
//   const getDisabledClass = (isCurrentProcessing: boolean) => {
//       if (isCurrentProcessing) return ''; // Processing button maintains its color
//       if (isAnyProcessing) return 'opacity-60 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none'; // Grayed out when other is active
//       return ''; // Default
//   }

//   return (
//     <div className="mt-8 pt-6 border-t border-gray-200">
//       <h4 className="text-xl font-extrabold mb-5 text-gray-800 flex items-center gap-2">
//         <span className="text-indigo-600 text-2xl">🗳️</span> Cast Your Decision
//       </h4>
      
//       <div className="flex space-x-5">
//         <button
//           onClick={() => handleVoteClick('YES')}
//           disabled={isAnyProcessing} // Disable both when one is processing
//           className={`${buttonBaseClasses} ${yesButtonClasses} ${getDisabledClass(isYesProcessing)}`}
//         >
//           {isYesProcessing ? (
//             <span className="flex items-center gap-2">
//               <Loader2 className="animate-spin h-5 w-5" /> Processing
//             </span>
//           ) : (
//             <>
//               👍 Vote YES
//             </>
//           )}
//         </button>
//         <button
//           onClick={() => handleVoteClick('NO')}
//           disabled={isAnyProcessing} // Disable both when one is processing
//           className={`${buttonBaseClasses} ${noButtonClasses} ${getDisabledClass(isNoProcessing)}`}
//         >
//           {isNoProcessing ? (
//             <span className="flex items-center gap-2">
//               <Loader2 className="animate-spin h-5 w-5" /> Processing
//             </span>
//           ) : (
//             <>
//               👎 Vote NO
//             </>
//           )}
//         </button>
//       </div>

//       <ConfirmationMessage message={message.text} type={message.type} />
      
//       <p className="text-sm text-gray-500 mt-4 italic">
//         Only authorized members can vote. Your decision is final upon submission.
//       </p>
//     </div>
//   );
// }