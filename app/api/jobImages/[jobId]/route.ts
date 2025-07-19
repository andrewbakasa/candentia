import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
  
    const jobImages = await prisma.jobAttachment.findMany({// removedunique
      where: {
        jobAppId: params.jobId,
      },
    });

    
    //console.log("cardImages",cardImages)
    return NextResponse.json(jobImages||null);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}