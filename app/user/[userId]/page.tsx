import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../../actions/getCurrentUser";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { UserData } from "./_components/userdata";
import { notFound } from "next/navigation";

interface UserIdPageProps {
  params: {
    userId: string;
  };
};

const UserIdPage = async ({
  params,
}: UserIdPageProps) => {
 
   const currentUser = await getCurrentUser();

   if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subtitle="Please login"
        />
      </ClientOnly>
    );
  }
 
  try {
      
      const user = await prisma.user.findUnique({
        where: {
          id: params.userId,
        },
      });
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
        <div className="p-4 h-full overflow-x-auto">
         <UserData data={safeData} currentUser={currentUser}/>
        </div>
      );

    }catch (err) {
      return {
        error: "Something went wrong!" 
      }
    };
};

export default UserIdPage;
