import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import { AnalysisMethod, DefectStatus } from '@prisma/client';

// Define the shape for dynamic route parameters
interface Params {
    id: string; // This is the AnalysisRecord ID for PUT/DELETE
}



// --- PUT handler: Updating an existing Root Cause Analysis (RCA) ---
export async function PUT(request: NextRequest, { params }: { params: Params }) {
    const analysisId = params.id; // The ID of the AnalysisRecord
    
    try {
        const body = await request.json();
        const currentUser = await getCurrentUser();

        // 0. Authentication Check
        if (!currentUser) {
            return NextResponse.json(
                { message: 'Authentication required to update a Root Cause Analysis.' },
                { status: 401 }
            );
        }

        // 1. Data Destructuring and Validation
        const { 
            analystName,          
            methodUsed,           
            summaryOfFindings,    
            criticalityScore,    
        } = body;

        if (!analystName || !methodUsed || !summaryOfFindings) {
            return NextResponse.json(
                { message: 'Missing required fields: analystName, methodUsed, and summaryOfFindings are mandatory for the RCA update.' },
                { status: 400 }
            );
        }

        // 2. Data Conversion and Enum Validation
        const validatedMethod: AnalysisMethod = (AnalysisMethod as any)[methodUsed.toUpperCase()] || AnalysisMethod.OTHER;

        // 3. Retrieve the existing record to find the associated RootCause ID
        const existingAnalysis = await prisma.analysisRecord.findUnique({
            where: { id: analysisId },
            select: { rootCauseId: true }
        });

        if (!existingAnalysis || !existingAnalysis.rootCauseId) {
            return NextResponse.json(
                { message: `Root Cause Analysis with ID ${analysisId} not found or missing associated root cause.` },
                { status: 404 }
            );
        }

        // 4. Perform Transactional Database Operations
        const updatedAnalysisRecord = await prisma.$transaction(async (tx) => {
            
            const rootCauseId = existingAnalysis.rootCauseId!;

            // Step A: Update the RootCause record
            await tx.rootCause.update({
                where: { id: rootCauseId },
                data: {
                    rootCauseText: summaryOfFindings, // Update RootCause text based on new summary
                    criticalityScore: criticalityScore ? parseInt(criticalityScore, 10) : null,
                }
            });

            // Step B: Update the AnalysisRecord
            const updatedRecord = await tx.analysisRecord.update({
                where: { id: analysisId },
                data: {
                    analystName: analystName,
                    methodUsed: validatedMethod, 
                    summaryOfFindings: summaryOfFindings,
                    // Note: analysisDate is typically preserved in an edit, but the client controls this.
                },
                include: {
                    rootCause: true, 
                }
            });

            return updatedRecord;
        });

        // 5. Return the updated AnalysisRecord
        return NextResponse.json(updatedAnalysisRecord, { status: 200 });

    } catch (error) {
        console.error(`RCA update failed for Analysis ID ${analysisId}:`, error);
        return NextResponse.json(
            { message: 'Internal Server Error: Failed to update the Root Cause Analysis.' },
            { status: 500 }
        );
    }
}

// --- DELETE handler: Deleting an existing Root Cause Analysis (RCA) ---
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
    const analysisId = params.id; // The ID of the AnalysisRecord

    try {
        const currentUser = await getCurrentUser();

        // 0. Authentication Check
        if (!currentUser) {
            return NextResponse.json(
                { message: 'Authentication required to delete a Root Cause Analysis.' },
                { status: 401 }
            );
        }
        
        // 1. Check existence and retrieve linked RootCause ID
        const existingAnalysis = await prisma.analysisRecord.findUnique({
            where: { id: analysisId },
            select: { rootCauseId: true, defectId: true }
        });

        if (!existingAnalysis) {
            return NextResponse.json(
                { message: `Root Cause Analysis with ID ${analysisId} not found.` },
                { status: 404 }
            );
        }
        
        const rootCauseId = existingAnalysis.rootCauseId;
        const defectId = existingAnalysis.defectId;

        // 2. Perform Transactional Database Operations
        await prisma.$transaction(async (tx) => {

            // Step A: Delete the AnalysisRecord
            await tx.analysisRecord.delete({
                where: { id: analysisId },
            });
            
            // Step B: If a RootCause was linked, delete it too
            if (rootCauseId) {
                await tx.rootCause.delete({
                    where: { id: rootCauseId },
                });
            }

            // Step C (Optional Cleanup): Check if the Defect still has any RCAs
            const remainingRCAs = await tx.analysisRecord.count({
                where: { defectId: defectId }
            });

            // If no other RCAs exist, we might want to revert the defect status, 
            // but for simplicity and robustness, we will leave the Defect status alone
            // unless specific rollback logic is requested.
            // A safer approach might be to revert to a previous status (e.g., INVESTIGATION)
            // if no RCA remains. For now, we will skip changing the Defect status on delete.
        });

        // 3. Return a successful response with status 204 (No Content)
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`RCA deletion failed for Analysis ID ${analysisId}:`, error);
        // P2025 error code often means a record targeted for deletion was not found.
        let statusCode = 500;
        let message = 'Internal Server Error: Failed to delete the Root Cause Analysis.';
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            statusCode = 404;
            message = `Analysis record or linked root cause not found during deletion.`;
        }

        return NextResponse.json(
            { message: message },
            { status: statusCode }
        );
    }
}