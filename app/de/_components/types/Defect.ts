
// Import the generated types/enums for use in the front end
import { Defect as PrismaDefect, AnalysisRecord, CorrectiveAction } from '@prisma/client';

// Define a type for a Defect fetched for a list (simpler payload)
export type DefectListItem = Pick<PrismaDefect, 'id' | 'title' | 'equipmentTag' | 'priority' | 'status' | 'identificationDate'>;

// Define a type for a Defect fetched for a detail view (includes relations)
export interface DefectDetail extends PrismaDefect {
    analyses: AnalysisRecord[]; // Includes the analysis records
    actions: CorrectiveAction[]; // Includes the corrective actions
    // Add other related models as needed: breakdown, eliminationRecord, etc.
}


// types/Defect.ts

// These types and enums must be consistent with your Prisma schema
// Note: These definitions are often used when the Prisma client itself isn't directly available in front-end code.

export enum Priority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum DefectStatus {
    IDENTIFIED = 'IDENTIFIED',
    IN_ANALYSIS = 'IN_ANALYSIS',
    ACTION_DEFINED = 'ACTION_DEFINED',
    ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
    CLOSED_VERIFIED = 'CLOSED_VERIFIED',
}

// Interface for the data sent to the POST API for creating a new Defect
export interface NewDefectPayload {
    title: string;
    description: string;
    area: string;
    equipmentTag: string;
    priority: Priority;
    breakdownRelated: boolean;
    identificationDate: string; // Sending as an ISO string (e.g., from datetime-local input)
}

// Full Defect Detail (for reference in detail pages)
// This structure would include related models when queried with Prisma's `include` option.
export interface DefectDetail {
    id: string;
    title: string;
    description: string;
    equipmentTag: string;
    priority: Priority;
    status: DefectStatus;
    // Add other fields and relations here based on your actual data fetching logic
}

// Interface for the data returned by the API after a successful POST
export interface DefectResponse {
    id: string;
    title: string;
    equipmentTag: string;
    status: DefectStatus;
}


// // Imports from Prisma Client (automatically generated)
// // import { Priority, DefectStatus, AnalysisMethod, ActionStatus } from '@prisma/client';

// export interface Defect {
//     id: string;
//     identificationDate: Date;
//     title: string;
//     description: string;
//     area: string | null;
//     equipmentTag: string;
//     priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
//     status: 'IDENTIFIED' | 'IN_ANALYSIS' | 'ACTION_DEFINED' | 'ACTION_IMPLEMENTED' | 'CLOSED_VERIFIED';
//     breakdownRelated: boolean;
//     breakdownId: string | null;
    
//     // Optional/Nested Data for Display
//     breakdown?: Breakdown;
//     eliminationRecord?: DefectElimination;
//     analysis?: AnalysisRecord;
//     action?: CorrectiveAction;
// }

// export interface RootCause {
//     id: string;
//     rootCauseText: string;
//     analysisRecordId: string | null;
//     criticalityScore: number | null;
    
//     // Optional/Nested Data for Display
//     analysisRecord?: AnalysisRecord;
//     actions?: CorrectiveAction[];
// }

// export interface CorrectiveAction {
//     id: string;
//     defectId: string | null;
//     rootCauseId: string | null;
//     description: string;
//     responsible: string;
//     dueDate: Date;
//     completionDate: Date | null;
//     status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'OVERDUE' | 'CANCELLED';

//     // Optional/Nested Data for Display
//     defect?: Defect;
//     rootCause?: RootCause;
// }

// // Add interfaces for Breakdown, FMEA, WorkOrder, etc., following the Prisma model structure.
// // This standardization across the stack is the primary benefit of using Prisma with TypeScript.