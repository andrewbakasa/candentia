import prisma from "../libs/prismadb";
import { Enquiry } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";

export default async function getArchivedEnquiries() {
  try {
    const currentUser = await getCurrentUser();
    // No need to check if currentUser exists if you want to show public job openings

    let enquiry: Enquiry[];

    if (currentUser?.isAdmin) {
      // Admin can view all active job openings
      enquiry = await prisma.enquiry.findMany({
        where: {
          active: false,
        },
        orderBy: { createdAt: "desc" },
       
      });
    } else {
      // Non-admin users can view all active job openings (assuming all are public)
      enquiry = await prisma.enquiry.findMany({
        where: {
          active: false,
        },
        orderBy: { updatedAt: "desc" },
        
      });
    }

    // Transform the career data if needed for the frontend
    const safeEnquiries = enquiry.map((enquiry) => ({
      ...enquiry,
      createdAt: enquiry.createdAt ? enquiry.createdAt.toISOString() : null,
      updatedAt: enquiry.updatedAt ? enquiry.updatedAt.toISOString() : null,
      // Add any other transformations if necessary
    }));

    return safeEnquiries;
  } catch (error: any) {
    throw new Error(error);
  }
}
