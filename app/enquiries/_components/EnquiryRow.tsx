// EnquiryRow.tsx - Designed to look like a single email in an inbox

import { Enquiry } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface EnquiryRowProps {
  record: Enquiry & { isRead: boolean }; // Assuming the enquiry object has an isRead status
  // Add an action handler if clicking the row should open the full enquiry
  onClick: (id: string) => void; 
}

const EnquiryRow: React.FC<EnquiryRowProps> = ({ 
  record, 
  onClick 
}) => {
  // Determine font weight based on read status
  const fontWeightClass = record.isRead ? 'font-normal text-gray-700' : 'font-bold text-gray-900';
  
  // Format the date to look clean (e.g., '10:30 AM' for today, or 'Oct 25' for older)
  const dateToDisplay = format(record.createdAt, 'MMM dd'); 
  
  // Create a snippet from the message body
  const messageSnippet = record.message.length > 80 
    ? record.message.substring(0, 80) + '...'
    : record.message;

  return (
    // The main container for the row
    <div 
      onClick={() => onClick(record.id)}
      className={cn(
        "flex items-center p-3 sm:pl-4 sm:pr-4 cursor-pointer border-b border-gray-100 transition-colors duration-150",
        "bg-white hover:bg-gray-100"
      )}
    >
      
      {/* 1. Checkbox/Select Area (Placeholder - often uses a small icon/checkbox) */}
      <div className="flex-shrink-0 w-8 pr-2">
          {/* Using a simple placeholder circle/dot for visual spacing */}
          <div className="w-2 h-2 rounded-full bg-gray-300 mx-auto"></div> 
      </div>

      {/* 2. Sender Name */}
      <div className={cn("flex-shrink-0 w-32 md:w-40 truncate", fontWeightClass)}>
        {record.first_name} {record.last_name}
      </div>

      {/* 3. Subject/Message Snippet */}
      <div className="flex-grow min-w-0 pr-4">
        <span className={cn("truncate", fontWeightClass)}>
          {/* Treat the first few words as 'subject' (bold if unread) */}
          {record.message.split(' ').slice(0, 5).join(' ')} 
        </span>
        <span className="text-gray-500 font-normal">
          &nbsp;— {messageSnippet}
        </span>
      </div>

      {/* 4. Date/Time */}
      <div className="flex-shrink-0 w-16 text-right text-xs text-gray-500">
        {dateToDisplay}
      </div>

    </div>
  );
};

export default EnquiryRow;