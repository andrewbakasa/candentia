import { ActivityType } from "@prisma/client";

// Replaces ContractModel
export interface StrategyOutputModel {
    id: string;
    title: string; // Used for display
    contractType?: 'MSA' | 'NDA' | 'SOW' | 'OTHER';
    counterpartyName: string;
    status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED';
    autoRenew: boolean;
    effectiveDate: Date | string;
    expirationDate: Date | string;
    nextReviewDate?: Date | string | null;
    annualRevenueUsd?: number | null;
    annualizedCostUsd?: number | null;
    riskRating?: number | null;
    description?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    strategyActivityModels: StrategyActivityModel[]; // Renamed from contractActivityModels
}

// Replaces ContractActivityModel
export interface StrategyActivityModel {
    id: string;
    strategyId: string; // Foreign Key, renamed from contractId
    title: string;
    description?: string | null;
    dueDate: Date | string;
    
    activityType: ActivityType;
    //activityType: 'COMPLIANCE' | 'MILESTONE' | 'REVIEW' | 'ADMIN';
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    responsiblePersons?: string | null;
    completedAt?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// Replaces ContractDetailProps
export interface StrategyDetailProps {
    strategyOutput: StrategyOutputModel;
}

// Data structure for Activity forms (used for both creation and updates)
export interface ActivityFormDataType {
    title: string;
    description: string;
    dueDate: string; // YYYY-MM-DD string
    activityType: string;
    status: string;
    responsiblePersons: string;
    completedAt: string; // YYYY-MM-DD string
}