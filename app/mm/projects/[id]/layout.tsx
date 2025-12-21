import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client";

/**
 * @description Type safety for MM_Project metadata fetch.
 * Follows Section 2.1: Financials (Allocated Budget vs Actual Cost).
 */
type ProjectMinimal = Prisma.MM_ProjectGetPayload<{
    select: {
        id: true,
        name: true,
        allocatedBudget: true,
        totalActualCost: true,
        status: true,
        projectManager: true,
        plan: {
            select: {
                year: true,
                assignedExecutive: true
            }
        }
    }
}>;

/**
 * @description Generates dynamic metadata for the Maintenance Management Project detail page.
 * Implements Guideline 1 of 2025 requirements for Cost Tracking Aggregation.
 */
export async function generateMetadata({ 
    params
}: {
    params: { id: string; };
}) {
    
    const project: ProjectMinimal | null = await prisma.mM_Project.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            name: true,
            allocatedBudget: true,
            totalActualCost: true,
            status: true,
            projectManager: true,
            plan: {
                select: {
                    year: true,
                    assignedExecutive: true
                }
            }
        }
    });

    if (!project) {
        return { title: "Maintenance Project Not Found" };
    }
    
    // Utilization Rate calculation (Actual Cost vs Target Budget)
    const utilizationRate = project.allocatedBudget > 0 
        ? ((project.totalActualCost / project.allocatedBudget) * 100).toFixed(1) 
        : "0.0";

    const executive = project.plan?.assignedExecutive || 'Unassigned HQ';
    const title = `${project.name} (${project.plan?.year || 'N/A'}) - PM: ${project.projectManager || 'Pending'}`;
    
    const description = 
        `Project Status: ${project.status}. ` +
        `Target Budget: $${project.allocatedBudget.toLocaleString()}. ` +
        `Aggregate Spend: $${project.totalActualCost.toLocaleString()} (${utilizationRate}% utilized). ` +
        `Executive Oversight: ${executive}.`;
        
    return {
        title,
        description,
    };
}

/**
 * @description Layout component for the Project Detail view.
 * Aligns with Section 3: Methodology for Teams (Standardized Documentation).
 */
const ProjectLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Contextual indicators for Maintenance Modules could be placed here */}
            <main className="max-w-[1600px] mx-auto p-6">
                {children}
            </main>
        </div>
    );
};

export default ProjectLayout;