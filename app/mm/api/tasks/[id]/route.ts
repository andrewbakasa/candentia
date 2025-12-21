import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/tasks/[id]
 * Updates specific task and re-calculates Activity-level labor and progress.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedTask = await prisma.$transaction(async (tx) => {
            
            // 1. Build update object for the Task
            const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
                ...(body.title && { title: body.title }),
                ...(body.description && { description: body.description }),
                ...(body.assignedTo && { assignedTo: body.assignedTo }),
                ...(body.status && { 
                    status: body.status,
                    isCompleted: body.status === 'COMPLETED',
                    completionDate: body.status === 'COMPLETED' ? new Date() : null
                }),
                ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) }),
                ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) }),
                ...(body.materialNotes && { materialNotes: body.materialNotes }),
            };

            const task = await tx.mM_Task.update({
                where: { id },
                data: updateData
            });

            // 2. Guideline 1 Sync: Roll up updated data to the Parent Activity
            const allTasks = await tx.mM_Task.findMany({
                where: { activityId: task.activityId }
            });

            const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
            const completedCount = allTasks.filter(t => t.isCompleted).length;
            const progress = Math.round((completedCount / allTasks.length) * 100);

            // Costing Example Integration (Sec 6.3): Using standard NRZ Labor Rate
            const LABOR_RATE = 50; 

            await tx.mM_Activity.update({
                where: { id: task.activityId },
                data: {
                    progress: progress,
                    actualLaborCost: totalActualHours * LABOR_RATE
                }
            });

            return task;
        });

        return NextResponse.json(updatedTask, { status: 200 });

    } catch (error: any) {
        console.error("MM_Task PATCH Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Task record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Failed to update task." }, { status: 500 });
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

        await prisma.mM_Task.delete({
            where: { id }
        });

        return NextResponse.json({ 
            message: "Task record removed successfully." 
        }, { status: 200 });

    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Task record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Failed to delete task." }, { status: 500 });
    }
}