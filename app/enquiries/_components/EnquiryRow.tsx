// Inside ./_components/EnquiryRow.tsx

import { Enquiry } from '@prisma/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BsDot } from 'react-icons/bs'; // Added a better visual indicator for unread
import { DotIcon, MailOpenIcon } from 'lucide-react';
// 1. THEME COLORS & UTILITIES
const NAVY_BLUE = 'text-[#001F3F]';
const NAVY_BG = 'bg-[#001F3F]';
const GOLD_ACCENT = 'text-[#FFD700]';
const GOLD_BORDER = 'border-[#FFD700]';
interface EnquiryRowProps {
    record: Enquiry & { isRead: boolean };
    onClick: (id: string) => void;
}

// const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick }) => {
//     // Define custom Tailwind classes (assuming they are in tailwind.config.js)
//     const NAVY_BLUE = 'text-[#001F3F]';
//     const GOLD_ACCENT = 'text-[#FFD700]';
//     const LIGHT_GRAY = 'bg-[#F9F9F9]';

//     const isUnread = !record.isRead;
    
//     // Apply bold font and Navy Blue for unread messages
//     const fontStyle = cn(
//         "truncate",
//         isUnread ? `font-bold ${NAVY_BLUE}` : "font-normal text-gray-700"
//     );

//     return (
//         <div 
//             onClick={() => onClick(record.id)}
//             className={cn(
//                 "p-3 sm:p-4 border-b border-gray-200 cursor-pointer transition flex items-start space-x-4",
//                 "hover:bg-gray-100", // Soft hover for corporate look
//                 isUnread ? LIGHT_GRAY : "bg-white" // Subtle background for unread rows
//             )}
//         >
            
//             {/* Unread Indicator (Dot) */}
//             <div className="flex-shrink-0 pt-1">
//                 {isUnread ? (
//                     <BsDot className={cn("h-6 w-6", GOLD_ACCENT)} /> // Prominent gold dot for unread
//                 ) : (
//                     <div className="h-4 w-4 mr-2" /> // Spacer for alignment
//                 )}
//             </div>

//             {/* 1. Sender/Name Column */}
//             <div className="flex-shrink-0 w-24 sm:w-32 min-w-0">
//                 <p className={fontStyle}>
//                     {record.first_name} {record.last_name}
//                 </p>
//             </div>

//             {/* 2. Subject/Preview Column */}
//             <div className="flex-grow min-w-0 flex items-center justify-between">
//                 <div className="truncate pr-4 min-w-0">
//                     <span className={cn(fontStyle, "mr-2")}>
//                         {/* Use the first part of the message as a 'subject' */}
//                         **{record.message.substring(0, 30)}{record.message.length > 30 ? '...' : ''}**
//                     </span>
//                     <span className="text-sm text-gray-500 hidden md:inline">
//                           — {record.message.substring(30, 80)}{record.message.length > 80 ? '...' : ''}
//                     </span>
//                 </div>
                
//                 {/* 3. Date Column (Right side, light color) */}
//                 <div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap pl-4">
//                     {format(new Date(record.createdAt), 'MMM d, yyyy')}
//                 </div>
//             </div>
//         </div>
//     );
// }

// Mock EnquiryRow (Enhanced for UI)
const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick }) => {
    const isUnread = !record.isRead;
    const initials = `${record.first_name?.[0] ?? ''}${record.last_name?.[0] ?? ''}`.toUpperCase();
    const messageSnippet = record.message.substring(0, 80) + (record.message.length > 80 ? '...' : '');

    const date = new Date(record.createdAt);
    const dateDisplay = date.toLocaleDateString();

    return (
        <div
            onClick={() => onClick(record.id)}
            className={cn(
                "flex items-center p-4 sm:p-5 cursor-pointer transition duration-150 ease-in-out",
                "border-l-4", // Always include the border style for consistent layout
                isUnread 
                    ? `bg-white hover:bg-[#FFF8E1] border-l-[#FFD700] shadow-sm` 
                    : "bg-gray-50 hover:bg-gray-100 border-l-transparent"
            )}
        >
            {/* Read/Unread Status */}
            <div className="flex-shrink-0 w-6">
                {isUnread ? (
                    <DotIcon className="h-4 w-4 text-[#FFD700] fill-current" />
                ) : (
                    <MailOpenIcon className="h-4 w-4 text-gray-400" />
                )}
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0 flex items-center space-x-4">
                {/* Sender Avatar/Initials (Hidden on Mobile) */}
                <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white hidden md:flex",
                    NAVY_BG 
                )}>
                    {initials}
                </div>

                <div className="min-w-0">
                    <p className={cn(
                        "font-bold truncate text-base", 
                        isUnread ? NAVY_BLUE : "text-gray-700"
                    )}>
                        {record.first_name} {record.last_name}
                    </p>
                    <p className={cn(
                        "text-sm truncate mt-0.5", 
                        isUnread ? "text-gray-700" : "text-gray-500"
                    )}>
                        {messageSnippet}
                    </p>
                </div>
            </div>

            {/* Date */}
            <div className="flex-shrink-0 ml-4 text-right hidden sm:block">
                <p className={cn("text-xs", isUnread ? NAVY_BLUE : "text-gray-500")}>
                    {dateDisplay}
                </p>
            </div>
        </div>
    );
};

export default EnquiryRow;// // Inside ./_components/EnquiryRow.tsx (Assumed Structure)