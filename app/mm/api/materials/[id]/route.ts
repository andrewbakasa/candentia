import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';

/**
 * 🎯 PATCH /api/mm/materials/[id]
 * Updates a specific Material Requirement (BoQ Entry)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        // Destructure to separate data from any accidental bulk update IDs 
        // that might have been passed from the shared form logic
        const { ids, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ message: "ID parameter missing" }, { status: 400 });
        }

        // Guideline 1 Compliance: Ensure numeric integrity for financial audit
        const formattedData = {
            ...updateData,
            ...(updateData.quantityRequired && { quantityRequired: Number(updateData.quantityRequired) }),
            ...(updateData.estimatedUnitCost && { estimatedUnitCost: Number(updateData.estimatedUnitCost) }),
        };

        const updatedMaterial = await prisma.mM_MaterialRequirement.update({
            where: { id },
            data: formattedData,
            include: {
                project: { select: { name: true } }
            }
        });

        return NextResponse.json(updatedMaterial, { status: 200 });

    } catch (error: any) {
        console.error("Material PATCH Error:", error);
        return NextResponse.json({ 
            message: "Failed to update material registry.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/materials/[id]
 * Removes a Material Requirement if it has no financial commitments (PO)
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

        // 1. Risk Management Check (Guideline 1): Verify no active fulfillment exists
        const material = await prisma.mM_MaterialRequirement.findUnique({
            where: { id },
            select: { poLineItemId: true, itemCode: true }
        });

        if (!material) {
            return NextResponse.json({ message: "Material not found" }, { status: 404 });
        }

        if (material.poLineItemId) {
            return NextResponse.json({ 
                message: `Forbidden: Item ${material.itemCode} is linked to a PO. Cancellation must happen at Procurement stage.` 
            }, { status: 403 });
        }

        // 2. Perform Deletion
        await prisma.mM_MaterialRequirement.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Material removed from BoQ" }, { status: 200 });

    } catch (error: any) {
        console.error("Material DELETE Error:", error);
        return NextResponse.json({ 
            message: "Deletion failed.", 
            error: error.message 
        }, { status: 500 });
    }
}