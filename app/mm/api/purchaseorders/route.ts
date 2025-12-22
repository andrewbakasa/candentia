import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST: Create PO and link to Project Requirements
 */
// app/mm/api/purchaseorders/route.ts

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Safety check: ensure lineItems exists
        if (!body.lineItems || body.lineItems.length === 0) {
            return NextResponse.json({ message: "No items selected for PO." }, { status: 400 });
        }

        const totalPOValue = body.lineItems.reduce(
            (acc: number, item: any) => acc + (item.quantity * item.unitPrice), 
            0
        );

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Purchase Order
            const newPO = await tx.mM_PurchaseOrder.create({
                data: {
                    poNumber: body.poNumber,
                    projectId: body.projectId,
                    status: 'AWAITING_FUNDING',
                    totalValue: totalPOValue,
                    lineItems: {
                        create: body.lineItems.map((item: any) => ({
                            itemCode: item.itemCode,
                            // FIX: provide fallback if description is missing from form
                            description: item.description || `Item: ${item.itemCode}`, 
                            quantityOrdered: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                            // Ensure the field name in schema matches 'materialRequirementId' or 'materialRequirement'
                            materialRequirement: {
                                connect: { id: item.requirementId }
                            }
                        }))
                    }
                },
                include: { lineItems: true }
            });

            // 2. Update status of requirements
            const requirementIds = body.lineItems.map((item: any) => item.requirementId);
            await tx.mM_MaterialRequirement.updateMany({
                where: { id: { in: requirementIds } },
                data: { status: 'PO_ISSUED' }
            });

            // 3. Update Project Actual Cost (Guideline 1 Financial Integrity)
            await tx.mM_Project.update({
                where: { id: body.projectId },
                data: {
                    totalActualCost: { increment: totalPOValue }
                }
            });

            return newPO;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("PO Creation Error Details:", error);
        // Return error.message to help debug in the browser console
        return NextResponse.json({ 
            message: "Procurement creation failed.", 
            error: error.message,
            stack: error.meta?.cause // Useful for Prisma specific errors
        }, { status: 500 });
    }
}
/**
 * 🎯 GET: Fetch POs (Aligns with Guideline 1 of 2025 Cost Tracking)
 */
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
        console.log("backend--->", pos)
        return NextResponse.json(pos, { status: 200 });
    } catch (error) {
        console.error("PO Fetch Error:", error);
        return NextResponse.json({ message: "Error fetching procurement data." }, { status: 500 });
    }
}