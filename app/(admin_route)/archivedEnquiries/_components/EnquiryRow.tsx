// Inside ./_components/EnquiryRow.tsx (Assumed Structure)

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

interface EnquiryRowProps {
    record: Enquiry & { isRead: boolean };
    onClick: (id: string) => void;
    isAdmin:boolean;
}

const EnquiryRow: React.FC<EnquiryRowProps> = ({ record, onClick, isAdmin }) => {
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
                    <div className="hidden sm:block flex-shrink-0">{readStatusIcon}</div>
                    <div className="min-w-0">
                        <p className="text-base truncate">
                            {record.first_name} {record.last_name}
                            <span className="text-xs text-gray-500 ml-2 font-normal">{new Date(record.createdAt).toLocaleDateString()}</span>
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