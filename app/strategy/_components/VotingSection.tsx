'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; // Example import for a spinner icon (you'll need to install `lucide-react`)

/**
 * Renders the voting buttons for a strategy.
 * This component is only rendered if the strategy status is VOTING_OPEN.
 */
interface VotingSectionProps {
  strategyId: string;
  // Handler function passed from the parent component (StrategyCard) to manage the API call.
  onVote: (voteType: 'YES' | 'NO') => Promise<void>;
}

// Helper component for displaying the temporary confirmation message with better UI
const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
    if (!message) return null;
    
    // 💡 UI Improvement: Added transition classes
    const baseClasses = "mt-4 p-4 rounded-xl text-base font-semibold shadow-md opacity-100 transition-opacity duration-500 ease-in-out";
    const successClasses = "bg-green-50 border border-green-300 text-green-700";
    const errorClasses = "bg-red-50 border border-red-300 text-red-700";

    return (
        <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
            {message}
        </div>
    );
};

export default function VotingSection({ strategyId, onVote }: VotingSectionProps) {
  // Tracks which vote type is currently processing ('YES', 'NO', or null for neither)
  const [processingVoteType, setProcessingVoteType] = useState<'YES' | 'NO' | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  
  const handleVoteClick = async (type: 'YES' | 'NO') => {
    if (processingVoteType) return; 

    setProcessingVoteType(type); 
    setMessage({ text: '', type: null });

    try {
      await onVote(type);
      // Removed success message here to keep the UI clean, 
      // but you can add it back if the API returns immediately.
    } catch (error) {
      console.error('Voting failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during voting.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setProcessingVoteType(null); 
      // Clear the message after a few seconds
      setTimeout(() => setMessage({ text: '', type: null }), 5000);
    }
  };

  const isAnyProcessing = processingVoteType !== null;

  // 💡 UI Improvement: Slightly refined base classes
  const buttonBaseClasses = "flex-1 font-bold py-3 px-5 rounded-2xl transition duration-300 shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 text-lg";

  // --- YES Button Specific Logic and Styling ---
  const isYesProcessing = processingVoteType === 'YES';
  const yesButtonClasses = isYesProcessing
    ? `bg-green-600 text-white` // Solid color while processing
    : `bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`;

  // --- NO Button Specific Logic and Styling ---
  const isNoProcessing = processingVoteType === 'NO';
  const noButtonClasses = isNoProcessing
    ? `bg-red-600 text-white` // Solid color while processing
    : `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`;

  // 💡 UI Improvement: Styling for the disabled, non-processing button
  const getDisabledClass = (isCurrentProcessing: boolean) => {
      if (isCurrentProcessing) return ''; // Processing button maintains its color
      if (isAnyProcessing) return 'opacity-60 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none'; // Grayed out when other is active
      return ''; // Default
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h4 className="text-xl font-extrabold mb-5 text-gray-800 flex items-center gap-2">
        <span className="text-indigo-600 text-2xl">🗳️</span> Cast Your Decision
      </h4>
      
      <div className="flex space-x-5">
        <button
          onClick={() => handleVoteClick('YES')}
          disabled={isAnyProcessing} // Disable both when one is processing
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
          onClick={() => handleVoteClick('NO')}
          disabled={isAnyProcessing} // Disable both when one is processing
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

      <ConfirmationMessage message={message.text} type={message.type} />
      
      <p className="text-sm text-gray-500 mt-4 italic">
        Only authorized members can vote. Your decision is final upon submission.
      </p>
    </div>
  );
}
// 'use client';

// import React, { useState } from 'react';

// /**
//  * Renders the voting buttons for a strategy.
//  * This component is only rendered if the strategy status is VOTING_OPEN.
//  */
// interface VotingSectionProps {
//   strategyId: string;
//   // Handler function passed from the parent component (StrategyCard) to manage the API call.
//   onVote: (voteType: 'YES' | 'NO') => Promise<void>;
// }

// // Helper component for displaying the temporary confirmation message
// const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
//     if (!message) return null;
    
//     const baseClasses = "mt-3 p-3 rounded-lg text-sm font-medium transition-all duration-300";
//     const successClasses = "bg-green-100 text-green-800 border border-green-300";
//     const errorClasses = "bg-red-100 text-red-800 border border-red-300";

//     return (
//         <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
//             {message}
//         </div>
//     );
// };

// export default function VotingSection({ strategyId, onVote }: VotingSectionProps) {
//   // 💡 NEW STATE: Tracks which vote type is currently processing ('YES', 'NO', or null for neither)
//   const [processingVoteType, setProcessingVoteType] = useState<'YES' | 'NO' | null>(null);
//   const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  
//   const handleVoteClick = async (type: 'YES' | 'NO') => {
//     // Check if *any* vote is currently being processed
//     if (processingVoteType) return; 

//     // 1. Set the specific type that is now processing
//     setProcessingVoteType(type); 
//     setMessage({ text: '', type: null });

//     try {
//       await onVote(type);
//       // Optional: Set a success message here if desired
//       // setMessage({ text: `Your ${type} vote has been successfully recorded.`, type: 'success' });
//     } catch (error) {
//       console.error('Voting failed:', error);
//       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during voting.';
//       setMessage({ text: errorMessage, type: 'error' });
//     } finally {
//       // 2. Clear the processing state
//       setProcessingVoteType(null); 
//       // Clear the message after a few seconds
//       setTimeout(() => setMessage({ text: '', type: null }), 5000);
//     }
//   };

//   const buttonBaseClasses = "flex-1 font-extrabold py-3 px-4 rounded-xl transition duration-300 shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

//   // Check if the current button is the one being processed
//   const isYesProcessing = processingVoteType === 'YES';
//   const isNoProcessing = processingVoteType === 'NO';
//   // Check if *any* button is processing to disable both when one is active
//   const isAnyProcessing = processingVoteType !== null;


//   return (
//     <div className="mt-6 pt-4 border-t border-gray-200">
//       <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
//         <span className="text-indigo-600">🗳️</span> Cast Your Decision
//       </h4>
      
//       <div className="flex space-x-4">
//         <button
//           onClick={() => handleVoteClick('YES')}
//           // Disable if *any* vote is processing
//           disabled={isAnyProcessing}
//           className={`${buttonBaseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`}
//         >
//           {/* Use the specific state to show 'Processing...' */}
//           {isYesProcessing ? 'Processing...' : (
//             <>
//               👍 Vote YES
//             </>
//           )}
//         </button>
//         <button
//           onClick={() => handleVoteClick('NO')}
//           // Disable if *any* vote is processing
//           disabled={isAnyProcessing}
//           className={`${buttonBaseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`}
//         >
//           {/* Use the specific state to show 'Processing...' */}
//           {isNoProcessing ? 'Processing...' : (
//             <>
//               👎 Vote NO
//             </>
//           )}
//         </button>
//       </div>

//       <ConfirmationMessage message={message.text} type={message.type} />
      
//       <p className="text-xs text-gray-500 mt-2">
//         Only authorized members can vote. Your vote is recorded upon submission.
//       </p>
//     </div>
//   );
// }
