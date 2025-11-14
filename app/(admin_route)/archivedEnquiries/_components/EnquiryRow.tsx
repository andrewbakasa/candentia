// import { Enquiry } from '@prisma/client';
// import { cn } from '@/lib/utils';
// import { format } from 'date-fns';
// import { Mail, MailOpen, RotateCcw } from 'lucide-react'; // Changed icons for clarity
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import { restoreMail } from '../../archivedEnquiry/[enquiryId]/service';
// import React from 'react'; 
// import ConfirmAction from '@/app/enquiry/[enquiryId]/ConfirmAction';
// import { timeAgo } from '@/app/bp/[id]/_components/utility';
// import { BsDot } from 'react-icons/bs'; // Use a dedicated dot for unread status

// // --- THEME COLORS ---
// const NAVY_BLUE = 'text-[#001F3F]';
// const GOLD_ACCENT = 'text-[#FFD700]';
// const BG_COLOR_UNREAD = 'bg-yellow-50/70'; 
// const HOVER_COLOR = 'hover:bg-gray-100';


// interface EnquiryRowProps {
//     record: Enquiry & { isRead: boolean };
//     onClick: (id: string) => void;
//     itemNum: number;
//     isAdmin: boolean;
// }

// const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick, itemNum, isAdmin }) => {
//     const router = useRouter();
//     const isUnread = !record.isRead;
    
//     // --- STYLES ---
//     const rowClass = cn(
//         "flex items-center p-3 sm:p-4 cursor-pointer transition duration-150 ease-in-out border-b border-gray-100",
//         "min-w-full",
//         isUnread 
//             ? `bg-white ${HOVER_COLOR} text-gray-700 font-semibold border-l-4 border-l-red-500` // Use a strong color (red/yellow) for UNREAD in archived list
//             : `bg-white ${HOVER_COLOR} text-gray-600 font-normal border-l-4 border-l-transparent` 
//     );
    
//     // --- HANDLERS ---
//     const handleRestoreMail = async (mailId: string) => {
//         try {
//             await restoreMail(mailId);
//             router.refresh();
//             toast.success("Mail restored successfully!");
//         } catch (err: any) {
//             toast.error(err.message || "Failed to restore Mail.");
//         }
//     };

//     const stopPropagation = (e: React.MouseEvent) => {
//         e.stopPropagation();
//     };

//     // --- DATE FORMATTING ---
//     const createdAt = new Date(record.createdAt);
//     const timeAgoDisplay = timeAgo(new Date(record.createdAt).toLocaleDateString()); 
//     const fullDate = format(createdAt, 'MMM dd, yyyy HH:mm');

//     return (
//         <div onClick={() => onClick(record.id)} className={rowClass}>
            
//             {/* 1. Item Number & Status Icon (Fixed Width) */}
//             <div className="flex flex-shrink-0 w-8 sm:w-12 items-center mr-2">
//                 {/* Item Number */}
//                 <span className="text-xs font-medium text-gray-400 mr-2 hidden sm:block">
//                     {itemNum}.
//                 </span>
//                 {/* Status Icon (Mail Closed for Unread, Mail Open for Read) */}
//                 <div className="flex-shrink-0">
//                     {isUnread ? (
//                         <BsDot className={`h-6 w-6 ${GOLD_ACCENT} fill-current`} aria-label="Unread message" />
//                     ) : (
//                         <MailOpen className="h-4 w-4 text-gray-400" aria-label="Read message" />
//                     )}
//                 </div>
//             </div>

//             {/* 2. Content (Name and Snippet) - Takes up maximum space */}
//             <div className="flex-grow min-w-0 max-w-sm sm:max-w-md mr-4">
//                 <p className={cn(
//                     "truncate text-base",
//                     isUnread ? `font-extrabold ${NAVY_BLUE}` : "font-semibold text-gray-800"
//                 )}>
//                     {record.first_name} {record.last_name}
//                 </p>
//                 <p className={cn(
//                     "text-sm truncate mt-0.5",
//                     isUnread ? "text-gray-800" : "text-gray-500"
//                 )}>
//                     {record.message}
//                 </p>
//             </div>

//             {/* 3. Date/Time (Mobile/Tablet Visibility) */}
//             <div 
//                 className="flex-shrink-0 ml-2 text-right hidden sm:block"
//                 title={fullDate} 
//             >
//                 <p className={cn(
//                     "text-xs sm:text-sm whitespace-nowrap", 
//                     isUnread ? `font-semibold ${NAVY_BLUE}` : "font-normal text-gray-500"
//                 )}>
//                     {timeAgoDisplay}
//                 </p>
//             </div>
            
//             {/* 4. Restore Action Button (Far Right) */}
//             <div onClick={stopPropagation} className="flex-shrink-0 ml-4">
//                 <ConfirmAction 
//                     onConfirm={handleRestoreMail} 
//                     itemId={record.id}
//                      action="Restore" 
//                     disabled={!isAdmin} 
//                     heading="Restore Mail"
//                     description="This action will restore this mail to the active inbox."
//                     showHint={true}
//                 />
//             </div>
//         </div>
//     );
// };

// export default EnquiryRow;
// // Inside ./_components/EnquiryRow.tsx (Assumed Structure)

import { Enquiry } from '@prisma/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Archive, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { restoreMail } from '../../archivedEnquiry/[enquiryId]/service';
//import ConfirmAction from '../../archivedEnquiry/[enquiryId]/ConfirmAction';
import { revalidatePath } from 'next/cache';
import React from 'react'; // Ensure React is imported for React.FC
import ConfirmAction from '@/app/enquiry/[enquiryId]/ConfirmAction';
import { timeAgo } from '@/app/bp/[id]/_components/utility';

interface EnquiryRowProps {
    record: Enquiry & { isRead: boolean };
    onClick: (id: string) => void;
    itemNum: number;
    isAdmin:boolean;
}

const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick, itemNum, isAdmin }) => {
    const isReadClass = record.isRead ? 'bg-white hover:bg-gray-50 text-gray-600' : 'bg-yellow-50 hover:bg-yellow-100 text-[#001F3F] font-semibold';
    const readStatusIcon = record.isRead ? <Mail className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-[#FFD700] fill-[#FFD700]" />;
    const router =useRouter();
    const handleRestoreMail = async (mailId: string) => {
            try {
            await restoreMail(mailId);
            router.refresh()
           // toast.success("Mail restored successfully!");
            } catch (err: any) {
            toast.error(err.message || "Failed to restore Mail.");
            }
        };

    // New handler to stop event propagation
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            onClick={() => onClick(record.id)}
            className={cn(
                "p-4 cursor-pointer transition duration-150 ease-in-out border-b border-gray-100",
                isReadClass
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-grow">
                    <span>{itemNum}.</span>
                    <div className="hidden sm:block flex-shrink-0">{readStatusIcon}</div>
                    <div className="min-w-0">
                        <p className="text-base truncate">
                                <span className="mr-3"> {/* Added a wrapper span with margin-right (mr-3) */}
                                    {record.first_name} {record.last_name}
                                </span>
                                <span className="text-gray-700 text-xs font-semibold mr-1">
                                    {/* Full Short Date */}
                                    {new Date(record.createdAt).toLocaleDateString(undefined, {
                                        weekday: 'short', 
                                        day: 'numeric',   
                                        month: 'short', 
                                        year: 'numeric',
                                    })}
                                </span>
                                
                                <span className="text-gray-400">|</span> 

                                <span className="text-blue-600 text-xs font-semibold ml-1">
                                    {timeAgo(new Date(record.createdAt).toLocaleDateString())}
                                </span>
                            </p>
                            <p className="text-sm truncate text-gray-500 font-normal mt-0.5">
                            {record.message}
                        </p>
                    </div>
                </div>
                
                {/* 🛑 WRAPPER ADDED TO STOP PROPAGATION 🛑 */}
                <div onClick={stopPropagation} className="flex-shrink-0 ml-4">
                   
                      <ConfirmAction 
                            onConfirm={handleRestoreMail} 
                            itemId={record.id}
                            action="Restore" 
                            disabled={!isAdmin} // Opposite of the main state
                            heading="Restore Mail"
                            description="This action will restore this mail. Press the restore button to continue."
                            showHint={true}
                        />
                </div>
                
            </div>
        </div>
    );
};

export default EnquiryRow;