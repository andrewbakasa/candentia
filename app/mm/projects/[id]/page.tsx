// NO 'use client' here
import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar';
import ProjectDetailView from '../../_components/ProjectDetailView';
import MM_ActivityForm from '../../_components/ActivityForm';
import EntityActionsHeader from '../../_components/ProjectActionWrapper';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

    // 1. Fetch the Specific Project with all Execution & Procurement Relations
    const project = await prisma.mM_Project.findUnique({
        where: { id },
        include: { 
            plan: true, 
            responsibleWorkshop: true, 
            // Execution timeline
            activities: {
                include: {
                    tasks: true 
                },
                orderBy: {
                    scheduledStart: 'asc'
                }
            },
            // Bill of Quantities (BoQ)
            materialRequirements: {
                include:{ material:true},
                orderBy: {
                    createdAt: 'desc'
                }
            },
            // Financial Commitments (POs)
            purchaseOrders: {
                include: {
                    lineItems: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    // 2. Fetch all Strategic Plans (Strategies) for Guideline 1 Validation
    // This provides the context for budget ceilings and resource allocation
    const strategies = await prisma.mM_StrategicPlan.findMany({
        orderBy: {
            year: 'desc'
        }
    });

    if (!project) notFound();

    // Serialize to handle Date objects safely for Client Components
    const serializedProject = JSON.parse(JSON.stringify(project));
    const serializedStrategies = JSON.parse(JSON.stringify(strategies));
    console.log('project structure:', serializedProject)
    return (
        <div className="flex h-screen bg-slate-100/50 overflow-hidden">
            {/* Sidebar Context */}
            <MM_Sidebar activeTab="projects" />

            <main className="flex-1 overflow-y-auto">
                {/* Header Implementation */}
                <div className="px-3 pt-3">
                    <EntityActionsHeader 
                        itemId={serializedProject.id}
                        entityLabel="Project"
                        editPath={`/mm/projects/edit/${serializedProject.id}`}
                        backLabel="Back to Project Inventory"
                        data={serializedProject}
                    />
                </div>
                
                <div className="p-2 pt-2">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        <ProjectDetailView 
                            project={serializedProject} 
                            MM_ActivityForm={MM_ActivityForm} 
                            // 3. Passing the full strategy registry to enable cross-referencing
                            allStrategies={serializedStrategies}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}