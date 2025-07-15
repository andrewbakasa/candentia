// app/api/current-user/route.ts
// (for Next.js App Router)

import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser'; // Adjust the import path if necessary

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      // If no current user is found (e.g., not logged in), return a 401 Unauthorized response.
      // You can customize the message based on your application's needs.
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    // If a user is found, return their data as a JSON response.
    return NextResponse.json(currentUser);

  } catch (error) {
    // Log the error for debugging purposes on the server.
    console.error('Error fetching current user in /api/current-user:', error);

    // Return a generic 500 Internal Server Error response to the client.
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}