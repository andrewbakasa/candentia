// components/StrategyCard.tsx (Client Component)
'use client';

import { SafeUser } from '@/app/types';
import { StrategyWithRBM } from '../types/strategy';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; // ⬅️ NEW IMPORT

interface StrategyCardProps {
  strategy: StrategyWithRBM;
  currentUser:SafeUser|null
}

export default function StrategyCard({ strategy,currentUser }: StrategyCardProps) {

    // 🧭 Logic to determine if the Edit button should be visible
    const isAuthor = currentUser && strategy.authorId === currentUser.id;
    const isDraft = strategy.status === 'DRAFT'; 
    const canEdit = isAuthor && isDraft;

    const handleVote = async (voteType: 'YES' | 'NO') => {
        // ... (Vote submission logic remains the same) ...
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

            alert(`Vote ${voteType} successfully recorded! ✅`);
        } catch (error) {
            alert(`Error submitting vote: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
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
              ✏️ Edit Draft Proposal
          </Link>
      )}

      {/* Voting Section (Only visible if status is VOTING_OPEN) */}
      {strategy.status === 'VOTING_OPEN' && (
        <VotingSection strategyId={strategy.id} onVote={handleVote} />
      )}
    </div>
  );
}
// // components/StrategyCard.tsx (Client Component)
// 'use client';

// import { SafeUser } from '@/app/types';
// import { StrategyWithRBM } from '../types/strategy';
// import RBMBreakdown from './RBMBreakdown';
// import VotingSection from './VotingSection';

// interface StrategyCardProps {
//   strategy: StrategyWithRBM;
//   currentUser:SafeUser|null
// }

// export default function StrategyCard({ strategy,currentUser }: StrategyCardProps) {

// const handleVote = async (voteType: 'YES' | 'NO') => {
//   // 🚨 CRITICAL: PLACEHOLDER ID
//   // In a production Next.js application, this ID must be retrieved 
//   // from a secure authentication session (e.g., using NextAuth).
//   //const currentUserId = "TEMP_VOTER_ID_FROM_SESSION"; 

//   try {
//     const response = await fetch(`/api/strategies/${strategy.id}/vote`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         voterId: currentUser?.id, // This is the ID passed to the backend
//         voteType: voteType,
//       }),
//     });

//     // Handle common errors first, especially the 409 Conflict (already voted)
//     if (response.status === 409) {
//       throw new Error("You have already cast a vote for this proposal. 🛑");
//     }
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to submit vote due to a server error.');
//     }

//     alert(`Vote ${voteType} successfully recorded! ✅`);
//     // After success, you would typically call router.refresh() or update component state 
//     // to show the new vote count without a full page reload.

//   } catch (error) {
//     alert(`Error submitting vote: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
//   }
// };

//   return (
//     <div className="bg-white shadow-xl rounded-lg p-6 border-t-4 border-indigo-500">
//       <h2 className="text-2xl font-semibold mb-2">{strategy.title}</h2>
//       <p className="text-sm text-gray-500 mb-4">
//         Submitted by **{strategy.author.name || 'N/A'}** on {new Date(strategy.submissionDate).toLocaleDateString()}
//       </p>
//       <div className="flex justify-between items-center text-sm mb-4">
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//           strategy.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
//         }`}>
//           Status: **{strategy.status}**
//         </span>
//         <span className="text-gray-700">
//           Current Votes: **{strategy.totalVotesYes} YES / {strategy.totalVotesNo} NO**
//         </span>
//       </div>
      
//       <p className="text-gray-800 mt-4">{strategy.content.substring(0, 200)}...</p>

//       {/* RBM Hierarchy Breakdown */}
//       <RBMBreakdown goals={strategy.goals} />

//       {/* Voting Section (Only visible if status is VOTING_OPEN) */}
//       {strategy.status === 'VOTING_OPEN' && (
//         <VotingSection strategyId={strategy.id} onVote={handleVote} />
//       )}
//     </div>
//   );
// }