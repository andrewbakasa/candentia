// pages/api/boqs/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const boqId = params.id;

  try {
    // Calculate 30 days from the current date
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Update the BOQ record to mark it as inactive and schedule deletion
    const updatedBOQ = await prisma.enquiry.delete({
      where: { id: boqId },
    });

    return NextResponse.json(
      {
        message: `Enquire "${updatedBOQ.last_name}" (ID: ${updatedBOQ.id}) has been marked as inactive and scheduled for permanent deletion on ${thirtyDaysFromNow.toLocaleDateString()}.`,
        boq: updatedBOQ,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error marking BOQ ${boqId} for deletion:`, error);

    // Provide a more specific error message based on the type of error
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json(
            { error: "BOQ not found", message: `No BOQ with ID ${boqId} could be found.` },
            { status: 404 } // Use 404 for Not Found
        );
    }

    return NextResponse.json(
      { error: "Failed to mark BOQ for deletion", message: error.message },
      { status: 500 }
    );
  }
}