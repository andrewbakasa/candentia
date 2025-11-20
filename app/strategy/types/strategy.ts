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