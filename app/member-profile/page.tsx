import prisma from "@/app/libs/prismadb";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { notFound, redirect } from "next/navigation"; // Import redirect
import getCurrentUser from "../actions/getCurrentUser";
import MemberData from "../member/[userId]/_components/MemberDataCore"

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
        </div>
      );

    }catch (err: any) {
      // Redirect the user to the specified page
      redirect("/membership#membership");
    };
};

export default UserIdPage;
// import prisma from "@/app/libs/prismadb";
// import EmptyState from "@/app/components/EmptyState";
// import ClientOnly from "@/app/components/ClientOnly";
// import { notFound } from "next/navigation";
// import getCurrentUser from "../actions/getCurrentUser";
// import MemberData from "../member/[userId]/_components/MemberDataCore"

// interface UserIdPageProps {

// };

// const UserIdPage = async ({
// }: UserIdPageProps) => {

//    const currentUser = await getCurrentUser();

//    if (!currentUser) {
//     return (
//       <ClientOnly>
//         <EmptyState
//           title="Unauthorized"
//           subtitle="Please login"
//         />
//       </ClientOnly>
//     );
//   }

//   try {

//       const user = await prisma.membership.findUnique({
//         where: {
//           userEmail: currentUser.email|| undefined,
//         },
//       });
//       if (!user) {
//         notFound();
//       }

//         const safeData = {
//           ...user,

//           createdAt: user.createdAt.toString(),
//           updatedAt: user.updatedAt.toString(),
//           // emailVerified: user?.emailVerified?.toString()||null,
//         };

//       return (
//         <div className="p-4 h-full overflow-x-auto">
//            <MemberData data={safeData} currentUser={currentUser}/>
//         </div>
//       );

//     }catch (err: any) { // Add ': any' to 'err' for better type handling if not already defined
//       // Return a React component to display the error
//       go to this pagege: "/membership#membership"
//       return (
//         <ClientOnly>
//           <EmptyState
//             title="Error"
//             subtitle={err.message || "Something went wrong!"} // Display the actual error message if available
//           />
//         </ClientOnly>
//       );
//     };
// };

// export default UserIdPage;