'use client';

import { SafeUser } from '@/app/types';
import { StrategyWithRBM } from '../types/strategy';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; 

interface StrategyCardProps {
  strategy: StrategyWithRBM;
  currentUser:SafeUser|null
}

// Placeholder for non-blocking message display
const displayNonBlockingMessage = (message: string, isError: boolean = false) => {
    // In a real application, replace this with a toast notification (e.g., sonner) or custom modal.
    console.log(`${isError ? 'ERROR' : 'SUCCESS'}: ${message}`);
    // You would typically show a state message in the UI here.
};


export default function StrategyCard({ strategy,currentUser }: StrategyCardProps) {

    // Logic to determine if the Edit button should be visible
    const isAuthor = currentUser && strategy.authorId === currentUser.id;
    const isDraft = strategy.status === 'DRAFT'; 
    const canEdit = isAuthor && isDraft;

    const handleVote = async (voteType: 'YES' | 'NO') => {
        try {
            const response = await fetch(`/api/strategies/${strategy.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voterId: currentUser?.id,
                    voteType: voteType,
                }),
            });

            if (response.status === 409) {
                throw new Error("You have already cast a vote for this proposal. 🛑");
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit vote due to a server error.');
            }

            // FIX: Replace alert() with non-blocking message
            displayNonBlockingMessage(`Vote ${voteType} successfully recorded! ✅`);
        } catch (error) {
            // FIX: Replace alert() with non-blocking message
            displayNonBlockingMessage(`Error submitting vote: ${error instanceof Error ? error.message : 'An unknown error occurred'}`, true);
        }
    };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 border-t-4 border-indigo-500">
      <h2 className="text-2xl font-semibold mb-2">{strategy.title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        Submitted by **{strategy.author.name || 'N/A'}** on {new Date(strategy.submissionDate).toLocaleDateString()}
      </p>
      <div className="flex justify-between items-center text-sm mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          strategy.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          Status: **{strategy.status}**
        </span>
        <span className="text-gray-700">
          Current Votes: **{strategy.totalVotesYes} YES / {strategy.totalVotesNo} NO**
        </span>
      </div>
      
      <p className="text-gray-800 mt-4">{strategy.content.substring(0, 200)}...</p>

      {/* RBM Hierarchy Breakdown */}
      <RBMBreakdown goals={strategy.goals} />

      {/* ✏️ EDIT BUTTON (New Feature) */}
      {canEdit && (
          <Link
              href={`/strategies/${strategy.id}/edit`}
              className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition duration-150 shadow-sm"
          >
              ✏️ Edit Strategy Proposal
          </Link>
      )}

      {/* Voting Section (Only visible if status is VOTING_OPEN) */}
      {strategy.status === 'VOTING_OPEN' && (
        <VotingSection strategyId={strategy.id} onVote={handleVote} />
      )}
    </div>
  );
}
