// types/contract.ts (Excerpt)
// types/contract.ts

// --- Enums ---
export enum ContractStatus {
  DRAFT = 'DRAFT',
  INTERNAL_REVIEW = 'INTERNAL_REVIEW',
  NEGOTIATION = 'NEGOTIATION',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  ARCHIVED = 'ARCHIVED',
}


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

// --- Placeholder for related models (Replace with your actual types) ---
interface UserMinimal {
  id: string;
  name: string;
}

interface BusinessProjectModelMinimal {
  id: string;
  title: string;
}

// --- Contract Activity Model ---
export interface ContractActivityModel {
  id: string;
  title: string;
  description: string | null;
  contractId: string;
  responsiblePersons: string; // Using string as per your model update
  createdByUserId: string;
  createdAt: string; // Use string for DateTimes from API
  updatedAt: string;
  activeType: ActivityType;
  status: ActivityStatus;
  dueDate: string;
  completedAt: string | null;
  resourceDetails: string | null;
  documentReferenceUrl: string | null;
  outcomeNotes: string | null;
}


// --- Full Contract Model (for API responses, includes relations) ---
export interface ContractModel {
  id: string;
  title: string;
  contractType: string;
  description: string | null;
  projectId: string | null;
  // relatedProject?: BusinessProjectModelMinimal; // Uncomment if you include project relation
  createdAt: string;
  updatedAt: string;
  status: ContractStatus;
  version: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  autoRenew: boolean;
  internalOwnerId: string;
  // internalOwner?: UserMinimal; // Uncomment if you include owner relation
  counterpartyName: string;
  counterpartyContact: string | null;
  signedDocumentUrl: string | null;
  totalValueUsd: number | null; // float becomes number
  paymentTerms: string | null;
  annualizedCostUsd: number | null;
  annualRevenueUsd: number | null;
  totalContractValueUsd: number | null;
  profitMarginPercent: number | null;
  costAllocationDetails: any; // Use 'any' or define a specific JSON type
  riskRating: number | null;
  complianceJurisdiction: string | null;
  breachOfContractClause: string | null;
  obligationsJson: any; // Use 'any' or define a specific JSON type
  nextReviewDate: string | null;
  notes: string | null;
  //activityType:string;
  // Included activities for viewing the detail page
  contractActivityModels: ContractActivityModel[];
}

// --- Contract Data for Update (Omit read-only/relational fields) ---
// This type is for sending data to your API update endpoint
export type ContractUpdateData = Partial<Omit<ContractModel, 
  | 'id' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'internalOwner' 
  | 'relatedProject'
  | 'contractActivityModels'
>>;

// Type specifically for the contract list view
export interface ContractListModel {
  id: string;
  title: string;
  contractType: string;
  status: ContractStatus;
  counterpartyName: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualRevenueUsd: number | null;
  updatedAt: string;
  description:string
}