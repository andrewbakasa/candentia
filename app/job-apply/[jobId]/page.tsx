// app/job-apply/[jobId]/page.tsx
import { notFound } from 'next/navigation';
import JobApplicationForm from './_components/JobAppForm' // Adjust path
import prisma from '@/app/libs/prismadb'; // Adjust path to your Prisma client
import getCurrentUser from '@/app/actions/getCurrentUser';

interface JobApplyPageProps {
  params: {
    jobId: string;
  };
}

const JobApplyPage = async ({ params }: JobApplyPageProps) => {
  const { jobId } = params;

  // Fetch the career details to pass the title to the form (optional)
  let career = null;
  const currentUser = await getCurrentUser();
  
  try {
    career = await prisma.career.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        title: true, // Only fetch what's needed
      },
    });
  } catch (error) {
    console.error("Error fetching career for application:", error);
    // Handle error, e.g., show a generic error page
  }

  if (!career) {
    notFound(); // If job not found, return 404
  }

  return (
    <JobApplicationForm
      careerId={career.id}
      careerTitle={career.title || undefined}
      currentUser={currentUser}
    />
  );
};

export default JobApplyPage;