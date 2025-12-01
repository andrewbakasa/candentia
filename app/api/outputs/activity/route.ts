import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import { 
    Prisma, 
    ActivityStatus, 
    ActivityType 
} from '@prisma/client'; 

// --- 1. Update Request Body Interface ---
interface StrategyActivityBody {
    title: string;
    dueDate: string; 
    description: string;
    startDate?: string | null; // Allow null to match DB model
    completionDate?: string | null; // Allow null to match DB model
    progressPercent?: number;
    activityType: ActivityType | string; 
    status: ActivityStatus | string;     
    outputId: string; // The ID of the parent StrategyOutput
}


// Helper function for robust date parsing (handles "", null, and invalid strings)
const parseAndValidateDate = (dateString: string | null | undefined, fieldName: string) => {
    if (!dateString) return null; // Treat empty string or null/undefined as null (no date)

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format provided for ${fieldName}: "${dateString}". Expected ISO 8601 or Date string.`);
    }
    return date;
};


/**
 * Handles POST requests to create a new Contract Activity (task/follow-up/review)
 * linked to a specific StrategyOutput (outputId).
 */
export async function POST(request: NextRequest) {
    
    // 1. 🔒 Authentication Check (Early Exit)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json(
            { message: 'Unauthorized: Authentication required to create an activity.' },
            { status: 401 }
        );
    }

    // 2. 📝 Parse Request Body & Type Assertion
    let body: StrategyActivityBody; 
    try {
        body = await request.json() as StrategyActivityBody;
        console.log("body------>",body )
    } catch (e) {
        return NextResponse.json(
            { message: 'Invalid JSON format in request body.' },
            { status: 400 } 
        );
    } 
    
    try {
        // 3. 🎯 Input Validation
        const { 
            outputId, 
            title, 
            dueDate, 
            description, 
            activityType, 
            status, 
            startDate, 
            completionDate, 
            progressPercent 
        } = body;
        
        // Check for mandatory fields
        if (!outputId || !title?.trim() || !dueDate?.trim() || !description?.trim() || !activityType || !status) {
            return NextResponse.json(
                { message: 'Missing required fields: outputId, title, dueDate, description, activityType, status.' },
                { status: 400 }
            );
        }
        
        // --- Date Validation & Parsing ---
        const parsedDueDate = parseAndValidateDate(dueDate, 'dueDate');
        if (parsedDueDate === null) {
             return NextResponse.json( // dueDate cannot be null/empty string as it is required
                { message: 'Due Date is required and must be a valid date.' },
                { status: 400 }
            );
        }

        const parsedStartDate = parseAndValidateDate(startDate, 'startDate');
        const parsedCompletionDate = parseAndValidateDate(completionDate, 'completionDate');
        
        // --- Enum Validation ---
        const uppercasedActivityType = (activityType as string).toUpperCase();
        if (!Object.keys(ActivityType).includes(uppercasedActivityType)) {
            throw new Error(`Invalid activity type provided: ${activityType}.`);
        }
        
        const uppercasedStatus = (status as string).toUpperCase();
        if (!Object.keys(ActivityStatus).includes(uppercasedStatus)) {
            throw new Error(`Invalid status provided: ${status}.`);
        }

        // 4. ⚙️ Data Preparation and Formatting
        const data: Prisma.StrategyActivityUncheckedCreateInput = {
            // Required fields
            title: title.trim(),
            description: description.trim(),
            dueDate: parsedDueDate,
            outputId, 
            
            // Validated Enum fields
            activityType: uppercasedActivityType as ActivityType, 
            status: uppercasedStatus as ActivityStatus,

            // Optional fields
            ...(parsedStartDate !== null && { startDate: parsedStartDate }),
            ...(parsedCompletionDate !== null && { completionDate: parsedCompletionDate }),
            // Ensure progressPercent is a number if provided, clamp if necessary
            ...(progressPercent !== undefined && { progressPercent: Math.min(100, Math.max(0, Number(progressPercent))) }),
        };

        // 5. 💾 Database Operation
        const newActivity = await prisma.strategyActivity.create({
            data,
        });

        // 6. ✅ Success Response
        return NextResponse.json(newActivity, { status: 201 });
        
    } catch (error) { 
        // 7. ⚠️ Error Handling
        console.error('Contract activity creation failed:', error);
        
        let message = 'Internal Server Error: Failed to save new contract activity.';
        if (error instanceof Error) {
            // Handle validation errors
            if (error.message.includes('Invalid date format') || error.message.includes('Invalid status') || error.message.includes('Invalid activity type')) {
                 return NextResponse.json(
                    { message: error.message },
                    { status: 400 } // Bad Request
                );
            }
            if (process.env.NODE_ENV === 'development') {
                 message = `Development Error: ${error.message}`;
            }
        } 

        return NextResponse.json(
            { message },
            { status: 500 }
        );
    } 
}