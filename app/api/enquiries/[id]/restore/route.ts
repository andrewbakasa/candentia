// pages/api/Mails/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const MailId = params.id;

  try {
    // Calculate 30 days from the current date
  
    const updatedMail = await prisma.enquiry.update({
      where: { id: MailId },
      data: {
        active: true, // Set active to false
        status: "restored", // Indicate that it's pending actual deletion
      },
      select: { // Select specific fields to return, rather than the entire object
        id: true,
        status: true,
        active: true,
        scheduledDeleteAt: true,
      }
    });

    return NextResponse.json(
      {
        message: `Enquire "${updatedMail.id}" has been restore to active.`,
        Mail: updatedMail,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error restoring Mail ${MailId}`, error);

    // Provide a more specific error message based on the type of error
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json(
            { error: "Mail not found", message: `No Mail with ID ${MailId} could be found.` },
            { status: 404 } // Use 404 for Not Found
        );
    }

    return NextResponse.json(
      { error: "Failed to restore", message: error.message },
      { status: 500 }
    );
  }
}

