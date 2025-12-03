// --- ENUMS (REPLICATED FROM YOUR SCHEMA) ---
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DefectStatus {
  IDENTIFIED = 'IDENTIFIED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  ACTION_DEFINED = 'ACTION_DEFINED',
  ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
  CLOSED_VERIFIED = 'CLOSED_VERIFIED'
}

export enum AnalysisMethod {
  APOLLO = 'APOLLO',
  FIVE_WHYS = 'FIVE_WHYS',
  FAULT_TREE = 'FAULT_TREE',
  TAPROOT = 'TAPROOT',
  FMECA = 'FMECA',
  OTHER = 'OTHER'
}

export enum ActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

// --- RELATED MODELS (Simplified for display) ---

export interface BreakdownModel {
  id: string;
  startTime: string; // Serialized Date
  endTime: string | null; // Serialized Date | null
  durationMinutes: number | null;
  isClosed: boolean;
  // ... other fields
}

export interface DefectEliminationModel {
  id: string;
  dateClosed: string | null; // Serialized Date | null
  rootCauseId: string | null;
  // Includes Defect, RootCause and FollowUp relationships if needed
}

export interface AnalysisRecordModel {
  id: string;
  analystName: string;
  analysisDate: string; // Serialized Date
  methodUsed: AnalysisMethod;
  summaryOfFindings: string;
  rootCauseId: string | null;
}

export interface CorrectiveActionModel {
  id: string;
  description: string;
  responsible: string;
  dueDate: string; // Serialized Date
  completionDate: string | null; // Serialized Date | null
  status: ActionStatus;
  // ... other IDs
}

// --- CORE DEFECT MODEL ---

/**
 * @interface DefectDetailModel
 * The final, serializable structure for the single Defect view.
 */
export interface DefectDetailModel {
  improvementOpportunities: any[];
  reportedBy: string;
  id: string;
  identificationDate: string; // Serialized Date
  title: string;
  description: string;
  area: string | null;
  equipmentTag: string | null;
  priority: Priority;
  status: DefectStatus;
  breakdownRelated: boolean;
  breakdownId: string | null;

  // Relationships (Crucial for the Detail View)
  breakdown: BreakdownModel | null;
  eliminationRecord: DefectEliminationModel | null;
  analyses: AnalysisRecordModel[]; // List of analysis records
  actions: CorrectiveActionModel[]; // List of actions
}