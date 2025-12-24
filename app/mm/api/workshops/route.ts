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


export async function GET() {
    try {
        const workshops = await prisma.mM_Workshop.findMany({
            include: {
                mm_projects: {
                    select: {
                        allocatedBudget: true,
                        totalActualCost: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // 🛠️ Manual Aggregation to bypass the _count:0 bug
        const workshopData = workshops.map(workshop => {
            const projects = workshop.mm_projects || [];
            
            // Financial aggregation for Guideline 2.1
            const totalAllocated = projects.reduce((sum, p) => sum + p.allocatedBudget, 0);
            const totalActual = projects.reduce((sum, p) => sum + p.totalActualCost, 0);

            return {
                id: workshop.id,
                name: workshop.name,
                type: workshop.type,
                location: workshop.location,
                capacity: workshop.capacity,
                // Explicitly derive count from the length of retrieved projects
                projectCount: projects.length, 
                totalAllocated,
                totalActual,
                // Calculate capacity utilization percentage
                utilization: workshop.capacity > 0 
                    ? Math.round((projects.length / workshop.capacity) * 100) 
                    : 0,
                createdAt: workshop.createdAt,
                updatedAt: workshop.updatedAt
            };
        });

        console.log("workshopData",workshopData)

        return NextResponse.json(workshopData, { status: 200 });
    } catch (error) {
        console.error("WORKSHOP_GET_ERROR:", error);
        return NextResponse.json(
            { message: "System Link Error: Unable to aggregate workshop metrics." }, 
            { status: 500 }
        );
    }
}

// export async function GET() {
//     try {
//         const workshops = await prisma.mM_Workshop.findMany({
//             include: {
//                 mm_projects: {
//                     select: {
//                         allocatedBudget: true,
//                         totalActualCost: true
//                     }
//                 }
//             },
//             orderBy: {
//                 name: 'asc'
//             }
//         });

//         // 🛠️ Manual Aggregation to bypass the _count:0 bug
//         const workshopData = workshops.map(workshop => {
//             const projects = workshop.mm_projects || [];
//            // console.log('workshop',workshop)
//             // Financial aggregation for Guideline 2.1
//             const totalAllocated = projects.reduce((sum, p) => sum + p.allocatedBudget, 0);
//             const totalActual = projects.reduce((sum, p) => sum + p.totalActualCost, 0);

//             return {
//                 id: workshop.id,
//                 name: workshop.name,
//                 type: workshop.type,
//                 location: workshop.location,
//                 capacity: workshop.capacity,
//                 // Explicitly derive count from the length of retrieved projects
//                 projectCount: projects.length, 
//                 totalAllocated,
//                 totalActual,
//                 // Calculate capacity utilization percentage
//                 utilization: workshop.capacity > 0 
//                     ? Math.round((projects.length / workshop.capacity) * 100) 
//                     : 0,
//                 createdAt: workshop.createdAt,
//                 updatedAt: workshop.updatedAt
//             };
//         });

//         console.log("workshopData------------------>",workshopData)

//         return NextResponse.json(workshopData, { status: 200 });
//     } catch (error) {
//         console.error("WORKSHOP_GET_ERROR:", error);
//         return NextResponse.json(
//             { message: "System Link Error: Unable to aggregate workshop metrics." }, 
//             { status: 500 }
//         );
//     }
// }