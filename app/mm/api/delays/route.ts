import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { MM_DelayType } from '@prisma/client';

/**
 * 🎯 POST /api/mm/delays
 */


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // 1. Validate mandatory Activity link
        if (!body.activityId) {
            return NextResponse.json({ message: "activityId is required" }, { status: 400 });
        }

        // 2. Fetch Parent Activity to resolve Project ID for financial updates
        const parentActivity = await prisma.mM_Activity.findUnique({
            where: { id: body.activityId },
            select: { projectId: true }
        });

        if (!parentActivity) {
            return NextResponse.json({ message: "Parent Activity not found" }, { status: 404 });
        }

        // 3. Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            
            // Convert types explicitly to satisfy Prisma/Database strictness
            const costValue = parseFloat(body.costImpact) || 0;
            const hoursValue = parseFloat(body.impactHours) || 0;
            
            // LOG THE DELAY
            const delay = await tx.mM_ProcessDelay.create({
                data: {
                    // Force the type to match Enum naming conventions
                    // We cast to 'any' here to bypass the strict TypeScript check 
                    // if your local generated types are out of sync.
                    type: body.type as MM_DelayType, 
                    activityId: body.activityId,
                    description: body.description || "No description provided",
                    impactHours: hoursValue,
                    costImpact: costValue,
                    isReworkTriggered: Boolean(body.isReworkTriggered),
                    materialReqId: body.materialReqId || null,
                }
            });

            // UPDATE ACTIVITY REWORK (Step 3 of Guidelines)
            if (body.isReworkTriggered) {
                await tx.mM_Activity.update({
                    where: { id: body.activityId },
                    data: { 
                        isRework: true,
                        reworkCost: { increment: costValue }
                    }
                });
            }

            // UPDATE PROJECT TOTAL ACTUAL COST
            if (parentActivity.projectId) {
                await tx.mM_Project.update({
                    where: { id: parentActivity.projectId },
                    data: { 
                        totalActualCost: { increment: costValue }
                    }
                });
            }

            return delay;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error("MM_ProcessDelay POST Error:", error);
        // Extract specific Prisma error messages if available
        return NextResponse.json({ 
            message: "Delay failed.", 
            error: error.message 
        }, { status: 500 });
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