
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

    // Update the Mail record to mark it as inactive and schedule deletion
    const updatedMail = await prisma.enquiry.delete({
      where: { id: MailId },
    });
    revalidatePath(`/enquiries`)
    revalidatePath(`/archivedEnquiries`)
    return NextResponse.json(
      {
        message: `Enquire "${updatedMail.last_name}" (ID: ${updatedMail.id}) has been deleted.`,
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