import { MM_ActivityStage, MM_ProjectStatus, MM_WorkshopType } from "@prisma/client";

export interface StrategicPlan {
  id: string;
  year: number;
  totalBudget: number;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  allocatedBudget: number;
  startDate: Date;
  endDate: Date;
  activities: Activity[]; // e.g., "Locomotive Refurbishment DE11"
}

export interface Activity {
  id: string;
  projectId: string;
  description: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualEnd?: Date;
  
  // Requirement Filtering (Sec 3.3)
  stage: 'PLANNING' | 'PROCUREMENT' | 'EXECUTION' | 'QUALITY_CHECK';
  requirements: string[]; // List of specific standards/parts needed
  
  // Resource & Cost Metrics
  allocatedResources: { staffId: string; role: string; estimatedHours: number }[];
  actualCosts: { labor: number; materials: number; overheads: number };
  
  // Rework & Variance (Sec 5.5)
  isRework: boolean;
  reworkOriginalActivityId?: string;
  varianceReason?: string; // e.g., "Awaiting Funding", "Skill Gap"
}
// --- TYPES & INTERFACES ---

export interface MM_User {
  id: string;
  name: string;
  role: string;
}

export interface MM_Workshop {
  id: string;
  name: string;
  type: MM_WorkshopType;
}

export interface MM_Activity {
  id: string;
  description: string;
  supervisor?: MM_User | null;
  stage: MM_ActivityStage;
  scheduledEnd: Date | string | null;
  actualEnd: Date | string | null;
  actualLaborCost: number;
  actualMaterialCost: number;
  progress: number;
  isRework: boolean;
  reworkCost: number;
}

export interface MM_Project {
  id: string;
  name: string;
  status: MM_ProjectStatus;
  progress: number;
  allocatedBudget: number;
  totalActualCost: number;
  responsibleWorkshop?: MM_Workshop | null;
  projectManager?: MM_User | null;
  activities?: MM_Activity[];
}

export interface MM_StrategicPlan {
  id: string;
  year: number;
  description: string;
  totalBudget: number;
  mm_projects?: MM_Project[];
  assignedExecutive?: MM_User | null;
}