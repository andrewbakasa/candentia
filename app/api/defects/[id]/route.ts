import { NextRequest, NextResponse } from 'next/server';
import { Priority, DefectStatus, Prisma } from '@prisma/client'; 
import prisma from "../../../libs/prismadb"
import getCurrentUser from '@/app/actions/getCurrentUser';



// 3. Define the Handler for the HTTP PUT method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const defectId = params.id; 

  // 1. Authentication and Authorization Check
  const currUser = await getCurrentUser();

  if (!currUser) {
    // Return a 401 Unauthorized response if the user is not authenticated.
    return NextResponse.json(
      { message: 'Unauthorized: You must be logged in to update a defect.' },
      { status: 401 }
    );
  }

  // 2. Parse Request Body
  const body = await request.json();

  // Basic validation: Check if ID is present and if the body is not empty
  if (!defectId) {
      return NextResponse.json(
        { message: 'Bad Request: Defect ID is missing from parameters.' },
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
    // --- Data Preparation for Defect Update (using partial update pattern) ---
    const { 
        title, 
        description, 
        area, 
        equipmentTag, 
        priority, 
        status, 
        breakdownRelated, 
        breakdownId
    } = body;
    
    // Convert and structure data for Prisma update
    const dataToUpdate: Prisma.DefectUpdateInput = {};

    // 2.1 Handle string fields
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description; 
    // Normalize empty strings/nulls to null for optional nullable columns
    if (area !== undefined) dataToUpdate.area = area || null; 
    
    // equipmentTag is unique and required in schema, only include if provided
    if (equipmentTag !== undefined) dataToUpdate.equipmentTag = equipmentTag; 

    // Handle boolean field
    if (breakdownRelated !== undefined) dataToUpdate.breakdownRelated = breakdownRelated; 
    
    // Handle ObjectId field (nullable)
  //  if (breakdownId !== undefined) dataToUpdate.breakdownId = breakdownId || null; 

    // 2.2 Handle Priority Enum (formerly severity/defectType)
    if (priority !== undefined) {
        if (!Object.values(Priority).includes(priority)) {
            return NextResponse.json({ message: 'Bad Request: Invalid value for priority.' }, { status: 400 });
        }
        dataToUpdate.priority = priority as Priority;
    }

    // 2.3 Handle DefectStatus Enum
    if (status !== undefined) {
        if (!Object.values(DefectStatus).includes(status)) {
            return NextResponse.json({ message: 'Bad Request: Invalid value for status.' }, { status: 400 });
        }
        // No special logic for closedDate/isClosed needed here, as those fields were removed 
        // from the Defect model in the new schema. The DefectElimination model handles closure tracking.
        dataToUpdate.status = status as DefectStatus;
    }
    
    // 3. Update the Defect in the Database
    const updatedDefect = await prisma.defect.update({
      where: { 
        id: defectId,
      },
      data: dataToUpdate,
      
      // 4. Select fields to return to the client, matching the updated model
      select: {
        id: true,
        identificationDate: true,
        title: true,
        description: true,
        area: true,
        equipmentTag: true,
        priority: true,
        status: true,
        breakdownRelated: true,
        breakdownId: true,
      },
    });
    
    // Return the updated resource
    return NextResponse.json(updatedDefect, { status: 200 });

  } catch (error: any) {
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
        console.error(`Defect ID ${defectId} not found.`, error);
        return NextResponse.json(
          { message: 'Not Found: Defect ID specified does not exist.' },
          { status: 404 }
        );
    }
    
    // Handle Unique Constraint Violation (P2002) - likely on equipmentTag
    if (error.code === 'P2002') {
        const target = error.meta?.target.join(', ') || 'field';
        return NextResponse.json(
          { message: `Conflict: A defect with this ${target} already exists.` },
          { status: 409 }
        );
    }
    
    console.error('Defect update failed:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during defect update.' },
      { status: 500 }
    );
  }
}