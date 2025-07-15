// app/api/careers/[careerId]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb"; // Adjust path as necessary

export async function DELETE(
  request: Request,
  { params }: { params: { careerId: string } }
) {
  const { careerId } = params;

  if (!careerId) {
    return new NextResponse("Career ID is required", { status: 400 });
  }

  try {
    const deletedCareer = await prisma.career.delete({
      where: {
        id: careerId,
      },
    });
    return NextResponse.json(deletedCareer, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting career:", error);
    return new NextResponse(`Failed to delete career: ${error.message || 'An unknown error occurred'}`, { status: 500 });
  }
}

export async function PATCH( // Or PUT, depending on your REST convention
  request: Request,
  { params }: { params: { careerId: string } }
) {
  const { careerId } = params;
  const body = await request.json();
  const {
    title,
    listingTitle,
    shortDescription,
    fullDescription,
    slug,
    location,
    type,
    department,
  } = body;

  if (!careerId) {
    return new NextResponse("Career ID is required", { status: 400 });
  }

  // Basic validation (add more comprehensive validation as needed)
  if (!title || !fullDescription || !slug || !location || !type || !department) {
    return new NextResponse('Missing required fields for career update.', { status: 400 });
  }

  try {
    const updatedCareer = await prisma.career.update({
      where: {
        id: careerId,
      },
      data: {
        title,
        listingTitle,
        shortDescription,
        fullDescription,
        slug,
        location,
        type,
        department,
      },
    });
    return NextResponse.json(updatedCareer, { status: 200 });
  } catch (error: any) {
    console.error("Error updating career:", error);
    return new NextResponse(`Failed to update career: ${error.message || 'An unknown error occurred'}`, { status: 500 });
  }
}