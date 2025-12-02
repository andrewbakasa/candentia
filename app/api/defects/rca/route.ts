import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
import { AnalysisMethod, DefectStatus } from '@prisma/client';

// --- POST handler: Creating a Root Cause Analysis (RCA) ---
export async function POST(request: NextRequest) {
  let defectId: string | undefined;

  try {
    const body = await request.json();
    const currentUser = await getCurrentUser();
    
    // 0. Authentication Check
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required to submit a Root Cause Analysis.' },
        { status: 401 }
      );
    }
    
    // 1. Data Destructuring and Validation
    const { 
        defectId: defectIdFromBody, 
        analystName,          
        methodUsed,           
        summaryOfFindings,    
        criticalityScore,     
        analysisDate,
    } = body;
    
    defectId = defectIdFromBody;

    if (!defectId || !analystName || !methodUsed || !summaryOfFindings) {
      return NextResponse.json(
        { message: 'Missing required fields: defectId, analystName, methodUsed, and summaryOfFindings are mandatory for the RCA.' },
        { status: 400 }
      );
    }
    
    // 2. Data Conversion and Enum Validation
    const validatedMethod: AnalysisMethod = (AnalysisMethod as any)[methodUsed.toUpperCase()] || AnalysisMethod.OTHER;
    
    // 3. Perform Transactional Database Operations using the FUNCTION OVERLOAD
    const newAnalysisRecord = await prisma.$transaction(async (tx) => {
        
        // --- TEMPORARY FIX: Retrieve the defect first to ensure we are operating on a valid record ---
        // This helps confirm the defect exists and forces Prisma to operate with a known object.
        const existingDefect = await tx.defect.findUnique({
            where: { id: defectId as string },
            select: { id: true } // Select minimal fields
        });

        if (!existingDefect) {
            // Throw an error that the catch block can interpret as a 404
            throw new Error('No Defect found');
        }

        // Step A: Create the RootCause record
        const newRootCause = await tx.rootCause.create({
            data: {
                rootCauseText: summaryOfFindings, 
                criticalityScore: criticalityScore ? parseInt(criticalityScore, 10) : null,
            }
        });

        // Step B: Create the AnalysisRecord, using the ID from the new RootCause
        const createdAnalysisRecord = await tx.analysisRecord.create({
            data: {
                defectId: defectId as string, 
                analystName: analystName,
                methodUsed: validatedMethod, 
                summaryOfFindings: summaryOfFindings,
                analysisDate: analysisDate ? new Date(analysisDate) : new Date(),
                rootCauseId: newRootCause.id, 
            },
            include: {
                rootCause: true, 
            }
        });

        // Step C: Update the parent Defect's status
        // Since we checked for existence above, this update should be fine.
        await tx.defect.update({
            where: { id: defectId as string }, 
            data: { 
                status: DefectStatus.ACTION_DEFINED, 
            },
        });
        
        return createdAnalysisRecord;
    });

    // 4. Return the created AnalysisRecord with status 201 (Created)
    return NextResponse.json(newAnalysisRecord, { status: 201 });
    
  } catch (error) {
    const logId = defectId || 'unknown';
    console.error(`RCA creation failed for Defect ID ${logId}:`, error);
    
    let statusCode = 500;
    let message = 'Internal Server Error: Failed to save the Root Cause Analysis.';
    
    // Check for common Prisma errors (e.g., trying to update a non-existent defect)
    if (error instanceof Error && error.message.includes('No Defect found')) {
         statusCode = 404;
         message = `Defect with ID ${logId} not found.`;
    }
    
    // P2032 error handling (specific to the current issue)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2032') {
         message = `Database Error (P2032): The Defect model's 'createdAt' field is missing or being set to null during update. Please check your schema.prisma to ensure 'createdAt' has '@default(now())'.`;
         // We might return 400 or 500, keeping 500 as it's a server/schema misconfiguration issue.
         statusCode = 500; 
    }

    if (process.env.NODE_ENV === 'development') {
        message = (error as Error).message;
    }

    return NextResponse.json(
      { message: message },
      { status: statusCode }
    );
  }
}