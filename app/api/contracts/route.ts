// app/api/contracts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../libs/prismadb" // Assuming this path is correct
import getCurrentUser from '@/app/actions/getCurrentUser';

// Define the handler for GET requests (already existing)
// export async function GET() {
//   try {
//     const contracts = await prisma.contractModel.findMany({
//       // Select only the essential fields needed for the list view
//       select: {
//         id: true,
//         title: true,
//         contractType: true,
//         status: true,
//         counterpartyName: true,
//         effectiveDate: true,
//         expirationDate: true,
//         annualRevenueUsd: true,
//         updatedAt: true,
//         description:true,
//       },
      
//       orderBy: {
//         updatedAt: 'desc', // Show most recently updated contracts first
//       },
//     });

//     // Return the list of contracts as JSON
//     return NextResponse.json(contracts, { status: 200 });
//   } catch (error) {
//     console.error('Failed to fetch contracts:', error);
//     return NextResponse.json(
//       { message: 'Internal Server Error while fetching contracts.' },
//       { status: 500 }
//     );
//   }
// }



export async function GET() {
  try {
    const contracts = await prisma.contractModel.findMany({
      select: {
        id: true,
        title: true,
        contractType: true,
        status: true,
        counterpartyName: true,
        effectiveDate: true,
        expirationDate: true,
        annualRevenueUsd: true,
        updatedAt: true,
        createdAt:true,
        description: true,
        // 🏆 Use _count to get the total number of related activities 🏆
        _count: {
          select: {
            contractActivityModels: true,
          },
        },
      },
      // Removed 'include' as _count is used instead for efficiency
      orderBy: {
        updatedAt: 'desc', // Show most recently updated contracts first
      },
    });

    // ➡️ The resulting data shape will be:
    // [{ 
    //    id: '...', 
    //    title: '...', 
    //    // ... other fields
    //    _count: { contractActivityModels: N } // N is the activity count
    // }, ...]
    
    // Return the list of contracts as JSON
    return NextResponse.json(contracts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch contracts with activity count:', error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching contracts.' },
      { status: 500 }
    );
  }
}
// Ensure these imports are correct based on your file structure
// import prisma from "../../libs/prismadb" 
// import getCurrentUser from '../../actions/getCurrentUser'; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentUser = await getCurrentUser(); // Assuming this is defined elsewhere
    
    // --- FIX: Return 401 Unauthorized for unauthenticated user ---
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required to create a contract.' },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // 1. Data Preparation and Conversion
    const data: any = {
      ...body,
      // Assign the internalOwnerId from the authenticated user
      internalOwnerId: currentUser.id, 
      
      // Date Conversion
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,

      // Numerical Field Handling (converting empty strings to null for optional fields)
      annualRevenueUsd: body.annualRevenueUsd === '' || body.annualRevenueUsd === undefined ? null : body.annualRevenueUsd,
      annualizedCostUsd: body.annualizedCostUsd === '' || body.annualizedCostUsd === undefined ? null : body.annualizedCostUsd,
      riskRating: body.riskRating === '' || body.riskRating === undefined ? null : body.riskRating,
      profitMarginPercent: body.profitMarginPercent === '' || body.profitMarginPercent === undefined ? null : body.profitMarginPercent,
      totalContractValueUsd: body.totalContractValueUsd === '' || body.totalContractValueUsd === undefined ? null : body.totalContractValueUsd,
    };

    // 2. Create the contract in the database
    const newContract = await prisma.contractModel.create({
      data: data,
    });

    // 3. Return the created contract object with status 201 (Created)
    return NextResponse.json(newContract, { status: 201 });
    
  } catch (error) {
    console.error('Contract creation failed:', error);
    
    // Improve error handling for better debugging in development
    const errorMessage = process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal Server Error: Failed to save new contract.';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}