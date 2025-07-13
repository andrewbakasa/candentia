import { NextResponse } from "next/server";
// bcrypt is typically used for hashing passwords for a User model, not directly for Membership details.
// Removed it as it's not directly used for the Membership model fields in this context.
// import bcrypt from "bcrypt"; 

import prisma from "../../libs/prismadb";

export async function POST(
  request: Request, 
) {
  const body = await request.json();
  const { 
    firstName,
    lastName,
    email,
    membershipCategory,
    sex,
    country,
    profession,
    age,
    nextOfKin,
    interests, // This will be a comma-separated string from the frontend
    memberExpectations,
    pledge,
    shares,
    experienceOrBackground,
    role, // This field is from the frontend form, but not in the current Membership Prisma model
    teamCode, // This field is from the frontend form, but not in the current Membership Prisma model
  } = body;
 console.log('body',body)
  // Basic validation for fields that are required for a minimal membership entry
  // More comprehensive validation should be done with Zod on the backend as well.
  if (!email || !membershipCategory || !sex) {
    return new NextResponse('Missing required fields for membership registration.', { status: 400 });
  }

  // Convert interests string (e.g., "farming, technology") to an array of strings
 // const interestsArray = interests ? interests.split(',').map((item: string) => item.trim()) : [];

  // Parse age and shares to integers, handling cases where they might be empty strings or null
  const parsedAge = age !== undefined && age !== null && age !== '' ? parseInt(age, 10) : null;
  const parsedShares = shares !== undefined && shares !== null && shares !== '' ? parseInt(shares, 10) : null;

  try {
    const membership = await prisma.membership.create({
      data: {
        userEmail: email, // Maps the incoming 'email' to the 'userEmail' field in the Membership model
        firstName:firstName,
        lastName:lastName,
        // Fields directly from the Membership Prisma model
        membershipCategory: membershipCategory,
        sex: sex,
        country: country,
        profession: profession,
        age: parsedAge,
        nextOfKin: nextOfKin,
        interests: interests, // Storing as String[]
        memberExpectations: memberExpectations,
        pledge: pledge,
        shares: parsedShares,
        experienceOrBackground: experienceOrBackground,
        role: role,
        teamCode: teamCode,
        // Note: 'role', and 'teamCode'
        // are present in the frontend form but are NOT part of the current 'Membership' Prisma model.
        // If you need to store these with the Membership record, you must update your Prisma schema
        // for the 'Membership' model to include them.
        // Password and confirmPassword are typically handled by a separate User authentication model.
      }
    });
    console.log(membership)
    return NextResponse.json(membership);
  } catch (error: any) {
     console.log(error)
    console.error("Error creating membership:", error);
    // Provide a more descriptive error message in production environments
    return new NextResponse(`Failed to create membership: ${error.message || 'An unknown error occurred'}`, { status: 500 });
  }
}
