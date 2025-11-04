// Inside ./_components/EnquiryRow.tsx (Assumed Structure)

import { Enquiry } from '@prisma/client';
import { cn } from '@/lib/utils'; // Assuming cn utility is used
import { format } from 'date-fns';

interface EnquiryRowProps {
    record: Enquiry & { isRead: boolean };
    onClick: (id: string) => void;
}

const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick }) => {
    
    // --- Key Styling Logic ---
    const isUnread = !record.isRead;

    // Apply bold font and darker color for unread messages
    const fontStyle = cn(
        "truncate", // Ensure text doesn't overflow
        isUnread ? "font-bold text-gray-900" : "font-normal text-gray-700"
    );
    // -------------------------

    return (
        <div 
            onClick={() => onClick(record.id)}
            className={cn(
                "p-2 sm:p-3 border-b hover:bg-gray-50 cursor-pointer transition flex items-start space-x-3",
                // Optional: Apply a slightly different background to the entire row if unread
                isUnread ? "bg-gray-100/50" : "bg-white"
            )}
        >
            
            {/* 1. Sender/Name Column */}
            <div className="flex-shrink-0 w-1/4 sm:w-1/5 min-w-0">
                {/* Apply conditional font style here for the sender name */}
                <p className={fontStyle}>
                    {record.first_name} {record.last_name}
                </p>
            </div>

            {/* 2. Subject/Preview Column */}
            <div className="flex-grow min-w-0 flex items-center justify-between">
                <div className="truncate pr-4 min-w-0">
                    {/* Apply conditional font style here for the message preview */}
                    <span className={cn(fontStyle, "mr-2")}>
                        {/* Placeholder for Subject/Title (using first 30 chars of message) */}
                        {record.message.substring(0, 30)}{record.message.length > 30 ? '...' : ''}
                    </span>
                    <span className="text-sm text-gray-500 hidden sm:inline">
                         — {record.message.substring(0, 70)}{record.message.length > 70 ? '...' : ''}
                    </span>
                </div>
                
                {/* 3. Date Column (Right side, light color) */}
                <div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(record.createdAt), 'MMM d')}
                </div>
            </div>
        </div>
    );
}

export default EnquiryRow;