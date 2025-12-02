
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

// export enum Priority {
//     LOW = 'LOW',
//     MEDIUM = 'MEDIUM',
//     HIGH = 'HIGH',
//     CRITICAL = 'CRITICAL',
// }

// export enum DefectStatus {
//     IDENTIFIED = 'IDENTIFIED',
//     IN_ANALYSIS = 'IN_ANALYSIS',
//     ACTION_DEFINED = 'ACTION_DEFINED',
//     ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
//     CLOSED_VERIFIED = 'CLOSED_VERIFIED',
// }

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

// --- 1. NEW TYPESCRIPT INTERFACES FOR DEFECT MODULE ---

// Define the enums used in the Defect model
enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

enum DefectStatus {
  IDENTIFIED = 'IDENTIFIED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  ACTION_DEFINED = 'ACTION_DEFINED',
  ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
  CLOSED_VERIFIED = 'CLOSED_VERIFIED'
}

enum ActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

// Minimal models for nested relations for type safety during serialization
interface CorrectiveActionModel {
  id: string;
  description: string;
  responsible: string;
  dueDate: string; // Serialized date string
  completionDate: string | null; // Serialized date string or null
  status: ActionStatus;
}

interface AnalysisRecordModel {
  id: string;
  analystName: string;
  analysisDate: string; // Serialized date string
  methodUsed: string; // AnalysisMethod enum will be a string
  summaryOfFindings: string;
}

interface DefectEliminationModel {
  id: string;
  dateClosed: string | null; // Serialized date string or null
  // ... other fields if needed, like rootCause relation
}

interface BreakdownModel {
  id: string;
  startTime: string; // Serialized date string
  endTime: string | null; // Serialized date string or null
  durationMinutes: number | null;
  isClosed: boolean;
}

/**
 * @interface DefectModel
 * The core model for a Defect record, including nested relations.
 * Dates are defined as strings for the client component (after serialization).
 */
export interface DefectModel {
  id: string;
  identificationDate: string; // Serialized date string
  title: string;
  description: string;
  area: string | null;
  equipmentTag: string | null;
  priority: Priority;
  status: DefectStatus;
  breakdownRelated: boolean;
  breakdownId: string | null;

  // Relationships (will be included via Prisma)
  breakdown: BreakdownModel | null;
  eliminationRecord: DefectEliminationModel | null;
  analyses: AnalysisRecordModel[];
  actions: CorrectiveActionModel[];
}