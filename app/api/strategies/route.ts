// app/api/strategies/route.ts
import { NextResponse } from 'next/server';
import prisma from "../../libs/prismadb";

import { ProposalStatus } from '@prisma/client'; // Import the enums from Prisma

// GET: Fetch all Strategies
export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      include: {
        author: true,
        goals: {
          include: {
            outcomes: {
              include: {
                outputs: true,
              },
            },
          },
        },
      },
      orderBy: {
        submissionDate: 'desc',
      },
    });
    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json({ message: 'Failed to fetch strategies' }, { status: 500 });
  }
}

// POST: Create a new Strategy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, authorId } = body;

    // Basic validation
    if (!title || !content || !authorId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newStrategy = await prisma.strategy.create({
      data: {
        title,
        content,
        authorId, // Assumes authorId is provided
        status: ProposalStatus.DRAFT, // Default status
        // Add default RBM Goal/Outcome/Output structure here if required on creation
      },
    });
    return NextResponse.json(newStrategy, { status: 201 });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json({ message: 'Failed to create strategy' }, { status: 500 });
  }
}