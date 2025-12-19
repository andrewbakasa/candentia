import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { MM_ProjectStatus } from '@prisma/client';

interface ProjectCreationData {
    name: string;
    allocatedBudget: number;
    planId: string;
    workshopId: string;
    managerId: string;
}

/**
 * 🎯 POST /api/mm/projects
 * Creates an NRZ Maintenance Project under a Strategic Plan
 */
export async function POST(request: NextRequest) {
    try {
        const body: ProjectCreationData = await request.json();

        // 1. Validation
        if (!body.name || !body.allocatedBudget || !body.planId) {
            return NextResponse.json({ message: 'Missing mandatory fields: name, budget, or planId' }, { status: 400 });
        }

        // 2. Budget Ceiling Check (Strategic Alignment)
        const plan = await prisma.mM_StrategicPlan.findUnique({
            where: { id: body.planId },
            include: { mm_projects: true }
        });

        const currentSpent = plan?.mm_projects.reduce((acc, p) => acc + p.allocatedBudget, 0) || 0;
        if (plan && (currentSpent + body.allocatedBudget > plan.totalBudget)) {
            return NextResponse.json({ message: 'Budget exceeds Strategic Plan ceiling.' }, { status: 403 });
        }

        // 3. Create MM_Project
        const newProject = await prisma.mM_Project.create({
            data: {
                name: body.name,
                allocatedBudget: body.allocatedBudget,
                planId: body.planId,
                workshopId: body.workshopId,
                managerId: body.managerId,
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
                projectManager: { select: { name: true} },
                _count: { select: { activities: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching projects" }, { status: 500 });
    }
}