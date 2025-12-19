import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/activities/[id]
 * Updates maintenance activity and synchronizes procurement values
 */
interface ActivityCreationData {
    projectId: string;
    description: string;
    supervisorId: string;
    allocatedBudget: number;
    scheduledStart: string;
    scheduledEnd: string;
    requirements: string[];
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body: Partial<ActivityCreationData> & { stage?: any, progress?: number } = await request.json();

        // 1. Transaction to ensure Activity and PO remain in sync
        const updatedActivity = await prisma.$transaction(async (tx) => {
            
            // Build the update object explicitly to satisfy Prisma's UncheckedUpdateInput
            const updateData: Prisma.MM_ActivityUncheckedUpdateInput = {
                ...(body.projectId && { projectId: body.projectId }),
                ...(body.description && { description: body.description }),
                ...(body.supervisorId && { supervisorId: body.supervisorId }),
                ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
                ...(body.scheduledStart && { scheduledStart: new Date(body.scheduledStart) }),
                ...(body.scheduledEnd && { scheduledEnd: new Date(body.scheduledEnd) }),
                ...(body.requirements && { requirements: body.requirements }),
                ...(body.progress !== undefined && { progress: body.progress }),
                ...(body.stage && { stage: body.stage }),
            };

            // Perform the update
            const activity = await tx.mM_Activity.update({
                where: { id },
                data: updateData
            });

            // 2. Guideline 1 Compliance: If budget changed, update the PO value
            if (body.allocatedBudget !== undefined) {
                await tx.mM_PurchaseOrder.updateMany({
                    where: { 
                        activityId: id,
                        status: 'AWAITING_FUNDING' 
                    },
                    data: {
                        value: body.allocatedBudget
                    }
                });
            }

            return activity;
        });

        return NextResponse.json(updatedActivity, { status: 200 });

    } catch (error: any) {
        console.error("MM_Activity PATCH Error:", error);
        
        // Prisma error for record not found
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Activity record not found." }, { status: 404 });
            }
        }
        
        return NextResponse.json({ message: "Failed to update activity." }, { status: 500 });
    }
}
/**
 * 🎯 DELETE /api/mm/activities/[id]
 * Removes a maintenance activity and its associated purchase order.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // 1. Transaction to maintain referential integrity
        await prisma.$transaction(async (tx) => {
            
            // A. Remove linked Purchase Order first (if any exists)
            // Purchase Order is a dependent child of the Activity
            await tx.mM_PurchaseOrder.deleteMany({
                where: { activityId: id }
            });

            // B. Delete the Activity itself
            await tx.mM_Activity.delete({
                where: { id }
            });
        });

        return NextResponse.json({ 
            message: "Activity and associated procurement records removed successfully." 
        }, { status: 200 });

    } catch (error: any) {
        console.error("MM_Activity DELETE Error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to delete does not exist
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Activity record not found." }, { status: 404 });
            }
        }

        return NextResponse.json({ 
            message: "Failed to delete activity. It may be referenced by other system modules." 
        }, { status: 500 });
    }
}