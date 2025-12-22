import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST: Create a new Material Requirement (BoQ Entry) with Master Linkage
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            projectId, 
            itemCode, 
            description, 
            quantityRequired, 
            estimatedUnitCost, 
            activityLabel,
            status 
        } = body;

        // 1. Validation
        if (!projectId || !itemCode || !quantityRequired) {
            return NextResponse.json({ message: "Missing required BoQ fields" }, { status: 400 });
        }

        // 2. Transactional Create: Ensure Master Material exists then Link
        const result = await prisma.$transaction(async (tx) => {
            // Find or Create the Master Material record
            const masterMaterial = await tx.mM_MasterMaterial.upsert({
                where: { itemCode: itemCode.trim().toUpperCase() },
                update: { description }, // Keep master description updated to latest
                create: {
                    itemCode: itemCode.trim().toUpperCase(),
                    description: description,
                }
            });

            // Create the Requirement linked to the Master Material
            return await tx.mM_MaterialRequirement.create({
                data: {
                    projectId,
                    materialId: masterMaterial.id, // Linked to Master
                    quantityRequired: Number(quantityRequired),
                    estimatedUnitCost: Number(estimatedUnitCost),
                    activityLabel: activityLabel || null,
                    status: status || 'DRAFT',
                },
                include: {
                    project: { select: { name: true } },
                    material: true // Include master details in response
                }
            });
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("BoQ Creation Error:", error);
        return NextResponse.json({ 
            message: "Failed to create requirement.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 GET: Fetch Material Requirements (BoQ) with Master Details
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const status = searchParams.get('status');

        const requirements = await prisma.mM_MaterialRequirement.findMany({
            where: {
                ...(projectId && { projectId }),
                ...(status && { status: status as any }),
            },
            include: {
                // Include Master Material details (Source of Truth)
                material: {
                    select: { itemCode: true, description: true, unitOfMeasure: true }
                },
                project: {
                    select: { name: true }
                },
                poLineItem: {
                    include: {
                        purchaseOrder: {
                            select: { poNumber: true, status: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requirements, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error fetching registry.", error: error.message }, { status: 500 });
    }
}

/**
 * 🎯 PATCH: Bulk Update Status
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, status } = body;

        if (!Array.isArray(ids) || !status) {
            return NextResponse.json({ message: "Invalid update data" }, { status: 400 });
        }

        const updateResult = await prisma.mM_MaterialRequirement.updateMany({
            where: { id: { in: ids } },
            data: { status: status as any }
        });

        return NextResponse.json(updateResult, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Bulk update failed", error: error.message }, { status: 500 });
    }
}