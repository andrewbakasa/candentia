import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client";

/**
 * @type ActivityMinimal
 * @description Typed specifically against the MM_Activity model.
 * Captures Rework and Variance logic from the 09 Sept Shareholder Meeting.
 */
type ActivityMinimal = Prisma.MM_ActivityGetPayload<{
    select: {
        id: true;
        description: true;
        supervisor: true;
        stage: true;
        allocatedBudget: true;
        actualLaborCost: true;
        actualMaterialCost: true;
        scheduledEnd: true;
        isRework: true;
        reworkCost: true;
        varianceReason: true;
        project: {
            select: {
                name: true; // Model uses 'name', not 'projectName'
            }
        };
    };
}>;

/**
 * @description Generates dynamic metadata for the MM Activity detail page.
 */
export async function generateMetadata({ 
    params
}: {
    params: { id: string; };
}) {
    
    // 1. Fetch Activity using the correct model name: mM_Activity
    const activity: ActivityMinimal | null = await prisma.mM_Activity.findUnique({
        where: {
            id: params.id,
        },
        select: {
            id: true,
            description: true,
            supervisor: true,
            stage: true,
            allocatedBudget: true,
            actualLaborCost: true,
            actualMaterialCost: true,
            scheduledEnd: true,
            isRework: true,
            reworkCost: true,
            varianceReason: true,
            project: {
                select: {
                    name: true,
                }
            },
        }
    });

    if (!activity) {
        return {
            title: "Activity Not Found | Maintenance Hub",
        };
    }
    
    // 2. Financial Performance Calculation (Including Rework)
    const totalActualCost = (activity.actualLaborCost || 0) + (activity.actualMaterialCost || 0);
    const hasVariance = totalActualCost > activity.allocatedBudget;
    
    // 3. Construct Metadata based on Guideline 5 (Risk & Compliance)
    const reworkNotice = activity.isRework ? ` [REWORK ITEM - $${activity.reworkCost}]` : '';
    const title = `Activity: ${activity.description}${reworkNotice}`;
    
    const description = 
        `Activity Detail: ${activity.description} for Project ${activity.project?.name}. ` +
        `Current Stage: ${activity.stage}. ` +
        `Financials: Spent $${totalActualCost.toLocaleString()} of $${activity.allocatedBudget.toLocaleString()} budget. ` +
        `${activity.isRework ? `Rework Cost: $${activity.reworkCost}. ` : ''}` +
        `${hasVariance && activity.varianceReason ? `Variance Reason: ${activity.varianceReason}. ` : ''}` +
        `Supervisor: ${activity.supervisor || 'Pending'}.`;
        
    return {
        title: title,
        description: description,
    };
}

/**
 * @description Layout component for Activity management.
 */
const ActivityLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Visualizing the Operational Hierarchy */}
            {children}
        </div>
    );
};

export default ActivityLayout;