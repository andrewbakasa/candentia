import { NextRequest, NextResponse } from 'next/server';
// Assuming these imports are correctly aliased and available in your environment
import prisma from '../../../libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import { DefectStatus } from '@prisma/client'; // Assuming DefectStatus enum is available

// --- POST handler: Creating an Improvement Opportunity ---
export async function POST(request: NextRequest) {
    let defectId: string | undefined;

    try {
        // Log 0.1: Start of request handling
        console.log("--- START POST /api/improvementOpportunity ---");
        
        const body = await request.json();
        console.log("Log 1. Request Body Received:", body);

        const currentUser = await getCurrentUser();
        
        // 0. Authentication Check
        if (!currentUser) {
            console.log("Log 0.2: Authentication failed. User not logged in.");
            return NextResponse.json(
                { message: 'Authentication required to submit an Improvement Opportunity.' },
                { status: 401 }
            );
        }
        console.log(`Log 0.3: User authenticated. User ID: ${currentUser.id}`);
        
        // 1. Data Destructuring
        const { 
            sourceId,           // ID of the defect from the frontend form (optional)
            proposedAction,          
            targetArea,             
            description             // Explicitly allow custom description
        } = body;
        console.log("Log 1.1 Destructured Data:", { sourceId, proposedAction, targetArea, description });

        defectId = sourceId;

        // 1.1. Validation
        if (!proposedAction || !targetArea) {
            console.log("Log 1.2: Validation failed. Missing mandatory fields.");
            return NextResponse.json(
                { message: 'Missing required fields: proposedAction and targetArea are mandatory to define an opportunity.' },
                { status: 400 }
            );
        }
        
        // 2. Perform Transactional Database Operations (Creation and Optional Status Update)
        const newOpportunityRecord = await prisma.$transaction(async (tx) => {
            console.log("Log 2.0: Starting Prisma transaction...");
            
            let sourceModule: string | null = null;
            let finalDescription: string = description || proposedAction; 

            // === PATH 1: DEFECT-DRIVEN OPPORTUNITY (defectId is present) ===
            if (defectId) {
                console.log(`Log 2.1: Defect ID found (${defectId}). Entering Defect-driven path.`);

                // Step A: Check if the source Defect exists and fetch its 'area'
                const existingDefect = await tx.defect.findUnique({
                    where: { id: defectId as string },
                    select: { id: true, area: true } 
                });
                console.log("Log 2.2: Existing Defect check result:", existingDefect);

                if (!existingDefect) {
                    console.log("Log 2.3: Defect not found in DB. Throwing error.");
                    throw new Error('No Defect found');
                }
                
                // Use the defect's area as the source module
                sourceModule = existingDefect.area || 'Unknown Defect Area';
                
                // If a description wasn't explicitly provided, create a traceable default
                if (!description) {
                    finalDescription = `Opportunity identified from Defect ID: ${defectId}.`;
                }
                
                // Step B: Update the parent Defect's status
                const updatedDefect = await tx.defect.update({
                    where: { id: defectId as string }, 
                    data: { 
                        status: DefectStatus.ACTION_DEFINED, 
                    },
                });
                console.log(`Log 2.4: Defect status updated to ${DefectStatus.ACTION_DEFINED}:`, updatedDefect.id);
            
            } else {
                // === PATH 2: INDEPENDENT OPPORTUNITY (defectId is NOT present) ===
                console.log("Log 2.1: Defect ID not found. Entering Independent Opportunity path.");
                sourceModule = 'Proactive CI Initiative';
                if (!description) {
                    finalDescription = `Independent Improvement Opportunity identified on ${new Date().toLocaleDateString()}.`;
                }
            }
            
            console.log("Log 2.5: Final data for creation:", {
                description: finalDescription, 
                proposedAction: proposedAction,
                targetArea: targetArea,
                sourceModule: sourceModule, 
                sourceDefectId: defectId, 
            });

            // Step C: Create the ImprovementOpportunity record
            const createdOpportunity = await tx.improvementOpportunity.create({
                data: {
                    description: finalDescription, 
                    proposedAction: proposedAction,
                    targetArea: targetArea,
                    sourceModule: sourceModule, 
                    sourceDefectId: defectId,    // Will be null if defectId was undefined
                },
            });
            console.log("Log 2.6: Improvement Opportunity Created Successfully:", createdOpportunity);
            return createdOpportunity;
        });

        // 3. Return the created ImprovementOpportunity record with status 201 (Created)
        console.log("Log 3.0: Transaction complete. Returning success response.");
        return NextResponse.json(newOpportunityRecord, { status: 201 });
        
    } catch (error) {
        const logId = defectId || 'unknown';
        console.error(`--- ERROR Improvement Opportunity creation failed for Defect ID ${logId}:`, error);
        
        let statusCode = 500;
        let message = 'Internal Server Error: Failed to save the Improvement Opportunity.';
        
        // Check for 404 error thrown in the transaction block
        if (error instanceof Error && error.message.includes('No Defect found')) {
            statusCode = 404;
            message = `Source Defect with ID ${logId} not found.`;
            console.log("Log E.1: Identified 404 error: Defect not found.");
        } else if (error instanceof Error) {
            // Log specific database/Prisma error message
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
// import { NextRequest, NextResponse } from 'next/server';
// // Assuming these imports are correctly aliased and available in your environment
// import prisma from '../../../libs/prismadb'; 
// import getCurrentUser from '@/app/actions/getCurrentUser';
// import { DefectStatus } from '@prisma/client'; // Assuming DefectStatus enum is available

// // --- POST handler: Creating an Improvement Opportunity ---
// export async function POST(request: NextRequest) {
//     let defectId: string | undefined;

//     try {
//         const body = await request.json();
//         const currentUser = await getCurrentUser();
        
//         // 0. Authentication Check
//         if (!currentUser) {
//             return NextResponse.json(
//                 { message: 'Authentication required to submit an Improvement Opportunity.' },
//                 { status: 401 }
//             );
//         }
        
//         // 1. Data Destructuring
//         // sourceId is now OPTIONAL, allowing for independent IO creation.
//         const { 
//             sourceId,           // ID of the defect from the frontend form (optional)
//             proposedAction,          
//             targetArea,             
//             description             // Explicitly allow custom description
//         } = body;
//         console.log("body:", body)
//         defectId = sourceId;

//         // 1.1. Validation (Only proposedAction and targetArea are mandatory)
//         if (!proposedAction || !targetArea) {
//             return NextResponse.json(
//                 { message: 'Missing required fields: proposedAction and targetArea are mandatory to define an opportunity.' },
//                 { status: 400 }
//             );
//         }
        
//         // 2. Perform Transactional Database Operations (Creation and Optional Status Update)
//         const newOpportunityRecord = await prisma.$transaction(async (tx) => {
            
//             let sourceModule: string | null = null;
//             let finalDescription: string = description || proposedAction; // Default description if none provided

//             // === PATH 1: DEFECT-DRIVEN OPPORTUNITY (defectId is present) ===
//             if (defectId) {
//                 // Step A: Check if the source Defect exists and fetch its 'area'
//                 const existingDefect = await tx.defect.findUnique({
//                     where: { id: defectId as string },
//                     select: { id: true, area: true } 
//                 });

//                 if (!existingDefect) {
//                     throw new Error('No Defect found');
//                 }
                
//                 // Use the defect's area as the source module
//                 sourceModule = existingDefect.area || 'Unknown Defect Area';
                
//                 // If a description wasn't explicitly provided, create a traceable default
//                 if (!description) {
//                     finalDescription = `Opportunity identified from Defect ID: ${defectId}.`;
//                 }

//                 // Step B: Update the parent Defect's status
//                 await tx.defect.update({
//                     where: { id: defectId as string }, 
//                     data: { 
//                         status: DefectStatus.ACTION_DEFINED, 
//                     },
//                 });
//             } else {
//                 // === PATH 2: INDEPENDENT OPPORTUNITY (defectId is NOT present) ===
//                 sourceModule = 'Proactive CI Initiative';
//                 if (!description) {
//                     finalDescription = `Independent Improvement Opportunity identified on ${new Date().toLocaleDateString()}.`;
//                 }
//             }
            
//             // Step C: Create the ImprovementOpportunity record
//             const createdOpportunity = await tx.improvementOpportunity.create({
//                 data: {
//                     description: finalDescription, 
//                     proposedAction: proposedAction,
//                     targetArea: targetArea,
//                     sourceModule: sourceModule, 
//                     sourceDefectId: defectId,    // Will be null if defectId was undefined
//                 },
//             });
//             console.log("createdOpportunity",createdOpportunity)
//             return createdOpportunity;
//         });

//         // 3. Return the created ImprovementOpportunity record with status 201 (Created)
//         return NextResponse.json(newOpportunityRecord, { status: 201 });
        
//     } catch (error) {
//         const logId = defectId || 'unknown';
//         console.error(`Improvement Opportunity creation failed for Defect ID ${logId}:`, error);
        
//         let statusCode = 500;
//         let message = 'Internal Server Error: Failed to save the Improvement Opportunity.';
        
//         // Check for 404 error thrown in the transaction block
//         if (error instanceof Error && error.message.includes('No Defect found')) {
//             statusCode = 404;
//             message = `Source Defect with ID ${logId} not found.`;
//         }
        
//         // Detailed error message for development environment
//         if (process.env.NODE_ENV === 'development') {
//             message = `Error in route.ts: ${(error as Error).message}`;
//         }

//         return NextResponse.json(
//             { message: message },
//             { status: statusCode }
//         );
//     }
// }