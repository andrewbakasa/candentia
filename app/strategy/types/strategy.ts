// types/strategy.ts

import { Strategy,
  // StrategyGoal, 
  // StrategyOutcome, 
  // StrategyOutput, 
  User, ProposalStatus } from '@prisma/client';

// Recursive type for fully hydrated Strategy data
export type StrategyWithRBM = Strategy & {
  author: User;
  goals: (StrategyGoal & {
    outcomes: (StrategyOutcome & {
      outputs: StrategyOutput[];
    })[];
  })[];
  // Include other relationships like comments, votes, etc. as needed
};


// /types/rbm.ts

/**
 * 1. StrategyOutput: The lowest level (Deliverable/Actionable Task).
 * Matches the required structure for the API's goals array.
 */
export interface StrategyOutputForm {
    /** The database ID for existing records. Omitted for new records. */
    id?: string;
    /** Client-side key for managing the array (e.g., 'temp-123'). */
    tempId: string; 
    
    title: string;
    responsible: string;
    isCompleted: boolean;
    // Add other fields if needed, like costEstimate: number;
}

/**
 * 2. StrategyOutcome: The middle level (Behavioral Change/Effect).
 */
export interface StrategyOutcomeForm {
    /** The database ID for existing records. Omitted for new records. */
    id?: string;
    /** Client-side key for managing the array. */
    tempId: string; 
    
    title: string;
    kpi: string; // Key Performance Indicator
    
    /** Nested list of required deliverables. */
    outputs: StrategyOutputForm[];
}

/**
 * 3. StrategyGoal: The top RBM level (High-Level Impact/Objective).
 * This structure is intended to be used within the main StrategyForm component.
 */
export interface StrategyGoalForm {
    /** The database ID for existing records. Omitted for new records. */
    id?: string;
    /** Client-side key for managing the array (if goals are also dynamic). */
    tempId: string;

    title: string;
    targetYear: number;
    
    /** Nested list of outcomes required to meet the goal. */
    outcomes: StrategyOutcomeForm[];
    
}

// Optionally, you might export the final structure expected by the PUT API,
// which is the same as the Form types but without the client-side 'tempId' fields.
// This is often handled by a simple cleanup function before the API call (e.g., Axios).
export interface StrategyGoalApiPayload {
    id?: string;
    title: string;
    targetYear: number;
    outcomes: {
        id?: string;
        title: string;
        kpi: string;
        outputs: {
            id?: string;
            title: string;
            responsible: string;
            isCompleted: boolean;
        }[];
    }[];
}


// Assuming your Prisma models are available via imports or generated types

// 1. Define the type for a single individual vote record
export interface IndividualVote {
    voterId: string;
    voteType: 'YES' | 'NO';
}

// 2. Define the core RBM Goal structure (as inferred from StrategyCard)
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

// 3. Define the final, transformed strategy type
// This combines the base Prisma Strategy fields with the derived data.
export interface StrategyWithIndividualVotes {
    // Base Strategy fields (from prisma.strategy.findMany)
    id: string;
    title: string;
    content: string;
    year: string;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'VOTING_OPEN' | 'APPROVED' | 'REJECTED';
    submissionDate: Date; // Added as it was in orderBy
    averageStrategicScore: number | null;
    authorId: string;
    // Assuming you have a relation for author details
    author: {
        id: string;
        name: string | null;
        email: string;
        // ... other SafeUser properties
    }; 
    
    // Included and nested fields
    goals: StrategyGoal[];

    // Derived fields from the mapping
    individualVotes: IndividualVote[];
    totalVotesYes: number;
    totalVotesNo: number;
    
    // Assuming the RBM structure is also part of the base Strategy or an included relation
    rbm: { riskLevel: string; impactScore: number };
    averageScore: number | null;
    
    // Note: The raw 'votes' property from the `include` is removed/undefined by the mapping.
}

// 4. The final return type for the getStrategies function:
export type StrategiesReturnType = StrategyWithIndividualVotes[];