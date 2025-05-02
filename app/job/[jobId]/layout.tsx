import { notFound, redirect } from "next/navigation";
import prisma from "@/app/libs/prismadb";



export async function generateMetadata({ 
  params
 }: {
  params: { jobId: string; };
 }) {

  

  const career = await prisma.career.findUnique({
    where: {
      id: params.jobId,
    }
  });

  return {
    title: career?.title || "Job",
  };
}

const CareerLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { jobId: string; };
}) => {
  
   
  const career = await prisma.career.findUnique({
    where: {
      id: params.jobId,
    },
  });
  // console.log("here.......")
  if (!career) {
    notFound();
  }

 
  return (
    <div
      className="relative h-full bg-no-repeat bg-cover bg-center "
    >
       <div 
        className="absolute inset-0 bg-black/10"
      
      />
        <main className="relative h-full pt-1">
          {children}
        </main>
      </div>
  );
};

export default CareerLayout;



