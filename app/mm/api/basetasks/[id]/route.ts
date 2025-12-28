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

        // 1. Execute Transaction to update the Master Template
        const result = await prisma.$transaction(async (tx) => {
            
            // Build update object based on your specific BaseTask Model
            const updateData: Prisma.BaseTaskUpdateInput = {
                ...(body.standardTitle && { standardTitle: body.standardTitle }),
                ...(body.standardDesc !== undefined && { standardDesc: body.standardDesc }),
                ...(body.category && { category: body.category }),
                
                // Benchmark Metrics (Guideline Sec 6.2)
                ...(body.benchmarkHours !== undefined && { 
                    benchmarkHours: parseFloat(body.benchmarkHours) || 0 
                }),
                
                // Skill Sets for Resource Management
                ...(body.requiredSkills && { 
                    requiredSkills: { set: body.requiredSkills } 
                }),
            };

            // Update the Blueprint
            const updatedBaseTask = await tx.baseTask.update({
                where: { id },
                data: updateData
            });

            return updatedBaseTask;
        }, {
            maxWait: 5000,
            timeout: 10000 
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("BaseTask PATCH Error:", error);
        
        // Handle Unique Constraint (standardTitle is @unique)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json(
                { message: "Another standard task already uses this title." }, 
                { status: 409 }
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Benchmark record not found." }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Internal Server Error updating benchmarks." }, { status: 500 });
    }
}