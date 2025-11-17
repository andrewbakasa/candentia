import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/libs/prismadb"; // Assuming this path is correct for your Prisma client
import getCurrentUser from '@/app/actions/getCurrentUser'; // Assuming this function is async

// Define the handler for the HTTP PUT method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = params.id;

  // 1. Authentication and Authorization Check
  // getCurrentUser should be awaited as it typically involves database or session checks.
  const currUser = await getCurrentUser();

  if (!currUser) {
    // If the user is not authenticated, return a 401 Unauthorized response.
    return NextResponse.json(
      { message: 'Unauthorized: You must be logged in to update a contract.' },
      { status: 401 }
    );
  }

  // 2. Parse Request Body
  const body = await request.json();

  // Basic validation (You should add more robust schema validation like Zod here)
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json(
      { message: 'Bad Request: Request body is empty.' },
      { status: 400 }
    );
  }

  try {
    // Optional: Add an authorization layer to ensure the user owns or is authorized
    // to edit this specific contract (e.g., checking internalOwnerId against currUser.id)

    // 3. Update the Contract in the Database
    const updatedContract = await prisma.contractModel.update({
      where: { 
        id: contractId,
        // Optional: Ensure only the authorized user/owner can update it
        // internalOwnerId: currUser.id, 
      },
      data: {
        // Spread the fields from the request body
        ...body,
        // Always update the modification timestamp
        updatedAt: new Date(),
        // Example of type correction for specific fields:
        // effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      },
      // 4. Select fields to return to the client
      select: {
        id: true,
        title: true,
        status: true,
        description: true,
        updatedAt: true,
        annualRevenueUsd: true,
        annualizedCostUsd: true,
        counterpartyName: true,
        // Add other fields you need here
      },
    });

    // If the contract was not found or the user was not authorized (due to the 'where' clause),
    // you might want to return a 404/403 status, though Prisma handles 'not found' by throwing an error.
    if (!updatedContract) {
        return NextResponse.json(
            { message: 'Not Found: Contract does not exist or you lack permission.' },
            { status: 404 }
        );
    }
    
    return NextResponse.json(updatedContract, { status: 200 });
  } catch (error: any) {
    // Handle specific Prisma errors, like record not found (P2025) or validation failures
    if (error.code === 'P2025') {
        console.error(`Contract ID ${contractId} not found.`);
        return NextResponse.json(
            { message: 'Not Found: Contract ID specified does not exist.' },
            { status: 404 }
        );
    }
    
    console.error('Contract update failed:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during contract update.' },
      { status: 500 }
    );
  }
}