import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';

/**
 * 🎯 PATCH: Update Master Material Details
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const updated = await prisma.mM_MasterMaterial.update({
            where: { id },
            data: {
                ...body,
                // Ensure numeric conversion for the financial field
                lastKnownCost: body.lastKnownCost ? Number(body.lastKnownCost) : undefined
            }
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

/**
 * 🎯 DELETE: Remove from Catalog (Only if never used in a project)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 🛡️ Integrity Check: Don't delete if it's referenced in any Project BoQ
        const usageCount = await prisma.mM_MaterialRequirement.count({
            where: { materialId: id }
        });

        if (usageCount > 0) {
            return NextResponse.json({ 
                message: "Cannot delete: This material is referenced in active projects." 
            }, { status: 403 });
        }

        await prisma.mM_MasterMaterial.delete({ where: { id } });

        return NextResponse.json({ message: "Material removed from catalog" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Deletion failed", error: error.message }, { status: 500 });
    }
}