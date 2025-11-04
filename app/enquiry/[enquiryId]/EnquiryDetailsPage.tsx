// app/enquiries/[enquiryId]/EnquiryDetailsClient.tsx
'use client';

import { Enquiry } from "@prisma/client";
import { SafeUser } from "@/app/types";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { FaReply, FaArchive, FaTrashAlt } from "react-icons/fa"; // Added Archive & Trash icons
import { IoArrowBackOutline, IoMailOpenOutline, IoMailOutline } from "react-icons/io5"; // Added Mail icons
import Container from "@/app/components/Container";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class concatenation

// Define the Enquiry type for client-side (dates are stringified)
type SafeEnquiry = Omit<Enquiry, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
    isRead: boolean; // Explicitly ensure isRead is here for UI logic
};

interface EnquiryDetailsClientProps {
    enquiry: SafeEnquiry;
    currentUser: SafeUser;
}

const EnquiryDetailsClient: React.FC<EnquiryDetailsClientProps> = ({
    enquiry,
    currentUser,
}) => {
    const router = useRouter();

    const handleAction = (action: string) => {
        // Placeholder logic for actions
        alert(`Action: ${action} on enquiry ${enquiry.id}`);
        // In a real application, this would call a server action or API route
        // e.g., if action is 'delete', navigate away after successful deletion
    };

    const formattedDate = format(new Date(enquiry.createdAt), 'MMM dd, yyyy, h:mm a');
    
    // Generate simple initials for the avatar placeholder
    //const senderInitials = `${enquiry.first_name[0]}${enquiry.last_name[0]}`.toUpperCase();
    const senderInitials = `${enquiry.first_name?.[0] ?? ''}${enquiry.last_name?.[0] ?? ''}`.toUpperCase();
    return (
        <Container>
            {/* Main Content Card - Removed mt-4 to let content hug the top */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[80vh] flex flex-col">
                
                {/* 1. Sticky Action Bar / Navigation */}
                <div className="sticky top-0 bg-white z-20 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 shadow-sm">
                    
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center p-2 rounded-full text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        title="Back to Inbox"
                    >
                        <IoArrowBackOutline className="w-5 h-5 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Back to Inbox</span>
                    </button>
                    
                    {/* Action Buttons (Right Side) */}
                    <div className="flex space-x-2">
                        
                        {/* Mark Read/Unread Toggle */}
                        <button
                            onClick={() => handleAction(enquiry.isRead ? 'Mark as Unread' : 'Mark as Read')}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
                            title={enquiry.isRead ? 'Mark as Unread' : 'Mark as Read'}
                        >
                            {enquiry.isRead ? (
                                <IoMailOutline className="w-5 h-5" />
                            ) : (
                                <IoMailOpenOutline className="w-5 h-5 text-blue-600" />
                            )}
                        </button>

                        {/* Archive */}
                        <button
                            onClick={() => handleAction('Archive')}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition hidden sm:block"
                            title="Archive"
                        >
                            <FaArchive className="w-5 h-5" />
                        </button>
                        
                        {/* Delete */}
                        <button
                            onClick={() => handleAction('Delete')}
                            className="p-2 rounded-full text-red-500 hover:bg-gray-100 transition"
                            title="Delete"
                        >
                             <FaTrashAlt className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. Message Header & Sender Info */}
                <div className="p-4 sm:p-6 flex-grow border-b">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                         Enquiry from {enquiry.first_name} {enquiry.last_name}
                    </h1>
                    
                    <div className="flex items-start space-x-3 sm:space-x-4">
                        
                        {/* Avatar Placeholder */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                            {senderInitials}
                        </div>

                        {/* Sender Details */}
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 truncate">
                                    {enquiry.first_name} {enquiry.last_name}
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:inline-block">
                                    &lt;{enquiry.email}&gt;
                                </span>
                                
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-0.5">
                                Received: {formattedDate}
                                {enquiry.isRead ? (
                                    <span className="ml-2 text-green-600 font-medium hidden md:inline">
                                        (Read)
                                    </span>
                                ) : (
                                    <span className="ml-2 text-red-600 font-medium">
                                        (Unread)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Message Body */}
                {/* Use flex-grow on the content wrapper if you want the footer reply to stick to the bottom */}
                <div className="flex-grow p-4 sm:p-6">
                    <div className="prose prose-sm max-w-none text-gray-800">
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {enquiry.message}
                        </p>
                        
                        {enquiry.phone_number && (
                            <p className="mt-6 pt-3 border-t border-dashed text-sm text-gray-600">
                                <span className="font-semibold">Contact Phone:</span> 
                                <a href={`tel:${enquiry.phone_number}`} className="ml-2 text-blue-600 hover:underline">
                                    {enquiry.phone_number}
                                </a>
                            </p>
                        )}
                        {enquiry.email && (
                            <p className="pt-1 text-sm text-gray-600">
                                <span className="font-semibold">Email:</span> 
                                <a href={`mailto:${enquiry.email}`} className="ml-2 text-blue-600 hover:underline">
                                    {enquiry.email}
                                </a>
                            </p>
                        )}
                    </div>
                </div>
                
                {/* 4. Footer Reply Action */}
                <div className="p-4 sm:p-6 border-t flex space-x-3 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={() => handleAction('Reply')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition shadow-md"
                    >
                        <FaReply className="w-4 h-4 mr-2" />
                        Reply to {enquiry.first_name}
                    </button>

                    <button
                        onClick={() => handleAction('Archive')}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition"
                    >
                        <FaArchive className="w-4 h-4 mr-2" />
                        Archive
                    </button>
                </div>
            </div>
        </Container>
    );
};

export default EnquiryDetailsClient;
// // app/enquiries/[enquiryId]/EnquiryDetailsClient.tsx
// 'use client';

// import { Enquiry } from "@prisma/client"; // Assuming Enquiry is your Prisma Model
// import { SafeUser } from "@/app/types"; // Your existing SafeUser type
// //import Container from "@/components/Container";
// //import Heading from "@/components/Heading";
// import { format } from 'date-fns';
// import { useRouter } from "next/navigation";
// import { FaReply } from "react-icons/fa";
// import { IoArrowBackOutline } from "react-icons/io5";
// import Container from "@/app/components/Container";

// // Define the Enquiry type for client-side (dates are stringified)
// type SafeEnquiry = Omit<Enquiry, "createdAt" | "updatedAt"> & {
//     createdAt: string;
//     updatedAt: string;
//     // Add any other fields that are Date objects and need string serialization
// };

// interface EnquiryDetailsClientProps {
//   enquiry: SafeEnquiry;
//   currentUser: SafeUser;
// }

// const EnquiryDetailsClient: React.FC<EnquiryDetailsClientProps> = ({
//   enquiry,
//   currentUser,
// }) => {
//   const router = useRouter();

//   // Handler for actions, e.g., marking as read/unread
//   const handleMarkAsRead = async () => {
//       // Logic to call a Server Action or API route to update the isRead status
//       // You would likely have a function like updateEnquiryStatus({ id: enquiry.id, isRead: true })
//       // For now, we'll just log
//       console.log(`Marking enquiry ${enquiry.id} as read...`);
//       // After action: router.refresh() to update data
//   }
  
//   // Example: If the enquiry is currently unread, mark it as read when the page loads
//  if (!enquiry.isRead) {
//       // You might use useEffect here if you want it to happen client-side after render
//       // For a clean server-first approach, the read status should ideally be updated 
//       // by a Server Action or Route Handler called from the page.tsx component 
//       // or by a client-side API call here. 
//       // For simplicity, we'll assume it's handled by a client-side action here for now:
//       // handleMarkAsRead(); 
//   } 

//   const formattedDate = format(new Date(enquiry.createdAt), 'MMM dd, yyyy, h:mm a');

//   return (
//     <Container>
//         <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm mt-4">
            
//             {/* Action Bar / Navigation */}
//             <div className="flex items-center justify-between border-b pb-3 mb-4 sticky top-0 bg-white z-10">
//                 <button
//                     onClick={() => router.back()}
//                     className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition"
//                 >
//                     <IoArrowBackOutline className="w-5 h-5 mr-1" />
//                     Back to Inbox
//                 </button>
                
//                 <div className="flex space-x-2">
//                     {/* Placeholder for Reply Button - links to a reply form/modal */}
//                     <button
//                         // Example: Link to your reply/CRM functionality
//                         onClick={() => alert(`Prepare to reply to: ${enquiry.email}`)}
//                         className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
//                         title="Reply"
//                     >
//                          <FaReply className="w-5 h-5" />
//                     </button>
                    
//                     {/* Add more actions here (e.g., Delete, Archive, Mark as Unread) */}
//                 </div>
//             </div>

//             {/* Header (Subject / Sender Info) */}
//             <div className="mb-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-1">
//                     Enquiry from {enquiry.first_name} {enquiry.last_name}
//                 </h1>
                
//                 <div className="text-sm text-gray-500">
//                     <span className="font-semibold text-gray-700">From:</span> {enquiry.first_name} {enquiry.last_name} &lt;{enquiry.email}&gt;
//                 </div>
                
//                 <div className="text-sm text-gray-500">
//                     <span className="font-semibold text-gray-700">Received:</span> {formattedDate}
//                 </div>
//             </div>

//             {/* Message Body */}
//             <div className="prose prose-sm max-w-none text-gray-800 border-t pt-4">
//                 <p className="whitespace-pre-wrap">
//                     {enquiry.message}
//                 </p>
                
//                 {enquiry.phone_number && (
//                     <p className="mt-4 pt-3 border-t border-dashed text-sm text-gray-600">
//                         <span className="font-semibold">Contact Phone:</span> {enquiry.phone_number}
//                     </p>
//                 )}
//             </div>
            
//             {/* Footer Actions (Optional but helpful) */}
//             <div className="mt-8 pt-4 border-t flex space-x-3">
//                  <button
//                     onClick={() => alert(`Prepare to reply to: ${enquiry.email}`)}
//                     className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
//                  >
//                     <FaReply className="w-4 h-4 mr-2" />
//                     Reply
//                  </button>
//             </div>
//         </div>
//     </Container>
//   );
// };

// export default EnquiryDetailsClient;