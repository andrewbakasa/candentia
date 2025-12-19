import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import ProjectActionsWrapper from '../../_components/ProjectAction Wrapper';
import ProjectDetailView from '../../_components/ProjectDetailView';

// Components

interface ProjectPageProps {
    params: {
        id: string;
    };
}

/**
 * MM Project Detail Page (Server Component)
 * Handles high-integrity data fetching for NRZ Maintenance Projects.
 */
export default async function ProjectDetailPage({ params }: ProjectPageProps) {
    const { id } = params;
    
    // 1. Data Fetching
    const project = await getProjectWithMetrics(id);

    // 2. Safeguard
    if (!project) {
        notFound();
    }

    // 3. Prepare Serializable Data for Client Components
    const serializedProject = {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                
                {/* Header Actions: Client Component for Interactivity (Edit/Delete/PDF) */}
                <ProjectActionsWrapper project={serializedProject} />

                {/* Main Content: The Detail UI developed previously */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <ProjectDetailView project={serializedProject} />
                </div>

                {/* Footer Audit Trail */}
                <div className="flex justify-center items-center gap-4 text-slate-400">
                    <div className="h-px w-12 bg-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                        Last System Update: {new Date(serializedProject.updatedAt).toLocaleString()}
                    </p>
                    <div className="h-px w-12 bg-slate-200" />
                </div>
            </div>
        </div>
    );
}

/**
 * Server-side database query.
 * Includes Strategic Plan (for Budget Ceilings) and Workshop (for Resource Mapping).
 */
async function getProjectWithMetrics(id: string) {
    try {
        const project = await prisma.mM_Project.findUnique({
            where: { id },
            include: {
                plan: true,                // Parent Strategic Plan (Guideline 1)
                responsibleWorkshop: true, // Facility Context
                activities: {              // Operational breakdown
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: { activities: true }
                }
            }
        });

        return project;
    } catch (error) {
        console.error(`NRZ ERP Gateway Error [Project ${id}]:`, error);
        return null;
    }
}