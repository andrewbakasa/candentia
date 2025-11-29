import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../libs/prismadb" // Assuming this path is correct
import getCurrentUser from '@/app/actions/getCurrentUser';


// --- GET handler: Fetching Strategy Outputs ---
export async function GET() {
  try {
    // Using the StrategyOutput model
    const strategies = await prisma.strategyOutput.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        
        // Fields from the new StrategyOutput schema
        responsible: true, 
        //responsibleId: true,
        costEstimate: true,
        isCompleted: true,
        //completionDate: true,
        outcomeId: true,

        // Standard timestamps
        //updatedAt: true,
        
        // Optional: Include the count of related activities
        _count: {
          select: {
            activities: true, // Based on the 'activities' relation name in StrategyOutput
          },
        },
      },
//       orderBy: {
//         updatedAt: 'desc', // Show most recently updated strategies first
//       },
    });

    // Return the list of strategies as JSON
    return NextResponse.json(strategies, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch strategy outputs:', error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching strategy outputs.' },
      { status: 500 }
    );
  }
}


// --- POST handler: Creating a Strategy Output ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentUser = await getCurrentUser();
    
    // Check for Unauthorized User
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required to create a strategy output.' },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // 1. Data Preparation and Conversion
    const data: any = {
      // Pass through general fields
      title: body.title,
      description: body.description,
      responsible: body.responsible,
     // costEstimate: body.costEstimate,
      isCompleted: body.isCompleted ?? false, // Default to false if not provided
      outcomeId: body.outcomeId, // Required relationship field

      // Set responsibleId to current user if not specified, 
      // or assume the internalOwnerId field is implicitly handled by the User relation.
      responsibleId: body.responsibleId || currentUser.id, 

      // Date Handling (only 'completionDate' exists in StrategyOutput)
      completionDate: body.completionDate ? new Date(body.completionDate) : null,
      
      // Numerical Field Handling for costEstimate
      costEstimate: body.costEstimate === '' || body.costEstimate === undefined ? null : parseFloat(body.costEstimate),
    };

    // 2. Create the strategy output in the database
    const newStrategyOutput = await prisma.strategyOutput.create({
      data: data,
    });

    // 3. Return the created strategy output object with status 201 (Created)
    return NextResponse.json(newStrategyOutput, { status: 201 });
    
  } catch (error) {
    console.error('Strategy output creation failed:', error);
    
    // Improve error handling for better debugging in development
    const errorMessage = process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal Server Error: Failed to save new strategy output.';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}