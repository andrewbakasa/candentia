import { 
    AssigneeType, 
    DefectStatus, 
    DefectType, 
    Priority, 
    ActionStatus, 
    AnalysisMethod 
} from '@prisma/client'; // Assuming these enums still exist
import * as XLSX from 'xlsx';

// ====================================================================
// 1. TYPE DEFINITIONS (Based *EXACTLY* on User's Structure)
// ====================================================================

interface CorrectiveActionData {
    id: string; 
    defectId: string;
    rootCauseId: string | null;
    improvementId: string | null;
    description: string;
    responsible: string;
    dueDate: Date;
    completionDate: Date | null;
    status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING'; // Assuming ActionStatus is mapped to these strings
}

interface RootCauseData {
    // Assuming root cause text is not directly here, but captured in the analysis summary or implied by action
}

interface AnalysisRecordData {
    id: string; 
    defectId: string;
    analystName: string; // New field name
    analysisDate: Date; 
    methodUsed: AnalysisMethod;
    summaryOfFindings: string;
    rootCauseId: string; // This ID links the analysis to the cause (though cause text is in summary)
}

interface BreakdownData {
    // Structure not provided, using a placeholder for null checking
    durationMinutes: number | null; 
}

interface DefectEliminationData {
    dateClosed: Date | null;
}

// **NEW STRUCTURE:** Improvement Opportunity
interface ImprovementOpportunityData {
    id: string;
    dateIdentified: Date;
    description: string;
    targetArea: string; // New field
    sourceModule: string;
    proposedAction: string; // New field
    implementationDate: Date | null;
    isImplemented: boolean; // New field
    sourceDefectId: string;
}

// --- Main Input Type ---
export interface FullDefectData {
    id: string;
    identificationDate: Date;
    title: string;
    description: string;
    area: string | null;
    equipmentTag: string | null;
    reportedby: string | null;
    type: DefectType; 
    assignee: AssigneeType;
    priority: Priority; 
    status: DefectStatus;
    breakdownRelated: boolean;
    createdAt: Date;
    updatedAt: Date;
    
    // Relationships 
    breakdown: BreakdownData | null;
    eliminationRecord: DefectEliminationData | null;
    analyses: AnalysisRecordData[]; 
    actions: CorrectiveActionData[]; 
    improvementOpportunities: ImprovementOpportunityData[]; // **CRITICAL change**
}

type DefectData = FullDefectData[]; 

// --- Sheet 1: Defect Log Row (Summary Metrics) ---
export interface ComprehensiveDefectExcelRow {
    'ID': string;
    'Identified Date': string;
    'Title': string;
    'Status': DefectStatus;
    'Priority': Priority;
    'Reported By': string;
    'Equipment Tag': string | null;
    'Total Analyses': number;
    'Total Actions Defined': number;
    'Action Progress (%)': number;
    'Total Opportunities': number; // Updated name
    'Date Closed': string;
}

// --- Sheet 2: Corrective Actions Row ---
export interface ActionExcelRow {
    'Defect ID': string; 
    'Action ID': string;
    'Defect Title': string; 
    'Action Description': string;
    'Responsible': string;
    'Status': string; // Using string to match user's 'COMPLETE'
    'Due Date': string;
    'Completion Date': string;
}

// --- Sheet 3: Improvement Opportunities Row ---
export interface OpportunityExcelRow { // Updated interface name
    'Defect ID': string; 
    'Opportunity ID': string; // Updated name
    'Defect Title': string; 
    'Date Identified': string; // New field
    'Target Area': string; // New field
    'Proposed Action': string; // New field
    'Implementation Status': boolean; // New field
    'Implementation Date': string;
    'Description': string; 
}

// --- Sheet 4: Root Cause Analysis Row ---
export interface AnalysisExcelRow {
    'Defect ID': string;
    'Analysis ID': string;
    'Defect Title': string;
    'Analyst Name': string; // New field name
    'Analysis Method': AnalysisMethod;
    'Analysis Date': string;
    'Summary of Findings': string;
    'Root Cause ID': string; // Keeping the ID for reference
}


// ====================================================================
// 2. HELPER FUNCTIONS
// ====================================================================

/**
 * Safely formats a Date object or ISO string into YYYY-MM-DD format.
 */
const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split('T')[0];
    } catch (e) {
        return 'Invalid Date';
    }
};

/**
 * Calculates the percentage of completed actions.
 */
const calculateActionProgress = (actions: CorrectiveActionData[]): number => {
    if (actions.length === 0) return 0;
    
    // User's status is 'COMPLETE', so we use that string
    const completedActions = actions.filter(
        (action) => action.status === 'COMPLETE'
    ).length;
    
    return Math.round((completedActions / actions.length) * 100);
};


// --- Helper for Sheet 1 (Defect Log) ---
const flattenDefectData = (defect: FullDefectData): ComprehensiveDefectExcelRow => {
    const dateClosed = defect.eliminationRecord?.dateClosed;
    
    return {
        'ID': defect.id,
        'Identified Date': formatDate(defect.identificationDate),
        'Title': defect.title,
        'Status': defect.status,
        'Priority': defect.priority,
        'Reported By': defect.reportedby || 'N/A',
        'Equipment Tag': defect.equipmentTag || 'N/A',
        'Total Analyses': defect.analyses?.length ?? 0,
        'Total Actions Defined': defect.actions?.length ?? 0,
        'Action Progress (%)': calculateActionProgress(defect.actions || []),
        'Total Opportunities': defect.improvementOpportunities?.length ?? 0,
        'Date Closed': formatDate(dateClosed),
    };
};

// --- Helper for Sheet 2 (Actions) ---
const flattenActions = (defects: FullDefectData[]): ActionExcelRow[] => {
    const allActions: ActionExcelRow[] = [];
    for (const defect of defects) {
        if (defect.actions && defect.actions.length > 0) {
            defect.actions.forEach((action) => {
                allActions.push({
                    'Defect ID': defect.id,
                    'Action ID': action.id,
                    'Defect Title': defect.title,
                    'Action Description': action.description,
                    'Responsible': action.responsible,
                    'Status': action.status, // Using the status string provided by user
                    'Due Date': formatDate(action.dueDate),
                    'Completion Date': formatDate(action.completionDate),
                });
            });
        }
    }
    return allActions;
};

// --- Helper for Sheet 3 (Improvement Opportunities) ---
const flattenOpportunities = (defects: FullDefectData[]): OpportunityExcelRow[] => {
    const allOpportunities: OpportunityExcelRow[] = [];
    for (const defect of defects) {
        if (defect.improvementOpportunities && defect.improvementOpportunities.length > 0) {
            defect.improvementOpportunities.forEach((opportunity) => {
                allOpportunities.push({
                    'Defect ID': defect.id,
                    'Opportunity ID': opportunity.id,
                    'Defect Title': defect.title,
                    'Date Identified': formatDate(opportunity.dateIdentified),
                    'Target Area': opportunity.targetArea,
                    'Proposed Action': opportunity.proposedAction,
                    'Implementation Status': opportunity.isImplemented,
                    'Implementation Date': formatDate(opportunity.implementationDate),
                    'Description': opportunity.description,
                });
            });
        }
    }
    return allOpportunities;
};

// --- Helper for Sheet 4 (RCA Analysis) ---
const flattenAnalyses = (defects: FullDefectData[]): AnalysisExcelRow[] => {
    const allAnalyses: AnalysisExcelRow[] = [];
    for (const defect of defects) {
        if (defect.analyses && defect.analyses.length > 0) {
            defect.analyses.forEach((analysis) => {
                allAnalyses.push({
                    'Defect ID': defect.id,
                    'Analysis ID': analysis.id,
                    'Defect Title': defect.title,
                    'Analyst Name': analysis.analystName, // **CRITICAL change**
                    'Analysis Method': analysis.methodUsed,
                    'Analysis Date': formatDate(analysis.analysisDate),
                    'Summary of Findings': analysis.summaryOfFindings,
                    'Root Cause ID': analysis.rootCauseId, // Keeping the ID for reference
                });
            });
        }
    }
    return allAnalyses;
};


// ====================================================================
// 3. EXPORT FUNCTION (FOUR-SHEET VERSION)
// ====================================================================

/**
 * Exports one or more fully loaded Defect objects to a single Excel workbook 
 * with four sheets based on the provided data structure.
 */
export const exportDefectToExcel = async (
    defectToExport: FullDefectData | DefectData | null | undefined
): Promise<Buffer> => {
    
    // 1. Safely convert input to an array
    let dataArray: FullDefectData[];

    if (!defectToExport) {
        dataArray = [];
    } else if (Array.isArray(defectToExport)) {
        dataArray = defectToExport;
    } else {
        dataArray = [defectToExport];
    }

    if (dataArray.length === 0) {
        const emptyWorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(emptyWorkBook, XLSX.utils.json_to_sheet([{ 'Message': 'No defect data to export.' }]), "Defect Log");
        return XLSX.write(emptyWorkBook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }
    
    const workBook = XLSX.utils.book_new();

    // --- Sheet 1: Defect Log (Summary) ---
    const flattenedDefects = dataArray.map(flattenDefectData);
    const defectWorkSheet = XLSX.utils.json_to_sheet(flattenedDefects);

    defectWorkSheet['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, 
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
        { wch: 18 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workBook, defectWorkSheet, "Defect Log");

    // --- Sheet 2: Corrective Actions (Detailed) ---
    const allActions = flattenActions(dataArray);
    const actionsWorkSheet = XLSX.utils.json_to_sheet(allActions);
    actionsWorkSheet['!cols'] = [
        { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 50 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workBook, actionsWorkSheet, "Corrective Actions");

    // --- Sheet 3: Improvement Opportunities (Detailed) ---
    const allOpportunities = flattenOpportunities(dataArray); // **CRITICAL change**
    const ciWorkSheet = XLSX.utils.json_to_sheet(allOpportunities);
    ciWorkSheet['!cols'] = [
        { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, 
        { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(workBook, ciWorkSheet, "Improvement Opportunities"); // **CRITICAL change**

    // --- Sheet 4: Root Cause Analysis (Detailed) ---
    const allAnalyses = flattenAnalyses(dataArray);
    const analysisWorkSheet = XLSX.utils.json_to_sheet(allAnalyses);
    
    analysisWorkSheet['!cols'] = [
        { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, 
        { wch: 18 }, { wch: 14 }, { wch: 60 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workBook, analysisWorkSheet, "Root Cause Analysis");

    // 4. Convert the workbook to a Buffer
    const excelBuffer = XLSX.write(workBook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
    }) as Buffer;
    
    return excelBuffer;
};
// import { 
//     AssigneeType, 
//     DefectStatus, 
//     DefectType, 
//     Priority, 
//     ActionStatus, 
//     AnalysisMethod 
// } from '@prisma/client';
// import * as XLSX from 'xlsx';

// // ====================================================================
// // 1. TYPE DEFINITIONS (Schema Simulation)
// // ====================================================================

// interface CorrectiveActionData {
//     id: string; 
//     description: string;
//     responsible: string;
//     dueDate: Date;
//     completionDate: Date | null;
//     status: ActionStatus; 
// }

// interface RootCauseData {
//     rootCauseText: string;
// }

// interface AnalysisRecordData {
//     id: string; 
//     methodUsed: AnalysisMethod;
//     summaryOfFindings: string;
//     rootCause: RootCauseData | null;
//     analysisDate: Date; 
// }

// interface BreakdownData {
//     startTime: Date;
//     endTime: Date | null;
//     durationMinutes: number | null;
//     causeCategory: string | null;
// }

// interface DefectEliminationData {
//     dateClosed: Date | null;
// }

// interface ImprovementOpportunity {
//     id: string;
//     description: string;
// }

// // --- Main Input Type ---
// export interface FullDefectData {
//     id: string;
//     identificationDate: Date;
//     title: string;
//     description: string;
//     area: string | null;
//     equipmentTag: string | null;
//     reportedby: string | null;
//     type: DefectType; 
//     assignee: AssigneeType;
//     priority: Priority; 
//     status: DefectStatus;
//     breakdownRelated: boolean;
//     createdAt: Date;
//     updatedAt: Date;
    
//     // Relationships 
//     breakdown: BreakdownData | null;
//     eliminationRecord: DefectEliminationData | null;
//     analyses: AnalysisRecordData[]; // For RCA Sheet
//     actions: CorrectiveActionData[]; // For Actions Sheet
//     opportunities: ImprovementOpportunity[]; // For CI Sheet
// }

// type DefectData = FullDefectData[]; 

// // --- Sheet 1: Defect Log Row (Summary Metrics) ---
// export interface ComprehensiveDefectExcelRow {
//     'ID': string;
//     'Identified Date': string;
//     'Title': string;
//     'Description': string;
//     'Status': DefectStatus;
//     'Priority': Priority;
//     'Reported By': string;
//     'Equipment Tag': string | null;
//     'Breakdown Duration (Min)': number | null;
//     'Total Analyses': number;
//     'Total Actions Defined': number;
//     'Action Progress (%)': number;
//     'Total CI Opportunities': number;
//     'Date Closed': string;
// }

// // --- Sheet 2: Corrective Actions Row ---
// export interface ActionExcelRow {
//     'Defect ID': string; 
//     'Action ID': string;
//     'Defect Title': string; 
//     'Action Description': string;
//     'Responsible': string;
//     'Status': ActionStatus;
//     'Due Date': string;
//     'Completion Date': string;
// }

// // --- Sheet 3: CI Opportunities Row ---
// export interface CIOpportunityExcelRow {
//     'Defect ID': string; 
//     'CI ID': string;
//     'Defect Title': string; 
//     'Opportunity Description': string;
// }

// // --- Sheet 4: Root Cause Analysis Row ---
// export interface AnalysisExcelRow {
//     'Defect ID': string;
//     'Analysis ID': string;
//     'Defect Title': string;
//     'Analysis Method': AnalysisMethod;
//     'Analysis Date': string;
//     'Summary of Findings': string;
//     'Root Cause Text': string;
// }


// // ====================================================================
// // 2. HELPER FUNCTIONS
// // ====================================================================

// /**
//  * Safely formats a Date object or ISO string into YYYY-MM-DD format.
//  */
// const formatDate = (date: Date | string | null | undefined): string => {
//     if (!date) return 'N/A';
//     try {
//         const d = date instanceof Date ? date : new Date(date);
//         return d.toISOString().split('T')[0];
//     } catch (e) {
//         return 'Invalid Date';
//     }
// };

// /**
//  * Calculates the percentage of completed actions.
//  */
// const calculateActionProgress = (actions: CorrectiveActionData[]): number => {
//     if (actions.length === 0) return 0;
    
//     const completedActions = actions.filter(
//         (action) => action.status === ActionStatus.COMPLETE
//     ).length;
    
//     return Math.round((completedActions / actions.length) * 100);
// };


// // --- Helper for Sheet 1 (Defect Log) ---
// const flattenDefectData = (defect: FullDefectData): ComprehensiveDefectExcelRow => {
//     const dateClosed = defect.eliminationRecord?.dateClosed;
    
//     return {
//         'ID': defect.id,
//         'Identified Date': formatDate(defect.identificationDate),
//         'Title': defect.title,
//         'Description': defect.description,
//         'Status': defect.status,
//         'Priority': defect.priority,
//         'Reported By': defect.reportedby || 'N/A',
//         'Equipment Tag': defect.equipmentTag || 'N/A',
//         'Breakdown Duration (Min)': defect.breakdown?.durationMinutes ?? null,
//         'Total Analyses': defect.analyses?.length ?? 0,
//         'Total Actions Defined': defect.actions?.length ?? 0,
//         'Action Progress (%)': calculateActionProgress(defect.actions || []),
//         'Total CI Opportunities': defect.opportunities?.length ?? 0,
//         'Date Closed': formatDate(dateClosed),
//     };
// };

// // --- Helper for Sheet 2 (Actions) ---
// const flattenActions = (defects: FullDefectData[]): ActionExcelRow[] => {
//     const allActions: ActionExcelRow[] = [];
//     for (const defect of defects) {
//         if (defect.actions && defect.actions.length > 0) {
//             defect.actions.forEach((action) => {
//                 allActions.push({
//                     'Defect ID': defect.id,
//                     'Action ID': action.id,
//                     'Defect Title': defect.title,
//                     'Action Description': action.description,
//                     'Responsible': action.responsible,
//                     'Status': action.status,
//                     'Due Date': formatDate(action.dueDate),
//                     'Completion Date': formatDate(action.completionDate),
//                 });
//             });
//         }
//     }
//     return allActions;
// };

// // --- Helper for Sheet 3 (CI Opportunities) ---
// const flattenCIOpportunities = (defects: FullDefectData[]): CIOpportunityExcelRow[] => {
//     const allOpportunities: CIOpportunityExcelRow[] = [];
//     for (const defect of defects) {
//         if (defect.opportunities && defect.opportunities.length > 0) {
//             defect.opportunities.forEach((opportunity) => {
//                 allOpportunities.push({
//                     'Defect ID': defect.id,
//                     'CI ID': opportunity.id,
//                     'Defect Title': defect.title,
//                     'Opportunity Description': opportunity.description,
//                 });
//             });
//         }
//     }
//     return allOpportunities;
// };

// // --- Helper for Sheet 4 (RCA Analysis) ---
// const flattenAnalyses = (defects: FullDefectData[]): AnalysisExcelRow[] => {
//     const allAnalyses: AnalysisExcelRow[] = [];
//     for (const defect of defects) {
//         if (defect.analyses && defect.analyses.length > 0) {
//             defect.analyses.forEach((analysis) => {
//                 allAnalyses.push({
//                     'Defect ID': defect.id,
//                     'Analysis ID': analysis.id,
//                     'Defect Title': defect.title,
//                     'Analysis Method': analysis.methodUsed,
//                     'Analysis Date': formatDate(analysis.analysisDate),
//                     'Summary of Findings': analysis.summaryOfFindings,
//                     'Root Cause Text': analysis.rootCause?.rootCauseText || 'N/A',
//                 });
//             });
//         }
//     }
//     return allAnalyses;
// };


// // ====================================================================
// // 3. EXPORT FUNCTION (FOUR-SHEET VERSION)
// // ====================================================================

// /**
//  * Exports one or more fully loaded Defect objects to a single Excel workbook 
//  * with four sheets: Defect Log (Summary), Corrective Actions (Detailed), 
//  * CI Opportunities (Detailed), and Root Cause Analysis (Detailed).
//  */
// export const exportDefectToExcel = async (
//     defectToExport: FullDefectData | DefectData | null | undefined
// ): Promise<Buffer> => {
    
//     // 1. Safely convert input to an array
//     let dataArray: FullDefectData[];

//     if (!defectToExport) {
//         dataArray = [];
//     } else if (Array.isArray(defectToExport)) {
//         dataArray = defectToExport;
//     } else {
//         dataArray = [defectToExport];
//     }

//     if (dataArray.length === 0) {
//         const emptyWorkBook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(emptyWorkBook, XLSX.utils.json_to_sheet([{ 'Message': 'No defect data to export.' }]), "Defect Log");
//         return XLSX.write(emptyWorkBook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
//     }
    
//     const workBook = XLSX.utils.book_new();

//     // --- Sheet 1: Defect Log (Summary) ---
//     const flattenedDefects = dataArray.map(flattenDefectData);
//     const defectWorkSheet = XLSX.utils.json_to_sheet(flattenedDefects);

//     defectWorkSheet['!cols'] = [
//         { wch: 10 }, { wch: 14 }, { wch: 25 }, { wch: 50 }, { wch: 15 }, { wch: 10 }, 
//         { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
//         { wch: 18 }, { wch: 12 }
//     ];
//     XLSX.utils.book_append_sheet(workBook, defectWorkSheet, "Defect Log");

//     // --- Sheet 2: Corrective Actions (Detailed) ---
//     const allActions = flattenActions(dataArray);
//     const actionsWorkSheet = XLSX.utils.json_to_sheet(allActions);
//     actionsWorkSheet['!cols'] = [
//         { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 50 }, 
//         { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
//     ];
//     XLSX.utils.book_append_sheet(workBook, actionsWorkSheet, "Corrective Actions");

//     // --- Sheet 3: CI Opportunities (Detailed) ---
//     const allOpportunities = flattenCIOpportunities(dataArray);
//     const ciWorkSheet = XLSX.utils.json_to_sheet(allOpportunities);
//     ciWorkSheet['!cols'] = [
//         { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 60 }
//     ];
//     XLSX.utils.book_append_sheet(workBook, ciWorkSheet, "CI Opportunities");

//     // --- Sheet 4: Root Cause Analysis (Detailed) ---
//     const allAnalyses = flattenAnalyses(dataArray);
//     const analysisWorkSheet = XLSX.utils.json_to_sheet(allAnalyses);
    
//     analysisWorkSheet['!cols'] = [
//         { wch: 10 }, // Defect ID
//         { wch: 10 }, // Analysis ID
//         { wch: 25 }, // Defect Title
//         { wch: 18 }, // Analysis Method
//         { wch: 14 }, // Analysis Date
//         { wch: 50 }, // Summary of Findings
//         { wch: 40 }, // Root Cause Text
//     ];
//     XLSX.utils.book_append_sheet(workBook, analysisWorkSheet, "Root Cause Analysis");

//     // 4. Convert the workbook to a Buffer
//     const excelBuffer = XLSX.write(workBook, { 
//         type: 'buffer', 
//         bookType: 'xlsx' 
//     }) as Buffer;
    
//     return excelBuffer;
// };