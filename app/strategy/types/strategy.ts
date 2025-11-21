// types/strategy.ts

import { Strategy, StrategyGoal, StrategyOutcome, StrategyOutput, User, ProposalStatus } from '@prisma/client';

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