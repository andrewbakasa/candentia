import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../libs/prismadb" // Assuming this path is correct
import getCurrentUser from '@/app/actions/getCurrentUser';



/**
 * Handles POST requests to create a new Contract Activity (task/follow-up/review)
 * linked to a specific ContractModel.
 * Endpoint: /api/contracts/activity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentUser = await getCurrentUser();
    
    // 1. Security Check
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required to create an activity.' },
        { status: 401 } // Unauthorized
      );
    }

    // 2. Input Validation (Ensure required fields for linking are present)
    const { title, dueDate, responsiblePersons, activeType, status, contractId } = body;

    if (!contractId || !title || !dueDate || !responsiblePersons || !activeType || !status) {
        return NextResponse.json(
            { message: 'Missing required fields: contractId, title, dueDate, responsiblePersons, type, status.' },
            { status: 400 } // Bad Request
        );
    }
    
    // 3. Data Preparation
    const data = {
      ...body,
      // Assign the user who created the activity
      createdByUserId: currentUser.id, 
      
      // Convert date string to Date object (Prisma requires Date)
      dueDate: new Date(dueDate), 

      // Ensure activity type and status are uppercase strings matching the Prisma Enums
       activeType: activeType.toUpperCase(),
      status: status.toUpperCase(),
    };

    // 4. Create the activity in the database
    const newActivity = await prisma.contractActivityModel.create({
      data: data,
    });

    // 5. Return the created activity object with status 201 (Created)
    return NextResponse.json(newActivity, { status: 201 });
    
  } catch (error) {
    console.error('Contract activity creation failed:', error);
    
    const errorMessage = process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal Server Error: Failed to save new contract activity.';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}