import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST /api/mm/activities
 * Purpose: Create an execution activity and log material needs to the Project BoQ.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Activity (Focus on Schedule & Labor)
            const activity = await tx.mM_Activity.create({
                data: {
                    projectId: body.projectId,
                    description: body.description,
                    supervisor: body.supervisor,
                    allocatedBudget: parseFloat(body.allocatedBudget) || 0,
                    scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
                    scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
                    requirements: body.nonMaterialRequirements || [], // e.g. "Safety Certs"
                    stage: 'PLANNING'
                }
            });

            // 2. Handle Material Requirements (Project-Centric BoQ)
            // Expecting body.materials to be an array: [{ itemCode: '...', qty: 5, cost: 100 }]
            if (body.materials && body.materials.length > 0) {
                await tx.mM_MaterialRequirement.createMany({
                    data: body.materials.map((mat: any) => ({
                        projectId: body.projectId,
                        activityLabel: activity.description, // Labeling material by activity for tracking
                        itemCode: mat.itemCode,
                        description: mat.description,
                        quantityRequired: parseInt(mat.qty),
                        estimatedUnitCost: parseFloat(mat.unitCost),
                        status: 'DRAFT'
                    }))
                });
            }

            return activity;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("MM_Activity POST Error:", error);
        return NextResponse.json({ 
            message: "Activity creation failed.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/activities
 * Includes tasks and filters for the Variance Engine (Guideline 5.5)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter');
        const projectId = searchParams.get('projectId');

        let whereClause: any = {};

        if (projectId) {
            whereClause.projectId = projectId;
        }

        // Variance Engine Logic: Detect overdue activities
        if (filter === 'overdue') {
            whereClause.actualEnd = null;
            whereClause.scheduledEnd = { lt: new Date() };
        }

        const activities = await prisma.mM_Activity.findMany({
            where: whereClause,
            include: {
                project: { 
                    select: { 
                        name: true,
                        // Include project materials to filter them by activityLabel in the UI
                        materialRequirements: true 
                    } 
                },
                tasks: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        console.error("MM_Activity GET Error:", error);
        return NextResponse.json({ message: "Error fetching activities" }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb';

// /**
//  * 🎯 POST /api/mm/activities
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body = await request.json();

//         const result = await prisma.$transaction(async (tx) => {
//             const activity = await tx.mM_Activity.create({
//                 data: {
//                     projectId: body.projectId,
//                     description: body.description,
//                     supervisor: body.supervisor,
//                     allocatedBudget: parseFloat(body.allocatedBudget),
//                     scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
//                     scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
//                     requirements: body.requirements || [],
//                     progress: 0,
//                     stage: 'PLANNING'
//                 }
//             });

//             // If requirements exist, auto-generate a Purchase Order per Guideline 6.3
//             if (body.requirements?.length > 0) {
//                 await tx.mM_PurchaseOrder.create({
//                     data: {
//                         poNumber: `PO-MM-${activity.id.slice(-5).toUpperCase()}`,
//                         activityId: activity.id,
//                         status: 'AWAITING_FUNDING',
//                         value: parseFloat(body.allocatedBudget)
//                     }
//                 });
//             }
//             return activity;
//         });

//         return NextResponse.json(result, { status: 201 });
//     } catch (error: any) {
//         console.error("MM_Activity POST Error:", error);
//         return NextResponse.json({ 
//             message: "Activity creation failed.", 
//             error: error.message 
//         }, { status: 500 });
//     }
// }

// /**
//  * 🎯 GET /api/mm/activities
//  * Updated to include tasks for the Expandable UI
//  */
// export async function GET(request: NextRequest) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const filter = searchParams.get('filter');
//         const projectId = searchParams.get('projectId');

//         // Build dynamic where clause
//         let whereClause: any = {};

//         // 1. Filter by Project if provided
//         if (projectId) {
//             whereClause.projectId = projectId;
//         }

//         // 2. Variance Engine Filter (Guideline 5.5)
//         if (filter === 'overdue') {
//             whereClause.actualEnd = null;
//             whereClause.scheduledEnd = { lt: new Date() };
//         }

//         const activities = await prisma.mM_Activity.findMany({
//             where: whereClause,
//             include: {
//                 project: { 
//                     select: { name: true } 
//                 },
//                 purchaseOrder: true,
//                 // Added Tasks to feed the UI's expandable drawer
//                 tasks: {
//                     orderBy: {
//                         createdAt: 'desc'
//                     }
//                 }
//             },
//             orderBy: { createdAt: 'desc' }
//         });

//         return NextResponse.json(activities, { status: 200 });
//     } catch (error) {
//         console.error("MM_Activity GET Error:", error);
//         return NextResponse.json({ message: "Error fetching activities" }, { status: 500 });
//     }
// }