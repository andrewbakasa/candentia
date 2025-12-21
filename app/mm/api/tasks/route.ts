import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST /api/mm/tasks
 * Handles task creation and updates Activity labor/progress metrics.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Task
            const task = await tx.mM_Task.create({
                data: {
                    activityId: body.activityId,
                    title: body.title,
                    description: body.description,
                    assignedTo: body.assignedTo,
                    status: body.status || 'PENDING',
                    estimatedHours: parseFloat(body.estimatedHours) || 0,
                    actualHours: parseFloat(body.actualHours) || 0,
                    materialNotes: body.materialNotes,
                    isCompleted: body.status === 'COMPLETED',
                    completionDate: body.status === 'COMPLETED' ? new Date() : null,
                }
            });

            // 2. Aggregate Data to Activity (Guideline 1 Sec 5.1 Financial Performance)
            // We sum all actual hours for tasks under this activity
            const allTasks = await tx.mM_Task.findMany({
                where: { activityId: body.activityId }
            });

            const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
            const completedTasks = allTasks.filter(t => t.isCompleted).length;
            const progressPercentage = Math.round((completedTasks / allTasks.length) * 100);

            // 3. Update Parent Activity with aggregated labor info
            // Note: actualLaborCost calculation assumes a standard rate (e.g., $50/hr)
            const LABOR_RATE = 50; 
            await tx.mM_Activity.update({
                where: { id: body.activityId },
                data: {
                    progress: progressPercentage,
                    actualLaborCost: totalActualHours * LABOR_RATE,
                }
            });

            return task;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("MM_Task POST Error:", error);
        return NextResponse.json({ message: "Task logging failed." }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/tasks
 * Fetches tasks with optional filtering by activity or technician.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activityId = searchParams.get('activityId');
        const technician = searchParams.get('technician');

        const whereClause: any = {};
        if (activityId) whereClause.activityId = activityId;
        if (technician) whereClause.assignedTo = { contains: technician, mode: 'insensitive' };

        const tasks = await prisma.mM_Task.findMany({
            where: whereClause,
            include: {
                activity: {
                    select: {
                        description: true,
                        projectId: true,
                        project: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        console.error("MM_Task GET Error:", error);
        return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
    }
}