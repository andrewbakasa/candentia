import prisma from "@/app/libs/prismadb";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { notFound, redirect } from "next/navigation"; // Import redirect
import getCurrentUser from "../actions/getCurrentUser";
import MemberData from "../member/[userId]/_components/MemberDataCore"
import Footer from "../components/Footer";

interface UserIdPageProps {

};

const UserIdPage = async ({
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

      const user = await prisma.membership.findUnique({
        where: {
          userEmail: currentUser.email|| undefined,
        },
      });
      if (!user) {
        notFound();
      }

        const safeData = {
          ...user,

          createdAt: user.createdAt.toString(),
          updatedAt: user.updatedAt.toString(),
          // emailVerified: user?.emailVerified?.toString()||null,
        };

      return (
        <div className="p-4 h-full overflow-x-auto">
           <MemberData data={safeData} currentUser={currentUser}/>
           <Footer />
        </div>
      );

    }catch (err: any) {
      // Redirect the user to the specified page
      redirect("/membership#membership");
    };
};

export default UserIdPage;