// components/VotingSection.tsx
'use client';

/**
 * Renders the voting buttons for a strategy.
 * This component is only rendered if the strategy status is VOTING_OPEN.
 */
interface VotingSectionProps {
  strategyId: string;
  // Handler function passed from the parent component (StrategyCard) to manage the API call.
  onVote: (voteType: 'YES' | 'NO') => Promise<void>;
}

export default function VotingSection({ strategyId, onVote }: VotingSectionProps) {
  
  const handleVoteClick = async (type: 'YES' | 'NO') => {
    // In a complete application, authorization (checking UserRole) would happen here 
    // or on the backend API layer.
    try {
      await onVote(type);
      console.log(`Submitted ${type} vote for strategy ${strategyId}`);
      // Ideally, update the UI (e.g., disable voting, show success message)
    } catch (error) {
      console.error('Voting failed:', error);
      // Show an error message to the user
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xl font-semibold mb-4 text-indigo-700">🗳️ Place Your Vote</h4>
      
      <div className="flex space-x-4">
        <button
          onClick={() => handleVoteClick('YES')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 shadow-md"
        >
          Vote YES
        </button>
        <button
          onClick={() => handleVoteClick('NO')}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 shadow-md"
        >
          Vote NO
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Your vote is final after submission.</p>
    </div>
  );
}