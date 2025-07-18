import { NextResponse } from "next/server";
import prisma from "../../../libs/prismadb";

export async function POST( // Changed to PATCH for semantic correctness
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // Get the membership ID from URL parameters
    const body = await request.json(); // Parse the request body

    // Destructure all fields that can be updated, matching your Prisma Membership model
    const {
      firstName,
      lastName,
      userEmail, // Changed from 'email' to 'userEmail' to match Prisma schema
      membershipCategory,
      sex,
      country,
      profession,
      age,
      nextOfKin,
      interests,
      memberExpectations,
      pledge,
      shares,
      experienceOrBackground,
      role, // This field is present in your Membership Prisma model
      teamCode, // This field is present in your Membership Prisma model
      subcommittees
    } = body;

    // --- Server-side Validation ---
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Membership ID is required for update." }, { status: 400 });
    }

    const updateData: any = {}; // Object to build update payload for Prisma

    // Conditionally add fields to updateData if they are provided in the request body
    // This allows for partial updates (only sending fields that need to be changed)
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (userEmail !== undefined) updateData.userEmail = userEmail;
    if (membershipCategory !== undefined) updateData.membershipCategory = membershipCategory;
    if (sex !== undefined) updateData.sex = sex;
    if (country !== undefined) updateData.country = country;
    if (profession !== undefined) updateData.profession = profession;
    if (age !== undefined) updateData.age = age;
    if (nextOfKin !== undefined) updateData.nextOfKin = nextOfKin;
    if (interests !== undefined) updateData.interests = interests;
    if (memberExpectations !== undefined) updateData.memberExpectations = memberExpectations;
    if (pledge !== undefined) updateData.pledge = pledge;
    if (shares !== undefined) updateData.shares = shares;
    if (experienceOrBackground !== undefined) updateData.experienceOrBackground = experienceOrBackground;
    if (role !== undefined) updateData.role = role;
    if (teamCode !== undefined) updateData.teamCode = teamCode;
    if (subcommittees !== undefined) updateData.subcommittees = subcommittees;
    // Execute the update operation
    const updatedRecord = await prisma.membership.update({
      where: {
        id: id,
      },
      data: updateData,
      // You can include related data here if needed, e.g.,
      // include: {
      //   user: true,
      // },
    });
    console.log("updatedRecord",updatedRecord )
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error: any) {
    console.error("Error updating membership:", error);
    // Return a more descriptive error response
    return NextResponse.json({ error: "Internal Server Error", message: error.message || "Something went wrong during update." }, { status: 500 });
  }
}


// DELETE method for membership
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Membership ID is required for deletion." }, { status: 400 });
    }
    const deletedMembership = await prisma.membership.delete({ // Changed variable name to deletedMembership
      where: { id: id },
    });
    return NextResponse.json({ message: "Membership deleted successfully.", deletedMembership }, { status: 200 }); // Changed message to Membership
  } catch (error: any) {
    console.error("Error deleting membership:", error); // Changed message to Membership
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Not Found", message: "Membership not found." }, { status: 404 }); // Changed message to Membership
    }
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message || "An unexpected error occurred while deleting the membership." }, // Changed message to Membership
      { status: 500 }
    );
  }
}
