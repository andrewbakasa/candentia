import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

/**
 * 🎯 PATCH /api/mm/projects/[id]
 * Updates Maintenance Projects and enforces Strategic Plan budget ceilings
 */
interface ProjectUpdateData {
    name?: string;
    allocatedBudget?: number;
    planId?: string;
    workshopId?: string;
    managerId?: string; 
    status?: any;
    progress?: number;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body: ProjectUpdateData = await request.json();

        // 1. Budget Ceiling Validation
        if (body.allocatedBudget !== undefined || body.planId) {
            // FIX: Changed 'strategicPlan' to 'plan' to match your schema
            const currentProject = await prisma.mM_Project.findUnique({
                where: { id },
                include: { 
                    plan: { 
                        include: { mm_projects: true } 
                    } 
                }
            });

            if (!currentProject) {
                return NextResponse.json({ message: "Project not found" }, { status: 404 });
            }

            // Logic check: If project is orphaned (no plan attached), we skip the ceiling check
            if (currentProject.plan) {
                const parentPlan = currentProject.plan;
                
                // Calculate total budget used by other projects under this specific plan
                const otherProjectsTotal = parentPlan.mm_projects
                    .filter(p => p.id !== id)
                    .reduce((acc, p) => acc + p.allocatedBudget, 0);

                const proposedTotal = otherProjectsTotal + (body.allocatedBudget ?? currentProject.allocatedBudget);

                if (proposedTotal > parentPlan.totalBudget) {
                    return NextResponse.json({ 
                        message: `Budget Breach: Strategic Plan limit is $${parentPlan.totalBudget.toLocaleString()}. Proposed allocation reaches $${proposedTotal.toLocaleString()}.` 
                    }, { status: 403 });
                }
            }
        }

        // 2. Type-Safe Update
        const updateData: Prisma.MM_ProjectUncheckedUpdateInput = {
            ...(body.name && { name: body.name }),
            ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
            ...(body.planId && { planId: body.planId }),
            ...(body.workshopId && { workshopId: body.workshopId }),
            ...(body.managerId && { projectManager: body.managerId }),
            ...(body.status && { status: body.status }),
            ...(body.progress !== undefined && { progress: body.progress }),
        };

        const updatedProject = await prisma.mM_Project.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedProject, { status: 200 });

    } catch (error: any) {
        console.error("MM_Project PATCH Error:", error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Project record not found." }, { status: 404 });
            }
        }
        
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


/**
 * 🎯 DELETE /api/mm/projects/[id]
 * Safely removes a project and its associated operational activities/POs
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // 1. Transaction: Ensure operational records are cleaned up before project deletion
        await prisma.$transaction(async (tx) => {
            
            // A. Find all activities linked to this project
            const projectActivities = await tx.mM_Activity.findMany({
                where: { projectId: id },
                select: { id: true }
            });

            const activityIds = projectActivities.map(a => a.id);

            // B. Delete associated Purchase Orders first (leaf nodes)
            if (activityIds.length > 0) {
                await tx.mM_PurchaseOrder.deleteMany({
                    where: { activityId: { in: activityIds } }
                });
            }

            // C. Delete the Activities
            await tx.mM_Activity.deleteMany({
                where: { projectId: id }
            });

            // D. Finally, delete the Project
            await tx.mM_Project.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: "Project and associated resources deleted successfully." }, { status: 200 });

    } catch (error: any) {
        console.error("MM_Project DELETE Error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ message: "Project record not found." }, { status: 404 });
            }
        }

        return NextResponse.json({ message: "Failed to delete project. Ensure no dependencies exist." }, { status: 500 });
    }
}