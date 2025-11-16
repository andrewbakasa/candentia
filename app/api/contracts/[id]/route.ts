// app/api/contracts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
//import prisma from '@/lib/prisma'; // Assumes you have a Prisma client initialized
//import { NextResponse } from "next/server";

//import getCurrentUser from getCurrentUser
import prisma from "../../../libs/prismadb"//"..app/libs/prismadb";
//import getCurrentUser from "../../../actions/getCurrentUser";
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = params.id;
  const body = await request.json();
  
  // NOTE: You should implement robust validation here (e.g., Zod)
  // Ensure the user is authorized to update the contract (e.g., checking internalOwnerId or role)

  try {
    const updatedContract = await prisma.contractModel.update({
      where: { id: contractId },
      data: {
        ...body,
        updatedAt: new Date(),
        // Convert string dates back to Date objects if necessary for other fields
        // effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      },
      // Select fields to return, and potentially include related data
      select: {
        id: true,
        title: true,
        status: true,
        description: true,
        updatedAt: true,
        annualRevenueUsd: true,
        annualizedCostUsd: true,
        counterpartyName: true,
        // ... include all fields needed for the ContractModel type
      },
    });

    return NextResponse.json(updatedContract, { status: 200 });
  } catch (error) {
    console.error('Contract update failed:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during contract update.' },
      { status: 500 }
    );
  }
}