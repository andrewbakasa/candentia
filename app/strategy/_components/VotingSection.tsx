'use client';

import React, { useState } from 'react';

/**
 * Renders the voting buttons for a strategy.
 * This component is only rendered if the strategy status is VOTING_OPEN.
 */
interface VotingSectionProps {
  strategyId: string;
  // Handler function passed from the parent component (StrategyCard) to manage the API call.
  onVote: (voteType: 'YES' | 'NO') => Promise<void>;
}

// Helper component for displaying the temporary confirmation message
const ConfirmationMessage = ({ message, type }: { message: string, type: 'success' | 'error' | null }) => {
    if (!message) return null;
    
    const baseClasses = "mt-3 p-3 rounded-lg text-sm font-medium transition-all duration-300";
    const successClasses = "bg-green-100 text-green-800 border border-green-300";
    const errorClasses = "bg-red-100 text-red-800 border border-red-300";

    return (
        <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
            {message}
        </div>
    );
};

export default function VotingSection({ strategyId, onVote }: VotingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  
  const handleVoteClick = async (type: 'YES' | 'NO') => {
    if (isLoading) return;

    setIsLoading(true);
    setMessage({ text: '', type: null });

    try {
      await onVote(type);
     // console.log(`Submitted ${type} vote for strategy ${strategyId}`);
      //setMessage({ text: `Your ${type} vote has been successfully recorded. Thank you!`, type: 'success' });
    } catch (error) {
      console.error('Voting failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during voting.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
      // Clear the message after a few seconds
      setTimeout(() => setMessage({ text: '', type: null }), 5000);
    }
  };

  const buttonBaseClasses = "flex-1 font-extrabold py-3 px-4 rounded-xl transition duration-300 shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span className="text-indigo-600">🗳️</span> Cast Your Decision
      </h4>
      
      <div className="flex space-x-4">
        <button
          onClick={() => handleVoteClick('YES')}
          disabled={isLoading}
          className={`${buttonBaseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`}
        >
          {isLoading ? 'Processing...' : (
            <>
              👍 Vote YES
            </>
          )}
        </button>
        <button
          onClick={() => handleVoteClick('NO')}
          disabled={isLoading}
          className={`${buttonBaseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700`}
        >
          {isLoading ? 'Processing...' : (
            <>
              👎 Vote NO
            </>
          )}
        </button>
      </div>

      <ConfirmationMessage message={message.text} type={message.type} />
      
      <p className="text-xs text-gray-500 mt-2">
        Only authorized members can vote. Your vote is recorded upon submission.
      </p>
    </div>
  );
}
