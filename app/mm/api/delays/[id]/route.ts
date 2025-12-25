import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';

/**
 * 🎯 PATCH /api/mm/delays/[id]
 * Recalculates Project financial leakage by drilling through Activity.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedDelay = await prisma.$transaction(async (tx) => {
            // 1. Fetch current delay + the activity's projectId
            const current = await tx.mM_ProcessDelay.findUnique({
                where: { id },
                select: { 
                    costImpact: true, 
                    activityId: true, 
                    isReworkTriggered: true,
                    activity: { select: { projectId: true } } 
                }
            });

            if (!current) throw new Error("Delay record not found");

            const projectId = current.activity.projectId;

            // 2. Prepare Sanitized Data
            // Explicitly cast the Enum and parse numbers to prevent Prisma Validation Errors
            const updateData: any = {};
            
            if (body.type) updateData.type = body.type as any; // Cast to Enum type
            if (body.description) updateData.description = body.description;
            if (body.impactHours !== undefined) updateData.impactHours = parseFloat(body.impactHours) || 0;
            if (body.costImpact !== undefined) updateData.costImpact = parseFloat(body.costImpact) || 0;
            if (body.materialReqId !== undefined) updateData.materialReqId = body.materialReqId;
            if (body.isReworkTriggered !== undefined) updateData.isReworkTriggered = Boolean(body.isReworkTriggered);

            // Execute Update
            const delay = await tx.mM_ProcessDelay.update({
                where: { id },
                data: updateData
            });

            // 3. Financial Re-balancing (Guideline Sec 3.4)
            // Only trigger if costImpact was actually provided in the body
            if (body.costImpact !== undefined) {
                const newCost = parseFloat(body.costImpact) || 0;
                const delta = newCost - current.costImpact;
                
                if (delta !== 0) {
                    // Update Project Cost
                    await tx.mM_Project.update({
                        where: { id: projectId },
                        data: { totalActualCost: { increment: delta } }
                    });

                    // Update Activity Rework Cost if it was already triggered
                    if (current.activityId && current.isReworkTriggered) {
                        await tx.mM_Activity.update({
                            where: { id: current.activityId },
                            data: { reworkCost: { increment: delta } }
                        });
                    }
                }
            }

            return delay;
        });

        return NextResponse.json(updatedDelay, { status: 200 });

    } catch (error: any) {
        console.error("MM_ProcessDelay PATCH Error:", error);
        return NextResponse.json({ message: error.message || "Update failed" }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/delays/[id]
 * Reverses financial impact before deletion.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.$transaction(async (tx) => {
            const delay = await tx.mM_ProcessDelay.findUnique({
                where: { id },
                select: { 
                    costImpact: true, 
                    activityId: true, 
                    isReworkTriggered: true,
                    activity: { select: { projectId: true } } 
                }
            });

            if (!delay) throw new Error("Delay record not found");

            const projectId = delay.activity.projectId;

            // 1. Reverse the Financial Impact (Cleanup)
            if (projectId) {
                await tx.mM_Project.update({
                    where: { id: projectId },
                    data: { totalActualCost: { decrement: delay.costImpact } }
                });
            }

            if (delay.activityId && delay.isReworkTriggered) {
                await tx.mM_Activity.update({
                    where: { id: delay.activityId },
                    data: { reworkCost: { decrement: delay.costImpact } }
                });
            }

            // 2. Delete the record
            await tx.mM_ProcessDelay.delete({ where: { id } });
        });

        return NextResponse.json({ message: "Delay record removed and costs re-balanced." });

    } catch (error: any) {
        console.error("MM_ProcessDelay DELETE Error:", error);
        return NextResponse.json({ message: "Deletion failed." }, { status: 500 });
    }
}