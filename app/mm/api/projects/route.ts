import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 

interface ProjectCreationData {
    name: string;
    allocatedBudget: number;
    planId: string;
    workshopId: string;
    managerId: string; // Coming from the "Project Manager Name" input in the form
}

/**
 * 🎯 POST /api/mm/projects
 * Creates an NRZ Maintenance Project under a Strategic Plan
 */
export async function POST(request: NextRequest) {
    try {
        const body: ProjectCreationData = await request.json();

        // 1. Validation
        if (!body.name || !body.allocatedBudget || !body.planId || !body.workshopId) {
            return NextResponse.json(
                { message: 'Missing mandatory fields: name, budget, workshopId, or planId' }, 
                { status: 400 }
            );
        }

        // 2. Budget Ceiling Check (Strategic Alignment - Guideline 1 of 2025)
        const plan = await prisma.mM_StrategicPlan.findUnique({
            where: { id: body.planId },
            include: { mm_projects: true }
        });

        if (!plan) {
            return NextResponse.json({ message: 'Strategic Plan not found.' }, { status: 404 });
        }

        const currentSpent = plan.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
        if (currentSpent + body.allocatedBudget > plan.totalBudget) {
            return NextResponse.json(
                { message: `Budget exceeds Strategic Plan ceiling. Available: $${(plan.totalBudget - currentSpent).toLocaleString()}` }, 
                { status: 403 }
            );
        }

        // 3. Create MM_Project with direct string for projectManager
        const newProject = await prisma.mM_Project.create({
            data: {
                name: body.name,
                allocatedBudget: body.allocatedBudget,
                planId: body.planId,
                workshopId: body.workshopId,
                projectManager: body.managerId, // Mapping the form's 'managerId' input to the 'projectManager' string field
                status: 'PLANNED',
                progress: 0,
                totalActualCost: 0
            }
        });

        return NextResponse.json(newProject, { status: 201 });

    } catch (error) {
        console.error("MM_Project POST Error:", error);
        return NextResponse.json({ message: "Failed to create MM Project." }, { status: 500 });
    }
}

/**
 * 🎯 GET /api/mm/projects
 * Fetches all NRZ Maintenance Projects with Workshop details
 */
export async function GET() {
    try {
        const projects = await prisma.mM_Project.findMany({
            include: {
                responsibleWorkshop: true,
                // projectManager is now a direct string field, no need for selection logic
                _count: { select: { activities: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("MM_Project GET Error:", error);
        return NextResponse.json({ message: "Error fetching projects" }, { status: 500 });
    }
}