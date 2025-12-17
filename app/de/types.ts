// types.ts

export type DefectStatusCategory = 'ALL' | 'HIGH_PRIORITY' | 'OPEN' | 'CLOSED';

export type DefectPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
 export interface DefectListModel {
    breakdownRelated: any;
    updatedAt: Date;
    id: string;
    title: string;
    description: string | null;
    assignee: string | null; 
    area: string | null;
    equipmentTag: string | null;
    reportedby: string | null;
    identificationDate: Date;
    type: string; 
    priority: Priority; 
    status: DatabaseDefectStatus; 

    isClosed: boolean; 
    closedDate: string | null; 
    targetResolutionDate: string | null; 

    // FIELDS FOR SEARCHING RELATED TEXT
    eliminationRootCauseText: string | null; 
    analysisSummaries: string[];             
    actionDescriptions: string[];           
    improvementDescriptions: string[]; 

    _count: {
        comments: number;
    }
}
export interface DefectListModel2 {
    _count: any;
    id: string;
    title: string;
    description: string | null;
    status: string; // e.g., "OPEN", "IN_PROGRESS", "CLOSED_VERIFIED"
    priority: DefectPriority;
    type: string; // e.g., "Mechanical", "Electrical"
    assignee: string | null;
    equipmentTag: string | null;
    
    // Detailed Searchable Fields (Arrays)
    eliminationRootCauseText?: string | null;
    analysisSummaries: string[];
    actionDescriptions: string[];
    improvementDescriptions: string[];

    // Tracking Dates
    createdAt: string;
    updatedAt: string;
    isClosed: boolean;
    closedDate: string | null;
    dueDate?: string | null;
}

export interface DefectFormData {
    title: string;
    description: string | null;
    assignee: string;
    area: string | null;
    equipmentTag: string | null;
    reportedby:string|null;
    identificationDate: string; // Changed to string for input compatibility
    type: string;
    severity: Priority;
    status: DatabaseDefectStatus;
}


export interface SearchFieldDefinition {
    label: string;
    type: 'string' | 'array';
}

export const searchableFields = {
    title: { label: 'Title', type: 'string' },
    description: { label: 'Description', type: 'string' },
    assignee: { label: 'Assignee', type: 'string' },
    type: { label: 'Defect Type', type: 'string' },
    equipmentTag: { label: 'Equipment Tag', type: 'string' },
    eliminationRootCauseText: { label: 'Root Cause Text', type: 'string' },
    analysisSummaries: { label: 'Analysis Summaries', type: 'array' },
    actionDescriptions: { label: 'Action Descriptions', type: 'array' },
    improvementDescriptions: { label: 'CI Opportunities', type: 'array' },
} as const; // <--- Add 'as const' here for strict literal types

export type SearchableFieldKey = keyof typeof searchableFields;


// types.ts (continued)

// export interface DefectFormData {
//     title: string;
//     description: string;
//     priority: DefectPriority;
//     status: string;
//     type: string;
//     assignee?: string;
//     equipmentTag?: string;
//     eliminationRootCauseText?: string;
//     // Note: Analysis, Actions, and Improvements are usually 
//     // managed as sub-collections or dynamic arrays in the form.
// }
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
/**
 * Corresponds to Prisma `enum DefectStatus`
 */
export type DatabaseDefectStatus = 'IDENTIFIED' | 'IN_ANALYSIS' | 'ACTION_DEFINED' | 'ACTION_IMPLEMENTED' | 'CLOSED_VERIFIED';

export interface DefectFormData {
    title: string;
    description: string | null;
    assignee: string;
    area: string | null;
    equipmentTag: string | null;
    reportedby:string|null;
    identificationDate: string; // Changed to string for input compatibility
    type: string;
    severity: Priority;
    status: DatabaseDefectStatus;
}