import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { MM_ProjectStatus } from '@prisma/client';

/**
 * 🛠️ UPDATED TYPES
 */
interface ProjectUpdateData {
    name?: string;
    allocatedBudget?: number;
    planId?: string;
    workshopId?: string;
    projectManager?: string;
    status?: MM_ProjectStatus;
    progress?: number;
    scheduledStart?: string | Date | null;
    scheduledEnd?: string | Date | null;
    actualEnd?: string | Date | null;
}

/**
 * 🎯 PATCH /api/mm/projects/[id]
 * Optimized with Atomic Transactions to avoid "Time Lapse" data inconsistencies
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body: ProjectUpdateData = await request.json();

        // WRAP IN TRANSACTION: Ensures budget validation doesn't drift if other users 
        // update the same plan simultaneously.
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Fetch Current State with a lock-check intent
            const currentProject = await tx.mM_Project.findUnique({
                where: { id },
                include: { 
                    plan: { 
                        include: { mm_projects: true } 
                    } 
                }
            });

            if (!currentProject) throw new Error("PROJECT_NOT_FOUND");

            // 2. Strategic Ceiling Validation (Guideline Section 5.1)
            if (body.allocatedBudget !== undefined || body.planId) {
                const parentPlan = currentProject.plan;
                if (parentPlan) {
                    const otherProjectsTotal = parentPlan.mm_projects
                        .filter(p => p.id !== id)
                        .reduce((acc, p) => acc + (p.allocatedBudget || 0), 0);

                    const proposedBudget = body.allocatedBudget ?? currentProject.allocatedBudget;
                    const totalRequested = otherProjectsTotal + proposedBudget;

                    if (totalRequested > parentPlan.totalBudget) {
                        throw new Error("BUDGET_BREACH");
                    }
                }
            }

            // 3. SVE & Status Logic
            let finalStatus = body.status;
            let finalActualEnd = body.actualEnd ? new Date(body.actualEnd) : undefined;

            if (body.progress === 100) {
                finalStatus = MM_ProjectStatus.COMPLETED;
                if (!finalActualEnd && !currentProject.actualEnd) {
                    finalActualEnd = new Date();
                }
            }

            // 4. Persistent Atomic Update
            return await tx.mM_Project.update({
                where: { id },
                data: {
                    ...(body.name && { name: body.name }),
                    ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
                    ...(body.projectManager && { projectManager: body.projectManager }),
                    ...(finalStatus && { status: finalStatus }),
                    ...(body.progress !== undefined && { progress: body.progress }),
                    ...(body.scheduledStart !== undefined && { 
                        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null 
                    }),
                    ...(body.scheduledEnd !== undefined && { 
                        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null 
                    }),
                    ...(finalActualEnd !== undefined && { actualEnd: finalActualEnd }),
                    ...(body.planId && { plan: { connect: { id: body.planId } } }),
                    ...(body.workshopId && { responsibleWorkshop: { connect: { id: body.workshopId } } }),
                },
                include: {
                    responsibleWorkshop: true,
                    plan: true
                }
            });
        }, {
            // Increase timeout to 10s to ensure heavy calculations finish without lapser
            maxWait: 5000, 
            timeout: 10000 
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        if (error.message === "PROJECT_NOT_FOUND") return NextResponse.json({ message: "Project not found" }, { status: 404 });
        if (error.message === "BUDGET_BREACH") return NextResponse.json({ message: "Budget limit exceeded for Strategic Plan" }, { status: 403 });
        
        console.error("MM_Project PATCH Error:", error);
        return NextResponse.json({ message: "Update failed. System Link Failure." }, { status: 500 });
    }
}

/**
 * 🎯 DELETE /api/mm/projects/[id]
 * Transaction-based cascade with increased timeout for large datasets
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await prisma.$transaction(async (tx) => {
            const activities = await tx.mM_Activity.findMany({ where: { projectId: id }, select: { id: true } });
            const activityIds = activities.map(a => a.id);

            const pos = await tx.mM_PurchaseOrder.findMany({ where: { projectId: id }, select: { id: true } });
            const poIds = pos.map(p => p.id);

            // Sequential Leaf Node Purge
            if (activityIds.length > 0) {
                await tx.mM_Task.deleteMany({ where: { activityId: { in: activityIds } } });
            }
            if (poIds.length > 0) {
                await tx.mM_POLineItem.deleteMany({ where: { poId: { in: poIds } } });
            }

            await tx.mM_MaterialRequirement.deleteMany({ where: { projectId: id } });
            await tx.mM_PurchaseOrder.deleteMany({ where: { projectId: id } });
            await tx.mM_Activity.deleteMany({ where: { projectId: id } });
            await tx.mM_Project.delete({ where: { id } });
        }, {
            maxWait: 5000,
            timeout: 15000 // Extended timeout for deep recursive deletions
        });

        return NextResponse.json({ message: "Project and dependencies purged successfully." }, { status: 200 });

    } catch (error: any) {
        console.error("MM_Project DELETE Error:", error);
        return NextResponse.json({ message: "Purge failed. Constraint violation." }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { MM_ProjectStatus } from '@prisma/client';

// /**
//  * 🛠️ UPDATED TYPES
//  */
// interface ProjectUpdateData {
//     name?: string;
//     allocatedBudget?: number;
//     planId?: string;
//     workshopId?: string;
//     projectManager?: string;
//     status?: MM_ProjectStatus;
//     progress?: number;
//     // New SVE Scheduling Fields
//     scheduledStart?: string | Date | null;
//     scheduledEnd?: string | Date | null;
//     actualEnd?: string | Date | null;
// }

// /**
//  * 🎯 PATCH /api/mm/projects/[id]
//  * Optimized for SVE (Schedule Variance Engine) and Budget Compliance
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const { id } = params;
//         const body: ProjectUpdateData = await request.json();

//         // 1. Fetch Current State & Strategy Link
//         const currentProject = await prisma.mM_Project.findUnique({
//             where: { id },
//             include: { 
//                 plan: { 
//                     include: { mm_projects: true } 
//                 } 
//             }
//         });

//         if (!currentProject) {
//             return NextResponse.json({ message: "Project not found" }, { status: 404 });
//         }

//         // 2. Strategic Ceiling Validation (Guideline Section 5.1)
//         if (body.allocatedBudget !== undefined || body.planId) {
//             const parentPlan = currentProject.plan;
//             if (parentPlan) {
//                 const otherProjectsTotal = parentPlan.mm_projects
//                     .filter(p => p.id !== id)
//                     .reduce((acc, p) => acc + (p.allocatedBudget || 0), 0);

//                 const proposedBudget = body.allocatedBudget ?? currentProject.allocatedBudget;
//                 const totalRequested = otherProjectsTotal + proposedBudget;

//                 if (totalRequested > parentPlan.totalBudget) {
//                     return NextResponse.json({ 
//                         message: `Budget Breach: Strategic Plan limit is $${parentPlan.totalBudget.toLocaleString()}. Proposed total reaches $${totalRequested.toLocaleString()}.` 
//                     }, { status: 403 });
//                 }
//             }
//         }

//         // 3. SVE & Status Logic: Auto-handle Completion Dates
//         let finalStatus = body.status;
//         let finalActualEnd = body.actualEnd ? new Date(body.actualEnd) : undefined;

//         // If progress is pushed to 100%, force status and set completion date if missing
//         if (body.progress === 100) {
//             finalStatus = MM_ProjectStatus.COMPLETED;
//             if (!finalActualEnd && !currentProject.actualEnd) {
//                 finalActualEnd = new Date();
//             }
//         }

//         // 4. Persistent Update
//         const updatedProject = await prisma.mM_Project.update({
//             where: { id },
//             data: {
//                 ...(body.name && { name: body.name }),
//                 ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
//                 ...(body.projectManager && { projectManager: body.projectManager }),
//                 ...(finalStatus && { status: finalStatus }),
//                 ...(body.progress !== undefined && { progress: body.progress }),
                
//                 // Date handling for Schedule Variance Engine
//                 ...(body.scheduledStart !== undefined && { 
//                     scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null 
//                 }),
//                 ...(body.scheduledEnd !== undefined && { 
//                     scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null 
//                 }),
//                 ...(finalActualEnd !== undefined && { actualEnd: finalActualEnd }),

//                 // Relational Connectors
//                 ...(body.planId && { plan: { connect: { id: body.planId } } }),
//                 ...(body.workshopId && { responsibleWorkshop: { connect: { id: body.workshopId } } }),
//             },
//             include: {
//                 responsibleWorkshop: true,
//                 plan: true
//             }
//         });

//         return NextResponse.json(updatedProject, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project PATCH Error:", error);
//         return NextResponse.json({ message: "Update failed. System Link Failure." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE /api/mm/projects/[id]
//  * Secure transaction-based cascade to prevent orphaned maintenance data
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const { id } = params;

//         await prisma.$transaction(async (tx) => {
//             // Identify child clusters for cleanup
//             const activities = await tx.mM_Activity.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const activityIds = activities.map(a => a.id);

//             const pos = await tx.mM_PurchaseOrder.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const poIds = pos.map(p => p.id);

//             // Sequential Leaf Node Purge
//             if (activityIds.length > 0) {
//                 await tx.mM_Task.deleteMany({ where: { activityId: { in: activityIds } } });
//             }

//             if (poIds.length > 0) {
//                 await tx.mM_POLineItem.deleteMany({ where: { poId: { in: poIds } } });
//             }

//             // Relationship node purge
//             await tx.mM_MaterialRequirement.deleteMany({ where: { projectId: id } });
//             await tx.mM_PurchaseOrder.deleteMany({ where: { projectId: id } });
//             await tx.mM_Activity.deleteMany({ where: { projectId: id } });

//             // Root Project purge
//             await tx.mM_Project.delete({ where: { id } });
//         });

//         return NextResponse.json({ message: "Project and dependencies purged successfully." }, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project DELETE Error:", error);
//         return NextResponse.json({ message: "Purge failed. Constraint violation." }, { status: 500 });
//     }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';

// interface ProjectUpdateData {
//     name?: string;
//     allocatedBudget?: number;
//     planId?: string;
//     workshopId?: string;
//     projectManager?: string;
//     status?: any;
//     progress?: number;
// }

// /**
//  * 🎯 PATCH /api/mm/projects/[id]
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const { id } = params;
//         const body: ProjectUpdateData = await request.json();

//         // 1. Strategic Ceiling Validation (Guideline Section 5.1)
//         const currentProject = await prisma.mM_Project.findUnique({
//             where: { id },
//             include: { 
//                 plan: { 
//                     include: { mm_projects: true } 
//                 } 
//             }
//         });

//         if (!currentProject) {
//             return NextResponse.json({ message: "Project not found" }, { status: 404 });
//         }

//         // Validate budget change if budget or plan is updated
//         if (body.allocatedBudget !== undefined || body.planId) {
//             const parentPlan = currentProject.plan;
            
//             if (parentPlan) {
//                 const otherProjectsTotal = parentPlan.mm_projects
//                     .filter(p => p.id !== id)
//                     .reduce((acc, p) => acc + (p.allocatedBudget || 0), 0);

//                 const proposedBudget = body.allocatedBudget ?? currentProject.allocatedBudget;
//                 const totalRequested = otherProjectsTotal + proposedBudget;

//                 if (totalRequested > parentPlan.totalBudget) {
//                     return NextResponse.json({ 
//                         message: `Budget Breach: Strategic Plan limit is $${parentPlan.totalBudget.toLocaleString()}. Proposed total reaches $${totalRequested.toLocaleString()}.` 
//                     }, { status: 403 });
//                 }
//             }
//         }

//         // 2. Persistent Update with Relational Connection logic
//         const updatedProject = await prisma.mM_Project.update({
//             where: { id },
//             data: {
//                 ...(body.name && { name: body.name }),
//                 ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
//                 ...(body.projectManager && { projectManager: body.projectManager }),
//                 ...(body.status && { status: body.status }),
//                 ...(body.progress !== undefined && { progress: body.progress }),
//                 // Using connect ensures MongoDB ObjectIDs are correctly linked
//                 ...(body.planId && { plan: { connect: { id: body.planId } } }),
//                 ...(body.workshopId && { responsibleWorkshop: { connect: { id: body.workshopId } } }),
//             },
//             include: {
//                 responsibleWorkshop: true,
//                 plan: true
//             }
//         });

//         return NextResponse.json(updatedProject, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project PATCH Error:", error);
//         return NextResponse.json({ message: "Update failed. System Link Failure." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE /api/mm/projects/[id]
//  * Implements a secure transaction-based cascade delete
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const { id } = params;

//         await prisma.$transaction(async (tx) => {
//             // 1. Get Activity IDs for Task cleanup
//             const activities = await tx.mM_Activity.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const activityIds = activities.map(a => a.id);

//             // 2. Get PO IDs for Line Item cleanup
//             const pos = await tx.mM_PurchaseOrder.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const poIds = pos.map(p => p.id);

//             // 3. Sequential Cleanup (Leaf Nodes to Root)
//             if (activityIds.length > 0) {
//                 await tx.mM_Task.deleteMany({ where: { activityId: { in: activityIds } } });
//             }

//             if (poIds.length > 0) {
//                 await tx.mM_POLineItem.deleteMany({ where: { poId: { in: poIds } } });
//             }

//             await tx.mM_MaterialRequirement.deleteMany({ where: { projectId: id } });
//             await tx.mM_PurchaseOrder.deleteMany({ where: { projectId: id } });
//             await tx.mM_Activity.deleteMany({ where: { projectId: id } });

//             // 4. Final Root Node Deletion
//             await tx.mM_Project.delete({ where: { id } });
//         });

//         return NextResponse.json({ message: "Project and all dependencies purged successfully." }, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project DELETE Error:", error);
//         return NextResponse.json({ 
//             message: "Purge failed. Project may be locked or already removed." 
//         }, { status: 500 });
//     }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { Prisma } from '@prisma/client';

// interface ProjectUpdateData {
//     name?: string;
//     allocatedBudget?: number;
//     planId?: string;
//     workshopId?: string;
//     projectManager?: string; // Updated field name
//     status?: any;
//     progress?: number;
// }

// /**
//  * 🎯 PATCH /api/mm/projects/[id]
//  * Updates Maintenance Projects and enforces Strategic Plan budget ceilings
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;
//         const body: ProjectUpdateData = await request.json();

//         // 1. Budget Ceiling Validation (Section 2.2 Alignment)
//         if (body.allocatedBudget !== undefined || body.planId) {
//             const currentProject = await prisma.mM_Project.findUnique({
//                 where: { id },
//                 include: { 
//                     plan: { 
//                         include: { mm_projects: true } 
//                     } 
//                 }
//             });

//             if (!currentProject) {
//                 return NextResponse.json({ message: "Project not found" }, { status: 404 });
//             }

//             // Perform check if project is linked to a Strategic Plan
//             if (currentProject.plan) {
//                 const parentPlan = currentProject.plan;
                
//                 // Calculate utilization by all sibling projects
//                 const otherProjectsTotal = parentPlan.mm_projects
//                     .filter(p => p.id !== id)
//                     .reduce((acc, p) => acc + p.allocatedBudget, 0);

//                 const proposedTotal = otherProjectsTotal + (body.allocatedBudget ?? currentProject.allocatedBudget);

//                 if (proposedTotal > parentPlan.totalBudget) {
//                     return NextResponse.json({ 
//                         message: `Budget Breach: Strategic Plan limit is $${parentPlan.totalBudget.toLocaleString()}. Proposed total reaches $${proposedTotal.toLocaleString()}.` 
//                     }, { status: 403 });
//                 }
//             }
//         }

//         // 2. Data Mapping & Persistent Update
//         const updatedProject = await prisma.mM_Project.update({
//             where: { id },
//             data: {
//                 ...(body.name && { name: body.name }),
//                 ...(body.allocatedBudget !== undefined && { allocatedBudget: body.allocatedBudget }),
//                 ...(body.planId && { planId: body.planId }),
//                 ...(body.workshopId && { workshopId: body.workshopId }),
//                 ...(body.projectManager && { projectManager: body.projectManager }), // String mapping
//                 ...(body.status && { status: body.status }),
//                 ...(body.progress !== undefined && { progress: body.progress }),
//             }
//         });

//         return NextResponse.json(updatedProject, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project PATCH Error:", error);
//         return NextResponse.json({ message: "Update failed. System Link Failure." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE /api/mm/projects/[id]
//  * Cascade deletion following NRZ Operational Security standards
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;

//         await prisma.$transaction(async (tx) => {
//             // 1. Delete Task-level steps (Leaf nodes of Activities)
//             const projectActivities = await tx.mM_Activity.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const activityIds = projectActivities.map(a => a.id);

//             if (activityIds.length > 0) {
//                 await tx.mM_Task.deleteMany({
//                     where: { activityId: { in: activityIds } }
//                 });
//             }

//            // 2. Delete PO Line Items before the POs
//             const projectPOs = await tx.mM_PurchaseOrder.findMany({
//                 where: { projectId: id },
//                 select: { id: true }
//             });
//             const poIds = projectPOs.map(po => po.id);

//             if (poIds.length > 0) {
//                 await tx.mM_POLineItem.deleteMany({
//                     where: { 
//                         purchaseOrder: { // Use the relation name
//                             id: { in: poIds } // Filter by the ID within that relation
//                         }
//                     }
//                 });
//             }

//             // 3. Delete Material Requirements (BoQ)
//             await tx.mM_MaterialRequirement.deleteMany({
//                 where: { projectId: id }
//             });

//             // 4. Delete Purchase Orders
//             await tx.mM_PurchaseOrder.deleteMany({
//                 where: { projectId: id }
//             });

//             // 5. Delete Activities
//             await tx.mM_Activity.deleteMany({
//                 where: { projectId: id }
//             });

//             // 6. Finally, Delete the Project (Root Node)
//             await tx.mM_Project.delete({
//                 where: { id }
//             });
//         });

//         return NextResponse.json({ message: "Project and all dependencies purged successfully." }, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Project DELETE Error:", error);
//         return NextResponse.json({ 
//             message: "Purge failed. Ensure project is not locked by external audit." 
//         }, { status: 500 });
//     }
// }