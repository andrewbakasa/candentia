import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST /api/mm/delays
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. First, find the activity to get the Project ID (Model cross-reference)
        const parentActivity = await prisma.mM_Activity.findUnique({
            where: { id: body.activityId },
            select: { projectId: true }
        });

        if (!parentActivity) {
            return NextResponse.json({ message: "Parent Activity not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 2. Log the Delay Incident (No projectId in this model)
            const delay = await tx.mM_ProcessDelay.create({
                data: {
                    type: body.type,
                    activityId: body.activityId,
                    materialReqId: body.materialReqId || null,
                    description: body.description,
                    impactHours: parseFloat(body.impactHours) || 0,
                    costImpact: parseFloat(body.costImpact) || 0,
                    isReworkTriggered: body.isReworkTriggered || false,
                }
            });

            // 3. Update Activity Rework Costs if applicable
            if (body.isReworkTriggered) {
                await tx.mM_Activity.update({
                    where: { id: body.activityId },
                    data: { 
                        isRework: true,
                        reworkCost: { increment: parseFloat(body.costImpact) || 0 }
                    }
                });
            }

            // 4. Update Project Total Cost using the ID we fetched in step 1
            await tx.mM_Project.update({
                where: { id: parentActivity.projectId },
                data: { 
                    totalActualCost: { increment: parseFloat(body.costImpact) || 0 }
                }
            });

            return delay;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("MM_ProcessDelay POST Error:", error);
        return NextResponse.json({ message: "Delay failed.", error: error.message }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/delays
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        let whereClause: any = {};

        // Filtering by Project requires a nested query since projectId isn't on the Delay model
        if (projectId) {
            whereClause.activity = {
                projectId: projectId
            };
        }

        const delays = await prisma.mM_ProcessDelay.findMany({
            where: whereClause,
            include: {
                activity: {
                    select: {
                        description: true,
                        projectId: true, // This allows you to see which project it belongs to
                        project: { select: { name: true } }
                    }
                },
                materialRequest: { include: { material: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(delays, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching delay records" }, { status: 500 });
    }
}