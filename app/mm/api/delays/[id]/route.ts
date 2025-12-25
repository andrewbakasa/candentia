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
                    activity: { select: { projectId: true } } // Drill down to get projectId
                }
            });

            if (!current) throw new Error("Delay record not found");

            const projectId = current.activity.projectId;

            // 2. Update the Delay Incident
            const delay = await tx.mM_ProcessDelay.update({
                where: { id },
                data: {
                    ...(body.type && { type: body.type }),
                    ...(body.description && { description: body.description }),
                    ...(body.impactHours !== undefined && { impactHours: parseFloat(body.impactHours) }),
                    ...(body.costImpact !== undefined && { costImpact: parseFloat(body.costImpact) }),
                    ...(body.materialReqId && { materialReqId: body.materialReqId }),
                    ...(body.isReworkTriggered !== undefined && { isReworkTriggered: body.isReworkTriggered }),
                }
            });

            // 3. Financial Re-balancing (Guideline Sec 3.4)
            if (body.costImpact !== undefined && parseFloat(body.costImpact) !== current.costImpact) {
                const delta = parseFloat(body.costImpact) - current.costImpact;
                
                // Update Project Cost
                await tx.mM_Project.update({
                    where: { id: projectId },
                    data: { totalActualCost: { increment: delta } }
                });

                // Update Activity Rework Cost if applicable
                if (current.activityId && current.isReworkTriggered) {
                    await tx.mM_Activity.update({
                        where: { id: current.activityId },
                        data: { reworkCost: { increment: delta } }
                    });
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

            // 1. Reverse the Financial Impact
            await tx.mM_Project.update({
                where: { id: projectId },
                data: { totalActualCost: { decrement: delay.costImpact } }
            });

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