// NO 'use client' here
import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar'; // Re-use the sidebar
import ProjectActionsWrapper from '../../_components/ProjectAction Wrapper';
import ProjectDetailView from '../../_components/ProjectDetailView';
import MM_ActivityForm from '../../_components/ActivityForm';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const project = await prisma.mM_Project.findUnique({
        where: { id },
        include: { plan: true, responsibleWorkshop: true, activities: true }
    });

    if (!project) notFound();
    const serializedProject = JSON.parse(JSON.stringify(project));

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Tell the sidebar that 'projects' is the active context */}
            <MM_Sidebar activeTab="projects" />

            <main className="flex-1 overflow-y-auto p-8">
                <ProjectActionsWrapper project={serializedProject} />
                
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden mt-6">
                    <ProjectDetailView 
                        project={serializedProject} 
                        MM_ActivityForm={MM_ActivityForm} 
                    />
                </div>
            </main>
        </div>
    );
}
// // 1. REMOVE 'use client' from here. 
// // This remains a Server Component so it can use Prisma and be async.

// import React from 'react';
// import Link from 'next/link';
// import { notFound } from 'next/navigation';
// import { 
//   Target, Briefcase, Activity, Settings, 
//   ChevronRight, LayoutDashboard 
// } from 'lucide-react';

// import prisma from '../../../libs/prismadb';
// import ProjectActionsWrapper from '../../_components/ProjectAction Wrapper';
// import ProjectDetailView from '../../_components/ProjectDetailView';
// import MM_ActivityForm from '../../_components/ActivityForm';

// interface ProjectPageProps {
//     params: {
//         id: string;
//     };
// }

// export default async function ProjectDetailPage({ params }: ProjectPageProps) {
//     const { id } = params;
    
//     const project = await getProjectWithMetrics(id);

//     if (!project) {
//         notFound();
//     }

//     const serializedProject = JSON.parse(JSON.stringify(project));

//     return (
//         <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            
//             {/* --- SIDEBAR --- */}
//             <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800">
//                 <div className="flex items-center gap-3 px-2 mb-10">
//                     <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
//                         <Target size={22} className="text-white" />
//                     </div>
//                     <div className="leading-none">
//                         <span className="font-black text-xl tracking-tight block text-white">NRZ MM</span>
//                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
//                     </div>
//                 </div>
                
//                 <nav className="space-y-2 flex-1">
//                     <SidebarLink href="/mm/dashboard?tab=strategies" icon={<Target size={20}/>} label="Strategic Plans" />
//                     <SidebarLink href="/mm/dashboard?tab=workshops" icon={<Settings size={20}/>} label="Workshops" />
//                     <SidebarLink href="/mm/dashboard?tab=projects" icon={<Briefcase size={20}/>} label="Workshop Projects" active />
//                     <SidebarLink href="/mm/dashboard?tab=activities" icon={<Activity size={20}/>} label="Operational Activities" />
                    
//                     <div className="pt-4 mt-4 border-t border-slate-800">
//                         <SidebarLink href="/mm/dashboard" icon={<LayoutDashboard size={20}/>} label="Main Dashboard" />
//                     </div>
//                 </nav>
//             </aside>

//             {/* --- MAIN CONTENT AREA --- */}
//             <main className="flex-1 overflow-y-auto bg-slate-50">
//                 <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
                    
//                     <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
//                         <Link href="/mm/dashboard" className="hover:text-blue-600 transition-colors">Maintenance</Link>
//                         <ChevronRight size={12} />
//                         <Link href="/mm/dashboard?tab=projects" className="hover:text-blue-600 transition-colors">Projects</Link>
//                         <ChevronRight size={12} />
//                         <span className="text-blue-600">Detail View</span>
//                     </nav>

//                     {/* Client Components for Interactivity */}
//                     <ProjectActionsWrapper project={serializedProject} />

//                     <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
//                         <ProjectDetailView 
//                             project={serializedProject} 
//                             MM_ActivityForm={MM_ActivityForm}
//                         />
//                     </div>

//                     <div className="flex justify-center items-center gap-4 text-slate-400 py-8">
//                         <div className="h-px w-12 bg-slate-200" />
//                         <p className="text-[10px] font-black uppercase tracking-widest text-center">
//                             NRZ Maintenance Management System <br className="sm:hidden" />
//                             Security Ref: Guideline 1-2025 | Last Audit: {new Date(serializedProject.updatedAt).toLocaleString()}
//                         </p>
//                         <div className="h-px w-12 bg-slate-200" />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }

// // Simple functional component for links (doesn't require 'use client' if it's just a Link wrapper)
// function SidebarLink({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
//     return (
//         <Link 
//             href={href} 
//             className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
//                 active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
//             }`}
//         >
//             <div className="flex items-center gap-3">
//                 <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
//                 <span className="font-bold text-sm tracking-tight">{label}</span>
//             </div>
//             {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
//         </Link>
//     );
// }

// async function getProjectWithMetrics(id: string) {
//     try {
//         const project = await prisma.mM_Project.findUnique({
//             where: { id },
//             include: {
//                 plan: true,
//                 responsibleWorkshop: true,
//                 activities: { orderBy: { createdAt: 'desc' } },
//                 _count: { select: { activities: true } }
//             }
//         });
//         return project;
//     } catch (error) {
//         console.error(`NRZ ERP Gateway Error:`, error);
//         return null;
//     }
// }