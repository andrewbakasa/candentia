import { NextResponse } from "next/server";
import { revalidatePath } from 'next/cache'; // 🚨 NEW: Import for cache revalidation
import prisma from "../../../../libs/prismadb";

// NOTE: A restoration action is typically handled by a PATCH request, 
// but sticking to POST as requested/provided.

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Rename variable for clarity and domain specificity
  const mailId = params.id;
  
  // 2. Input validation for ID (optional but good practice)
  if (!mailId) {
    return NextResponse.json(
      { error: "Bad Request", message: "Mail ID is required." },
      { status: 400 }
    );
  }

  try {
    // Perform the database update: restore mail from archived state
    const updatedMail = await prisma.enquiry.update({
      where: { id: mailId },
      data: {
        active: true, // Mail is now active/in the main inbox
        status: "restored", // Explicitly set status to restored
        // If your schema uses an 'isArchived' field, set it here:
        // isArchived: false,
      },
      select: { 
        id: true,
        status: true,
        active: true,
      }
    });

    // 3. MANDATORY: Revalidate the cache for the page that displays the list.
    // This is the key to forcing the front-end list to refresh when navigating back.
    revalidatePath('/archivedEnquiries');
    
    // We should also revalidate the main inbox path, assuming the mail moves there.
    revalidatePath('/enquiries'); 
    
    return NextResponse.json(
      {
        message: `Mail "${updatedMail.id}" has been successfully restored to active.`,
        mail: updatedMail, // Use lowercase 'mail' for consistency
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error restoring Mail ${mailId}:`, error);

    // 4. Improved error handling
    if (error.code === 'P2025') { 
        return NextResponse.json(
            { error: "Not Found", message: `Mail with ID ${mailId} was not found or has already been restored.` },
            { status: 404 } 
        );
    }
    
    // 5. Default 500 error response
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred during restoration." },
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
  
//     const updatedMail = await prisma.enquiry.update({
//       where: { id: MailId },
//       data: {
//         active: true, // Set active to false
//         status: "restored", // Indicate that it's pending actual deletion
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
//         message: `Enquire "${updatedMail.id}" has been restore to active.`,
//         Mail: updatedMail,
//       },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error(`Error restoring Mail ${MailId}`, error);

//     // Provide a more specific error message based on the type of error
//     if (error.code === 'P2025') { // Prisma error code for record not found
//         return NextResponse.json(
//             { error: "Mail not found", message: `No Mail with ID ${MailId} could be found.` },
//             { status: 404 } // Use 404 for Not Found
//         );
//     }

//     return NextResponse.json(
//       { error: "Failed to restore", message: error.message },
//       { status: 500 }
//     );
//   }
// }

