import * as XLSX from 'xlsx';
// Removed 'import prisma from '../libs/prismadb';' as the function no longer queries the DB

// ====================================================================
// 1. TYPE DEFINITIONS (Based on the data array structure you provided)
// ====================================================================

interface Vote {
    id: string;
    voterId: string;
    voteType: 'YES' | 'NO'; // Uses 'voteType'
    email: string;
    name: string;
    timestamp: string;
    updatedAt: string;
}

interface Outcome {
    id: string;
    title: string;
    outputs: any[] | null; // Added null for safety
}

interface Goal {
    id: string;
    title: string;
    description: string | null;
    targetYear: number;
    strategyId: string;
    outcomes: Outcome[] | null; // Added null for safety
}

interface StrategyData {
    id: string;
    title: string;
    status: string;
    averageStrategicScore: number;
    submissionDate: Date | null;
    createdAt: Date;
    author: { name: string | null; email: string | null; };
    individualVotes: Vote[] | null; // Uses 'individualVotes' property
    goals: Goal[] | null; // Added null for safety
    // ... other properties not used in export, but part of the object
}


// ====================================================================
// 2. HELPER FUNCTION
// ====================================================================

// Helper function to flatten the complex object into a single row object
const flattenStrategyData = (strategy: StrategyData) => {
    
    // --- Safe Initialization (Prevents "Cannot read properties of undefined") ---
    const goalsArray = strategy.goals ?? []; 
    // FIX: Use individualVotes property
    const votesArray = strategy.individualVotes ?? []; 
    
    // --- 1. Aggregate and Concatenate Nested Data ---
    
    // Goal Titles
    const goalTitles = goalsArray.map((goal) => goal.title).join(' | '); 

    // Outcomes Summary
    const outcomesSummary = goalsArray.flatMap((goal) => {
        const outcomesArray = goal.outcomes ?? [];
        return outcomesArray.map((outcome) => 
            // Ensure outputs is an array before checking length
            `${outcome.title} [Outputs: ${(outcome.outputs ?? []).length}]`
        );
    }).join(' | ');

    // Count Votes 
    // FIX: Use vote.voteType
    const totalVotesYes = votesArray.filter((vote) => vote.voteType === 'YES').length;
    const totalVotesNo = votesArray.filter((vote) => vote.voteType === 'NO').length;
    
    // --- 2. Construct the Flattened Row ---
    return {
        // Core Strategy Details
        ID: strategy.id,
        Title: strategy.title,
        Status: strategy.status,
        Avg_Score: strategy.averageStrategicScore,
        // Safely format Date object
        //Submission_Date: strategy.submissionDate ? strategy.submissionDate.toISOString().split('T')[0] : 'N/A',

        // **FIX 1: Handle submissionDate**
        // Since strategy.submissionDate is an ISO string after JSON transfer, 
        // we use string methods to extract the date part (YYYY-MM-DD).
        Submission_Date: strategy.submissionDate 
            ? strategy.submissionDate.toString().split('T')[0] 
            : 'N/A',
        
        // Author Details
        Author_Name: strategy.author.name || 'N/A',
        Author_Email: strategy.author.email || 'N/A',
        
        // Voting Summary
        Total_Votes_YES: totalVotesYes,
        Total_Votes_NO: totalVotesNo,
        
        // Goals and Outcomes Summary (Flattened)
        Goal_Titles: goalTitles,
        Outcomes_Summary: outcomesSummary,
        
        // Dates
        Created_At: strategy.createdAt?.toISOString(),
    };
};

// ====================================================================
// 3. EXPORT FUNCTION
// ====================================================================

/**
 * Accepts an array of strategies (already fetched and filtered) and generates the Excel file buffer.
 * @param strategiesToExport - The array of filtered strategies to be exported.
 * @returns A Buffer containing the XLSX file data.
 */
export const exportStrategiesToExcel = async (strategiesToExport: StrategyData[]): Promise<Buffer> => {
    
    // CRITICAL: Function now uses the input argument (strategiesToExport) 
    // instead of querying the database.

    // 1. Flatten the data structure
    const flattenedData = strategiesToExport.map(flattenStrategyData);

    // 2. Create the Excel workbook
    const workSheet = XLSX.utils.json_to_sheet(flattenedData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Strategies");

    // 3. Convert the workbook to a Buffer
    const excelBuffer = XLSX.write(workBook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
    }) as Buffer;
    
    return excelBuffer;
};