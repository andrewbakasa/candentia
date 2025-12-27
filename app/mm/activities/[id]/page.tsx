// NO 'use client' here
import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '../../../libs/prismadb';
import MM_Sidebar from '../../_components/MM_Sidebar';
import MM_TaskForm from '../../_components/TaskForm';
import ActivityDetailView from '../../_components/ActvityDetailView';
import EntityActionsHeader from '../../_components/ProjectActionWrapper';
import getCurrentUser from '@/app/actions/getCurrentUser';

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
 // Execute server-side authentication
  const currentUser = await getCurrentUser();

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
                <div className="px-4 pt-4">
                    <EntityActionsHeader 
                        itemId={serializedActivity.id}
                        entityLabel="Activity"
                        editPath={`/mm/activities/edit/${serializedActivity.id}`}
                        backLabel="Back to Activity Logs"
                        data={serializedActivity}
                    />
                </div>
                
                <div className="p-2 pt-2">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                       
                        <ActivityDetailView 
                            activity={serializedActivity} 
                            MM_TaskForm_Component={MM_TaskForm} 
                            currentUser={currentUser}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}