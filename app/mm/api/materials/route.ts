import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST: Create a new Material Requirement (BoQ Entry)
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

        // Validation: Basic check for required fields
        if (!projectId || !itemCode || !quantityRequired) {
            return NextResponse.json({ message: "Missing required BoQ fields" }, { status: 400 });
        }

        // Create the Material Requirement
        const materialRequirement = await prisma.mM_MaterialRequirement.create({
            data: {
                projectId,
                itemCode,
                description,
                quantityRequired: Number(quantityRequired),
                estimatedUnitCost: Number(estimatedUnitCost),
                activityLabel: activityLabel || null,
                status: status || 'DRAFT',
            },
            include: {
                project: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(materialRequirement, { status: 201 });
    } catch (error: any) {
        console.error("Material Requirement Creation Error:", error);
        return NextResponse.json({ 
            message: "Failed to create material requirement.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 GET: Fetch Material Requirements (BoQ)
 * Supports filtering by Project or Status
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
                project: {
                    select: { 
                        name: true,
                       // strategy: { select: { year: true } } // For Guideline 1 Compliance context
                    }
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
        console.error("Material Requirement Fetch Error:", error);
        return NextResponse.json({ 
            message: "Error fetching material registry.", 
            error: error.message 
        }, { status: 500 });
    }
}

/**
 * 🎯 PATCH: Bulk Update Status (e.g., Moving from DRAFT to REQUISITIONED)
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