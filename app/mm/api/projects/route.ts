import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { MM_ProjectStatus } from '@prisma/client';

/**
 * 🛠️ TYPES & INTERFACES
 */
interface ProjectCreationData {
    name: string;
    allocatedBudget: number;
    planId: string;
    workshopId: string;
    projectManager: string;
    progress?: number; // Added to interface
   // status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
    status: MM_ProjectStatus//'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
}

/**
 * 🎯 GET /api/mm/projects
 */
export async function GET() {
    try {
        const projects = await prisma.mM_Project.findMany({
            include: {
                responsibleWorkshop: true,
                plan: true,
                materialRequirements: {
                    include: {
                        material: true 
                    }
                },
                _count: {
                    select: { 
                        activities: true,
                        purchaseOrders: true 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("MM_PROJECT_GET_ERROR:", error);
        return NextResponse.json(
            { message: "System Link Failure: Could not retrieve project ledger." }, 
            { status: 500 }
        );
    }
}

/**
 * 🎯 POST /api/mm/projects
 * Creates a Project with initial progress (usually 0).
 */
export async function POST(request: NextRequest) {
    try {
        const body: ProjectCreationData = await request.json();

        const { name, allocatedBudget, planId, workshopId, projectManager, progress, status } = body;
        
        if (!name || !allocatedBudget || !planId || !workshopId || !projectManager) {
            return NextResponse.json(
                { message: 'Missing mandatory fields: Name, Budget, Workshop, Plan, or Manager' }, 
                { status: 400 }
            );
        }

        // Financial Compliance Check
        const plan = await prisma.mM_StrategicPlan.findUnique({
            where: { id: planId },
            include: { mm_projects: true }
        });

        if (!plan) {
            return NextResponse.json({ message: 'Strategic Plan not found.' }, { status: 404 });
        }

        const currentSpent = plan.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
        const availableCeiling = plan.totalBudget - currentSpent;

        if (allocatedBudget > availableCeiling) {
            return NextResponse.json(
                { message: `Ceiling Violation: FY ${plan.year} only has $${availableCeiling.toLocaleString()} remaining.` }, 
                { status: 403 }
            );
        }

        const newProject = await prisma.mM_Project.create({
            data: {
                name,
                allocatedBudget,
                projectManager,
                status: status,// || MM_ProjectStatus.PLANNED,
                progress: progress ?? 0, // Accepts progress if provided, defaults to 0
                totalActualCost: 0,
                plan: { connect: { id: planId } },
                responsibleWorkshop: { connect: { id: workshopId } }
            },
            include: {
                responsibleWorkshop: true,
                plan: true
            }
        });

        return NextResponse.json(newProject, { status: 201 });

    } catch (error: any) {
        console.error("MM_PROJECT_POST_ERROR:", error);
        if (error.code === 'P2023') {
            return NextResponse.json({ message: "Invalid ID format for Workshop or Plan." }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * 🎯 PATCH /api/mm/projects/[id]
 * Specifically handles updates to Progress and Status during execution.
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, progress, status, name, allocatedBudget, projectManager } = body;

        if (!id) {
            return NextResponse.json({ message: "Project ID is required for update." }, { status: 400 });
        }

        // Logic to auto-complete if progress reaches 100
        const updatedStatus = progress === 100 ? 'COMPLETED' : status;

        const updatedProject = await prisma.mM_Project.update({
            where: { id },
            data: {
                name,
                allocatedBudget,
                projectManager,
                status: updatedStatus,
                progress: progress !== undefined ? Number(progress) : undefined,
            }
        });

        return NextResponse.json(updatedProject, { status: 200 });
    } catch (error) {
        console.error("MM_PROJECT_PATCH_ERROR:", error);
        return NextResponse.json({ message: "Failed to update project progress." }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb'; 

// /**
//  * 🛠️ TYPES & INTERFACES
//  */
// interface ProjectCreationData {
//     name: string;
//     allocatedBudget: number;
//     planId: string;
//     workshopId: string;
//     projectManager: string;
//     status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
// }

// /**
//  * 🎯 GET /api/mm/projects
//  * Fetches all NRZ Maintenance Projects with Workshop and Strategic Parent details.
//  * Implements full relation mapping for the Project BoQ (Material Requirements).
//  */
// export async function GET() {
//     try {
//         const projects = await prisma.mM_Project.findMany({
//             include: {
//                 responsibleWorkshop: true,
//                 plan: true,
//                 materialRequirements: {
//                     include: {
//                         material: true // Connects to MM_MasterMaterial for item descriptions/codes
//                     }
//                 },
//                 _count: {
//                     select: { 
//                         activities: true,
//                         purchaseOrders: true 
//                     }
//                 }
//             },
//             orderBy: { createdAt: 'desc' }
//         });

//         return NextResponse.json(projects, { status: 200 });
//     } catch (error) {
//         console.error("MM_PROJECT_GET_ERROR:", error);
//         return NextResponse.json(
//             { message: "System Link Failure: Could not retrieve project ledger." }, 
//             { status: 500 }
//         );
//     }
// }

// /**
//  * 🎯 POST /api/mm/projects
//  * Creates a Project. 
//  * Compliance Check: Validates against Guideline 1 of 2025 (Strategic Budget Ceiling).
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body: ProjectCreationData = await request.json();

//         // 1. Mandatory Field Validation (Data Integrity)
//         const { name, allocatedBudget, planId, workshopId, projectManager } = body;
//         if (!name || !allocatedBudget || !planId || !workshopId || !projectManager) {
//             return NextResponse.json(
//                 { message: 'Missing mandatory fields: Name, Budget, Workshop, Plan, or Manager' }, 
//                 { status: 400 }
//             );
//         }

//         // 2. Strategic Ceiling Check (Financial Compliance)
//         const plan = await prisma.mM_StrategicPlan.findUnique({
//             where: { id: planId },
//             include: { mm_projects: true }
//         });

//         if (!plan) {
//             return NextResponse.json({ message: 'Strategic Plan not found.' }, { status: 404 });
//         }

//         const currentSpent = plan.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
//         const availableCeiling = plan.totalBudget - currentSpent;

//         if (allocatedBudget > availableCeiling) {
//             return NextResponse.json(
//                 { 
//                     message: `Ceiling Violation: FY ${plan.year} only has $${availableCeiling.toLocaleString()} remaining.` 
//                 }, 
//                 { status: 403 }
//             );
//         }

//         // 3. Persistent Creation using Relational Connectors
//         // This ensures the foreign keys (planId and workshopId) are mapped correctly in MongoDB
//         const newProject = await prisma.mM_Project.create({
//             data: {
//                 name,
//                 allocatedBudget,
//                 projectManager,
//                 status: 'PLANNED',
//                 progress: 0,
//                 totalActualCost: 0,
//                 // Relational Links
//                 plan: { connect: { id: planId } },
//                 responsibleWorkshop: { connect: { id: workshopId } }
//             },
//             include: {
//                 responsibleWorkshop: true,
//                 plan: true
//             }
//         });

//         return NextResponse.json(newProject, { status: 201 });

//     } catch (error: any) {
//         console.error("MM_PROJECT_POST_ERROR:", error);
        
//         // Handle Prisma specific errors (e.g., malformed ObjectIDs)
//         if (error.code === 'P2023') {
//             return NextResponse.json({ message: "Invalid ID format for Workshop or Plan." }, { status: 400 });
//         }

//         return NextResponse.json(
//             { message: "Internal Server Error: Failed to authorize Project rollout." }, 
//             { status: 500 }
//         );
//     }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb'; 

// // Aligned with the MM_Project model string fields
// interface ProjectCreationData {
//     name: string;
//     allocatedBudget: number;
//     planId: string;
//     workshopId: string;
//     projectManager: string; // Updated from managerId
//     status?: any;
// }

// /**
//  * 🎯 POST /api/mm/projects
//  * Creates an NRZ Maintenance Project under a Strategic Plan
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body: ProjectCreationData = await request.json();

//         // 1. Mandatory Field Validation
//         if (!body.name || !body.allocatedBudget || !body.planId || !body.workshopId || !body.projectManager) {
//             return NextResponse.json(
//                 { message: 'Missing mandatory fields: Project Name, Budget, Workshop, Plan, or Manager' }, 
//                 { status: 400 }
//             );
//         }

//         // 2. Strategic Ceiling Check (Guideline 1 of 2025 Compliance)
//         const plan = await prisma.mM_StrategicPlan.findUnique({
//             where: { id: body.planId },
//             include: { mm_projects: true }
//         });

//         if (!plan) {
//             return NextResponse.json({ message: 'Target Strategic Plan not found in NRZ Database.' }, { status: 404 });
//         }

//         const currentSpent = plan.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
//         const availableCeiling = plan.totalBudget - currentSpent;

//         if (body.allocatedBudget > availableCeiling) {
//             return NextResponse.json(
//                 { 
//                     message: `Strategic Ceiling Violation: FY ${plan.year} only has $${availableCeiling.toLocaleString()} remaining.` 
//                 }, 
//                 { status: 403 }
//             );
//         }

//         // 3. Persistent Creation
//         const newProject = await prisma.mM_Project.create({
//             data: {
//                 name: body.name,
//                 allocatedBudget: body.allocatedBudget,
//                 planId: body.planId,
//                // workshopId: body.workshopId,
//                 responsibleWorkshop: { connect: { id: body.workshopId } },
//                 projectManager: body.projectManager, // Direct string mapping
//                 status: 'PLANNED',
//                 progress: 0,
//                 totalActualCost: 0
//             }
//         });

//         return NextResponse.json(newProject, { status: 201 });

//     } catch (error) {
//         console.error("MM_Project POST Error:", error);
//         return NextResponse.json({ message: "Internal Server Error: Failed to authorize Project rollout." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 GET /api/mm/projects
//  * Fetches all NRZ Maintenance Projects with Workshop and Strategic Parent details
//  */
// export async function GET() {
//     try {

//         const projects = await prisma.mM_Project.findMany({
//             include: {
//                 responsibleWorkshop: true,
//                 materialRequirements: {
//                     include: {
//                         material: true // This is the missing link!
//                     }
//                 },
//                 plan: true,                
//                 _count: { select: { activities: true } }
//             },
//             orderBy: { createdAt: 'desc' }
//         });
//         //console.log("projects----check..........>>>>>>>>>>",projects)
//         return NextResponse.json(projects, { status: 200 });
//     } catch (error) {
//         console.error("MM_Project GET Error:", error);
//         return NextResponse.json({ message: "System Link Failure: Could not retrieve projects" }, { status: 500 });
//     }
// }