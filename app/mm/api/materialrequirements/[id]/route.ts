import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';

/**
 * 🎯 PATCH: Update a specific Material Requirement (BoQ Entry)
 * Handles linkage to MM_MasterMaterial for itemCode/description changes.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const { 
            itemCode, 
            description, 
            quantityRequired, 
            estimatedUnitCost, 
            status, 
            activityLabel 
        } = body;

        if (!id) {
            return NextResponse.json({ message: "ID parameter missing" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            let materialUpdate: any = {};

            // 1. Handle Master Material Linkage if itemCode is being changed
            if (itemCode) {
                const master = await tx.mM_MasterMaterial.upsert({
                    where: { itemCode: itemCode.trim().toUpperCase() },
                    update: { description: description || undefined }, // Update master desc if provided
                    create: { 
                        itemCode: itemCode.trim().toUpperCase(), 
                        description: description || 'No description provided' 
                    }
                });
                materialUpdate.materialId = master.id;
            }

            // 2. Perform the update on the Requirement
            return await tx.mM_MaterialRequirement.update({
                where: { id },
                data: {
                    ...materialUpdate,
                    ...(quantityRequired !== undefined && { quantityRequired: Number(quantityRequired) }),
                    ...(estimatedUnitCost !== undefined && { estimatedUnitCost: Number(estimatedUnitCost) }),
                    ...(status && { status }),
                    ...(activityLabel !== undefined && { activityLabel }),
                },
                include: {
                    material: true,
                    project: { select: { name: true } }
                }
            });
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Material PATCH Error:", error);
        return NextResponse.json({ 
            message: "Failed to update material registry.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 DELETE: Removes a Requirement if no PO is linked
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ message: "Material ID is required" }, { status: 400 });
        }

        // 1. Risk Management Check: Verify no active PO linkage
        const materialReq = await prisma.mM_MaterialRequirement.findUnique({
            where: { id },
            select: { 
                poLineItemId: true, 
                material: { select: { itemCode: true } } 
            }
        });

        if (!materialReq) {
            return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
        }

        if (materialReq.poLineItemId) {
            return NextResponse.json({ 
                message: `Forbidden: Item ${materialReq.material?.itemCode} is already linked to a PO. You must revoke the PO first.` 
            }, { status: 403 });
        }

        // 2. Perform Deletion (Does NOT delete the Master Material, only this project's need for it)
        await prisma.mM_MaterialRequirement.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Material removed from BoQ" }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: "Deletion failed", error: error.message }, { status: 500 });
    }
}