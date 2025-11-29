import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser'; 
import { Prisma, ActivityStatus, ActivityType } from '@prisma/client'; // Import ActivityType

// Define the expected structure of the activity update request body, 
// using string for enums from the client.
interface UpdateActivityBody {
    title?: string;
    description?: string | null;
    startDate?: string | null; 
    dueDate?: string | null; 
    completionDate?: string | null; 
    
    // Client sends these as strings, we validate and convert them to Enums
    status?: ActivityStatus | string; 
    activityType?: ActivityType | string; 
    
    progressPercent?: number; 
    responsibleUserId?: string | null; 
}

/**
 * Handles PUT requests to update a specific Strategy Activity (Action Plan Task).
 * Route: /api/outputs/activity/[activityId]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { activityId: string } } 
) {
    const activityId = params.activityId;

    // 1. 🔒 Authentication Check
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json(
            { message: 'Authentication required to update an activity.' },
            { status: 401 }
        );
    }

    // 2. Parse Request Body
    let body: UpdateActivityBody;
    try {
        body = await request.json() as UpdateActivityBody;
    } catch (e) {
        return NextResponse.json(
            { message: 'Bad Request: Invalid JSON body.' },
            { status: 400 }
        );
    }
    
    try {
        // --- Validation Helpers ---

        /**
         * Safely parses a date string, handling null and empty string ("") as null (clear field).
         */
        const parseAndValidateDate = (dateString: string | null | undefined, fieldName: string) => {
            if (dateString === undefined) return undefined;
            if (dateString === null || dateString === '') return null; // Treat empty string as clearing the field

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date format provided for ${fieldName}: "${dateString}". Expected ISO 8601 or Date string.`);
            }
            return date;
        };

        /**
         * Validates the progress percentage.
         */
        const validateProgress = (progress?: number) => {
            if (progress === undefined) return undefined;
            if (typeof progress !== 'number' || progress < 0 || progress > 100) {
                throw new Error('Invalid value for progressPercent. Must be an integer between 0 and 100.');
            }
            return progress;
        }

        // --- Execute Validation ---
        const parsedStartDate = parseAndValidateDate(body.startDate, 'startDate');
        const parsedDueDate = parseAndValidateDate(body.dueDate, 'dueDate');
        const parsedCompletionDate = parseAndValidateDate(body.completionDate, 'completionDate');
        const validatedProgress = validateProgress(body.progressPercent);

        // Prepare Enum fields
        let validatedStatus: ActivityStatus | undefined = undefined;
        if (body.status) {
            const uppercasedStatus = (body.status as string).toUpperCase();
            if (!Object.keys(ActivityStatus).includes(uppercasedStatus)) {
                throw new Error(`Invalid status provided: ${body.status}.`);
            }
            validatedStatus = uppercasedStatus as ActivityStatus;
        }

        let validatedActivityType: ActivityType | undefined = undefined;
        if (body.activityType) {
            const uppercasedType = (body.activityType as string).toUpperCase();
            if (!Object.keys(ActivityType).includes(uppercasedType)) {
                throw new Error(`Invalid activity type provided: ${body.activityType}.`);
            }
            validatedActivityType = uppercasedType as ActivityType;
        }

        // --- Prepare Data Payload ---
        const dataToUpdate: Prisma.StrategyActivityUpdateInput = {
            // String/Number fields
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(validatedProgress !== undefined && { progressPercent: validatedProgress }),

            // Date fields
            ...(parsedStartDate !== undefined && { startDate: parsedStartDate }),
            ...(parsedDueDate !== undefined && { dueDate: parsedDueDate }),
            ...(parsedCompletionDate !== undefined && { completionDate: parsedCompletionDate }),
            
            // Enum fields (Type safety achieved by using validated enum variables)
            ...(validatedStatus !== undefined && { status: validatedStatus }),
            ...(validatedActivityType !== undefined && { activityType: validatedActivityType }),
            
            // Relationship field (Handles clearing the foreign key by accepting "" and converting to null)
            ...(body.responsibleUserId !== undefined && { 
                responsibleUserId: body.responsibleUserId === '' ? null : body.responsibleUserId 
            }),
        };

        // Check if there's anything to update
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json(
                { message: 'No valid fields provided for update.' },
                { status: 400 }
            );
        }

        // 3. Update the StrategyActivity record in the database
        const updatedActivity = await prisma.strategyActivity.update({
            where: {
                id: activityId,
            },
            data: dataToUpdate,
        });

        // 4. Return the updated activity object
        return NextResponse.json(updatedActivity, { status: 200 });

    } catch (error) {
        console.error('API Error updating strategy activity:', error);

        let errorMessage = 'Failed to update strategy activity due to a server error.';
        let statusCode = 500;

        // Handle validation errors thrown in the try block
        if (error instanceof Error) {
             if (error.message.includes('Invalid date format') || error.message.includes('Invalid value') || error.message.includes('Invalid status') || error.message.includes('Invalid activity type')) {
                errorMessage = error.message;
                statusCode = 400; // Bad Request
             }
        }

        // Handle specific Prisma errors (e.g., record not found)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            errorMessage = `Strategy Activity with ID ${activityId} not found.`;
            statusCode = 404; // Not Found
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: statusCode }
        );
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "../../../../libs/prismadb"; 
// import getCurrentUser from '@/app/actions/getCurrentUser'; // 🚨 Added required import
// import { Prisma, ActivityStatus, StrategyActivity } from '@prisma/client';

// // Define the expected structure of the activity update request body,
// // aligned with the StrategyActivity model and its enums (ActivityStatus)
// interface UpdateActivityBody {
//     // Fields that exist on StrategyActivity
//     title?: string;
//     description?: string | null;
//     startDate?: string | null; // Will be converted to Date
//     dueDate?: string | null; // Will be converted to Date
//     completionDate?: string | null; // Will be converted to Date
    
//     // Using the correct ActivityStatus enum values
//     status?: ActivityStatus | string; // Use the imported Enum type
    
//     // Numerical/Relational fields
//     progressPercent?: number; // 0-100
//     responsibleUserId?: string | null; // Note: Ensure this field exists in your StrategyActivity model
// }

// /**
//  * Handles PUT requests to update a specific Strategy Activity (Action Plan Task).
//  * Route: /api/contracts/activity/[activityId]
//  * * NOTE: The file name for this route should be [activityId]/route.ts
//  */
// export async function PUT(
//     request: NextRequest,
//     { params }: { params: { activityId: string } } // Access path parameters
// ) {
//     const activityId = params.activityId;

//     // 1. 🔒 Authentication Check (REQUIRED)
//     const currentUser = await getCurrentUser();
//     if (!currentUser) {
//         return NextResponse.json(
//             { message: 'Authentication required to update an activity.' },
//             { status: 401 } // Unauthorized
//         );
//     }

//     // 2. Parse Request Body
//     let body: UpdateActivityBody;
//     try {
//         body = await request.json() as UpdateActivityBody;
//     } catch (e) {
//         return NextResponse.json(
//             { message: 'Bad Request: Invalid JSON body.' },
//             { status: 400 }
//         );
//     }
    
//     try {
//         // Helper function for date parsing and validation
//         const parseAndValidateDate = (dateString: string | null | undefined, fieldName: string) => {
//             if (dateString === undefined) return undefined;
//             if (dateString === null) return null;

//             const date = new Date(dateString);
//             if (isNaN(date.getTime())) {
//                 throw new Error(`Invalid date format provided for ${fieldName}.`);
//             }
//             return date;
//         };

//         // Validate and prepare date fields
//         const parsedStartDate = parseAndValidateDate(body.startDate, 'startDate');
//         const parsedDueDate = parseAndValidateDate(body.dueDate, 'dueDate');
//         const parsedCompletionDate = parseAndValidateDate(body.completionDate, 'completionDate');

//         // Prepare the data payload for Prisma update
//         const dataToUpdate: Prisma.StrategyActivityUpdateInput = {
//             // Conditional updates for string/number fields
//             ...(body.title !== undefined && { title: body.title }),
//             ...(body.description !== undefined && { description: body.description }),
//             ...(body.responsibleUserId !== undefined && { responsibleUserId: body.responsibleUserId }),
//             ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),

//             // Conditional updates for validated Date fields
//             ...(parsedStartDate !== undefined && { startDate: parsedStartDate }),
//             ...(parsedDueDate !== undefined && { dueDate: parsedDueDate }),
//             ...(parsedCompletionDate !== undefined && { completionDate: parsedCompletionDate }),

//             // Conditional updates for Enum field
//             // Ensure status is uppercase before casting to the Enum type
//             ...(body.status && { status: body.status.toUpperCase() as ActivityStatus }), 
//         };

//         // Check if there's anything to update
//         if (Object.keys(dataToUpdate).length === 0) {
//             return NextResponse.json(
//                 { message: 'No valid fields provided for update.' },
//                 { status: 400 }
//             );
//         }

//         // 3. Update the StrategyActivity record in the database
//         const updatedActivity = await prisma.strategyActivity.update({
//             where: {
//                 id: activityId,
//             },
//             data: dataToUpdate,
//         });

//         // 4. Return the updated activity object
//         return NextResponse.json(updatedActivity, { status: 200 });

//     } catch (error) {
//         console.error('API Error updating strategy activity:', error);

//         // Handle specific date validation error thrown in the try block
//         if (error instanceof Error && error.message.includes('Invalid date format')) {
//             return NextResponse.json(
//                 { message: error.message },
//                 { status: 400 }
//             );
//         }

//         // Handle specific Prisma errors (e.g., record not found)
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json(
//                 { message: `Strategy Activity with ID ${activityId} not found.` },
//                 { status: 404 }
//             );
//         }

//         // Handle other server errors
//         return NextResponse.json(
//             { message: 'Failed to update strategy activity due to a server error.' },
//             { status: 500 }
//         );
//     }
// }