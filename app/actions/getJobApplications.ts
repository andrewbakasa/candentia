import prisma from "../libs/prismadb";
import { JobApplication, Prisma } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";

export default async function getJobApplications() {
  try {
    const currentUser = await getCurrentUser();

    // 1. Crucial: If no user, immediately deny access.
    if (!currentUser) {
      throw new Error("Unauthorized: User not logged in to view job applications.");
    }

    let jobApplications: JobApplication[];
      jobApplications = await prisma.jobApplication.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          career: true,
          jobAttachment:true
        },
      });
    
    // 4. Ensure all Date objects are converted to ISO strings for client-side consumption.
    // This is vital for Server Components.
    const safeJobApplications = jobApplications.map((application) => ({
      ...application,
      createdAt: application.createdAt ? application.createdAt.toISOString() : null,
      updatedAt: application.updatedAt ? application.updatedAt.toISOString() : null,
      
    }));

    return safeJobApplications;
  } catch (error: any) {
    console.error("Error fetching job applications in getJobApplications:", error);
    // Re-throw a more specific error if it's an authorization issue,
    // otherwise, a generic message for other errors.
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      throw error; // Re-throw the original error if it's related to authorization
    } else {
      throw new Error(`Failed to retrieve job applications. Please try again later.`);
    }
  }
}