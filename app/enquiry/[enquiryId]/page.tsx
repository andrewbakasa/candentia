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