// --- Enums (Keeping the Activity-related Enums) ---

export enum ActivityType {
  MEETING = 'MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  DRAWING_APPROVAL = 'DRAWING_APPROVAL',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  SUPPLIER_ENGAGEMENT = 'SUPPLIER_ENGAGEMENT',
  DOCUMENT_SUBMISSION = 'DOCUMENT_SUBMISSION',
  OTHER = 'OTHER',
}

export enum ActivityStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// --- Placeholder for related models ---
interface UserMinimal {
  id: string;
  name: string;
}

interface StrategyOutcomeMinimal {
  id: string;
  title: string;
}

// =======================================================
// --- Strategy Activity Model (Action Plan Task) ---
// =======================================================
export interface StrategyActivityModel {
  id: string;
  title: string;
  description: string | null;
  
  // Relationship to the Output (replaces contractId)
  outputId: string; 
  
  createdAt: string; // Use string for DateTimes from API
  updatedAt: string;
  
  // Activity fields from Prisma schema
  startDate: string | null;
  dueDate: string | null; // Scheduled completion time
  completionDate: string | null; // Date the task was finished
  status: string ;//ActivityStatus;
  progressPercent: number; // 0-100
  activityType:string;
}


// =======================================================
// --- Full Strategy Output Model (The Deliverable) ---
// =======================================================
export interface StrategyOutputModel {
  id: string;
  title: string;
  description: string | null;
  
  // Fields from StrategyOutput schema
  responsible: string | null; // Name of the responsible party (non-relational string)
  costEstimate: number | null;
  isCompleted: boolean;
  completionDate: string | null; 

  // Relationship to the Outcome
  outcomeId: string;
  outcome?: StrategyOutcomeMinimal; // Optional relation include

  createdAt: string;
  updatedAt: string;
  
  // Included activities for viewing the detail page (replaces contractActivityModels)
  activities: StrategyActivityModel[];
}


// =======================================================
// --- Data for Update (Omit read-only/relational fields) ---
// =======================================================
export type StrategyOutputUpdateData = Partial<Omit<StrategyOutputModel, 
  | 'id' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'outcome'
  | 'activities'
>>;

// =======================================================
// --- List View Model (for StrategyOutput List) ---
// =======================================================
export interface StrategyOutputListModel {
  id: string;
  title: string;
  description: string | null;
  
  // Core fields for display
  responsible: string | null;
  costEstimate: number | null;
  isCompleted: boolean;
  updatedAt: string;
  
  // Relationship count (replaces contractActivityModels count)
  _count: {
    activities: number;
  };
}

