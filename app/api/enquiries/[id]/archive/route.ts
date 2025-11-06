// pages/api/Mails/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";
import { revalidatePath } from "next/cache";
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const MailId = params.id;

  try {
    // Calculate 30 days from the current date
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Update the Mail record to mark it as inactive and schedule deletion
     // Update the Mail record to mark it as inactive and schedule deletion
    const updatedMail = await prisma.enquiry.update({
      where: { id: MailId },
      data: {
        active: false, // Set active to false
        status: "pending_delete", // Indicate that it's pending actual deletion
        scheduledDeleteAt: thirtyDaysFromNow, // Set the date for future deletion
      },
      select: { // Select specific fields to return, rather than the entire object
        id: true,
        status: true,
        active: true,
        scheduledDeleteAt: true,
      }
    });
    revalidatePath(`/enquiries`)
    revalidatePath(`/archivedEnquiries`)
    return NextResponse.json(
      {
        message: `Enquire "${updatedMail.id}" (ID: ${updatedMail.id}) has been marked as inactive and scheduled for permanent deletion on ${thirtyDaysFromNow.toLocaleDateString()}.`,
        Mail: updatedMail,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error marking Mail ${MailId} for deletion:`, error);

    // Provide a more specific error message based on the type of error
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json(
            { error: "Mail not found", message: `No Mail with ID ${MailId} could be found.` },
            { status: 404 } // Use 404 for Not Found
        );
    }

    return NextResponse.json(
      { error: "Failed to mark Mail for deletion", message: error.message },
      { status: 500 }
    );
  }
}

