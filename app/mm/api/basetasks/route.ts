import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 GET /api/mm/baseTasks
 * Retrieves all Standardized Benchmarks.
 * Used for populating Task Selection during Project Planning.
 */
export async function GET() {
    try {
        const baseTasks = await prisma.baseTask.findMany({
            orderBy: {
                standardTitle: 'asc'
            }
        });

        return NextResponse.json(baseTasks, { status: 200 });
    } catch (error) {
        console.error("Fetch BaseTasks Error:", error);
        return NextResponse.json({ message: "Failed to retrieve benchmarks." }, { status: 500 });
    }
}

/**
 * 🎯 POST /api/mm/baseTasks
 * Creates a Standardized BaseTask Template (Guideline 1 of 2025).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { standardTitle, category, benchmarkHours, requiredSkills, standardDesc } = body;

        if (!standardTitle) {
            return NextResponse.json({ message: "Standard Title is required." }, { status: 400 });
        }

        const baseTask = await prisma.baseTask.create({
            data: {
                standardTitle,
                standardDesc: standardDesc || null,
                category: category || "General",
                benchmarkHours: parseFloat(benchmarkHours) || 0,
                requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
            }
        });
       console.log("base posted", baseTask)
        return NextResponse.json(baseTask, { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ message: "A standard task with this title already exists." }, { status: 409 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb';

// /**
//  * 🎯 POST /api/admin/base-tasks
//  * Creates a Standardized BaseTask Template for Workshop Benchmarking.
//  * Reference: Guideline 1 of 2025 Sec 6.2
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body = await request.json();
//         const { standardTitle, category, benchmarkHours, requiredSkills } = body;

//         // 1. Validation for Unique Standard Title
//         if (!standardTitle) {
//             return NextResponse.json({ message: "Standard Title is required." }, { status: 400 });
//         }

//         // 2. Create the Master Template
//         const baseTask = await prisma.baseTask.create({
//             data: {
//                 standardTitle: standardTitle,
//                 standardDesc: body.standardDesc || null,
//                 category: category || "General",
                
//                 // Metrics for Financial Performance Benchmarking
//                 benchmarkHours: parseFloat(benchmarkHours) || 0,
                
//                 // Array of strings for resource matching
//                 requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
//             }
//         });

//         return NextResponse.json(baseTask, { status: 201 });

//     } catch (error: any) {
//         console.error("BaseTask Template Creation Error:", error);
        
//         // Handle MongoDB/Prisma Unique Constraint Error (P2002)
//         if (error.code === 'P2002') {
//             return NextResponse.json(
//                 { message: "A standard task with this title already exists." }, 
//                 { status: 409 }
//             );
//         }

//         return NextResponse.json({ message: "Failed to create standardized benchmark." }, { status: 500 });
//     }
// }