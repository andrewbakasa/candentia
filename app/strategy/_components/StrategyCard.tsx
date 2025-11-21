'use client';

import { SafeUser } from '@/app/types';
//import { StrategyWithRBM } from '../types/strategy';
import RBMBreakdown from './RBMBreakdown';
import VotingSection from './VotingSection';
import Link from 'next/link'; 
import { ArrowRight, Flag, Zap } from 'lucide-react';
import { Toaster } from 'sonner';
import { StrategyWithRBMFull } from './StrategyForm';
//import { StrategyGoal } from '@prisma/client';
export interface StrategyOutput {
    id: string;
    title: string;
    responsible: string;
    isCompleted: boolean;
}
// --- 3. StrategyCard COMPONENT (Your requested component) ---
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
    score: number | null;
    //goals: any[];
    goals: StrategyGoal[]; // ⬅️ Must be present
    votes: { YES: number; NO: number };
    authorId: string;
    rbm: { riskLevel: string; impactScore: number }; // Example RBM structure
    averageScore: number | null; // Changed to allow null if scoring is not complete
    totalVotesYes: number;
    totalVotesNo: number;
}

// interface StrategyWithRBM {
//     id: string;
//     title: string;
//     content: string;
//     year: string;//|number;
//     status: string; // Note: This is a generic string in the external interface
//     goals: StrategyGoal[];
//     authorId: string;
// }

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const; // Use 'as const' for strong literal typing

interface StrategyCardProps {
    strategy: StrategyWithRBMFull;
    currentUser: SafeUser | null;
   // onVote: (strategyId: string, type: 'YES' | 'NO') => void; 
     onVote: (strategyId: string, type: 'YES' | 'NO') => Promise<void>; 
    onStrategyClick: (strategy: StrategyWithRBMFull) => void;
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
        {status.replace('_', ' ')}
    </span>
);

export default function StrategyCard({ strategy, currentUser, onVote, onStrategyClick, counter }: StrategyCardProps) {

    const isVotingOpen = strategy.status === ProposalStatus.VOTING_OPEN;
    console.log("strategy",strategy)
    const totalVotes = strategy.totalVotesNo + strategy?.totalVotesYes;
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
                    {counter+1}. {strategy.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{strategy.content}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 border-t pt-3">
                    <span className='flex items-center gap-1 font-medium'>
                        <Zap className="w-4 h-4 text-indigo-500" />
                        ID: {strategy.id}
                    </span>
                    <span className='flex items-center gap-1 font-medium'>
                        <Flag className="w-4 h-4 text-indigo-500" />
                        Goals: {strategy?.goals?.length}
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
                            <span className="text-green-600">YES ({strategy?.totalVotesYes})</span>
                            <span className="text-red-600">NO ({strategy?.totalVotesNo})</span>
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

            
            {isVotingOpen && (
                <VotingSection 
                    strategyId={strategy.id} 
                    onVote={(type: 'YES' | 'NO') => onVote(strategy.id, type)}
                    //isVoting={isVoting} // Pass the loading state down
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