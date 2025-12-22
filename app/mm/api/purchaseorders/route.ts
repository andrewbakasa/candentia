import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { MM_POStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { poNumber, vendorName, projectId, lineItems, status } = body;

        // 1. Validation
        if (!lineItems || lineItems.length === 0) {
            return NextResponse.json({ message: "No items selected for PO." }, { status: 400 });
        }

        const totalPOValue = lineItems.reduce(
            (acc: number, item: any) => acc + (item.quantity * item.unitPrice), 
            0
        );

        const result = await prisma.$transaction(async (tx) => {
            
            // 2. Determine Initial Funding Timestamp
            // If created as FUNDED, stamp the date immediately for cash flow audit
            const initialStatus = (status as MM_POStatus) || 'AWAITING_FUNDING';
            const fundedAtValue = initialStatus === 'FUNDED' ? new Date() : null;

            // 3. Create the Purchase Order
            const newPO = await tx.mM_PurchaseOrder.create({
                data: {
                    poNumber,
                    vendorname: vendorName || body.vendorname, 
                    status: initialStatus,
                    totalValue: totalPOValue,
                    fundedAt: fundedAtValue,
                    
                    // Connect to Project
                    project: { connect: { id: projectId } },
                    
                    // Create Line Items
                    lineItems: {
                        create: lineItems.map((item: any) => ({
                            itemCode: item.itemCode,
                            description: item.description || `Item: ${item.itemCode}`,
                            quantityOrdered: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                            materialRequirement: {
                                connect: { id: item.requirementId }
                            }
                        }))
                    }
                },
                include: { lineItems: true }
            });

            // 4. Update status of Material Requirements to prevent double-ordering
            const requirementIds = lineItems.map((item: any) => item.requirementId);
            await tx.mM_MaterialRequirement.updateMany({
                where: { id: { in: requirementIds } },
                data: { status: 'PO_ISSUED' }
            });

            // 5. Financial Integrity: Increment Project Actual Cost
            await tx.mM_Project.update({
                where: { id: projectId },
                data: {
                    totalActualCost: { increment: totalPOValue }
                }
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

export async function GET(request: NextRequest) {
    try {
        const pos = await prisma.mM_PurchaseOrder.findMany({
            include: {
                lineItems: {
                    include: {
                        materialRequirement: true 
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