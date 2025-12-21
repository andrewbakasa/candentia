import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client";

/**
 * @description Type safety for the Strategic Plan metadata fetch.
 * Follows Section 2.1: Financials and HQ Strategic Ceiling.
 */
type PlanMinimal = Prisma.MM_StrategicPlanGetPayload<{
    select: {
        id: true,
        year: true,
        totalBudget: true,
        assignedExecutive: true,
        mm_projects: {
            select: {
                totalActualCost: true
            }
        }
    }
}>;

/**
 * @description Generates dynamic metadata for the Strategic Plan detail page.
 */
export async function generateMetadata({ 
    params
}: {
    params: { id: string; };
}) {
    
    const plan: PlanMinimal | null = await prisma.mM_StrategicPlan.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            year: true,
            totalBudget: true,
            assignedExecutive: true,
            mm_projects: {
                select: {
                    totalActualCost: true
                }
            }
        }
    });

    if (!plan) {
        return { title: "Strategic Plan Not Found" };
    }
    
    // Calculate global utilization across all projects
    const totalSpent = plan.mm_projects.reduce((acc, curr) => acc + curr.totalActualCost, 0);
    const utilizationRate = plan.totalBudget > 0 
        ? ((totalSpent / plan.totalBudget) * 100).toFixed(1) 
        : 0;

    const title = `Strategic Plan ${plan.year} - Executive: ${plan.assignedExecutive || 'Unassigned'}`;
    const description = 
        `${plan.year} Maintenance Management Strategy. ` +
        `HQ Budget Ceiling: $${plan.totalBudget.toLocaleString()}. ` +
        `Current Aggregate Spend: $${totalSpent.toLocaleString()} (${utilizationRate}% utilized). ` +
        `Overseen by: ${plan.assignedExecutive}.`;
        
    return {
        title,
        description,
    };
}

/**
 * @description Layout component for the Strategic Plan dashboard.
 */
const StrategicPlanLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Global Strategy Navigation or Branding can go here */}
            <main className="max-w-[1600px] mx-auto">
                {children}
            </main>
        </div>
    );
};

export default StrategicPlanLayout;