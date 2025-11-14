import { Enquiry } from '@prisma/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BsDot } from 'react-icons/bs'; 
import { timeAgo } from '@/app/bp/[id]/_components/utility';

// 1. THEME COLORS & UTILITIES
const NAVY_BLUE = 'text-[#001F3F]';
const NAVY_BG = 'bg-[#001F3F]';
const GOLD_ACCENT = 'text-[#FFD700]';

// NEW: Define stronger colors for better contrast
const BG_COLOR_UNREAD = 'bg-yellow-50/70'; // Soft background for unread

interface EnquiryRowProps {
    record: Enquiry & { isRead: boolean };
    onClick: (id: string) => void;
    itemNum: number
}


const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, itemNum, onClick }) => {
    const isUnread = !record.isRead;
    const initials = `${record.first_name?.[0] ?? ''}${record.last_name?.[0] ?? ''}`.toUpperCase();
    
    // Adjusted snippet length for better readability on smaller screens
    const messageSnippet = record.message.substring(0, 70) + (record.message.length > 70 ? '...' : '');

    const createdAt = new Date(record.createdAt);
    const timeAgoDisplay = timeAgo(new Date(record.createdAt).toLocaleDateString()); 

    // Full date for tooltip/title
    const fullDate = format(createdAt, 'MMM dd, yyyy HH:mm');

    return (
        <div
            onClick={() => onClick(record.id)}
            className={cn(
                "flex items-center p-3 sm:p-4 cursor-pointer transition duration-150 ease-in-out border-b border-gray-200", 
                "border-l-4", 
                isUnread
                    ? `font-medium ${BG_COLOR_UNREAD} hover:bg-yellow-100 border-l-[#FFD700] shadow-sm`
                    : "bg-white hover:bg-gray-100 border-l-transparent font-normal text-gray-700"
            )}
        >
            {/* 1. Status Indicator & Item Number (Visible on all sizes) */}
            <div className="flex flex-shrink-0 w-8 sm:w-10 items-center mr-2 sm:mr-4">
                {/* Item Number */}
                <span className="text-xs font-semibold text-gray-400 mr-1 sm:mr-2">
                    {itemNum}.
                </span>
                {/* Status Dot */}
                {isUnread ? (
                    <BsDot className={`h-6 w-6 ${GOLD_ACCENT} fill-current`} aria-label="Unread message" />
                ) : (
                    <span className="w-1 h-1 bg-gray-300 rounded-full" aria-label="Read message"></span>
                )}
            </div>

            {/* 2. Sender Avatar/Initials (Hidden on Mobile) */}
            <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm text-white hidden md:flex mr-4",
                NAVY_BG
            )}>
                {initials}
            </div>

            {/* 3. Content (Name and Snippet) */}
            <div className="flex-grow min-w-0">
                <p className={cn(
                    "truncate text-base",
                    isUnread ? `font-extrabold ${NAVY_BLUE}` : "font-semibold text-gray-800"
                )}>
                    {record.first_name} {record.last_name}
                </p>
                <p className={cn(
                    "text-sm truncate mt-0.5",
                    isUnread ? "text-gray-800" : "text-gray-500"
                )}>
                    {messageSnippet}
                </p>
            </div>

            {/* 4. Date/Time (Right Aligned, now visible on mobile) */}
            <div 
                className="flex-shrink-0 ml-2 text-right" // Removed hidden sm:block
                title={fullDate} // Shows full date on hover
            >
                <p className={cn(
                    "text-xs sm:text-sm whitespace-nowrap", // Smaller text and prevent wrapping on mobile
                    isUnread ? `font-semibold ${NAVY_BLUE}` : "font-normal text-gray-500"
                )}>
                    {/* {timeAgoDisplay} */}
                   
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
            </div>
        </div>
    );
};

export default EnquiryRow;
// import { Enquiry } from '@prisma/client';
// import { cn } from '@/lib/utils';
// import { format } from 'date-fns';
// import { BsDot } from 'react-icons/bs'; // Added a better visual indicator for unread
// import { DotIcon, MailOpenIcon } from 'lucide-react';
// import { timeAgo } from '@/app/bp/[id]/_components/utility';
// // 1. THEME COLORS & UTILITIES
// const NAVY_BLUE = 'text-[#001F3F]';
// const NAVY_BG = 'bg-[#001F3F]';
// const GOLD_ACCENT = 'text-[#FFD700]';
// const GOLD_BORDER = 'border-[#FFD700]';
// interface EnquiryRowProps {
//     record: Enquiry & { isRead: boolean };
//     onClick: (id: string) => void;
//     itemNum:number
// }


// const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, itemNum, onClick }) => {
//     const isUnread = !record.isRead;
//     const initials = `${record.first_name?.[0] ?? ''}${record.last_name?.[0] ?? ''}`.toUpperCase();
//     const messageSnippet = record.message.substring(0, 80) + (record.message.length > 80 ? '...' : '');

//     const date = new Date(record.createdAt);
//     const dateDisplay = date.toLocaleDateString();

//     return (
//         <div
//             onClick={() => onClick(record.id)}
//             className={cn(
//                 "flex items-center p-4 sm:p-5 cursor-pointer transition duration-150 ease-in-out",
//                 "border-l-4", // Always include the border style for consistent layout
//                 isUnread 
//                     ? `bg-white hover:bg-[#FFF8E1] border-l-[#FFD700] shadow-sm` 
//                     : "bg-gray-50 hover:bg-gray-100 border-l-transparent"
//             )}
//         >
//             {/* Read/Unread Status */}
//             {/* <div className="flex-shrink-0 w-6">
//                 <span> {itemNum}. </span>
//                 {isUnread ? (
//                     <DotIcon className="h-4 w-4 text-[#FFD700] fill-current" />
//                 ) : (
//                     <MailOpenIcon className="h-4 w-4 text-gray-400" />
//                 )}
//             </div> */}
//             <div className="flex flex-shrink-0 w-6 items-center">
//                 <span> {itemNum}. </span>
//                 {isUnread ? (
//                     <DotIcon className="h-4 w-4 text-[#FFD700] fill-current" />
//                 ) : (
//                     <MailOpenIcon className="h-4 w-4 text-gray-400" />
//                 )}
//             </div>

//             {/* Content */}
//             <div className="flex-grow min-w-0 flex items-center space-x-4">
//                 {/* Sender Avatar/Initials (Hidden on Mobile) */}
//                 <div className={cn(
//                     "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white hidden md:flex",
//                     NAVY_BG 
//                 )}>
//                     {initials}
//                 </div>

//                 <div className="min-w-0">
//                     <p className={cn(
//                         "font-bold truncate text-base", 
//                         isUnread ? NAVY_BLUE : "text-gray-700"
//                     )}>
//                         {record.first_name} {record.last_name}
//                     </p>
//                     <p className={cn(
//                         "text-sm truncate mt-0.5", 
//                         isUnread ? "text-gray-700" : "text-gray-500"
//                     )}>
//                         {messageSnippet}
//                     </p>
//                 </div>
//             </div>

//             {/* Date */}
//             <div className="flex-shrink-0 ml-4 text-right hidden sm:block">
//                 {/* <p className={cn("text-xs", isUnread ? NAVY_BLUE : "text-gray-500")}>
//                     {dateDisplay}
//                 </p> */}
//                 <span className="text-gray-700 font-semibold mr-1">
//                     {/* Full Short Date */}
//                     {new Date(record.createdAt).toLocaleDateString(undefined, {
//                         weekday: 'short', 
//                         day: 'numeric',   
//                         month: 'short', 
//                         year: 'numeric',
//                     })}
//                 </span>
    
//                 <span className="text-gray-400">|</span> 

//                     <span className="text-blue-600 font-semibold ml-1">
//                     {timeAgo(new Date(record.createdAt).toLocaleDateString())}
//                 </span>
//             </div>
//         </div>
//     );
// };

// export default EnquiryRow;