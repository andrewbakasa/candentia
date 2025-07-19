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
 // Define the filter object
    const whereClause: Prisma.JobApplicationWhereInput = {};

    // Only add applicantEmail filter if currentUser.email exists
    if (currentUser.email) {
      whereClause.applicantEmail = currentUser.email;
    } else {
      // If the current user doesn't have an email, they won't match any applications
      // You might want to throw an error or return an empty array here based on your app logic.
      // For now, let's assume if no email, no applications can be retrieved via this filter.
      // Or, if you intend for users without an email to still see something, adjust this.
      // For this specific error, if currentUser.email is null, it means no applications
      // can be found for them this way.
      console.warn("Current user has no email. No job applications will be retrieved based on email.");
      return []; // Return an empty array if there's no email to filter by
    }

  let jobApplications: JobApplication[];

    jobApplications = await prisma.jobApplication.findMany({
      where: whereClause, // Use the dynamically built whereClause
      orderBy: { createdAt: "desc" },
      include: {
        career: true,
        jobAttachment: true
      },
    });

    // let jobApplications: JobApplication[];
    //   jobApplications = await prisma.jobApplication.findMany({
    //     where: {
    //     applicantEmail: currentUser.email
    //   },
    //     orderBy: { createdAt: "desc" },
    //     include: {
    //       career: true,
    //       jobAttachment:true
    //     },
    //   });
    
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