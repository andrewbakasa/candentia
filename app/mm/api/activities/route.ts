import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

interface ActivityCreationData {
    projectId: string;
    description: string;
    supervisorId: string;
    allocatedBudget: number;
    scheduledStart: string;
    scheduledEnd: string;
    requirements: string[];
}

/**
 * 🎯 POST /api/mm/activities
 * Creates a tactical activity and triggers an "Awaiting Funding" PO
 */
export async function POST(request: NextRequest) {
    try {
        const body: ActivityCreationData = await request.json();

        // 1. Transaction: Create Activity & Link Procurement
        const result = await prisma.$transaction(async (tx) => {
            const activity = await tx.mM_Activity.create({
                data: {
                    projectId: body.projectId,
                    description: body.description,
                    supervisorId: body.supervisorId,
                    allocatedBudget: body.allocatedBudget,
                    scheduledStart: new Date(body.scheduledStart),
                    scheduledEnd: new Date(body.scheduledEnd),
                    requirements: body.requirements,
                    progress: 0,
                    stage: 'PLANNING'
                }
            });

            // Auto-trigger MM Purchase Order if requirements exist
            if (body.requirements.length > 0) {
                await tx.mM_PurchaseOrder.create({
                    data: {
                        poNumber: `PO-MM-${activity.id.slice(-5).toUpperCase()}`,
                        activityId: activity.id,
                        status: 'AWAITING_FUNDING',
                        value: body.allocatedBudget // Initial value estimate
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
 * Fetches all activities with a filter for "Unmet Timelines" (Variances)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('filter'); // e.g., 'overdue'

        const whereClause = type === 'overdue' ? {
            actualEnd: null,
            scheduledEnd: { lt: new Date() }
        } : {};

        const activities = await prisma.mM_Activity.findMany({
            where: whereClause,
            include: {
                supervisor: { select: { name: true } },
                project: { select: { name: true } },
                purchaseOrder: true
            }
        });

        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching activities" }, { status: 500 });
    }
}