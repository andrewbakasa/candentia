import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma, MM_WorkshopType } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/workshops/[id]
 * Updates workshop infrastructure details (Capacity, Location, Specialization)
 */
interface WorkshopUpdateData {
    name?: string;
    specialization?: MM_WorkshopType;
    location?: string;
    capacity?: string | number;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body: WorkshopUpdateData = await request.json();

        const updateData: Prisma.MM_WorkshopUncheckedUpdateInput = {
            ...(body.name && { name: body.name }),
            ...(body.specialization && { type: body.specialization }),
            ...(body.location && { location: body.location }),
            ...(body.capacity !== undefined && { 
                capacity: typeof body.capacity === 'string' ? parseInt(body.capacity) : body.capacity 
            }),
        };

        const updatedWorkshop = await prisma.mM_Workshop.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedWorkshop, { status: 200 });

    } catch (error: any) {
        console.error("WORKSHOP_PATCH_ERROR:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({ message: "Workshop name already exists." }, { status: 409 });
            }
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Workshop record not found." }, { status: 404 });
            }
        }

        return NextResponse.json({ message: "Failed to update workshop asset." }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/workshops/[id]
 * Removes a workshop asset. Note: Will fail if projects are still assigned.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // Check if workshop has active projects before deletion to prevent orphaned data
        const workshopWithProjects = await prisma.mM_Workshop.findUnique({
            where: { id },
            include: { _count: { select: { mm_projects: true } } }
        });

        if (workshopWithProjects && workshopWithProjects._count.mm_projects > 0) {
            return NextResponse.json({ 
                message: `Cannot delete: This workshop is currently managing ${workshopWithProjects._count.mm_projects} projects.` 
            }, { status: 400 });
        }

        await prisma.mM_Workshop.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Workshop asset decommissioned successfully." }, { status: 200 });

    } catch (error: any) {
        console.error("WORKSHOP_DELETE_ERROR:", error);

        if (error.code === 'P2025') {
            return NextResponse.json({ message: "Workshop record not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Failed to delete workshop asset." }, { status: 500 });
    }
}