// pages/api/boqs/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const boqId = params.id;

  try {
    // Calculate 30 days from the current date

    // Update the BOQ record to mark it as inactive and schedule deletion
    const updatedBOQ = await prisma.enquiry.delete({
      where: { id: boqId },
    });
    revalidatePath(`/enquiries`)
    revalidatePath(`/archivedEnquiries`)
    return NextResponse.json(
      {
        message: `Enquire "${updatedBOQ.last_name}" (ID: ${updatedBOQ.id}) has been deleted.`,
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