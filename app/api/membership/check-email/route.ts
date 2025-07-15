// app/api/membership/check-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb'; // Assuming your Prisma client is exported from here
// Adjust the import path if necessary, e.g., import prisma from '../../../../lib/prismadb';

//import prisma from "../../../libs/prismadb";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return new NextResponse(JSON.stringify({ message: 'Email query parameter is required.' }), { status: 400 });
    }

    // Check if a Membership record with the given userEmail exists
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userEmail: userEmail,
      },
    });

    if (existingMembership) {
      return NextResponse.json({ isRegistered: true, message: 'User is already a registered member.' });
    } else {
      return NextResponse.json({ isRegistered: false, message: 'User is not yet a registered member.' });
    }

  } catch (error) {
    console.error('Error checking membership status:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal server error while checking membership status.' }), { status: 500 });
  }
}