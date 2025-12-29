// NO 'use client' here
import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar';
import MM_ActivityForm from '../../_components/ActivityForm';
import EntityActionsHeader from '../../_components/ProjectActionWrapper';
import ProjectDetailView from '../../_components/ProjectDetailView';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { MM_MaterialStatus } from '@prisma/client';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const currentUser = await getCurrentUser();
    const now = new Date();

    const [project, baseTasks, strategies] = await Promise.all([
        prisma.mM_Project.findUnique({
            where: { id },
            include: { 
                plan: true, 
                responsibleWorkshop: true, 
                activities: {
                    include: {
                        tasks: { include: { baseTask: true } }, // Include BaseTask for benchmarking
                       // processDelays: true
                       processDelays: {
                        include: {
                            activity: {
                                include: {
                                    project: true // This allows delay.activity.project.name
                                }
                            }
                        }
                    }
                    },
                    orderBy: { scheduledStart: 'asc' }
                },
                materialRequirements: { include: { material: true } },
                purchaseOrders: { include: { lineItems: true } }
            }
        }),
        prisma.baseTask.findMany({ orderBy: { standardTitle: 'asc' } }),
        prisma.mM_StrategicPlan.findMany({ orderBy: { year: 'desc' } })
    ]);

    if (!project) notFound();

    // --- 🚀 ADVANCED SVE & FINANCIAL ANALYTICS ENGINE ---
    
    // 1. Activity Variance Stats
    const activityStats = project.activities.reduce((acc, act) => {
        const isDone = !!act.actualEnd || act.progress === 100;
        const isOverdue = !isDone && act.scheduledEnd && new Date(act.scheduledEnd) < now;
        
        if (isDone) acc.completed++;
        else if (isOverdue) acc.overdue++;
        else acc.active++;
        return acc;
    }, { completed: 0, overdue: 0, active: 0 });

    // 2. Labor Efficiency (Benchmark vs Actual) - Guideline 6.2
    let totalActualHours = 0;
    let totalBenchmarkHours = 0;
    project.activities.forEach(act => {
        act.tasks.forEach(task => {
            if (task.actualHours) totalActualHours += task.actualHours;
            if (task.baseTask?.benchmarkHours) totalBenchmarkHours += task.baseTask.benchmarkHours;
        });
    });

    const efficiencyRatio = totalBenchmarkHours > 0 
        ? Math.round((totalBenchmarkHours / totalActualHours) * 100) 
        : 100;

    // 3. Financial Status
    const budgetUtilization = Math.round((project.totalActualCost / project.allocatedBudget) * 100);
    const isOverBudget = project.totalActualCost > project.allocatedBudget;

    // 4. Procurement/Material Readiness
    const totalMaterials = project.materialRequirements.length;
    const fulfilledMaterials = project.materialRequirements.filter(m => m.status === MM_MaterialStatus.RECEIVED || m.status === MM_MaterialStatus.PO_ISSUED).length;
    const materialReadiness = totalMaterials > 0 ? Math.round((fulfilledMaterials / totalMaterials) * 100) : 100;

    // 5. Aggregate Analysis Package
    const projectAnalytics = {
        activityStats,
        efficiencyRatio,
        budgetUtilization,
        isOverBudget,
        materialReadiness,
        daysRemaining: project.scheduledEnd ? Math.max(0, Math.ceil((new Date(project.scheduledEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0,
        statusSeverity: (activityStats.overdue > 0 || isOverBudget) ? 'CRITICAL' : 'STABLE'
    };

    // Flatten Delays
    const allProcessDelays = project.activities.flatMap(activity => 
        activity.processDelays.map(delay => ({
            ...delay,
            activityName: activity.description 
        }))
    );

    const serializedProject = {
        ...JSON.parse(JSON.stringify(project)),
        analytics: projectAnalytics, // 📊 Injecting new analytics
        allProcessDelays: JSON.parse(JSON.stringify(allProcessDelays))
    };

    return (
        <div className="flex h-screen bg-slate-100/50 overflow-hidden">
            <MM_Sidebar activeTab="projects" />
            <main className="flex-1 overflow-y-auto">
                <div className="px-3 pt-3">
                    <EntityActionsHeader 
                        itemId={serializedProject.id}
                        entityLabel="Project"
                        editPath={`/mm/projects/edit/${serializedProject.id}`}
                        backLabel="Back to Project Inventory"
                        data={serializedProject}
                    />
                </div>
                
                <div className="p-1 pt-2">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        <ProjectDetailView 
                            project={serializedProject} 
                            currentUser={currentUser}
                            MM_ActivityForm={MM_ActivityForm} 
                            allStrategies={JSON.parse(JSON.stringify(strategies))}
                            baseTasks={JSON.parse(JSON.stringify(baseTasks))}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
// // NO 'use client' here
// import React from 'react';
// import { notFound } from 'next/navigation';
// import prisma from '../../../libs/prismadb';
// import MM_Sidebar from '../../_components/MM_Sidebar';
// import MM_ActivityForm from '../../_components/ActivityForm';
// import EntityActionsHeader from '../../_components/ProjectActionWrapper';
// import ProjectDetailView from '../../_components/ProjectDetailView';
// import getCurrentUser from '@/app/actions/getCurrentUser';

// export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
//     const { id } = params;
//     const currentUser = await getCurrentUser();

//     // 1. Parallel Fetch for High-Performance Loading
//     const [project, baseTasks, strategies] = await Promise.all([
//         prisma.mM_Project.findUnique({
//             where: { id },
//             include: { 
//                 plan: true, 
//                 responsibleWorkshop: true, 
//                 activities: {
//                     include: {
//                         tasks: true,
//                         processDelays: { 
//                             include: {
//                                 activity: {
//                                     select: {
//                                         description: true,
//                                         project: { select: { name: true } }
//                                     }
//                                 }
//                             }
//                         }
//                     },
//                     orderBy: { scheduledStart: 'asc' }
//                 },
//                 materialRequirements: {
//                     include: { material: true },
//                     orderBy: { createdAt: 'desc' }
//                 },
//                 purchaseOrders: {
//                     include: { lineItems: true },
//                     orderBy: { createdAt: 'desc' }
//                 }
//             }
//         }),
//         // Fetch Standardized Base Protocols (Guideline 1 of 2025)
//         prisma.baseTask.findMany({
//             orderBy: { standardTitle: 'asc' }
//         }),
//         prisma.mM_StrategicPlan.findMany({
//             orderBy: { year: 'desc' }
//         })
//     ]);

//     if (!project) notFound();

//     // 2. Flatten Delays for Hierarchy
//     const allProcessDelays = project.activities.flatMap(activity => 
//         activity.processDelays.map(delay => ({
//             ...delay,
//             activityName: activity.description 
//         }))
//     );

//     // 3. Serialization for Client Components
//     const serializedProject = {
//         ...JSON.parse(JSON.stringify(project)),
//         allProcessDelays: JSON.parse(JSON.stringify(allProcessDelays))
//     };
    
//     const serializedStrategies = JSON.parse(JSON.stringify(strategies));
//     const serializedBaseTasks = JSON.parse(JSON.stringify(baseTasks));

//     return (
//         <div className="flex h-screen bg-slate-100/50 overflow-hidden">
//             <MM_Sidebar activeTab="projects" />
//             <main className="flex-1 overflow-y-auto">
//                 <div className="px-3 pt-3">
//                     <EntityActionsHeader 
//                         itemId={serializedProject.id}
//                         entityLabel="Project"
//                         editPath={`/mm/projects/edit/${serializedProject.id}`}
//                         backLabel="Back to Project Inventory"
//                         data={serializedProject}
//                     />
//                 </div>
                
//                 <div className="p-1 pt-2">
//                     <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
//                         <ProjectDetailView 
//                             project={serializedProject} 
//                             currentUser={currentUser}
//                             MM_ActivityForm={MM_ActivityForm} 
//                             allStrategies={serializedStrategies}
//                             baseTasks={serializedBaseTasks} // 🚀 Passed to the View
//                         />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }