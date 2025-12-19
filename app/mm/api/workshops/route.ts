import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { MM_WorkshopType } from '@prisma/client';

/**
 * 🎯 POST /api/mm/workshops
 * Registers a new Maintenance Workshop asset
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Validation for mandatory fields
        if (!body.name || !body.specialization) {
            return NextResponse.json(
                { message: "Missing required fields: Name and Specialization are mandatory." }, 
                { status: 400 }
            );
        }

        // 2. Create the Workshop with full infrastructure data
        const newWorkshop = await prisma.mM_Workshop.create({
            data: {
                name: body.name,
                // Map form 'specialization' to Prisma 'type'
                type: body.specialization as MM_WorkshopType,
                location: body.location || "Unspecified",
                capacity: body.capacity ? parseInt(body.capacity) : 0,
            }
        });

        return NextResponse.json(newWorkshop, { status: 201 });

    } catch (error: any) {
        console.error("WORKSHOP_POST_ERROR:", error);
        
        // Handle unique constraint violation for duplicate names
        if (error.code === 'P2002') {
            return NextResponse.json(
                { message: "A workshop with this name already exists." }, 
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Failed to create Workshop infrastructure entry." }, 
            { status: 500 }
        );
    }
}

/**
 * 🎯 GET /api/mm/workshops
 * Fetches workshops with capacity and project load counts
 */
export async function GET() {
    try {
        const workshops = await prisma.mM_Workshop.findMany({
            include: { 
                _count: { 
                    select: { mm_projects: true } 
                } 
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(workshops, { status: 200 });
    } catch (error) {
        console.error("WORKSHOP_GET_ERROR:", error);
        return NextResponse.json(
            { message: "Error fetching workshop records." }, 
            { status: 500 }
        );
    }
}