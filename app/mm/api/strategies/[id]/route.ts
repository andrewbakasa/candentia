import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/strategic-plans/[id]
 * Updates strategic fiscal plans and handles budget adjustments
 */
interface StrategyUpdateData {
    year?: number;
    description?: string;
    totalBudget?: number;
    assignedExecutive?: string;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body: StrategyUpdateData = await request.json();

        // Build the update object explicitly to satisfy Prisma's UncheckedUpdateInput
        const updateData: Prisma.MM_StrategicPlanUncheckedUpdateInput = {
            ...(body.year && { year: body.year }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.totalBudget !== undefined && { totalBudget: body.totalBudget }),
            ...(body.assignedExecutive && { assignedExecutive: body.assignedExecutive }),
        };

        const updatedPlan = await prisma.mM_StrategicPlan.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedPlan, { status: 200 });

    } catch (error: any) {
        console.error("MM_StrategicPlan PATCH Error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2002: Unique constraint failed (e.g., trying to change a plan to a year that already exists)
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { message: "A strategic plan for this fiscal year already exists." }, 
                    { status: 409 }
                );
            }
            // P2025: Record to update not found
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { message: "Strategic Plan record not found." }, 
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { message: "Failed to update Strategic Plan." }, 
            { status: 500 }
        );
    }
}

/**
 * 🎯 DELETE /api/mm/strategic-plans/[id]
 * Deep-cleanses an entire fiscal year strategy and all nested operational data.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // 1. Transaction to handle the multi-level cascade cleanup
        await prisma.$transaction(async (tx) => {
            
            // A. Identify all projects belonging to this Strategic Plan
            const projects = await tx.mM_Project.findMany({
                where: { planId: id },
                select: { id: true }
            });
            const projectIds = projects.map(p => p.id);

            if (projectIds.length > 0) {
                // B. Identify all activities within those projects
                const activities = await tx.mM_Activity.findMany({
                    where: { projectId: { in: projectIds } },
                    select: { id: true }
                });
                const activityIds = activities.map(a => a.id);

                if (activityIds.length > 0) {
                    // C. Delete all Purchase Orders first (Bottom level)
                    await tx.mM_PurchaseOrder.deleteMany({
                        where: { activityId: { in: activityIds } }
                    });

                    // D. Delete all Activities (Operational level)
                    await tx.mM_Activity.deleteMany({
                        where: { id: { in: activityIds } }
                    });
                }

                // E. Delete all Projects (Tactical level)
                await tx.mM_Project.deleteMany({
                    where: { id: { in: projectIds } }
                });
            }

            // F. Finally, delete the Strategic Plan (Executive level)
            await tx.mM_StrategicPlan.delete({
                where: { id }
            });
        });

        return NextResponse.json({ 
            message: "Fiscal year plan and all associated projects/activities purged successfully." 
        }, { status: 200 });

    } catch (error: any) {
        console.error("MM_StrategicPlan DELETE Error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Strategic Plan not found." }, { status: 404 });
            }
        }

        return NextResponse.json({ 
            message: "Failed to purge Strategic Plan. System integrity requires manual review." 
        }, { status: 500 });
    }
}