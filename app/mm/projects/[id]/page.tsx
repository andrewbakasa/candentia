import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar';
import MM_ActivityForm from '../../_components/ActivityForm';
import EntityActionsHeader from '../../_components/ProjectActionWrapper';
import ProjectDetailView from '../../_components/ProjectDetailView';
export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

   const project = await prisma.mM_Project.findUnique({
    where: { id },
    include: { 
        plan: true, 
        responsibleWorkshop: true, 
        activities: {
            include: {
                tasks: true,
                processDelays: { 
                    include: {
                        // Corrected: use nested select for deep relations
                        activity: {
                            select: {
                                description: true,
                                project: {
                                    select: {
                                        name: true // Assuming your field is 'name', use 'title' if different
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { scheduledStart: 'asc' }
        },
        materialRequirements: {
            include: { material: true },
            orderBy: { createdAt: 'desc' }
        },
        purchaseOrders: {
            include: { lineItems: true },
            orderBy: { createdAt: 'desc' }
        }
    }
});

    if (!project) notFound();

    // --- NEW: FLATTEN DELAYS FOR HIERARCHY ---
    // Extract every delay from every activity into one flat array
    const allProcessDelays = project.activities.flatMap(activity => 
        activity.processDelays.map(delay => ({
            ...delay,
            activityName: activity.description // Inject activity context directly
        }))
    );

    const strategies = await prisma.mM_StrategicPlan.findMany({
        orderBy: { year: 'desc' }
    });

    // Serialize and inject the flattened delays
    const serializedProject = {
        ...JSON.parse(JSON.stringify(project)),
        allProcessDelays: JSON.parse(JSON.stringify(allProcessDelays))
    };
    
    const serializedStrategies = JSON.parse(JSON.stringify(strategies));
    console.log("serializedProject",serializedProject)
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
                            // Now ProjectDetailView has access to project.allProcessDelays
                            MM_ActivityForm={MM_ActivityForm} 
                            allStrategies={serializedStrategies}
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

// export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
//     const { id } = params;

//     // 1. Fetch the Specific Project with all Execution & Procurement Relations
//     const project = await prisma.mM_Project.findUnique({
//         where: { id },
//         include: { 
//             plan: true, 
//             responsibleWorkshop: true, 
            
//             // Execution timeline
//             activities: {
//                 include: {
//                     tasks: true ,
//                     processDelays:true
//                 },
//                 orderBy: {
//                     scheduledStart: 'asc'
//                 }
//             },
//             // Bill of Quantities (BoQ)
//             materialRequirements: {
//                 include:{ material:true},
//                 orderBy: {
//                     createdAt: 'desc'
//                 }
//             },
//             // Financial Commitments (POs)
//             purchaseOrders: {
//                 include: {
//                     lineItems: true
//                 },
//                 orderBy: {
//                     createdAt: 'desc'
//                 }
//             }
//         }
//     });

//     // 2. Fetch all Strategic Plans (Strategies) for Guideline 1 Validation
//     // This provides the context for budget ceilings and resource allocation
//     const strategies = await prisma.mM_StrategicPlan.findMany({
//         orderBy: {
//             year: 'desc'
//         }
//     });

//     if (!project) notFound();

//     // Serialize to handle Date objects safely for Client Components
//     const serializedProject = JSON.parse(JSON.stringify(project));
//     const serializedStrategies = JSON.parse(JSON.stringify(strategies));
//     //console.log('project structure:', serializedProject)
//     return (
//         <div className="flex h-screen bg-slate-100/50 overflow-hidden">
//             {/* Sidebar Context */}
//             <MM_Sidebar activeTab="projects" />

//             <main className="flex-1 overflow-y-auto">
//                 {/* Header Implementation */}
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
//                             MM_ActivityForm={MM_ActivityForm} 
//                             // 3. Passing the full strategy registry to enable cross-referencing
//                             allStrategies={serializedStrategies}
//                         />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }