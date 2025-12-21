// NO 'use client' here
import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar';
import MM_TaskForm from '../../_components/TaskForm';
import ActivityDetailView from '../../_components/ActvityDetailView';
import EntityActionsHeader from '../../_components/ProjectActionWrapper';

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const activity = await prisma.mM_Activity.findUnique({
        where: { id },
        include: { 
            // Fetch parent project and its plan for strategic context
            project: {
                include: {
                    plan: true,
                    responsibleWorkshop: true
                }
            },
            // Fetch all work orders associated with this specific phase
            tasks: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!activity) notFound();

    // Safe serialization for Client Components
    const serializedActivity = JSON.parse(JSON.stringify(activity));

    return (
        <div className="flex h-screen bg-slate-100/50 overflow-hidden">
            {/* Sidebar Context - Keeps activities active */}
            <MM_Sidebar activeTab="activities" />

            <main className="flex-1 overflow-y-auto">
                {/* Standardized Header Implementation */}
                <div className="px-8 pt-8">
                    <EntityActionsHeader 
                        itemId={serializedActivity.id}
                        entityLabel="Activity"
                        editPath={`/mm/activities/edit/${serializedActivity.id}`}
                        backLabel="Back to Activity Logs"
                    />
                </div>
                
                <div className="p-8 pt-4">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        {/* ActivityDetailView receives serialized activity 
                            which includes parent project data for financial 
                            compliance tracking.
                        */}
                        <ActivityDetailView 
                            activity={serializedActivity} 
                            MM_TaskForm_Component={MM_TaskForm} 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
// NO 'use client' here
// import React from 'react';
// import { notFound } from 'next/navigation';
// import prisma from '../../../libs/prismadb';
// import MM_Sidebar from '../../_components/MM_Sidebar';
// //import ActivityDetailView from '../../_components/ActivityDetailView';
// import MM_TaskForm from '../../_components/TaskForm';
// import ActivityDetailView from '../../_components/ActvityDetailView';

// export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
//     const { id } = params;

//     const activity = await prisma.mM_Activity.findUnique({
//         where: { id },
//         include: { 
//             // Fetch parent project and its plan for strategic context
//             project: {
//                 include: {
//                     plan: true,
//                     responsibleWorkshop: true
//                 }
//             },
//             // Fetch all work orders associated with this specific phase
//             tasks: {
//                 orderBy: {
//                     createdAt: 'desc'
//                 }
//             }
//         }
//     });

//     if (!activity) notFound();

//     // Safe serialization for Client Components
//     const serializedActivity = JSON.parse(JSON.stringify(activity));

//     return (
//         <div className="flex h-screen bg-slate-100/50 overflow-hidden">
//             {/* Sidebar Context - Keeps activities active */}
//             <MM_Sidebar activeTab="activities" />

//             <main className="flex-1 overflow-y-auto">
//                 {/* Header context */}
//                 <div className="px-8 pt-8">
//                     <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
//                         <div>
//                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase Insight</p>
//                             <h2 className="text-xl font-black text-slate-800">Execution Details</h2>
//                         </div>
//                         {/* You can add specialized Activity Actions here if needed */}
//                     </div>
//                 </div>
                
//                 <div className="p-8 pt-4">
//                     <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
//                         {/* Now rendering the specialized Activity View */}
//                         <ActivityDetailView 
//                             activity={serializedActivity} 
//                             MM_TaskForm_Component={MM_TaskForm} 
//                         />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }
