import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser'; // 🚨 Added required import
import { Prisma, ActivityStatus, StrategyActivity } from '@prisma/client';

// Define the expected structure of the activity update request body,
// aligned with the StrategyActivity model and its enums (ActivityStatus)
interface UpdateActivityBody {
    // Fields that exist on StrategyActivity
    title?: string;
    description?: string | null;
    startDate?: string | null; // Will be converted to Date
    dueDate?: string | null; // Will be converted to Date
    completionDate?: string | null; // Will be converted to Date
    
    // Using the correct ActivityStatus enum values
    status?: ActivityStatus | string; // Use the imported Enum type
    
    // Numerical/Relational fields
    progressPercent?: number; // 0-100
    responsibleUserId?: string | null; // Note: Ensure this field exists in your StrategyActivity model
}

/**
 * Handles PUT requests to update a specific Strategy Activity (Action Plan Task).
 * Route: /api/contracts/activity/[activityId]
 * * NOTE: The file name for this route should be [activityId]/route.ts
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { activityId: string } } // Access path parameters
) {
    const activityId = params.activityId;

    // 1. 🔒 Authentication Check (REQUIRED)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json(
            { message: 'Authentication required to update an activity.' },
            { status: 401 } // Unauthorized
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
        // Helper function for date parsing and validation
        const parseAndValidateDate = (dateString: string | null | undefined, fieldName: string) => {
            if (dateString === undefined) return undefined;
            if (dateString === null) return null;

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date format provided for ${fieldName}.`);
            }
            return date;
        };

        // Validate and prepare date fields
        const parsedStartDate = parseAndValidateDate(body.startDate, 'startDate');
        const parsedDueDate = parseAndValidateDate(body.dueDate, 'dueDate');
        const parsedCompletionDate = parseAndValidateDate(body.completionDate, 'completionDate');

        // Prepare the data payload for Prisma update
        const dataToUpdate: Prisma.StrategyActivityUpdateInput = {
            // Conditional updates for string/number fields
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.responsibleUserId !== undefined && { responsibleUserId: body.responsibleUserId }),
            ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),

            // Conditional updates for validated Date fields
            ...(parsedStartDate !== undefined && { startDate: parsedStartDate }),
            ...(parsedDueDate !== undefined && { dueDate: parsedDueDate }),
            ...(parsedCompletionDate !== undefined && { completionDate: parsedCompletionDate }),

            // Conditional updates for Enum field
            // Ensure status is uppercase before casting to the Enum type
            ...(body.status && { status: body.status.toUpperCase() as ActivityStatus }), 
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

        // Handle specific date validation error thrown in the try block
        if (error instanceof Error && error.message.includes('Invalid date format')) {
            return NextResponse.json(
                { message: error.message },
                { status: 400 }
            );
        }

        // Handle specific Prisma errors (e.g., record not found)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json(
                { message: `Strategy Activity with ID ${activityId} not found.` },
                { status: 404 }
            );
        }

        // Handle other server errors
        return NextResponse.json(
            { message: 'Failed to update strategy activity due to a server error.' },
            { status: 500 }
        );
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "../../../../libs/prismadb" // Assuming this path is correct
// import { Prisma, StrategyActivity } from '@prisma/client';

// // Define the expected structure of the activity update request body,
// // aligned with the StrategyActivity model and its enums (ActivityStatus)
// interface UpdateActivityBody {
//     // Fields that exist on StrategyActivity
//     title?: string;
//     description?: string | null;
//     startDate?: string | null; // Will be converted to Date
//     dueDate?: string | null; // Will be converted to Date
//     completionDate?: string | null; // Will be converted to Date
//     
//     // Using the correct ActivityStatus enum values
//     status?: 'SCHEDULED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED' | string;
//     
//     // Numerical/Relational fields
//     progressPercent?: number; // 0-100
//     responsibleUserId?: string | null; // Replaces 'responsiblePersons'
// }

// /**
//  * Handles PUT requests to update a specific Strategy Activity (Action Plan Task).
//  * Route: /api/contracts/activity/[activityId]
//  */
// export async function PUT(
//     request: NextRequest,
//     { params }: { params: { activityId: string } } // Access path parameters
// ) {
//     const activityId = params.activityId;

//     // 1. Parse Request Body
//     let body: UpdateActivityBody;
//     try {
//         body = await request.json();
//     } catch (e) {
//         return NextResponse.json(
//             { message: 'Bad Request: Invalid JSON body.' },
//             { status: 400 }
//         );
//     }
//     
//     // NOTE: We allow partial updates (PUT/PATCH behavior), so minimal validation here.
//     
//     try {
//         // Prepare the data payload for Prisma update, only including fields provided in the body
//         // Use StrategyActivityUpdateInput, which is the correct generated type
//         const dataToUpdate: Prisma.StrategyActivityUpdateInput = {
//             // Conditional updates for string/number fields
//             ...(body.title && { title: body.title }),
//             ...(body.description !== undefined && { description: body.description }),
//             ...(body.responsibleUserId !== undefined && { responsibleUserId: body.responsibleUserId }),
//             ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),

//             // Conditional updates for Date fields (converting string to Date or null)
//             ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
//             ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
//             ...(body.completionDate !== undefined && { completionDate: body.completionDate ? new Date(body.completionDate) : null }),

//             // Conditional updates for Enum field
//             ...(body.status && { status: body.status as StrategyActivity['status'] }), 

//             updatedAt: new Date(), // Explicitly set the update timestamp (if not using @updatedAt)
//         };

//         // 3. Update the StrategyActivity record in the database
//         const updatedActivity = await prisma.strategyActivity.update({
//             where: {
//                 id: activityId,
//             },
//             data: dataToUpdate,
//         });

//         // 4. Return the updated activity object
//         return NextResponse.json(updatedActivity, { status: 200 });

//     } catch (error) {
//         console.error('API Error updating strategy activity:', error);

//         // Handle specific Prisma errors (e.g., record not found)
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json(
//                 { message: `Strategy Activity with ID ${activityId} not found.` },
//                 { status: 404 }
//             );
//         }

//         // Handle other server errors
//         return NextResponse.json(
//             { message: 'Failed to update strategy activity due to a server error.' },
//             { status: 500 }
//         );
//     }
// }