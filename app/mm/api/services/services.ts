import { PrismaClient, MM_ProjectStatus, MM_ActivityStage } from '@prisma/client';

const prisma = new PrismaClient();

export class MMProjectService {
  /**
   * 1. Create a Maintenance Project
   * Validates budget against the Strategic Plan before creation.
   */
  static async createProject(data: {
    name: string;
    allocatedBudget: number;
    planId: string;
    workshopId: string;
    managerId: string;
  }) {
    // Validate Budget Availability in NRZ Strategic Plan
    const plan = await prisma.mM_StrategicPlan.findUnique({
      where: { id: data.planId },
      include: { mm_projects: true }
    });

    if (!plan) throw new Error("Strategic Plan not found");

    const spentBudget = plan.mm_projects.reduce((sum, p) => sum + p.allocatedBudget, 0);
    if (spentBudget + data.allocatedBudget > plan.totalBudget) {
      throw new Error("Budget ceiling exceeded for this Strategic Plan year.");
    }

    return await prisma.mM_Project.create({
      data: {
        ...data,
        status: MM_ProjectStatus.PLANNED,
        progress: 0,
        totalActualCost: 0
      }
    });
  }

  /**
   * 2. Create an MM Activity with Automated Procurement Link
   * Triggers an Awaiting Funding PO if requirements are listed.
   */
  static async createActivity(data: {
    projectId: string;
    description: string;
    supervisorId: string;
    allocatedBudget: number;
    scheduledStart: Date;
    scheduledEnd: Date;
    requirements: string[];
  }) {
    return await prisma.$transaction(async (tx) => {
      const activity = await tx.mM_Activity.create({
        data: {
          ...data,
          stage: MM_ActivityStage.PLANNING,
          progress: 0
        }
      });

      // If activity has requirements (Spares/Services), create the PO
      if (data.requirements.length > 0) {
        await tx.mM_PurchaseOrder.create({
          data: {
            poNumber: `NRZ-PO-${activity.id.slice(-6).toUpperCase()}`,
            activityId: activity.id,
            value: data.allocatedBudget * 0.7, // Assume 70% of budget is for materials
            status: 'AWAITING_FUNDING'
          }
        });
      }

      return activity;
    });
  }

  /**
   * 3. Update Progress & Cost (RBM Tracking)
   * Automatically calculates project-level progress based on activities.
   */
  static async updateActivityProgress(id: string, progress: number, laborCost: number, materialCost: number) {
    const activity = await prisma.mM_Activity.update({
      where: { id },
      data: { 
        progress, 
        actualLaborCost: { increment: laborCost },
        actualMaterialCost: { increment: materialCost }
      }
    });

    // Aggregate to Project Level
    const allActivities = await prisma.mM_Activity.findMany({
      where: { projectId: activity.projectId }
    });

    const avgProgress = allActivities.reduce((sum, a) => sum + a.progress, 0) / allActivities.length;
    const totalCosts = allActivities.reduce((sum, a) => sum + (a.actualLaborCost + a.actualMaterialCost), 0);

    await prisma.mM_Project.update({
      where: { id: activity.projectId },
      data: { 
        progress: Math.round(avgProgress),
        totalActualCost: totalCosts
      }
    });

    return activity;
  }
}