import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/activities/[id]
 * Updates activity and syncs Project-level Material Requirements (BoQ).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedActivity = await prisma.$transaction(async (tx) => {
            // 1. Fetch current activity to get the Project Context and current Label
            const current = await tx.mM_Activity.findUnique({
                where: { id },
                select: { description: true, projectId: true }
            });

            if (!current) throw new Error("Activity not found");

            // 2. Update the Activity (Schedule, Labor, and Progress)
            const activity = await tx.mM_Activity.update({
                where: { id },
                data: {
                    ...(body.description && { description: body.description }),
                    ...(body.supervisor && { supervisor: body.supervisor }),
                    ...(body.allocatedBudget !== undefined && { allocatedBudget: parseFloat(body.allocatedBudget) }),
                    ...(body.scheduledStart && { scheduledStart: new Date(body.scheduledStart) }),
                    ...(body.scheduledEnd && { scheduledEnd: new Date(body.scheduledEnd) }),
                    ...(body.actualEnd && { actualEnd: new Date(body.actualEnd) }),
                    ...(body.progress !== undefined && { progress: body.progress }),
                    ...(body.stage && { stage: body.stage }),
                    ...(body.varianceReason && { varianceReason: body.varianceReason }),
                    ...(body.isRework !== undefined && { isRework: body.isRework }),
                    ...(body.reworkCost !== undefined && { reworkCost: parseFloat(body.reworkCost) }),
                }
            });

            // 3. Sync BoQ Labels: If description changed, update the label on project materials
            if (body.description && current.description !== body.description) {
                await tx.mM_MaterialRequirement.updateMany({
                    where: { 
                        projectId: current.projectId,
                        activityLabel: current.description 
                    },
                    data: { activityLabel: body.description }
                });
            }

            return activity;
        });

        return NextResponse.json(updatedActivity, { status: 200 });

    } catch (error: any) {
        console.error("MM_Activity PATCH Error:", error);
        return NextResponse.json({ message: error.message || "Update failed" }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/activities/[id]
 * Removes activity. Procurement records (POs) remain safe at Project level.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.$transaction(async (tx) => {
            const activity = await tx.mM_Activity.findUnique({
                where: { id },
                select: { description: true, projectId: true }
            });

            if (activity) {
                // Unlink materials from this deleted activity but keep them in Project BoQ
                await tx.mM_MaterialRequirement.updateMany({
                    where: { 
                        projectId: activity.projectId,
                        activityLabel: activity.description 
                    },
                    data: {
                        activityLabel: "UNASSIGNED",
                        status: 'DRAFT' 
                    }
                });
            }

            // Delete Activity (Tasks will cascade delete if configured in Prisma)
            await tx.mM_Activity.delete({ where: { id } });
        });

        return NextResponse.json({ message: "Activity removed. BoQ preserved." });

    } catch (error: any) {
        return NextResponse.json({ message: "Deletion failed." }, { status: 500 });
    }
}