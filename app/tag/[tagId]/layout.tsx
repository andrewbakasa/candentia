import { notFound, redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import { TagData } from "./_components/tagData";

export async function generateMetadata({ 
  params
 }: {
  params: { tagId: string; };
 }) {

  

  const tag = await prisma.tag.findUnique({
    where: {
      id: params.tagId,
    }
  });

  return {
    title: tag?.name || "Name",
  };
}

const TagIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tagId: string; };
}) => {
  
  const currentUser = await getCurrentUser();

 
 
  if (!currentUser) {
   

   return (
     <ClientOnly>
       <EmptyState
         title="Unauthorized"
         subtitle="Please login"
       />
     </ClientOnly>
   )
  }
  const tag = await prisma.tag.findUnique({
    where: {
      id: params.tagId,
    },
  });
 // console.log("here.......")
  if (!tag) {
    notFound();
  }

 


 const safeData = {
  ...tag,
 
  createdAt: tag.createdAt.toString(),
  updatedAt: tag.updatedAt.toString(),
};
  return (
    <div
    className="h-full bg-no-repeat bg-cover bg-center flex justify-center"
   
  >
  
    <div 
      className="bg-black/10 "
    /> 
      <main className="flex justify-center pt-1 h-full">
        {children}
      </main>
    </div>
  );
};

export default TagIdLayout;
