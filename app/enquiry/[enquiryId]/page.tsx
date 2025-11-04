// app/enquiries/[enquiryId]/page.tsx
import prisma from "@/app/libs/prismadb";
import { redirect } from "next/navigation";
import { SafeUser } from "@/app/types";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import EnquiryDetailsClient from "./EnquiryDetailsPage";

// Define the expected props for the page component (Next.js automatically passes params)
interface IParams {
  enquiryId?: string;
}

const EnquiryPage = async ({ params }: { params: IParams }) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return redirect('/denied'); // Security check
  }

  // --- 1. FETCH DATA (Server-side) ---
  const enquiry = await prisma.enquiry.findUnique({
    where: {
      id: params.enquiryId,
    },
  });

  // --- 2. SECURITY & ERROR CHECK ---
  if (!enquiry) {
    return (
        <Container>
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-gray-900">Enquiry Not Found</h2>
                <p className="text-gray-500 mt-2">The message you are looking for does not exist or may have been deleted.</p>
            </div>
        </Container>
    );
  }

  // --- NEW LOGIC: MARK AS READ ---
  let updatedEnquiry = enquiry;
  
  // Check if the enquiry is currently unread
  if (enquiry.isRead === false) {
    try {
        // Use Prisma's update method to set isRead to true
        updatedEnquiry = await prisma.enquiry.update({
            where: {
                id: enquiry.id,
            },
            data: {
                isRead: true, // Mark it as read
            },
        });
        // Note: Errors here (like DB connection failure) should be handled
        // but for a simple read status update, continuing with the original data 
        // if the update fails is often acceptable, though less ideal.
    } catch (error) {
        console.error("Failed to update enquiry status to READ:", error);
        // Continue rendering the page, but the status remains 'unread' in the DB until fixed.
    }
  }
  // --- END NEW LOGIC ---

  // --- 3. PASS DATA TO CLIENT COMPONENT ---
  // Ensure the date object is serialized to a string for the Client Component
  const safeEnquiry = {
    ...updatedEnquiry, // Use the potentially updated enquiry object
    createdAt: updatedEnquiry.createdAt.toISOString(),
    updatedAt: updatedEnquiry.updatedAt.toISOString(),
    // isRead will now be true if it was successfully updated
  };

  return (
    <EnquiryDetailsClient
      enquiry={safeEnquiry}
      currentUser={currentUser}
    />
  );
}

export default EnquiryPage;
// // app/enquiries/[enquiryId]/page.tsx
// import prisma from "@/app/libs/prismadb";
// import { redirect } from "next/navigation";
// import { SafeUser } from "@/app/types"; // Assuming you have a SafeUser type
// import getCurrentUser from "@/app/actions/getCurrentUser";
// import Container from "@/app/components/Container";
// import EnquiryDetailsClient from "./EnquiryDetailsPage";

// // Import the UI component you'll create next
// //import EnquiryDetailsClient from "./EnquiryDetailsClient"; 
// //import getCurrentUser from "@/actions/getCurrentUser"; 
// //import Container from "@/components/Container"; 

// // Define the expected props for the page component (Next.js automatically passes params)
// interface IParams {
//   enquiryId?: string;
// }

// const EnquiryPage = async ({ params }: { params: IParams }) => {
//   const currentUser = await getCurrentUser(); // Assume this fetches the logged-in user

//   if (!currentUser) {
//     return redirect('/denied'); // Security check
//   }

//   // --- 1. FETCH DATA (Server-side) ---
//   const enquiry = await prisma.enquiry.findUnique({
//     where: {
//       id: params.enquiryId,
//     },
//     // You can also select specific fields if you don't need all of them
//     // select: { id: true, first_name: true, last_name: true, ... }
//   });

//   // --- 2. SECURITY & ERROR CHECK ---
//   if (!enquiry) {
//     // Optionally render a custom Not Found page or redirect
//     return (
//         <Container>
//             <div className="text-center py-20">
//                 <h2 className="text-3xl font-bold text-gray-900">Enquiry Not Found</h2>
//                 <p className="text-gray-500 mt-2">The message you are looking for does not exist or may have been deleted.</p>
//             </div>
//         </Container>
//     );
//   }

//   // --- 3. PASS DATA TO CLIENT COMPONENT ---
//   // Ensure the date object is serialized to a string for the Client Component
//   const safeEnquiry = {
//     ...enquiry,
//     createdAt: enquiry.createdAt.toISOString(),
//     updatedAt: enquiry.updatedAt.toISOString(),
//     // Add more fields if they are Date objects
//   };

//   return (
//     // The Client component will handle the interactive UI
//     <EnquiryDetailsClient
//       enquiry={safeEnquiry}
//       currentUser={currentUser}
//     />
//   );
// }

// export default EnquiryPage;