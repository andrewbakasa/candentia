import * as XLSX from 'xlsx';
import prisma from '../libs/prismadb';
import { StrategyWithVotesAndGoals } from './getStrategies'; // Re-enabled type import

// Helper function to flatten the complex object into a single row object
const flattenStrategyData = (strategy: any) => {
    
    // --- 1. Aggregate and Concatenate Nested Data ---
    const goalTitles = strategy.goals.map((goal: { title: any; }) => goal.title).join(' | ');

    const outcomesSummary = strategy.goals.flatMap((goal: { outcomes: any[]; }) => 
        goal.outcomes.map((outcome: { title: any; outputs: string | any[]; }) => 
            `${outcome.title} [Outputs: ${outcome.outputs.length}]`
        )
    ).join(' | ');

    // Count Votes
    const totalVotesYes = strategy.votes.filter((vote: { type: string; }) => vote.type === 'YES').length;
    const totalVotesNo = strategy.votes.filter((vote: { type: string; }) => vote.type === 'NO').length;
    
    // --- 2. Construct the Flattened Row ---
    return {
        // Core Strategy Details
        ID: strategy.id,
        Title: strategy.title,
        Status: strategy.status,
        Avg_Score: strategy.averageStrategicScore,
        // Safely format Date object
        Submission_Date: strategy.submissionDate ? strategy?.submissionDate?.toISOString().split('T')[0] : 'N/A',
        
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
        Created_At: strategy?.createdAt?.toISOString(),
    };
};

/**
 * Executes the query, flattens the data, and generates the Excel file buffer.
 * @returns A Buffer containing the XLSX file data.
 */
export const exportStrategiesToExcel = async (): Promise<Buffer> => {
    
    // Replicating your provided Prisma query and applying the necessary type assertion
    const rawStrategies = await prisma.strategy.findMany({
        include: {
            author: true,
            votes: { include: { voter: { select: { id: true, name: true, email: true } } } },
            goals: { include: { outcomes: { include: { outputs: true } } } },
        },
        orderBy: [
            { averageStrategicScore: 'desc' },
            { submissionDate: 'desc' },
        ]
    }) //as StrategyWithVotesAndGoals[]; // <-- Type Assertion Re-enabled

    // 1. Flatten the data structure
    const flattenedData = rawStrategies.map(flattenStrategyData);

    // 2. Create the Excel workbook
    const workSheet = XLSX.utils.json_to_sheet(flattenedData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Strategies");

    // 3. Convert the workbook to a Buffer
    const excelBuffer = XLSX.write(workBook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
    }) as Buffer; // <-- FIX: Explicitly cast the result to Buffer to resolve TypeScript error
    
    return excelBuffer;
};