// app/api/applications/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb'; // Adjust the import path to your Prisma client

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      careerId,
      applicantName,
      applicantEmail,
      applicantPhone,
      resumeUrl,
      coverLetterText,
      // status will default to "Pending" as per your Prisma schema
      // appliedAt will default to now() as per your Prisma schema
    } = body;

    // --- Basic Validation ---
    // Ensure all required fields are present
    if (!careerId || !applicantName || !applicantEmail || !resumeUrl) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing required fields: careerId, applicantName, applicantEmail, resumeUrl.' }),
        { status: 400 }
      );
    }

    // Optional: Validate if the careerId actually exists
    const existingCareer = await prisma.career.findUnique({
      where: {
        id: careerId,
      },
    });

    if (!existingCareer) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid careerId: The specified job posting does not exist.' }),
        { status: 404 } // Not Found for the career
      );
    }

    // --- Create JobApplication Record ---
    const newApplication = await prisma.jobApplication.create({
      data: {
        careerId, // Link to the Career model
        applicantName,
        applicantEmail,
        applicantPhone,
        resumeUrl,
        coverLetterText,
        // status and appliedAt will be set by their @default values in Prisma
      },
    });

    // Return the created application with a 201 Created status
    return NextResponse.json(newApplication, { status: 201 });

  } catch (error: any) {
    console.error('Error creating job application:', error);

    // Provide a more descriptive error message in production environments
    return new NextResponse(
      JSON.stringify({ message: `Failed to create job application: ${error.message || 'An unknown error occurred.'}` }),
      { status: 500 }
    );
  }
}