import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from "../../../../libs/prismadb"; // Assuming correct path to Prisma client
import getCurrentUser from '@/app/actions/getCurrentUser';

// Define the required fields for ImprovementOpportunity update
type ImprovementOpportunityUpdateInput = {
    description?: string;
    targetArea?: string;
    proposedAction?: string;
    isImplemented?: boolean;
    implementationDate?: string | null;
    // id and sourceId are filtered out as they shouldn't be updated here
}

/**
 * Handle PUT /api/defects/io/[id] (Update)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const opportunityId = params.id;

    // 1. Authentication Check
    const currUser = await getCurrentUser();
    if (!currUser) {
        return NextResponse.json(
            { message: 'Unauthorized: You must be logged in to update an Improvement Opportunity.' },
            { status: 401 }
        );
    }

    // 2. Parse Request Body and Validate ID
    const body: ImprovementOpportunityUpdateInput = await request.json();

    if (!opportunityId) {
        return NextResponse.json(
            { message: 'Bad Request: Opportunity ID is missing from parameters.' },
            { status: 400 }
        );
    }

    if (Object.keys(body).length === 0) {
        return NextResponse.json(
            { message: 'Bad Request: Request body cannot be empty for an update.' },
            { status: 400 }
        );
    }

    try {
        // --- Data Preparation for Update ---
        const { 
            description, 
            targetArea, 
            proposedAction, 
            isImplemented,
        } = body;
        
        const dataToUpdate: Prisma.ImprovementOpportunityUpdateInput = {};

        // Handle string fields, normalizing empty strings to null if applicable
        if (description !== undefined) dataToUpdate.description = description.trim() ;
        if (targetArea !== undefined) dataToUpdate.targetArea = targetArea.trim();
        if (proposedAction !== undefined) dataToUpdate.proposedAction = proposedAction.trim();
        
        // Handle boolean and related date field
        if (isImplemented !== undefined) {
            dataToUpdate.isImplemented = isImplemented;
            // Set implementationDate if marking as implemented, clear it otherwise
            dataToUpdate.implementationDate = isImplemented ? new Date().toISOString() : null;
        }

        if (Object.keys(dataToUpdate).length === 0) {
             return NextResponse.json(
                { message: 'Bad Request: No valid updateable fields were provided.' },
                { status: 400 }
            );
        }

        // 3. Update the Improvement Opportunity in the Database
        const updatedOpportunity = await prisma.improvementOpportunity.update({
            where: { id: opportunityId },
            data: dataToUpdate,
            select: {
                id: true,
                dateIdentified: true,
                description: true,
                targetArea: true,
                sourceModule: true,
                proposedAction: true,
                implementationDate: true,
                isImplemented: true,
                sourceDefectId: true, // Included for context, assuming this links to the defect
            },
        });
        
        return NextResponse.json(updatedOpportunity, { status: 200 });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Not Found: Improvement Opportunity ID specified does not exist.' },
                { status: 404 }
            );
        }
        
        console.error('Improvement Opportunity update failed:', error);
        return NextResponse.json(
            { message: 'Internal Server Error during opportunity update.' },
            { status: 500 }
        );
    }
}

/**
 * Handle DELETE /api/defects/io/[id] (Delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const opportunityId = params.id;

    // 1. Authentication Check
    const currUser = await getCurrentUser();
    if (!currUser) {
        return NextResponse.json(
            { message: 'Unauthorized: You must be logged in to delete an Improvement Opportunity.' },
            { status: 401 }
        );
    }

    if (!opportunityId) {
        return NextResponse.json(
            { message: 'Bad Request: Opportunity ID is missing from parameters.' },
            { status: 400 }
        );
    }

    try {
        // 2. Delete the Improvement Opportunity
        await prisma.improvementOpportunity.delete({
            where: { id: opportunityId },
        });
        
        // 3. Return 204 No Content on successful deletion
        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        if (error.code === 'P2025') {
            // If resource not found, it's already deleted (or never existed), which is often treated as success (idempotent)
            return new NextResponse(null, { status: 204 }); 
        }
        
        console.error('Improvement Opportunity deletion failed:', error);
        return NextResponse.json(
            { message: 'Internal Server Error during opportunity deletion.' },
            { status: 500 }
        );
    }
}