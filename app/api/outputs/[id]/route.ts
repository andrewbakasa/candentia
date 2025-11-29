import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/libs/prismadb"; // Assuming this path is correct for your Prisma client
import getCurrentUser from '@/app/actions/getCurrentUser'; // Assuming this function is async
import { Prisma } from '@prisma/client';

// Define the handler for the HTTP PUT method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use 'outputId' or 'id' for clarity on the resource being updated
  const outputId = params.id; 

  // 1. Authentication and Authorization Check
  const currUser = await getCurrentUser();

  if (!currUser) {
    // If the user is not authenticated, return a 401 Unauthorized response.
    return NextResponse.json(
      { message: 'Unauthorized: You must be logged in to update a strategy output.' },
      { status: 401 }
    );
  }

  // 2. Parse Request Body
  const body = await request.json();

  // Basic validation for the required field: title
  if (!body.title) {
    return NextResponse.json(
        { message: 'Bad Request: Missing required field "title".' },
        { status: 400 }
    );
  }

  try {
    // --- Data Preparation for StrategyOutput ---
    // Extracting all updatable fields from the request body
    const { 
        title, 
        description, 
        responsible, 
        costEstimate, 
        isCompleted, 
        completionDate 
    } = body;
    
    // Convert and structure data for Prisma update
    const dataToUpdate: Prisma.StrategyOutputUpdateInput = {
        title: title,
        
        // Handle optional nullable string fields
        description: description || null,
        responsible: responsible || null,

        // Handle numerical field: costEstimate
        // Frontend sends a number or null/empty string. We normalize empty string to null.
        costEstimate: (costEstimate === null || (typeof costEstimate === 'string' && costEstimate === ''))
            ? null 
            : parseFloat(costEstimate),
            
        // Handle boolean field
        isCompleted: isCompleted,
        
        // Handle date field: completionDate
        // Convert ISO string (or null) to Date object (or null)
        completionDate: completionDate ? new Date(completionDate) : null,
        
        // Ensures the updatedAt timestamp is always updated
        //updatedAt: new Date(), 
    };

    // 3. Update the Strategy Output in the Database
    const updatedOutput = await prisma.strategyOutput.update({
      where: { 
        id: outputId,
        // Optional: Add authorization check if the StrategyOutput model has an owner ID.
        // For example: internalOwnerId: currUser.id, 
      },
      data: dataToUpdate,
      
      // 4. Select fields to return to the client (matching StrategyOutputModel structure)
      select: {
        id: true,
        title: true,
        description: true,
        responsible: true,
        costEstimate: true,
        isCompleted: true,
        completionDate: true,
        outcomeId: true,
        // Include calculated fields like updatedAt if the frontend expects it
        //updatedAt: true,
        // Include _count for related activities if helpful
        _count: { select: { activities: true } }
      },
    });
    
    return NextResponse.json(updatedOutput, { status: 200 });

  } catch (error: any) {
    // Handle specific Prisma errors, like record not found (P2025)
    if (error.code === 'P2025') {
        console.error(`Strategy Output ID ${outputId} not found.`);
        return NextResponse.json(
          { message: 'Not Found: Strategy Output ID specified does not exist.' },
          { status: 404 }
        );
    }
    
    console.error('Strategy Output update failed:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during strategy output update.' },
      { status: 500 }
    );
  }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "@/app/libs/prismadb"; // Assuming this path is correct for your Prisma client
// import getCurrentUser from '@/app/actions/getCurrentUser'; // Assuming this function is async
// import { Prisma } from '@prisma/client';

// // Define the handler for the HTTP PUT method
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   // Use 'outputId' or 'id' for clarity on the resource being updated
//   const outputId = params.id; 

//   // 1. Authentication and Authorization Check
//   const currUser = await getCurrentUser();

//   if (!currUser) {
//     // If the user is not authenticated, return a 401 Unauthorized response.
//     return NextResponse.json(
//       { message: 'Unauthorized: You must be logged in to update a strategy output.' },
//       { status: 401 }
//     );
//   }

//   // 2. Parse Request Body
//   const body = await request.json();

//   // Basic validation
//   if (!body || Object.keys(body).length === 0) {
//     return NextResponse.json(
//       { message: 'Bad Request: Request body is empty.' },
//       { status: 400 }
//     );
//   }

//   try {
//     // --- Data Preparation for StrategyOutput ---
//     // We only include fields relevant to the StrategyOutput model in the update payload.
//     const dataToUpdate: Prisma.StrategyOutputUpdateInput = {
//       ...body,
//       
//       // Specific Type Corrections/Conversions for StrategyOutput fields:
//       
//       // Handle date field: completionDate
//       ...(body.completionDate !== undefined && { 
//         completionDate: body.completionDate ? new Date(body.completionDate) : null 
//       }),
//       
//       // Handle numerical field: costEstimate
//       ...(body.costEstimate !== undefined && { 
//         costEstimate: typeof body.costEstimate === 'string' && body.costEstimate === '' 
//           ? null 
//           : body.costEstimate 
//       }),
//       
//       // Ensures the timestamp is always updated
//       updatedAt: new Date(), 
//     };

//     // 3. Update the Strategy Output in the Database
//     const updatedOutput = await prisma.strategyOutput.update({
//       where: { 
//         id: outputId,
//         // Add authorization check if the StrategyOutput model has an owner/creator ID:
//         // internalOwnerId: currUser.id, 
//       },
//       data: dataToUpdate,
//       
//       // 4. Select fields to return to the client (StrategyOutput fields)
//       select: {
//         id: true,
//         title: true,
//         description: true,
//         responsible: true,
//         //responsibleId: true,
//         costEstimate: true,
//         isCompleted: true,
//         completionDate: true,
//         outcomeId: true,
//         //updatedAt: true,
//         // Include _count for related activities if helpful
//         _count: { select: { activities: true } }
//       },
//     });
//     
//     return NextResponse.json(updatedOutput, { status: 200 });

//   } catch (error: any) {
//     // Handle specific Prisma errors, like record not found (P2025)
//     if (error.code === 'P2025') {
//         console.error(`Strategy Output ID ${outputId} not found.`);
//         return NextResponse.json(
//             { message: 'Not Found: Strategy Output ID specified does not exist.' },
//             { status: 404 }
//         );
//     }
//     
//     console.error('Strategy Output update failed:', error);
//     return NextResponse.json(
//       { message: 'Internal Server Error during strategy output update.' },
//       { status: 500 }
//     );
//   }
// }