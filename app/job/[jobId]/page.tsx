
import prisma from "@/app/libs/prismadb";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { JobContainer } from "./_components/job-container";

interface JobIdPageProps {
  params: {
    jobId: string;
  };
};

const JobIdPage = async ({
  params,
}: JobIdPageProps) => {
  try {
    
    const job = await prisma.career.findUnique({
      where: {
        id: params.jobId,
      },
    });
     

      if (!job) {
        return (
          <ClientOnly>
            <EmptyState
              title="Not Ready"
              subtitle="Please wait"
            />
          </ClientOnly>
        );
      }
     

      
      return (
         <div className="p-4  h-full overflow-x-auto">
            <JobContainer          
              job={job}
              jobId={params.jobId}
            />
          </div>
      );

    }catch (err) {
      //console.log(err)
      return {
        error: "Something went wrong!" 
      }
    };
};

export default JobIdPage;
