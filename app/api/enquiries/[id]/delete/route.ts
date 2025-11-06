import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";
import { revalidatePath } from "next/cache";
import getCurrentUser from "@/app/actions/getCurrentUser";

// Define the shape for the URL parameters
interface IParams {
  id?: string;
}

// DELETE handler for Next.js Route Handler
// Note: While your original code used POST, DELETE is the RESTful method for deletion.
// I've kept it as POST based on your function signature, but recommend using DELETE.
// If you change the file name to 'route.ts' and the function to 'DELETE', you should use DELETE.

export async function POST(
  request: Request,
  { params }: { params: IParams } // Use the defined interface for better type safety
) {
  const MailId = params.id; // Correctly access the 'id' from the params object

  // 1. Authentication and Authorization Checks
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Must return a NextResponse object for Next.js Route Handlers
    return NextResponse.json(
      { error: "Unauthorized", message: "User not logged in" },
      { status: 401 } // 401 Unauthorized
    );
  }

  // Authorization: Only administrators can delete enquiries
  if (!currentUser.isAdmin) {
    // Must return a NextResponse object
    return NextResponse.json(
      { error: "Forbidden", message: "User does not have admin permissions" },
      { status: 403 } // 403 Forbidden
    );
  }

  // Basic validation to ensure an ID was provided
  if (!MailId) {
    return NextResponse.json(
      { error: "Bad Request", message: "Enquiry ID is missing" },
      { status: 400 } // 400 Bad Request
    );
  }

  // 2. Database Operation
  try {
    // Delete the enquiry record
    const deletedEnquiry = await prisma.enquiry.delete({
      where: { id: MailId },
    });

    // 3. Cache Revalidation (for Next.js App Router)
    revalidatePath(`/enquiries`);
    revalidatePath(`/archivedEnquiries`); // Assuming this is needed after a hard delete

    // 4. Success Response
    return NextResponse.json(
      {
        message: `Enquiry for "${deletedEnquiry.last_name}" (ID: ${deletedEnquiry.id}) has been permanently deleted.`,
        deletedEnquiry: deletedEnquiry,
      },
      { status: 200 } // 200 OK
    );
  } catch (error: any) {
    console.error(`Error deleting Enquiry ${MailId}:`, error);

    // 5. Error Handling
    // Prisma error code P2025: Record to delete does not exist.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Not Found", message: `No Enquiry with ID ${MailId} could be found to delete.` },
        { status: 404 } // 404 Not Found
      );
    }

    // Generic Internal Server Error
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred during deletion." },
      { status: 500 } // 500 Internal Server Error
    );
  }
}