import prisma from "../libs/prismadb";
import { Career } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";

export default async function getJobOpenings() {
  try {
    const currentUser = await getCurrentUser();
    // No need to check if currentUser exists if you want to show public job openings

    let careers: Career[];

    if (currentUser?.isAdmin) {
      // Admin can view all active job openings
      careers = await prisma.career.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        // Include any relevant relations for Career here
        // Example: If Career has a relation to Department
        // include: {
        //   department: true,
        //   // ... other relations
        // },
      });
    } else {
      // Non-admin users can view all active job openings (assuming all are public)
      careers = await prisma.career.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        // Include any relevant relations for Career here
        // Example: If Career has a relation to Department
        // include: {
        //   department: true,
        //   // ... other relations
        // },
      });
    }

    // Transform the career data if needed for the frontend
    const safeCareers = careers.map((career) => ({
      ...career,
      createdAt: career.createdAt ? career.createdAt.toISOString() : null,
      updatedAt: career.updatedAt ? career.updatedAt.toISOString() : null,
      // Add any other transformations if necessary
    }));

    return safeCareers;
  } catch (error: any) {
    throw new Error(error);
  }
}
