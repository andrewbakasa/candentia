import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { MM_MaterialStatus } from '@prisma/client';

/**
 * 🎯 PATCH: Update existing PO and Re-calibrate Costs
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();        
        const { poNumber, lineItems, projectId, vendorName } = body; // vendorName from frontend

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch the existing record to calculate cost differences
            const oldPO = await tx.mM_PurchaseOrder.findUnique({ 
                where: { id },
                include: { lineItems: true }
            });
            if (!oldPO) throw new Error("Procurement record not found in ledger");

            const newTotal = lineItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
            const costDiff = newTotal - oldPO.totalValue;

            // 2. Update Project Cost Delta (Financial Integrity)
            await tx.mM_Project.update({
                where: { id: projectId },
                data: { totalActualCost: { increment: costDiff } }
            });

            // 3. Reset status of previously linked requirements to DRAFT
            const oldReqIds = oldPO.lineItems.map((li: any) => li.requirementId).filter(Boolean);
            if (oldReqIds.length > 0) {
                await tx.mM_MaterialRequirement.updateMany({
                    where: { id: { in: oldReqIds } },
                    data: { status: MM_MaterialStatus.DRAFT }
                });
            }

            // 4. Wipe old line items to replace with new set
            // Check your schema: use 'poId' or 'purchaseOrderId' based on relation field name
            await tx.mM_POLineItem.deleteMany({ where: { poId: id } });

            // 5. Update PO details and create new line items
            const updatedPO = await tx.mM_PurchaseOrder.update({
                where: { id },
                data: {
                    poNumber,
                    vendorname: vendorName || body.vendorname, // Direct string update
                    totalValue: newTotal,
                    lineItems: {
                        create: lineItems.map((item: any) => ({
                            itemCode: item.itemCode,
                            description: item.description || `Item: ${item.itemCode}`,
                            quantityOrdered: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                            materialRequirement: { connect: { id: item.requirementId } }
                        }))
                    }
                },
                include: { lineItems: true }
            });

            // 6. Set new requirements status to PO_ISSUED
            const newReqIds = lineItems.map((item: any) => item.requirementId);
            await tx.mM_MaterialRequirement.updateMany({
                where: { id: { in: newReqIds } },
                data: { status: 'PO_ISSUED' }
            });

            return updatedPO;
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("PATCH Error:", error);
        return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

/**
 * 🎯 DELETE: Remove PO and Revert Costs
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            const po = await tx.mM_PurchaseOrder.findUnique({
                where: { id },
                include: { lineItems: true }
            });
            if (!po) throw new Error("PO not found");

            // 1. Revert Material Statuses back to DRAFT for re-procurement
            const reqIds = po.lineItems.map((li: any) => li.requirementId).filter(Boolean);
            if (reqIds.length > 0) {
                await tx.mM_MaterialRequirement.updateMany({
                    where: { id: { in: reqIds } },
                    data: { status: MM_MaterialStatus.DRAFT }
                });
            }

            // 2. Revert Project Costs (Subtract the deleted PO value)
            await tx.mM_Project.update({
                where: { id: po.projectId },
                data: { totalActualCost: { decrement: po.totalValue } }
            });

            // 3. Delete PO (POLineItems should delete via Cascade if set in schema, 
            // otherwise add a deleteMany for lineItems here first)
            await tx.mM_PurchaseOrder.delete({ where: { id } });
        });

        return NextResponse.json({ message: "PO Revoked & Costs Reverted" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { MM_MaterialStatus,  } from '@prisma/client';




// /**
//  * 🎯 PATCH: Update existing PO and Re-calibrate Costs
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
    
//     try {

//         const { id } = params;
//         const body = await request.json();        
//         const {poNumber, lineItems, projectId } = body;

//         const result = await prisma.$transaction(async (tx) => {
//             const oldPO = await tx.mM_PurchaseOrder.findUnique({ 
//                 where: { id },
//                 include: { lineItems: true }
//             });
//             if (!oldPO) throw new Error("PO not found");

//             const newTotal = lineItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
//             const costDiff = newTotal - oldPO.totalValue;

//             // 1. Update Project Cost Delta
//             await tx.mM_Project.update({
//                 where: { id: projectId },
//                 data: { totalActualCost: { increment: costDiff } }
//             });

//             // 2. Reset old items status to PLANNED
//             const oldReqIds = oldPO.lineItems.map((li: any) => li.requirementId).filter(Boolean);
//             await tx.mM_MaterialRequirement.updateMany({
//                 where: { id: { in: oldReqIds } },
//                 data: { status: MM_MaterialStatus.DRAFT }
//             });

//             // 3. Replace Line Items (Note: adjust 'poId' if your schema uses 'purchaseOrderId')
//             await tx.mM_POLineItem.deleteMany({ where: { poId: id } });

//             const updatedPO = await tx.mM_PurchaseOrder.update({
//                 where: { id },
//                 data: {
//                     poNumber,
//                     totalValue: newTotal,
//                     lineItems: {
//                         create: lineItems.map((item: any) => ({
//                             itemCode: item.itemCode,
//                             description: item.description,
//                             quantityOrdered: item.quantity,
//                             unitPrice: item.unitPrice,
//                             totalPrice: item.quantity * item.unitPrice,
//                             materialRequirement: { connect: { id: item.requirementId } }
//                         }))
//                     }
//                 }
//             });

//             // 4. Set new items status to PO_ISSUED
//             const newReqIds = lineItems.map((item: any) => item.requirementId);
//             await tx.mM_MaterialRequirement.updateMany({
//                 where: { id: { in: newReqIds } },
//                 data: { status: 'PO_ISSUED' }
//             });

//             return updatedPO;
//         });

//         return NextResponse.json(result, { status: 200 });
//     } catch (error: any) {
//         return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE: Remove PO and Revert Costs
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const { id } = params;
//         if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

//         await prisma.$transaction(async (tx) => {
//             const po = await tx.mM_PurchaseOrder.findUnique({
//                 where: { id },
//                 include: { lineItems: true }
//             });
//             if (!po) throw new Error("PO not found");

//             // 1. Revert Material Statuses
//             const reqIds = po.lineItems.map((li: any) => li.requirementId).filter(Boolean);
//             await tx.mM_MaterialRequirement.updateMany({
//                 where: { id: { in: reqIds } },
//                 data: { status: MM_MaterialStatus.DRAFT }
//             });

//             // 2. Revert Project Costs
//             await tx.mM_Project.update({
//                 where: { id: po.projectId },
//                 data: { totalActualCost: { decrement: po.totalValue } }
//             });

//             // 3. Delete PO
//             await tx.mM_PurchaseOrder.delete({ where: { id } });
//         });

//         return NextResponse.json({ message: "PO Deleted" }, { status: 200 });
//     } catch (error: any) {
//         return NextResponse.json({ message: error.message }, { status: 500 });
//     }
// }

/**
 * 🎯 DELETE: Remove PO and Revert Costs
 * URL: /mm/api/purchaseorders?id=XXXXX
 */
// export async function DELETE(request: NextRequest) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const id = searchParams.get('id');

//         if (!id) {
//             return NextResponse.json({ message: "PO ID required" }, { status: 400 });
//         }

//         const result = await prisma.$transaction(async (tx) => {
//             // 1. Get PO details
//             const po = await tx.mM_PurchaseOrder.findUnique({
//                 where: { id },
//                 include: { lineItems: true }
//             });

//             if (!po) throw new Error("Purchase Order not found");

//             // 2. Revert Material Statuses to PLANNED
//             // Note: Use 'requirementId' or 'materialRequirementId' based on your schema
//             const reqIds = po.lineItems.map((li: any) => li.requirementId).filter(Boolean);
            
//             if (reqIds.length > 0) {
//                 await tx.mM_MaterialRequirement.updateMany({
//                     where: { id: { in: reqIds } },
//                     data: { status: MM_MaterialStatus.DRAFT }
//                 });
//             }

//             // 3. Revert Project Costs
//             await tx.mM_Project.update({
//                 where: { id: po.projectId },
//                 data: {
//                     totalActualCost: { decrement: po.totalValue }
//                 }
//             });

//             // 4. Delete the PO
//             return await tx.mM_PurchaseOrder.delete({
//                 where: { id }
//             });
//         });

//         return NextResponse.json({ message: "PO Deleted", result }, { status: 200 });
//     } catch (error: any) {
//         console.error("DELETE ERROR:", error);
//         return NextResponse.json({ message: error.message || "Delete failed" }, { status: 500 });
//     }
// }

// Ensure your PATCH/POST/GET are also exported in this same file...