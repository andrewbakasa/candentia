import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST /api/mm/activities
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const result = await prisma.$transaction(async (tx) => {
            const activity = await tx.mM_Activity.create({
                data: {
                    projectId: body.projectId,
                    description: body.description,
                    supervisor: body.supervisor, // Now a plain string
                    allocatedBudget: parseFloat(body.allocatedBudget),
                    scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
                    scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
                    requirements: body.requirements || [],
                    progress: 0,
                    stage: 'PLANNING'
                }
            });

            if (body.requirements?.length > 0) {
                await tx.mM_PurchaseOrder.create({
                    data: {
                        poNumber: `PO-MM-${activity.id.slice(-5).toUpperCase()}`,
                        activityId: activity.id,
                        status: 'AWAITING_FUNDING',
                        value: parseFloat(body.allocatedBudget)
                    }
                });
            }
            return activity;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("MM_Activity POST Error:", error);
        return NextResponse.json({ message: "Activity creation failed." }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/activities
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter');

        const whereClause = filter === 'overdue' ? {
            actualEnd: null,
            scheduledEnd: { lt: new Date() }
        } : {};

        const activities = await prisma.mM_Activity.findMany({
            where: whereClause,
            include: {
                project: { select: { name: true } },
                purchaseOrder: true
                // Note: supervisor included as plain field in model, no join needed
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching activities" }, { status: 500 });
    }
}