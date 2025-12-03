import { NextRequest, NextResponse } from 'next/server';
// Assuming these imports are correctly aliased and available in your environment
import prisma from '../../../libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
// Correctly imported enums based on your schema
import { DefectStatus, ActionStatus } from '@prisma/client'; 

// --- POST handler: Creating a Corrective Action ---
export async function POST(request: NextRequest) {
    let sourceId: string | undefined; // defectId, rootCauseId, or improvementId used as sourceId

    try {
        // Log 0.1: Start of request handling
        console.log("--- START POST /api/defects/ca (Create Corrective Action) ---");
        
        const body = await request.json();
        console.log("Log 1. Request Body Received:", body);

        const currentUser = await getCurrentUser();
        
        // 0. Authentication Check
        if (!currentUser) {
            console.log("Log 0.2: Authentication failed. User not logged in.");
            return NextResponse.json(
                { message: 'Authentication required to submit a Corrective Action.' },
                { status: 401 }
            );
        }
        console.log(`Log 0.3: User authenticated. User ID: ${currentUser.id}`);
        
        // 1. Data Destructuring
        const { 
            sourceId: requestSourceId, // ID of the defect from the frontend form
            description, 
            responsible, 
            dueDate, // Date string (YYYY-MM-DD)
            status,  // ActionStatus enum value
        } = body;
        
        // Use requestSourceId as the internal sourceId (defect ID, as this route is /api/defects/ca)
        sourceId = requestSourceId;

        console.log("Log 1.1 Destructured Data:", { sourceId, description, responsible, dueDate, status });

        // 1.1. Validation
        if (!description || !responsible || !dueDate || !status) {
            console.log("Log 1.2: Validation failed. Missing mandatory fields.");
            return NextResponse.json(
                { message: 'Missing required fields: description, responsible, dueDate, and status are mandatory to define a Corrective Action.' },
                { status: 400 }
            );
        }
        
        // Validate Status field against the ActionStatus enum
        if (!Object.values(ActionStatus).includes(status)) {
            console.log("Log 1.3: Invalid status value provided.");
            return NextResponse.json(
                { message: `Invalid status value: ${status}. Must be one of ${Object.values(ActionStatus).join(', ')}` },
                { status: 400 }
            );
        }

        // 2. Perform Transactional Database Operations (Creation and Optional Status Update)
        const newActionRecord = await prisma.$transaction(async (tx) => {
            console.log("Log 2.0: Starting Prisma transaction...");
            
            // Prepare completion date if the action is created in COMPLETE status
            let completionDate: Date | undefined = undefined;
            if (status === ActionStatus.COMPLETE) {
                // Use completionDate as per the CorrectiveAction model
                completionDate = new Date(); 
            }
            
            // === Defect-Driven Path (sourceId is present and assumed to be a Defect ID) ===
            if (sourceId) {
                console.log(`Log 2.1: Source Defect ID found (${sourceId}). Checking and updating defect status.`);

                // Step A: Check if the source Defect exists
                const existingDefect = await tx.defect.findUnique({
                    where: { id: sourceId as string },
                    select: { id: true } 
                });
                
                if (!existingDefect) {
                    console.log("Log 2.2: Defect not found in DB. Throwing error.");
                    throw new Error('No Defect found to link the Corrective Action.');
                }
                
                // Step B: Update the parent Defect's status to indicate action has been defined
                const updatedDefect = await tx.defect.update({
                    where: { id: sourceId as string }, 
                    data: { 
                        status: DefectStatus.ACTION_DEFINED, 
                    },
                });
                console.log(`Log 2.3: Defect status updated to ${DefectStatus.ACTION_DEFINED}:`, updatedDefect.id);
            
            } else {
                console.log("Log 2.1: Source ID not provided. Creating independent Corrective Action.");
            }
            
            // Step C: Create the CorrectiveAction record
            const createdAction = await tx.correctiveAction.create({
                data: {
                    description: description.trim(), 
                    responsible: responsible.trim(),
                    // Convert YYYY-MM-DD string to a proper Date object
                    dueDate: new Date(dueDate), 
                    status: status,
                    // CORRECTION 1: Use 'defectId' as per the schema
                    defectId: sourceId, 
                    // CORRECTION 2: Use 'completionDate' as per the schema
                    completionDate: completionDate, 
                    // Link to the user who created it (Assuming the User model exists and is linked)
                    // createdBy: { connect: { id: currentUser.id } }, // Assuming a 'createdBy' relation exists on CorrectiveAction
                },
            });
            console.log("Log 2.4: Corrective Action Created Successfully:", createdAction.id);
            return createdAction;
        });

        // 3. Return the created Corrective Action record with status 201 (Created)
        console.log("Log 3.0: Transaction complete. Returning success response.");
        return NextResponse.json(newActionRecord, { status: 201 });
        
    } catch (error) {
        const logId = sourceId || 'unknown';
        console.error(`--- ERROR Corrective Action creation failed for Source ID ${logId}:`, error);
        
        let statusCode = 500;
        let message = 'Internal Server Error: Failed to save the Corrective Action.';
        
        if (error instanceof Error && error.message.includes('No Defect found')) {
            statusCode = 404;
            message = `Source Defect with ID ${logId} not found.`;
            console.log("Log E.1: Identified 404 error: Defect not found.");
        } else if (error instanceof Error) {
            console.log(`Log E.2: Specific Error Message: ${error.message}`);
        }

        // Detailed error message for development environment
        if (process.env.NODE_ENV === 'development') {
            message = `Error in route.ts: ${(error as Error).message}`;
        }

        return NextResponse.json(
            { message: message },
            { status: statusCode }
        );
    }
}
