// ConfirmAction.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // <--- Make sure Button is imported!
import {
    Scissors,
    Trash2,
    PlusCircle,
    Copy,
    RotateCw,
    Download,
    Layers,
    Undo2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Hint } from '@/app/components/hint';
import { cn } from '@/lib/utils';
import { FaArchive, FaTrashAlt } from 'react-icons/fa';

interface ConfirmActionProps {
    onConfirm: (id: string) => void;
    itemId: string;
    action: 'Read'| 'Archive' |'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore"; // Added 'Restore'
    heading?: string;
    description?: string;
    buttonIcon?: React.ReactNode;
    disabled?: boolean; // Add disabled property, optional
    disabledReason?: string; // NEW: Add a reason for being disabled
    showHint?: boolean;
}


const ConfirmAction: React.FC<ConfirmActionProps> = ({
    onConfirm,
    itemId,
    action,
    heading,
    description,
    buttonIcon,
    disabled = false,
    disabledReason,
    showHint=true
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const actualHeading = heading || `Confirm ${action}`;

    const getActionIcon = () => {
        // IMPORTANT: Ensure consistent icon sizing (h-4 w-4) across all buttons and ConfirmActions
        // Your BOQCard.tsx already uses h-4 w-4 for its direct buttons.
        // And your buttonIcon props for ConfirmAction also use h-4 w-4.
        // So, this lucideIconClasses should also use h-4 w-4 for the default icons.
        const lucideIconClasses = cn(
            "h-5 w-5", // <--- Make sure this is h-4 w-4, not h-5 w-5
            action === 'Delete' ? "text-red-600 hover:text-red-400" :
            action === 'Update' ? "text-blue-600 hover:text-blue-400" :
            action === 'Export' ? "text-purple-600 hover:text-purple-400" :
            action === 'Update Levels' ? "text-indigo-600 hover:text-indigo-400" :
            action === 'Restore' ? "text-green-600 hover:text-green-400" :
            "text-gray-600 hover:text-gray-400"
        );

        // If a custom buttonIcon is provided (e.g., from BOQCard), use it.
        // Otherwise, render the default Lucide icon based on the action.
        return buttonIcon ? buttonIcon : (() => {
            switch (action) {
                case 'Read': return <Scissors className={lucideIconClasses} />;
                case 'Archive': return <FaArchive className={lucideIconClasses} />;
                case 'Detach': return <Scissors className={lucideIconClasses} />;
                case 'Delete': return <FaTrashAlt className={lucideIconClasses} />;
                case 'Add': return <PlusCircle className={lucideIconClasses} />;
                case 'Update': return <RotateCw className={lucideIconClasses} />;
                case 'Clone': return <Copy className={lucideIconClasses} />;
                case 'Export': return <Download className={lucideIconClasses} />;
                case 'Update Levels': return <Layers className={lucideIconClasses} />;
                case 'Restore': return <Undo2 className={lucideIconClasses} />;
              
                default: return null;
            }
        })();
    };
  
    const handleConfirm = () => {
        onConfirm(itemId);
        setIsDialogOpen(false);
    };

    const getActionText = (act: string) => {
        switch (act) {
            case 'Detach': return "Detach";
            case 'Read': return "Read";
            case 'Archive': return "Archive";
            case 'Delete': return "Delete";
            case 'Add': return "Add";
            case 'Clone': return "Clone";
            case 'Update': return "Update";
            case 'Export': return "Export";
            case 'Update Levels': return "Update Levels";
            case 'Restore': return "Restore";
            default: return "Confirm";
        }
    };

    const hintDescription = disabled && disabledReason
        ? disabledReason
        : `Click to ${action.toLowerCase()}`;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
            <DialogTrigger asChild>
               
                 <div
                    className={cn(
                        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    )}
                    onClick={(e) => {
                        if (disabled) {
                            e.stopPropagation();
                            return;
                        }
                        e.stopPropagation();
                        setIsDialogOpen(true);
                    }}
                >
                {showHint? (<Hint sideOffset={2} description={hintDescription}>
                    {/* THIS IS THE KEY CHANGE: Use <Button> here instead of a plain <div> */}
                    <Button
                        variant="ghost" // Match the variant used for your other Buttons in BOQCard.tsx
                        size="icon"   // Match the size used for your other Buttons in BOQCard.tsx
                        disabled={disabled} // Pass the disabled prop directly to the Button
                        // Any additional styling for the button itself can go here if needed.
                        // The text colors are primarily handled by the icon's className from getActionIcon.
                    >
                        {/* The icon element is rendered directly inside the Button */}
                        {getActionIcon()}
                    </Button>
                </Hint>):(<Button
                        variant="ghost" // Match the variant used for your other Buttons in BOQCard.tsx
                        size="icon"   // Match the size used for your other Buttons in BOQCard.tsx
                        disabled={disabled} // Pass the disabled prop directly to the Button
                        // Any additional styling for the button itself can go here if needed.
                        // The text colors are primarily handled by the icon's className from getActionIcon.
                    >
                        {/* The icon element is rendered directly inside the Button */}
                        {getActionIcon()}
                    </Button>)}
                </div>
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "bg-gray-900 text-white border border-gray-800 rounded-lg shadow-lg w-[384px] max-w-md",
                    "md:w-[400px]",
                    "max-h-[60vh] overflow-y-auto"
                )}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">{actualHeading}</DialogTitle>
                    <DialogDescription className="text-gray-400">{description || `Are you sure you want to ${action?.toLocaleLowerCase()} this item?`}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-end sm:gap-2">
                    <Button
                        variant="destructive"
                        className={cn(
                            "text-white w-full sm:w-auto",
                            action === 'Delete' ? "bg-red-500 hover:bg-red-600" :
                            action === 'Update' ? "bg-blue-500 hover:bg-blue-600" :
                            action === 'Export' ? "bg-purple-500 hover:bg-purple-600" :
                            action === 'Update Levels' ? "bg-indigo-500 hover:bg-indigo-600" :
                            action === 'Restore' ? "bg-green-500 hover:bg-green-600" :
                            "bg-gray-500 hover:bg-gray-600"
                        )}
                        onClick={handleConfirm}
                    >
                        {getActionText(action)}
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto"
                        onClick={() => setIsDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmAction;