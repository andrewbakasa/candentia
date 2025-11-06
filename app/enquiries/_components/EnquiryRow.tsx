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

export default EnquiryRow;