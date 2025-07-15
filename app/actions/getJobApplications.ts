import prisma from "../libs/prismadb";
import { JobApplication, Prisma } from "@prisma/client"; // Import Prisma here
import getCurrentUser from "./getCurrentUser";

export default async function getJobApplications() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Unauthorized: User not logged in to view job applications.");
    }

    let jobApplications: JobApplication[];

    // Let TypeScript infer the type, or use Prisma.JobApplicationFindManyArgs for explicit typing
    const baseQueryOptions: Prisma.JobApplicationFindManyArgs = { // Explicitly type using Prisma's generated type
      orderBy: { createdAt: "desc" }, // 'desc' is a valid value for SortOrder
      include: {
        career: true,
       // user: true,
      },
    };

    if (currentUser.isAdmin) {
      jobApplications = await prisma.jobApplication.findMany({
        ...baseQueryOptions,
      });
    } else if (currentUser.id) {
        jobApplications = await prisma.jobApplication.findMany({
            ...baseQueryOptions,
           
        });
    } else {
      throw new Error("Forbidden: User does not have permission to view job applications.");
    }

    const safeJobApplications = jobApplications.map((application) => ({
      ...application,
      createdAt: application.createdAt ? application.createdAt.toISOString() : null,
      updatedAt: application.updatedAt ? application.updatedAt.toISOString() : null,
      // career: application. ? {
      //   ...application.career,
      //   createdAt: application.career.createdAt?.toISOString() || null,
      //   updatedAt: application.career.updatedAt?.toISOString() || null,
      // } : null,
      // user: application.user ? {
      //   ...application.user,
      //   createdAt: application.user.createdAt?.toISOString() || null,
      //   updatedAt: application.user.updatedAt?.toISOString() || null,
      // } : null,
    }));

    return safeJobApplications;
  } catch (error: any) {
    console.error("Error fetching job applications:", error);
    throw new Error(`Failed to retrieve job applications: ${error.message}`);
  }
}