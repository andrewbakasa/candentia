import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        // 1. Validation for Business Model Compliance (Sec 5.5)
        if (body.status === 'COMPLETED' && !body.completionDate) {
            return NextResponse.json(
                { message: "Completion date is mandatory for finalized tasks." }, 
                { status: 400 }
            );
        }

        // 2. Execute Transaction with increased timeout to prevent P2028
        const result = await prisma.$transaction(async (tx) => {
            
            // Build update object
            const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
                ...(body.title && { title: body.title }),
                ...(body.description && { description: body.description }),
                ...(body.assignedTo && { assignedTo: body.assignedTo }),
                ...(body.dueDate !== undefined && { 
                    dueDate: body.dueDate ? new Date(body.dueDate) : null 
                }),
                ...(body.status && { 
                    status: body.status,
                    isCompleted: body.status === 'COMPLETED',
                    completionDate: body.status === 'COMPLETED' 
                        ? new Date(body.completionDate) 
                        : null
                }),
                ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) || 0 }),
                ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) || 0 }),
                ...(body.materialNotes && { materialNotes: body.materialNotes }),
            };

            // Update the Task
            const updatedTask = await tx.mM_Task.update({
                where: { id },
                data: updateData
            });

            // 3. Financial & Progress Rollup (Guideline Sec 5.1)
            const allTasks = await tx.mM_Task.findMany({
                where: { activityId: updatedTask.activityId }
            });

            const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
            const completedCount = allTasks.filter(t => t.isCompleted).length;
            const progress = allTasks.length > 0 
                ? Math.round((completedCount / allTasks.length) * 100) 
                : 0;

            // Using standard NRZ Labor Rate (Sec 6.3)
            const LABOR_RATE = 50; 

            await tx.mM_Activity.update({
                where: { id: updatedTask.activityId },
                data: {
                    progress: progress,
                    actualLaborCost: totalActualHours * LABOR_RATE
                }
            });

            return updatedTask;
        }, {
            maxWait: 5000,
            timeout: 20000 // Increased from 5s to 20s to handle latency
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("MM_Task PATCH Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Task record not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Internal Server Error during task sync." }, { status: 500 });
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { Prisma } from '@prisma/client';

// /**
//  * 🎯 PATCH /api/mm/tasks/[id]
//  * Updates specific task and re-calculates Activity-level labor and progress.
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;
//         const body = await request.json();

//         const updatedTask = await prisma.$transaction(async (tx) => {
            
//             // 1. Build update object for the Task
//             const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
//                 ...(body.title && { title: body.title }),
//                 ...(body.description && { description: body.description }),
//                 ...(body.assignedTo && { assignedTo: body.assignedTo }),
                
//                 // Due Date Management
//                 ...(body.dueDate !== undefined && { 
//                     dueDate: body.dueDate ? new Date(body.dueDate) : null 
//                 }),

//                 // Status & User-Supplied Completion Date
//                 ...(body.status && { 
//                     status: body.status,
//                     isCompleted: body.status === 'COMPLETED',
//                     // Respect the user's provided date, otherwise nullify if not completed
//                     completionDate: body.status === 'COMPLETED' 
//                         ? (body.completionDate ? new Date(body.completionDate) : null) 
//                         : null
//                 }),

//                 ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) }),
//                 ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) }),
//                 ...(body.materialNotes && { materialNotes: body.materialNotes }),
//             };

//             const task = await tx.mM_Task.update({
//                 where: { id },
//                 data: updateData
//             });

//             // 2. Roll up updated data to the Parent Activity
//             const allTasks = await tx.mM_Task.findMany({
//                 where: { activityId: task.activityId }
//             });

//             const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
//             const completedCount = allTasks.filter(t => t.isCompleted).length;
            
//             const progress = allTasks.length > 0 
//                 ? Math.round((completedCount / allTasks.length) * 100) 
//                 : 0;

//             const LABOR_RATE = 50; 

//             await tx.mM_Activity.update({
//                 where: { id: task.activityId },
//                 data: {
//                     progress: progress,
//                     actualLaborCost: totalActualHours * LABOR_RATE
//                 }
//             });

//             return task;
//         });

//         return NextResponse.json(updatedTask, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Task PATCH Error:", error);
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json({ message: "Task record not found." }, { status: 404 });
//         }
//         return NextResponse.json({ message: "Failed to update task." }, { status: 500 });
//     }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { Prisma } from '@prisma/client';

// /**
//  * 🎯 PATCH /api/mm/tasks/[id]
//  * Updates specific task and re-calculates Activity-level labor and progress.
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;
//         const body = await request.json();

//         const updatedTask = await prisma.$transaction(async (tx) => {
            
//             // 1. Build update object for the Task
//             const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
//                 ...(body.title && { title: body.title }),
//                 ...(body.description && { description: body.description }),
//                 ...(body.assignedTo && { assignedTo: body.assignedTo }),
//                 // NEW FIELD: Optional due date update
//                 ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
//                 ...(body.status && { 
//                     status: body.status,
//                     isCompleted: body.status === 'COMPLETED',
//                     completionDate: body.status === 'COMPLETED' ? new Date() : null
//                 }),
//                 ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) }),
//                 ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) }),
//                 ...(body.materialNotes && { materialNotes: body.materialNotes }),
//             };

//             const task = await tx.mM_Task.update({
//                 where: { id },
//                 data: updateData
//             });

//             // 2. Guideline 1 Sync: Roll up updated data to the Parent Activity
//             const allTasks = await tx.mM_Task.findMany({
//                 where: { activityId: task.activityId }
//             });

//             const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
//             const completedCount = allTasks.filter(t => t.isCompleted).length;
            
//             // Defensive check for divide by zero (Guideline Sec 5.1)
//             const progress = allTasks.length > 0 
//                 ? Math.round((completedCount / allTasks.length) * 100) 
//                 : 0;

//             // Costing Example Integration (Sec 6.3): Using standard NRZ Labor Rate
//             const LABOR_RATE = 50; 

//             await tx.mM_Activity.update({
//                 where: { id: task.activityId },
//                 data: {
//                     progress: progress,
//                     actualLaborCost: totalActualHours * LABOR_RATE
//                 }
//             });

//             return task;
//         });

//         return NextResponse.json(updatedTask, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Task PATCH Error:", error);
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json({ message: "Task record not found." }, { status: 404 });
//         }
//         return NextResponse.json({ message: "Failed to update task." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE /api/mm/tasks/[id]
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;

//         // Note: In a production environment, you might want to wrap DELETE in a transaction 
//         // to re-calculate Activity progress/costs after removal (Guideline Sec 2.2).
//         const deletedTask = await prisma.mM_Task.delete({
//             where: { id }
//         });

//         // Trigger rollup update for the activity after deletion
//         const allRemainingTasks = await prisma.mM_Task.findMany({
//             where: { activityId: deletedTask.activityId }
//         });

//         const totalHours = allRemainingTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
//         const progress = allRemainingTasks.length > 0 
//             ? Math.round((allRemainingTasks.filter(t => t.isCompleted).length / allRemainingTasks.length) * 100)
//             : 0;

//         await prisma.mM_Activity.update({
//             where: { id: deletedTask.activityId },
//             data: {
//                 progress,
//                 actualLaborCost: totalHours * 50
//             }
//         });

//         return NextResponse.json({ 
//             message: "Task record removed and activity synced successfully." 
//         }, { status: 200 });

//     } catch (error: any) {
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json({ message: "Task record not found." }, { status: 404 });
//         }
//         return NextResponse.json({ message: "Failed to delete task." }, { status: 500 });
//     }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';
// import { Prisma } from '@prisma/client';

// /**
//  * 🎯 PATCH /api/mm/tasks/[id]
//  * Updates specific task and re-calculates Activity-level labor and progress.
//  */
// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;
//         const body = await request.json();

//         const updatedTask = await prisma.$transaction(async (tx) => {
            
//             // 1. Build update object for the Task
//             const updateData: Prisma.MM_TaskUncheckedUpdateInput = {
//                 ...(body.title && { title: body.title }),
//                 ...(body.description && { description: body.description }),
//                 ...(body.assignedTo && { assignedTo: body.assignedTo }),
//                 ...(body.status && { 
//                     status: body.status,
//                     isCompleted: body.status === 'COMPLETED',
//                     completionDate: body.status === 'COMPLETED' ? new Date() : null
//                 }),
//                 ...(body.estimatedHours !== undefined && { estimatedHours: parseFloat(body.estimatedHours) }),
//                 ...(body.actualHours !== undefined && { actualHours: parseFloat(body.actualHours) }),
//                 ...(body.materialNotes && { materialNotes: body.materialNotes }),
//             };

//             const task = await tx.mM_Task.update({
//                 where: { id },
//                 data: updateData
//             });

//             // 2. Guideline 1 Sync: Roll up updated data to the Parent Activity
//             const allTasks = await tx.mM_Task.findMany({
//                 where: { activityId: task.activityId }
//             });

//             const totalActualHours = allTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
//             const completedCount = allTasks.filter(t => t.isCompleted).length;
//             const progress = Math.round((completedCount / allTasks.length) * 100);

//             // Costing Example Integration (Sec 6.3): Using standard NRZ Labor Rate
//             const LABOR_RATE = 50; 

//             await tx.mM_Activity.update({
//                 where: { id: task.activityId },
//                 data: {
//                     progress: progress,
//                     actualLaborCost: totalActualHours * LABOR_RATE
//                 }
//             });

//             return task;
//         });

//         return NextResponse.json(updatedTask, { status: 200 });

//     } catch (error: any) {
//         console.error("MM_Task PATCH Error:", error);
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json({ message: "Task record not found." }, { status: 404 });
//         }
//         return NextResponse.json({ message: "Failed to update task." }, { status: 500 });
//     }
// }

// /**
//  * 🎯 DELETE /api/mm/tasks/[id]
//  */
// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const id = params.id;

//         await prisma.mM_Task.delete({
//             where: { id }
//         });

//         return NextResponse.json({ 
//             message: "Task record removed successfully." 
//         }, { status: 200 });

//     } catch (error: any) {
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return NextResponse.json({ message: "Task record not found." }, { status: 404 });
//         }
//         return NextResponse.json({ message: "Failed to delete task." }, { status: 500 });
//     }
// }