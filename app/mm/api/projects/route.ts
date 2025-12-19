import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 

// Aligned with the MM_Project model string fields
interface ProjectCreationData {
    name: string;
    allocatedBudget: number;
    planId: string;
    workshopId: string;
    projectManager: string; // Updated from managerId
    status?: any;
}

/**
 * 🎯 POST /api/mm/projects
 * Creates an NRZ Maintenance Project under a Strategic Plan
 */
export async function POST(request: NextRequest) {
    try {
        const body: ProjectCreationData = await request.json();

        // 1. Mandatory Field Validation
        if (!body.name || !body.allocatedBudget || !body.planId || !body.workshopId || !body.projectManager) {
            return NextResponse.json(
                { message: 'Missing mandatory fields: Project Name, Budget, Workshop, Plan, or Manager' }, 
                { status: 400 }
            );
        }

        // 2. Strategic Ceiling Check (Guideline 1 of 2025 Compliance)
        const plan = await prisma.mM_StrategicPlan.findUnique({
            where: { id: body.planId },
            include: { mm_projects: true }
        });

        if (!plan) {
            return NextResponse.json({ message: 'Target Strategic Plan not found in NRZ Database.' }, { status: 404 });
        }

        const currentSpent = plan.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
        const availableCeiling = plan.totalBudget - currentSpent;

        if (body.allocatedBudget > availableCeiling) {
            return NextResponse.json(
                { 
                    message: `Strategic Ceiling Violation: FY ${plan.year} only has $${availableCeiling.toLocaleString()} remaining.` 
                }, 
                { status: 403 }
            );
        }

        // 3. Persistent Creation
        const newProject = await prisma.mM_Project.create({
            data: {
                name: body.name,
                allocatedBudget: body.allocatedBudget,
                planId: body.planId,
                workshopId: body.workshopId,
                projectManager: body.projectManager, // Direct string mapping
                status: 'PLANNED',
                progress: 0,
                totalActualCost: 0
            }
        });

        return NextResponse.json(newProject, { status: 201 });

    } catch (error) {
        console.error("MM_Project POST Error:", error);
        return NextResponse.json({ message: "Internal Server Error: Failed to authorize Project rollout." }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/projects
 * Fetches all NRZ Maintenance Projects with Workshop and Strategic Parent details
 */
export async function GET() {
    try {
        const projects = await prisma.mM_Project.findMany({
            include: {
                responsibleWorkshop: true,
                plan: {
                    select: {
                        year: true,
                        assignedExecutive: true
                    }
                },
                _count: { select: { activities: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("MM_Project GET Error:", error);
        return NextResponse.json({ message: "System Link Failure: Could not retrieve projects" }, { status: 500 });
    }
}