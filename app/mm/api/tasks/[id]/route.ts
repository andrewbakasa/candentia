import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🛠️ PATCH /api/mm/tasks/[id]
 * Updates specific Work Order data and re-calculates Activity progress/costs.
 * Ensures compliance with Variation Tracking (Guideline Sec 6.2).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        // 1. Validation for Business Model Compliance (Sec 5.5)
        if (body.status === 'COMPLETED' && !body.completionDate) {
            return NextResponse.json(
                { message: "Operational Requirement: Completion date is mandatory for finalized tasks." }, 
                { status: 400 }
            );
        }

        // 2. Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            
            // Build update object dynamically
            const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
                ...(body.baseTaskId !== undefined && { baseTaskId: body.baseTaskId || null }),
                ...(body.title && { title: body.title }),
                ...(body.description && { description: body.description }),
                ...(body.assignedTo && { assignedTo: body.assignedTo }),
                ...(body.variationReason !== undefined && { variationReason: body.variationReason }),
                ...(body.materialNotes !== undefined && { materialNotes: body.materialNotes }),
                
                // Date Handling
                ...(body.dueDate !== undefined && { 
                    dueDate: body.dueDate ? new Date(body.dueDate) : null 
                }),
                
                // Status & Progress logic
                ...(body.status && { 
                    status: body.status,
                    isCompleted: body.status === 'COMPLETED',
                    completionDate: body.status === 'COMPLETED' 
                        ? new Date(body.completionDate) 
                        : null
                }),

                // Metric Syncing (Guideline Sec 6.2)
                ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) || 0 }),
                ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) || 0 }),
            };

            // Update the Task
            const updatedTask = await tx.mM_Task.update({
                where: { id },
                data: updateData
            });

            // 3. Financial & Progress Rollup (Guideline Sec 5.1 - Financial Performance)
            const allTasks = await tx.mM_Task.findMany({
                where: { activityId: updatedTask.activityId }
            });

            const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
            const completedCount = allTasks.filter(t => t.isCompleted).length;
            const progress = allTasks.length > 0 
                ? Math.round((completedCount / allTasks.length) * 100) 
                : 0;

            // Using standard Guideline Labor Rate (Sec 6.3)
            const LABOR_RATE = 50; 

            // Sync Parent Activity
            await tx.mM_Activity.update({
                where: { id: updatedTask.activityId },
                data: {
                    progress: progress,
                    actualLaborCost: totalActualHours * LABOR_RATE
                }
            });

            return updatedTask;
        }, {
            maxWait: 5000,
            timeout: 20000 // Handle potential DB contention during peak activity sync
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("MM_Task PATCH Error:", error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Work Order record not found." }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: "Internal Server Error during task sync.",
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/tasks/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // Note: In a production environment, you might want to wrap DELETE in a transaction 
        // to re-calculate Activity progress/costs after removal (Guideline Sec 2.2).
        const deletedTask = await prisma.mM_Task.delete({
            where: { id }
        });

        // Trigger rollup update for the activity after deletion
        const allRemainingTasks = await prisma.mM_Task.findMany({
            where: { activityId: deletedTask.activityId }
        });

        const totalHours = allRemainingTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
        const progress = allRemainingTasks.length > 0 
            ? Math.round((allRemainingTasks.filter(t => t.isCompleted).length / allRemainingTasks.length) * 100)
            : 0;

        await prisma.mM_Activity.update({
            where: { id: deletedTask.activityId },
            data: {
                progress,
                actualLaborCost: totalHours * 50
            }
        });

        return NextResponse.json({ 
            message: "Task record removed and activity synced successfully." 
        }, { status: 200 });

    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Task record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Failed to delete task." }, { status: 500 });
    }
}