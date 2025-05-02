import { notFound, redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import { UserData } from "./_components/userdata";

export async function generateMetadata({ 
  params
 }: {
  params: { userId: string; };
 }) {

  

  const user = await prisma.user.findUnique({
    where: {
      id: params.userId,
    }
  });

  return {
    title: user?.name || "Name",
  };
}

const UserIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string; };
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
  const user = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
  });
 // console.log("here.......")
  if (!user) {
    notFound();
  }

 


 const safeData = {
  ...user,
 
  createdAt: user.createdAt.toString(),
  updatedAt: user.updatedAt.toString(),
  emailVerified: user?.emailVerified?.toString()||null,
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

export default UserIdLayout;
