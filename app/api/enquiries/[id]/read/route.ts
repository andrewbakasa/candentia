import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";

// We use POST for updating existing resources (like setting a field)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Use lowercase and descriptive variable names
  const mailId = params.id;
  
  if (!mailId) {
    return NextResponse.json(
      { error: "Bad Request", message: "Mail ID is required." },
      { status: 400 }
    );
  }

  try {
    // 1. Semantic update: The operation is setting 'isRead' to true.
    const updatedMail = await prisma.enquiry.update({
      where: { id: mailId },
      data: {
        isRead: true, // Core action: mark as read
      },
      select: { 
        // 2. Only select relevant fields for the response, including the one you updated
        id: true,
        isRead: true,
        // If needed for client-side state update, include status/active:
        status: true,
        active: true, 
      }
    });

    // 3. Clear the cache for the page(s) where the 'unread count' or 'isRead' status is displayed.
    // Assuming the main inbox list is at /enquiries
    // import { revalidatePath } from 'next/cache'; // Must be imported at the top level
    // revalidatePath('/enquiries'); 
    
    return NextResponse.json(
      {
        message: `Enquiry "${updatedMail.id}" has been marked as read.`,
        mail: updatedMail, // Use lowercase 'mail' for consistency
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error marking Mail ${mailId} as read:`, error);

    // 4. Improved error handling for common Prisma errors
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json(
            { error: "Not Found", message: `Mail with ID ${mailId} could not be found.` },
            { status: 404 } 
        );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred while marking the Mail as read." },
      { status: 500 }
    );
  }
}
// // pages/api/Mails/[id]/route.ts
// import { NextResponse } from "next/server";
// import prisma from "../../../../libs/prismadb";

// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const MailId = params.id;

//   try {
//     // Calculate 30 days from the current date
//      // Update the Mail record to mark it as inactive and schedule deletion
//     const updatedMail = await prisma.enquiry.update({
//       where: { id: MailId },
//       data: {
//         isRead: true, // Set active to false
//       },
//       select: { // Select specific fields to return, rather than the entire object
//         id: true,
//         status: true,
//         active: true,
//         scheduledDeleteAt: true,
//       }
//     });

//     return NextResponse.json(
//       {
//         message: `Enquire "${updatedMail.id}" (ID: ${updatedMail.id}) has been marked as read}.`,
//         Mail: updatedMail,
//       },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error(`Error marking Mail ${MailId} for deletion:`, error);

//     // Provide a more specific error message based on the type of error
//     if (error.code === 'P2025') { // Prisma error code for record not found
//         return NextResponse.json(
//             { error: "Mail not found", message: `No Mail with ID ${MailId} could be found.` },
//             { status: 404 } // Use 404 for Not Found
//         );
//     }

//     return NextResponse.json(
//       { error: "Failed to mark Mail for deletion", message: error.message },
//       { status: 500 }
//     );
//   }
// }