import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import { DefectStatus, ActionStatus } from '@prisma/client'; 

/**
 * Handles PUT requests to update a specific Corrective Action record.
 * Route: /api/defect/ca/[id]
 *
 * @param request The incoming NextRequest containing the update body.
 * @param params An object containing the dynamic route parameter 'id' (Corrective Action ID).
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const caId = params.id;
    console.log(`--- START PUT /api/defect/ca/${caId} (Update Corrective Action) ---`);

    try {
        const body = await request.json();
        console.log("Log 1. Request Body Received:", body);

        const currentUser = await getCurrentUser();

        // 0. Authentication Check
        if (!currentUser) {
            console.log("Log 0.2: Authentication failed. User not logged in.");
            return NextResponse.json(
                { message: 'Authentication required to update a Corrective Action.' },
                { status: 401 }
            );
        }
        console.log(`Log 0.3: User authenticated. User ID: ${currentUser.id}`);

        // 1. Data Destructuring and Validation
        const { 
            description, 
            responsible, 
            dueDate, 
            status, // ActionStatus enum value
        } = body;
        
        const updateData: Record<string, any> = {};

        if (description) updateData.description = description.trim();
        if (responsible) updateData.responsible = responsible.trim();
        
        if (dueDate) {
            // Convert YYYY-MM-DD string to a proper Date object
            updateData.dueDate = new Date(dueDate);
        }

        if (status) {
            // Validate Status field against the ActionStatus enum
            if (!Object.values(ActionStatus).includes(status)) {
                console.log("Log 1.1: Invalid status value provided.");
                return NextResponse.json(
                    { message: `Invalid status value: ${status}. Must be one of ${Object.values(ActionStatus).join(', ')}` },
                    { status: 400 }
                );
            }
            updateData.status = status;
        }

        if (Object.keys(updateData).length === 0) {
            console.log("Log 1.2: No valid fields provided for update.");
            return NextResponse.json(
                { message: 'No valid fields provided to update the Corrective Action.' },
                { status: 400 }
            );
        }

        // 2. Perform Transactional Database Operations
        const updatedActionRecord = await prisma.$transaction(async (tx) => {
            console.log("Log 2.0: Starting Prisma transaction...");

            // Step A: Fetch current status and defectId before update
            const existingAction = await tx.correctiveAction.findUnique({
                where: { id: caId },
                select: { status: true, defectId: true }
            });

            if (!existingAction) {
                console.log("Log 2.1: Corrective Action not found.");
                throw new Error('Corrective Action not found.');
            }
            
            // Step B: Handle completion date logic based on status change
            const newStatus = updateData.status || existingAction.status;
            const statusChangedToComplete = existingAction.status !== ActionStatus.COMPLETE && newStatus === ActionStatus.COMPLETE;
            const statusChangedAwayFromComplete = existingAction.status === ActionStatus.COMPLETE && newStatus !== ActionStatus.COMPLETE;

            if (statusChangedToComplete) {
                updateData.completionDate = new Date(); // Set completion date to now
                console.log("Log 2.2: Action status changed to COMPLETE. Setting completionDate.");
            } else if (statusChangedAwayFromComplete) {
                updateData.completionDate = null; // Clear completion date
                console.log("Log 2.2: Action status changed away from COMPLETE. Clearing completionDate.");
            }
            // If status wasn't provided or didn't change, completionDate remains unchanged by default

            // Step C: Update the Corrective Action record
            const updatedAction = await tx.correctiveAction.update({
                where: { id: caId },
                data: updateData
            });
            console.log(`Log 2.3: Corrective Action ${caId} updated successfully.`);


            // Step D: Check for Defect Status Update
            if (updatedAction.defectId) {
                const defectId = updatedAction.defectId;

                if (statusChangedToComplete) {
                    // Check if *all* Corrective Actions for this defect are now COMPLETE
                    const incompleteActionsCount = await tx.correctiveAction.count({
                        where: {
                            defectId: defectId,
                            status: { not: ActionStatus.COMPLETE }
                        }
                    });

                    if (incompleteActionsCount === 0) {
                        // All actions are complete, update Defect status to ACTION_COMPLETE
                        await tx.defect.update({
                            where: { id: defectId },
                            data: { status: DefectStatus.CLOSED_VERIFIED }
                        });
                        console.log(`Log 2.4: All actions for Defect ${defectId} are complete. Defect status updated to ACTION_COMPLETE.`);
                    } else {
                         console.log(`Log 2.4: Defect ${defectId} still has ${incompleteActionsCount} incomplete actions.`);
                    }
                } else if (statusChangedAwayFromComplete) {
                    // If an action was marked incomplete, ensure the parent Defect status reflects it (e.g., ACTION_DEFINED)
                    // First, ensure the Defect exists and is not already OPEN or ROOT_CAUSE_DEFINED
                    const currentDefect = await tx.defect.findUnique({
                        where: { id: defectId },
                        select: { status: true }
                    });

                    if (currentDefect && currentDefect.status === DefectStatus.CLOSED_VERIFIED) {
                         // Downgrade status if it was previously ACTION_COMPLETE
                        await tx.defect.update({
                            where: { id: defectId },
                            data: { status: DefectStatus.ACTION_DEFINED }
                        });
                        console.log(`Log 2.5: Action ${caId} marked incomplete. Defect ${defectId} status downgraded to ACTION_DEFINED.`);
                    }
                }
            } else {
                 console.log("Log 2.4: Corrective Action is independent (no defectId). Skipping defect status check.");
            }

            return updatedAction;
        });

        // 3. Return the updated Corrective Action record with status 200 (OK)
        console.log("Log 3.0: Transaction complete. Returning success response.");
        return NextResponse.json(updatedActionRecord, { status: 200 });

    } catch (error) {
        console.error(`--- ERROR Corrective Action update failed for ID ${caId}:`, error);

        let statusCode = 500;
        let message = 'Internal Server Error: Failed to update the Corrective Action.';

        if (error instanceof Error && error.message.includes('Corrective Action not found')) {
            statusCode = 404;
            message = `Corrective Action with ID ${caId} not found.`;
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

/**
 * Handles DELETE requests to delete a specific Corrective Action record.
 * Route: /api/defect/ca/[id]
 *
 * @param request The incoming NextRequest.
 * @param params An object containing the dynamic route parameter 'id' (Corrective Action ID).
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const caId = params.id;
    console.log(`--- START DELETE /api/defect/ca/${caId} (Delete Corrective Action) ---`);

    try {
        const currentUser = await getCurrentUser();

        // 0. Authentication Check
        if (!currentUser) {
            console.log("Log 0.2: Authentication failed. User not logged in.");
            return NextResponse.json(
                { message: 'Authentication required to delete a Corrective Action.' },
                { status: 401 }
            );
        }
        console.log(`Log 0.3: User authenticated. User ID: ${currentUser.id}`);
        
        // 1. Perform Transactional Database Operations (Deletion and Optional Status Update)
        const deletedActionRecord = await prisma.$transaction(async (tx) => {
            console.log("Log 1.0: Starting Prisma transaction for DELETE...");

            // Step A: Fetch the Corrective Action to get its defectId before deletion
            const existingAction = await tx.correctiveAction.findUnique({
                where: { id: caId },
                select: { defectId: true }
            });

            if (!existingAction) {
                console.log("Log 1.1: Corrective Action not found for deletion.");
                throw new Error('Corrective Action not found.');
            }
            
            const defectId = existingAction.defectId;

            // Step B: Delete the Corrective Action record
            const deletedAction = await tx.correctiveAction.delete({
                where: { id: caId },
            });
            console.log(`Log 1.2: Corrective Action ${caId} deleted successfully.`);

            // Step C: Check for Defect Status Update (Parent Defect)
            if (defectId) {
                // Check how many actions are left for this defect
                const remainingActionsCount = await tx.correctiveAction.count({
                    where: { defectId: defectId }
                });

                if (remainingActionsCount === 0) {
                    // If no actions remain, revert the defect status to the previous stage: ROOT_CAUSE_DEFINED
                    await tx.defect.update({
                        where: { id: defectId },
                        data: { status: DefectStatus.ACTION_DEFINED }
                    });
                    console.log(`Log 1.3: Last action deleted. Defect ${defectId} status reverted to ROOT_CAUSE_DEFINED.`);
                } else {
                    console.log(`Log 1.3: Defect ${defectId} still has ${remainingActionsCount} remaining actions. Status unchanged.`);
                }
            } else {
                 console.log("Log 1.3: Corrective Action was independent (no defectId). Skipping defect status check.");
            }

            return deletedAction;
        });

        // 2. Return success status 200 (OK) with the deleted record details
        console.log("Log 2.0: Transaction complete. Returning success response.");
        return NextResponse.json(deletedActionRecord, { status: 200 });

    } catch (error) {
        const caIdLog = caId || 'unknown';
        console.error(`--- ERROR Corrective Action deletion failed for ID ${caIdLog}:`, error);

        let statusCode = 500;
        let message = 'Internal Server Error: Failed to delete the Corrective Action.';

        if (error instanceof Error && error.message.includes('Corrective Action not found')) {
            statusCode = 404;
            message = `Corrective Action with ID ${caIdLog} not found.`;
        } else if (error instanceof Error) {
            console.log(`Log E.2: Specific Error Message: ${error.message}`);
        }

        if (process.env.NODE_ENV === 'development') {
            message = `Error in route.ts (DELETE): ${(error as Error).message}`;
        }

        return NextResponse.json(
            { message: message },
            { status: statusCode }
        );
    }
}