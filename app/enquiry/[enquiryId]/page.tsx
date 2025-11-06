import prisma from "@/app/libs/prismadb";
import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import EnquiryDetailsClient from "./EnquiryDetailsPage";
// Assuming SafeEnquiry is a type defined elsewhere, similar to SafeUser
// import { SafeEnquiry } from "@/app/types"; 

// Define the expected props for the page component (Next.js automatically passes params)
interface IParams {
  enquiryId?: string;
}

const EnquiryPage = async ({ params }: { params: IParams }) => {
  const currentUser = await getCurrentUser(); // currentUser can be null if unlogged

  // WARNING: Removing the authentication check below means that this page
  // is now PUBLICLY accessible. This exposes sensitive enquiry data
  // (names, contact info, messages) to anyone who knows the URL.
  
  // --- 1. AUTHENTICATION & AUTHORIZATION (REMOVED REDIRECT) ---
  // The redirect has been removed to allow unlogged access as requested.
  // The currentUser object will be null for unlogged users.

  const enquiryId = params.enquiryId;
  let enquiry = null;

  // --- 2. FETCH DATA & CONDITIONAL UPDATE (MARK AS READ) ---
  try {
    // 2a. Fetch the enquiry, ensuring it's active (not archived)
    enquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
        active: true,
      },
    });

    // 2b. Conditionally mark as read (Only if authenticated and admin)
    const isAuthorizedToUpdate = currentUser && currentUser.isAdmin;

    if (enquiry && enquiry.isRead === false && isAuthorizedToUpdate) {
      // Update the enquiry object with the new 'isRead: true' status
      enquiry = await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { isRead: true }, // Mark it as read
      });
      // NOTE: Consider adding revalidatePath('/enquiries') here if your list page needs 
      // an immediate cache bust to reflect the new 'read' status badge/count.
    }
  } catch (error) {
    console.error(`[ENQUIRY_PAGE_ERROR] Database error for ID ${enquiryId}:`, error);
    // 'enquiry' will remain null or the original fetched state if the update failed.
  }

  // --- 3. SECURITY & NOT FOUND CHECK ---
  if (!enquiry) {
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Enquiry Not Found</h2>
          <p className="text-gray-500 mt-2">The message you are looking for does not exist, may have been deleted, or is archived.</p>
        </div>
      </Container>
    );
  }

  // --- 4. DATA SERIALIZATION ---
  // Ensure the date objects are serialized to strings before passing to the Client Component
  const safeEnquiry = {
    ...enquiry, // Use the potentially updated enquiry object
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };

  // --- 5. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <EnquiryDetailsClient
        // The type assertion 'as any' is used here to avoid strict type errors 
        // regarding the dates/Prisma object structure when passing to the client.
        enquiry={safeEnquiry as any} 
        currentUser={currentUser} // May be null
      />
    </Container>
  );
}

export default EnquiryPage;

// // app/enquiries/[enquiryId]/page.tsx
// import prisma from "@/app/libs/prismadb";
// import { redirect } from "next/navigation";
// import { SafeUser } from "@/app/types";
// import getCurrentUser from "@/app/actions/getCurrentUser";
// import Container from "@/app/components/Container";
// import EnquiryDetailsClient from "./EnquiryDetailsPage";

// // Define the expected props for the page component (Next.js automatically passes params)
// interface IParams {
//   enquiryId?: string;
// }

// const EnquiryPage = async ({ params }: { params: IParams }) => {
//   const currentUser = await getCurrentUser();

// //   if (!currentUser) {
// //     return redirect('/denied'); // Security check
// //   }

//   // --- 1. FETCH DATA (Server-side) only if not archived ---
//   const enquiry = await prisma.enquiry.findUnique({
//     where: {
//       id: params.enquiryId,
//       active:true
//     },
//   });

//   // --- 2. SECURITY & ERROR CHECK ---
//   if (!enquiry) {
//     return (
//         <Container>
//             <div className="text-center py-20">
//                 <h2 className="text-3xl font-bold text-gray-900">Enquiry Not Found</h2>
//                 <p className="text-gray-500 mt-2">The message you are looking for does not exist or may have been deleted.</p>
//             </div>
//         </Container>
//     );
//   }

//   // --- NEW LOGIC: MARK AS READ ---
//   let updatedEnquiry = enquiry;
  
//   // Check if the enquiry is currently unread
//   if (enquiry.isRead === false) {
//     try {
//         // Use Prisma's update method to set isRead to true
//         updatedEnquiry = await prisma.enquiry.update({
//             where: {
//                 id: enquiry.id,
//             },
//             data: {
//                 isRead: true, // Mark it as read
//             },
//         });
//         // Note: Errors here (like DB connection failure) should be handled
//         // but for a simple read status update, continuing with the original data 
//         // if the update fails is often acceptable, though less ideal.
//     } catch (error) {
//         console.error("Failed to update enquiry status to READ:", error);
//         // Continue rendering the page, but the status remains 'unread' in the DB until fixed.
//     }
//   }
//   // --- END NEW LOGIC ---

//   // --- 3. PASS DATA TO CLIENT COMPONENT ---
//   // Ensure the date object is serialized to a string for the Client Component
//   const safeEnquiry = {
//     ...updatedEnquiry, // Use the potentially updated enquiry object
//     createdAt: updatedEnquiry.createdAt.toISOString(),
//     updatedAt: updatedEnquiry.updatedAt.toISOString(),
//     // isRead will now be true if it was successfully updated
//   };

//   return (
//     <EnquiryDetailsClient
//       enquiry={safeEnquiry}
//       currentUser={currentUser}
//     />
//   );
// }

// export default EnquiryPage;