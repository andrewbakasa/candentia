import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

interface ProjectUpdateData {
    name?: string;
    allocatedBudget?: number;
    planId?: string;
    workshopId?: string;
    projectManager?: string; // Updated field name
    status?: any;
    progress?: number;
}

/**
 * 🎯 PATCH /api/mm/projects/[id]
 * Updates Maintenance Projects and enforces Strategic Plan budget ceilings
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body: ProjectUpdateData = await request.json();

        // 1. Budget Ceiling Validation (Section 2.2 Alignment)
        if (body.allocatedBudget !== undefined || body.planId) {
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

            // Perform check if project is linked to a Strategic Plan
            if (currentProject.plan) {
                const parentPlan = currentProject.plan;
                
                // Calculate utilization by all sibling projects
                const otherProjectsTotal = parentPlan.mm_projects
                    .filter(p => p.id !== id)
                    .reduce((acc, p) => acc + p.allocatedBudget, 0);

                const proposedTotal = otherProjectsTotal + (body.allocatedBudget ?? currentProject.allocatedBudget);

                if (proposedTotal > parentPlan.totalBudget) {
                    return NextResponse.json({ 
                        message: `Budget Breach: Strategic Plan limit is $${parentPlan.totalBudget.toLocaleString()}. Proposed total reaches $${proposedTotal.toLocaleString()}.` 
                    }, { status: 403 });
                }
            }
        }

        // 2. Data Mapping & Persistent Update
        const updatedProject = await prisma.mM_Project.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
                ...(body.planId && { planId: body.planId }),
                ...(body.workshopId && { workshopId: body.workshopId }),
                ...(body.projectManager && { projectManager: body.projectManager }), // String mapping
                ...(body.status && { status: body.status }),
                ...(body.progress !== undefined && { progress: body.progress }),
            }
        });

        return NextResponse.json(updatedProject, { status: 200 });

    } catch (error: any) {
        console.error("MM_Project PATCH Error:", error);
        return NextResponse.json({ message: "Update failed. System Link Failure." }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/projects/[id]
 * Cascade deletion following NRZ Operational Security standards
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.$transaction(async (tx) => {
            // 1. Delete Task-level steps (Leaf nodes of Activities)
            const projectActivities = await tx.mM_Activity.findMany({
                where: { projectId: id },
                select: { id: true }
            });
            const activityIds = projectActivities.map(a => a.id);

            if (activityIds.length > 0) {
                await tx.mM_Task.deleteMany({
                    where: { activityId: { in: activityIds } }
                });
            }

           // 2. Delete PO Line Items before the POs
            const projectPOs = await tx.mM_PurchaseOrder.findMany({
                where: { projectId: id },
                select: { id: true }
            });
            const poIds = projectPOs.map(po => po.id);

            if (poIds.length > 0) {
                await tx.mM_POLineItem.deleteMany({
                    where: { 
                        purchaseOrder: { // Use the relation name
                            id: { in: poIds } // Filter by the ID within that relation
                        }
                    }
                });
            }

            // 3. Delete Material Requirements (BoQ)
            await tx.mM_MaterialRequirement.deleteMany({
                where: { projectId: id }
            });

            // 4. Delete Purchase Orders
            await tx.mM_PurchaseOrder.deleteMany({
                where: { projectId: id }
            });

            // 5. Delete Activities
            await tx.mM_Activity.deleteMany({
                where: { projectId: id }
            });

            // 6. Finally, Delete the Project (Root Node)
            await tx.mM_Project.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: "Project and all dependencies purged successfully." }, { status: 200 });

    } catch (error: any) {
        console.error("MM_Project DELETE Error:", error);
        return NextResponse.json({ 
            message: "Purge failed. Ensure project is not locked by external audit." 
        }, { status: 500 });
    }
}