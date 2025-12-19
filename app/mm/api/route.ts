import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const MM_StrategyService = {
  /**
   * 1. CREATE STRATEGIC PLAN
   * Sets the HQ-level budget ceiling.
   */
  async createStrategicPlan(data: { year: number, description: string, budget: number, execId: string }) {
    return await prisma.mM_StrategicPlan.create({
      data: {
        year: data.year,
        description: data.description,
        totalBudget: data.budget,
        executiveId: data.execId
      }
    });
  },

  /**
   * 2. ADD PROJECT TO PLAN
   * Links a project to a Workshop and Project Manager.
   */
  async createProject(planId: string, data: any) {
    return await prisma.mM_Project.create({
      data: {
        ...data,
        planId,
        status: 'PLANNED',
        progress: 0
      }
    });
  },

  /**
   * 3. LOG ACTIVITY & TRIGGER PROCUREMENT
   * When an activity is created, we link requirements and timeline.
   */
  async createActivity(projectId: string, data: any) {
    const activity = await prisma.mM_Activity.create({
      data: { ...data, projectId }
    });

    // If requirements include materials, auto-generate a Draft Purchase Order
    if (activity.requirements.length > 0) {
      await prisma.mM_PurchaseOrder.create({
        data: {
          poNumber: `PO-${activity.id.slice(-5)}`,
          activityId: activity.id,
          status: 'AWAITING_FUNDING',
          value: activity.allocatedBudget // Initial estimate
        }
      });
    }
    return activity;
  }
};

export const MM_AnalyticsEngine = {
  /**
   * FILTER: UNMET ACTIVITIES
   * Finds all activities where the clock has run out.
   */
  async getUnmetActivities(workshopId?: string) {
    const now = new Date();
    return await prisma.mM_Activity.findMany({
      where: {
        actualEnd: null,
        scheduledEnd: { lt: now },
        project: workshopId ? { workshopId } : {}
      },
      include: {
        project: true,
        supervisor: true,
        purchaseOrder: true
      }
    });
  },

  /**
   * ANALYTICS: REWORK & RESOURCE WASTE
   * Measures the cost impact of failed quality checks.
   */
  async getReworkAnalytics() {
    const reworkData = await prisma.mM_Activity.aggregate({
      where: { isRework: true },
      _sum: {
        reworkCost: true,
        actualLaborCost: true,
        actualMaterialCost: true
      },
      _count: true
    });

    return {
      totalReworks: reworkData._count,
      totalFinancialLoss: reworkData._sum.reworkCost,
      wastedResources: (reworkData._sum.actualLaborCost || 0) + (reworkData._sum.actualMaterialCost || 0)
    };
  }
};