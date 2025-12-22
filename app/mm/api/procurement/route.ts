import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

interface POLineItemData {
    requirementId: string; // The specific ID from MM_MaterialRequirement
    itemCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface POCreationData {
    poNumber: string;
    projectId: string; // Changed from activityId
    lineItems: POLineItemData[];
}

/**
 * 🎯 POST: Create PO and link to Project Requirements
 */
export async function POST(request: NextRequest) {
    try {
        const body: POCreationData = await request.json();

        const totalPOValue = body.lineItems.reduce(
            (acc, item) => acc + (item.quantity * item.unitPrice), 
            0
        );

        // We use a transaction to ensure both PO creation and Status updates succeed
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Create the Purchase Order
            const newPO = await tx.mM_PurchaseOrder.create({
                data: {
                    poNumber: body.poNumber,
                    projectId: body.projectId,
                    status: 'AWAITING_FUNDING',
                    totalValue: totalPOValue, // Using totalValue as per updated schema
                    lineItems: {
                        create: body.lineItems.map(item => ({
                            itemCode: item.itemCode,
                            description: item.description,
                            quantityOrdered: item.quantity, // Matches schema 'quantityOrdered'
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                            // This creates the link back to the requirement
                            materialRequirement: {
                                connect: { id: item.requirementId }
                            }
                        }))
                    }
                },
                include: { lineItems: true }
            });

            // 2. Update the status of the requirements to PO_ISSUED
            const requirementIds = body.lineItems.map(item => item.requirementId);
            await tx.mM_MaterialRequirement.updateMany({
                where: { id: { in: requirementIds } },
                data: { status: 'PO_ISSUED' }
            });

            return newPO;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("PO Creation Error:", error);
        return NextResponse.json({ 
            message: "Procurement creation failed.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 GET: Fetch POs for a Project or by Status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const projectId = searchParams.get('projectId');

        const pos = await prisma.mM_PurchaseOrder.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(projectId && { projectId: projectId })
            },
            include: {
                lineItems: {
                    include: {
                        materialRequirement: true // Shows which requirement this line satisfies
                    }
                },
                project: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(pos, { status: 200 });
    } catch (error) {
        console.error("PO Fetch Error:", error);
        return NextResponse.json({ message: "Error fetching procurement data." }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/purchase-orders
 * Purpose: Fetch POs. If activityDescription is provided, find POs linked to those materials.
 */
// export async function GET(request: NextRequest) {
//     const { searchParams } = new URL(request.url);
//     const activityLabel = searchParams.get('activityLabel');
//     const projectId = searchParams.get('projectId');

//     const pos = await prisma.mM_PurchaseOrder.findMany({
//         where: {
//             projectId: projectId || undefined,
//             // Deep filter: Find POs where at least one line item 
//             // satisfies a requirement labeled with this activity
//             ...(activityLabel && {
//                 lineItems: {
//                     some: {
//                         requirement: {
//                             activityLabel: activityLabel
//                         }
//                     }
//                 }
//             })
//         },
//         include: {
//             lineItems: {
//                 include: {
//                     requirement: true
//                 }
//             }
//         }
//     });

//     return NextResponse.json(pos);
// }