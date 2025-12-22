import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { MM_MaterialStatus, MM_POStatus } from '@prisma/client';

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
        const { poNumber, lineItems, projectId, vendorName, status } = body; 

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch existing record for comparison
            const oldPO = await tx.mM_PurchaseOrder.findUnique({ 
                where: { id },
                include: { lineItems: true }
            });
            if (!oldPO) throw new Error("Procurement record not found in ledger");

            const newTotal = lineItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
            const costDiff = newTotal - oldPO.totalValue;

            // 2. Logic for fundedAt Timestamp (Audit & Cash Flow Tracking)
            let fundedAtUpdate = undefined;
            // If the new status is FUNDED and it wasn't funded before, set the timestamp
            if (status === 'FUNDED' && oldPO.status !== 'FUNDED') {
                fundedAtUpdate = new Date();
            } else if (status !== 'FUNDED') {
                // Optional: Clear fundedAt if the status is reverted from FUNDED
                fundedAtUpdate = null;
            }

            // 3. Update Project Cost Delta (Financial Integrity)
            await tx.mM_Project.update({
                where: { id: projectId },
                data: { totalActualCost: { increment: costDiff } }
            });

            // 4. Reset old requirements to DRAFT
            const oldReqIds = oldPO.lineItems.map((li: any) => li.requirementId).filter(Boolean);
            if (oldReqIds.length > 0) {
                await tx.mM_MaterialRequirement.updateMany({
                    where: { id: { in: oldReqIds } },
                    data: { status: MM_MaterialStatus.DRAFT }
                });
            }

            // 5. Wipe old line items
            await tx.mM_POLineItem.deleteMany({ where: { poId: id } });

            // 6. Update PO details, Status, and fundedAt
            const updatedPO = await tx.mM_PurchaseOrder.update({
                where: { id },
                data: {
                    poNumber,
                    status: status as MM_POStatus, // Explicitly cast to Enum
                    vendorname: vendorName || body.vendorname,
                    totalValue: newTotal,
                    fundedAt: fundedAtUpdate, // Updated trigger
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

            // 7. Update new requirements status to PO_ISSUED
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