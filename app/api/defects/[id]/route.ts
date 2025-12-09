import { NextRequest, NextResponse } from 'next/server';
// 1. ✅ ADDED: DefectType is imported
import { Priority, DefectStatus, DefectType, AssigneeType, Prisma } from '@prisma/client'; 
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
    // Destructure all expected and potentially mismatched fields.
    const { 
      title, 
      description, 
      area, 
      equipmentTag, 
      reportedby,
      status, 
      breakdownRelated, 
      breakdownId,
      identificationDate,
      // *** Mismatched or Legacy Fields ***
      priority: currentPriority, // Renamed if client uses 'priority'
      severity, // Legacy name for Priority
      // 2. ✅ ADDED: Destructure the incoming defectType field (frontend name)
      defectType, 
      assignee,
      // Unused/Removed fields (assignee, id, isClosed, closedDate) are implicitly filtered out
    } = body;
    //console.log("body", body)
    
    // Determine the priority value (since defectType is now separate)
    const finalPriority = currentPriority ?? severity ?? null; 
    
    // Convert and structure data for Prisma update
    const dataToUpdate: Prisma.DefectUpdateInput = {};

    // 2.1 Handle string fields
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description; 
    
    // Normalize empty strings/nulls to null for optional nullable columns
    if (area !== undefined) dataToUpdate.area = area || null; 
    if (equipmentTag !== undefined) dataToUpdate.equipmentTag = equipmentTag || null; 

     if (reportedby !== undefined) dataToUpdate.reportedby = reportedby || null;

    // Handle boolean field
    if (breakdownRelated !== undefined) dataToUpdate.breakdownRelated = breakdownRelated; 
    
    // 2.2 Handle identificationDate
    if (identificationDate !== undefined) {
        // If identificationDate is provided, convert to Date object; 
        // If null/empty string, you can either keep existing or set a fallback.
        dataToUpdate.identificationDate = identificationDate ? new Date(identificationDate) : undefined;
    }
    // 2.2 ✅ ADDED: Handle DefectType Enum (Model field: 'type', Body field: 'defectType')
    if (defectType !== undefined) {
        // Ensure type value is capitalized and valid
        const upperType = typeof defectType === 'string' ? defectType.toUpperCase() : defectType;

        if (!Object.values(DefectType).includes(upperType as DefectType)) {
            return NextResponse.json({ message: `Bad Request: Invalid value for defect type: ${defectType}. Must be one of ${Object.values(DefectType).join(', ')}` }, { status: 400 });
        }
        dataToUpdate.type = upperType as DefectType;
    }

     if (assignee !== undefined) {
        // Ensure type value is capitalized and valid
        const upperType = typeof assignee === 'string' ? assignee.toUpperCase() : assignee;

        if (!Object.values(AssigneeType).includes(upperType as AssigneeType)) {
            return NextResponse.json({ message: `Bad Request: Invalid value for defect type: ${assignee}. Must be one of ${Object.values(AssigneeType).join(', ')}` }, { status: 400 });
        }
        dataToUpdate.assignee = upperType as AssigneeType;
    }
    

    // 2.3 Handle Priority Enum (using the determined `finalPriority` value)
    if (finalPriority !== undefined && finalPriority !== null) {
        // Ensure priority value is capitalized and valid
        const upperPriority = typeof finalPriority === 'string' ? finalPriority.toUpperCase() : finalPriority;

        if (!Object.values(Priority).includes(upperPriority as Priority)) {
            return NextResponse.json({ message: `Bad Request: Invalid value for priority: ${finalPriority}. Must be one of ${Object.values(Priority).join(', ')}` }, { status: 400 });
        }
        dataToUpdate.priority = upperPriority as Priority;
    }

    // 2.4 Handle DefectStatus Enum
    if (status !== undefined) {
        // Ensure status value is capitalized and valid
        const upperStatus = typeof status === 'string' ? status.toUpperCase() : status;

        if (!Object.values(DefectStatus).includes(upperStatus as DefectStatus)) {
            return NextResponse.json({ message: `Bad Request: Invalid value for status: ${status}. Must be one of ${Object.values(DefectStatus).join(', ')}` }, { status: 400 });
        }
        dataToUpdate.status = upperStatus as DefectStatus;
    }
    
    // If no fields were provided in the body (after filtering for undefined), return an error
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: 'Bad Request: No valid updateable fields were provided in the request body.' },
        { status: 400 }
      );
    }
    console.log("dataToUpdate",dataToUpdate)
    
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
        reportedby:true,
        // 3. ✅ ADDED: Include the new type field in the response
        type: true, 
        assignee:true,
        priority: true,
        status: true,
        breakdownRelated: true,
        breakdownId: true,
        createdAt: true, 
        updatedAt: true,
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


// 2. ✅ ADDED: HANDLER FOR HTTP DELETE (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const defectId = params.id;
  
  // 1. Authentication and Authorization Check
  const currUser = await getCurrentUser();

  if (!currUser) {
    // Return a 401 Unauthorized response if the user is not authenticated.
    return NextResponse.json(
      { message: 'Unauthorized: You must be logged in to delete a defect.' },
      { status: 401 }
    );
  }

  // 2. ID Validation
  if (!defectId) {
    return NextResponse.json(
      { message: 'Bad Request: Defect ID is missing from parameters.' },
      { status: 400 }
    );
  }

  try {
    // 3. Delete the Defect from the Database
    await prisma.defect.delete({
      where: {
        id: defectId,
      },
    });

    // 4. Return a 204 No Content response for successful deletion
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    // Handle specific Prisma errors, especially if the record is not found (P2025)
    if (error.code === 'P2025') {
      console.error(`Defect ID ${defectId} not found for deletion.`, error);
      return NextResponse.json(
        { message: 'Not Found: Defect ID specified does not exist.' },
        { status: 404 }
      );
    }
    
    console.error(`Defect deletion failed for ID ${defectId}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error during defect deletion.' },
      { status: 500 }
    );
  }
}