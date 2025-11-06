// app/enquiries/[enquiryId]/EnquiryDetailsClient.tsx
'use client';

import { Enquiry } from "@prisma/client";
import { SafeUser } from "@/app/types";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { FaReply, FaArchive, FaTrashAlt } from "react-icons/fa"; 
import { IoArrowBackOutline, IoMailOpenOutline, IoMailOutline } from "react-icons/io5"; 
import Container from "@/app/components/Container";
import { cn } from "@/lib/utils"; 
//import ConfirmAction from "./ConfirmAction"; // Assuming this is styled separately
import { deleteMail, restoreMail, readMail } from "./service";
import { toast } from "sonner";
import { BsDot } from "react-icons/bs"; // For a subtle unread indicator
import ConfirmAction from "@/app/enquiry/[enquiryId]/ConfirmAction";

// Define custom Tailwind classes (assuming they are in tailwind.config.js)
const NAVY_BLUE = 'text-[#001F3F]';
const NAVY_BG = 'bg-[#001F3F]';
const NAVY_HOVER_BG = 'hover:bg-[#0a3154]';
const GOLD_ACCENT = 'text-[#FFD700]';
const GOLD_BORDER = 'border-[#FFD700]';
const GOLD_HOVER_BG = 'hover:bg-[#FFF8E1]';
const GOLD_ICON = 'text-[#FFD700]';


// Define the Enquiry type for client-side (dates are stringified)
type SafeEnquiry = Omit<Enquiry, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
    isRead: boolean; 
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

    // --- Action Handlers (Kept unchanged for functionality) ---

    

    const handleRead = (action: string) => {
        handleReadMail(enquiry.id)
    };

  
        // --- Authorization Flags ---
        const isLoggedIn = !!currentUser;
        const isAdmin = currentUser?.isAdmin;
    
        // --- Action Handlers with Guards ---
    
        const handleAction = (action: string) => {
            // Placeholder for actions like Reply (which generates a mailto link)
            if (action === 'Reply') {
                window.location.href = `mailto:${enquiry.email}?subject=Re: Your Enquiry`;
            } else {
                 toast.info(`Action: ${action} on enquiry ${enquiry.id}`);
            }
        };
    
        const handleReadMail = async (mailId: string) => {
            if (!isLoggedIn) {
                toast.error("You must be logged in to change the read status.");
                return;
            }
            try {
                await readMail(mailId);
                // toast.success("Mail read status updated successfully!");
                router.refresh(); 
                // Optional: router.push("/enquiries", { refresh: true } as any) if list needs updating
            } catch (err: any) {
                toast.error(err.message || "Failed to update read status.");
            }
        };
    
    
        const handleDeleteMail = async (mailId: string) => {
            if (!isAdmin) {
                toast.error("You must be an administrator to delete mail permanently.");
                return;
            }
            try {
                await deleteMail(mailId);
                
                // toast.success("Mail deleted successfully!");
                router.push("/archivedEnquiries", { refresh: true } as any)
                router.refresh();
            } catch (err: any) {
                toast.error(err.message || "Failed to delete Mail.");
            }
        };

        
        const handleRestoreMail = async (mailId: string) => {

             if (!isAdmin) {
                toast.error("You must be an administrator to restore archived mail.");
                return;
            }
            try {
                await restoreMail(mailId);

                router.push("/archivedEnquiries", { refresh: true } as any)
                router.refresh();
                } catch (err: any) {
                toast.error(err.message || "Failed to restore Mail.");
            }
        };


    // --- Formatting ---
    const formattedDate = format(new Date(enquiry.createdAt), 'MMM dd, yyyy, h:mm a');
    const senderInitials = `${enquiry.first_name?.[0] ?? ''}${enquiry.last_name?.[0] ?? ''}`.toUpperCase();

    // --- Common Button Style for the Action Bar ---
    const actionButtonClasses = "p-2 rounded-lg transition text-gray-700 hover:bg-gray-100";
    
    return (
        <Container>
            {/* Main Content Card with subtle shadow/border */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg min-h-[80vh] flex flex-col">
                
                {/* 1. Sticky Action Bar / Navigation - Navy/Gold Accent */}
                <div className={cn(
                    "sticky top-0 bg-white z-20 flex items-center justify-between p-3 sm:p-4 border-b-2 shadow-sm",
                    GOLD_BORDER // Accent border for corporate feel
                )}>
                    
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        // Navy text for primary action
                        className={cn("flex items-center p-2 rounded-lg transition text-sm font-medium", NAVY_BLUE, "hover:bg-gray-100")}
                        title="Back to Inbox"
                    >
                        <IoArrowBackOutline className="w-5 h-5 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Back to Inbox</span>
                    </button>
                    
                    {/* Action Buttons (Right Side) */}
                    <div className="flex space-x-2">
                           <ConfirmAction 
                                onConfirm={handleDeleteMail} 
                                itemId={enquiry.id}
                                action="Delete" 
                                disabled={!isLoggedIn}
                                disabledReason={'Cannot delete active items'}
                                heading="Permanent Deletion"
                                description="This item will be permanently removed from the system. This action cannot be undone."
                                showHint={true}
                            />
                            <ConfirmAction 
                                onConfirm={handleRestoreMail} 
                                itemId={enquiry.id}
                                action="Restore" 
                                disabled={!isAdmin} // Opposite of the main state
                                heading="Restore Mail"
                                description="This action will restore this mail. Press the restore button to continue."
                            />
                    </div>
                </div>

                {/* 2. Message Header & Sender Info - Clear Hierarchy */}
                <div className="p-4 sm:p-6 flex-grow border-b">
                    <h1 className={cn("text-xl sm:text-2xl font-bold mb-4", NAVY_BLUE)}>
                        Enquiry from {enquiry.first_name} {enquiry.last_name}
                    </h1>
                    
                    <div className="flex items-start space-x-4">
                        
                        {/* Avatar Placeholder - Navy BG, White Text */}
                        <div className={cn(
                            "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-lg text-white",
                            NAVY_BG 
                        )}>
                            {senderInitials}
                        </div>

                        {/* Sender Details */}
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center space-x-2">
                                <span className={cn("font-bold truncate", NAVY_BLUE)}>
                                    {enquiry.first_name} {enquiry.last_name}
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:inline-block">
                                    &lt;{enquiry.email}&gt;
                                </span>
                                
                            </div>
                            
                            <div className="text-sm text-gray-500 mt-0.5 flex items-center">
                                Received: {formattedDate}
                                {!enquiry.isRead && (
                                    <span className={cn("ml-2 font-bold flex items-center", GOLD_ACCENT)}>
                                        <BsDot className="w-6 h-6 -ml-2"/> UNREAD
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Message Body - Standard Content */}
                <div className="flex-grow p-4 sm:p-6">
                    <div className="prose prose-sm max-w-none text-gray-800">
                        <p className="whitespace-pre-wrap leading-relaxed text-base">
                            {enquiry.message}
                        </p>
                        
                        {/* Contact Info (Styled) */}
                        <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-sm">
                            {enquiry.phone_number && (
                                <p className="pt-1 text-gray-700">
                                    <span className={cn("font-bold mr-2", NAVY_BLUE)}>Contact Phone:</span> 
                                    <a href={`tel:${enquiry.phone_number}`} className="ml-1 text-blue-600 hover:underline">
                                        {enquiry.phone_number}
                                    </a>
                                </p>
                            )}
                            {enquiry.email && (
                                <p className="pt-1 text-gray-700">
                                    <span className={cn("font-bold mr-2", NAVY_BLUE)}>Email:</span> 
                                    <a href={`mailto:${enquiry.email}`} className="ml-1 text-blue-600 hover:underline">
                                        {enquiry.email}
                                    </a>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* 4. Footer Reply Action - Navy/Gold Primary Button */}
                <div className="p-4 sm:p-6 border-t flex space-x-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={() => handleAction('Reply')}
                        // Primary corporate action button: Navy BG, Gold Icon
                        className={cn(
                            "flex items-center px-6 py-2.5 text-white text-base font-semibold rounded-lg transition shadow-md",
                            NAVY_BG, NAVY_HOVER_BG, "focus:ring-2 focus:ring-gold focus:ring-offset-2"
                        )}
                    >
                        <FaReply className={cn("w-5 h-5 mr-2", GOLD_ICON)} /> 
                        Reply to {enquiry.first_name}
                    </button>

                   
                </div>
            </div>
        </Container>
    );
};

export default EnquiryDetailsClient;