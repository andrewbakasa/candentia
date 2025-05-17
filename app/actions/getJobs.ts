import prisma from "../libs/prismadb";
import { Career } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";
export default async function getJobs() {
  try {
    const currentUser = await getCurrentUser();
    // No need to check if currentUser exists if you want to show public job openings

    let record: Career[];


    if (currentUser?.isAdmin) {
      // Admin can view all active job openings
      record = await prisma.career.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        
      });
    } else {
      // Non-admin users can view all active job openings (assuming all are public)
      record = await prisma.career.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
       
      });
    }

    // Transform the career data if needed for the frontend
    const safeRecord = record.map((x) => ({
      ...x,
      createdAt: x.createdAt ? x.createdAt.toISOString() : null,
      updatedAt: x.updatedAt ? x.updatedAt.toISOString() : null,
      // Add any other transformations if necessary
    }));

    return safeRecord;
  } catch (error: any) {
    throw new Error(error);
  }
}

