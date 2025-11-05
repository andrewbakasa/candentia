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
import ConfirmAction from "./ConfirmAction";
import { deleteMail, restoreMail, readMail } from "./service";
import { toast } from "sonner";

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

    const handleRead = (action: string) => {
        
        handleReadMail(enquiry.id)
      
    };

     const handleDeleteMail = async (mailId: string) => {
        try {
        await deleteMail(mailId);
        router.refresh();
        //setBoqs(currentBoqs => currentBoqs.filter(boq => boq.id !== boqId));
        toast.success("Mail deleted successfully!");
        router.push("/enquiries", { refresh: true } as any)
        } catch (err: any) {
        toast.error(err.message || "Failed to delete Mail.");
        //setError(err.message);
        }
    };

    const handleRestoreMail = async (mailId: string) => {
        try {
        await restoreMail(mailId);
         router.refresh();
        //setBoqs(currentBoqs => currentBoqs.filter(boq => boq.id !== boqId));
        toast.success("Mail restored successfully!");
        router.push("/archivedEnquiries", { refresh: true } as any)
        } catch (err: any) {
        toast.error(err.message || "Failed to restore Mail.");
        //setError(err.message);
        }
    };

    
    const handleReadMail = async (mailId: string) => {
        try {
        await readMail(mailId);
        router.refresh();
        //setBoqs(currentBoqs => currentBoqs.filter(boq => boq.id !== boqId));
        toast.success("Mail read successfully!");
        router.push("/enquiries", { refresh: true } as any)
        } catch (err: any) {
        toast.error(err.message || "Failed to read Mail.");
        //setError(err.message);
        }
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
                       
                      
                         <ConfirmAction
                            onConfirm={handleRestoreMail}
                            itemId={enquiry.id}
                            action="Restore"
                            heading={`Restore ${enquiry.category}`}
                            description="Are you sure you want to archive this Mail? This action cannot be undone and will remove all associated BOQ items."
                        />
                       

                         {/* ConfirmAction for Deleting Mail */}
                        <ConfirmAction
                            onConfirm={handleDeleteMail}
                            itemId={enquiry.id}
                            action="Delete"
                            heading={`Delete ${enquiry.category}`}
                            description="Are you sure you want to delete this Mail? This action cannot be undone and will remove all associated BOQ items."
                        />
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