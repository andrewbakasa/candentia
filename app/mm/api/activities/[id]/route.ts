import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/activities/[id]
 * Updates maintenance activity and synchronizes procurement values
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedActivity = await prisma.$transaction(async (tx) => {
            
            // 1. Build update object matching the updated MM_Activity schema
            const updateData: Prisma.MM_ActivityUncheckedUpdateInput = {
                ...(body.description && { description: body.description }),
                ...(body.supervisor && { supervisor: body.supervisor }), // Changed from supervisorId to supervisor
                ...(body.allocatedBudget !== undefined && { allocatedBudget: parseFloat(body.allocatedBudget) }),
                ...(body.scheduledStart && { scheduledStart: new Date(body.scheduledStart) }),
                ...(body.scheduledEnd && { scheduledEnd: new Date(body.scheduledEnd) }),
                ...(body.actualEnd && { actualEnd: new Date(body.actualEnd) }), // Variance Engine Support
                ...(body.requirements && { requirements: body.requirements }),
                ...(body.progress !== undefined && { progress: body.progress }),
                ...(body.stage && { stage: body.stage }),
                ...(body.varianceReason && { varianceReason: body.varianceReason }),
                ...(body.isRework !== undefined && { isRework: body.isRework }),
                ...(body.reworkCost !== undefined && { reworkCost: parseFloat(body.reworkCost) }),
            };

            const activity = await tx.mM_Activity.update({
                where: { id },
                data: updateData
            });

            // 2. Guideline 1 Compliance: Sync PO value if budget changed and PO is still pending
            if (body.allocatedBudget !== undefined) {
                await tx.mM_PurchaseOrder.updateMany({
                    where: { 
                        activityId: id,
                        status: 'AWAITING_FUNDING' 
                    },
                    data: {
                        value: parseFloat(body.allocatedBudget)
                    }
                });
            }

            return activity;
        });

        return NextResponse.json(updatedActivity, { status: 200 });

    } catch (error: any) {
        console.error("MM_Activity PATCH Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Activity record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Failed to update activity." }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/activities/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.$transaction(async (tx) => {
            // A. Remove dependent Purchase Orders
            await tx.mM_PurchaseOrder.deleteMany({
                where: { activityId: id }
            });

            // B. Delete Activity
            await tx.mM_Activity.delete({
                where: { id }
            });
        });

        return NextResponse.json({ 
            message: "Activity and associated procurement records removed." 
        }, { status: 200 });

    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Activity record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Failed to delete activity." }, { status: 500 });
    }
}