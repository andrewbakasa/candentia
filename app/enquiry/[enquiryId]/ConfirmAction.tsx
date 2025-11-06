import React, { useState } from 'react';
// Assuming 'Button' is available from shadcn/ui or a similar library
// NOTE: Since I cannot access your actual local components/paths, I'll assume standard imports.
// For demonstration, I will use a simplified structure here, but I will keep your original import paths.

// Note: For this single-file React component to run independently in the canvas, 
// the imported components like Button, Dialog, Hint, and utility functions 
// would typically need to be defined or mocked within this file, 
// but based on your input, I am preserving the component structure as if 
// all imports (like '@/components/ui/button') resolve correctly in your environment.

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
import { FaArchive, FaTrashAlt } from 'react-icons/fa';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Hint } from '@/app/components/hint';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Placeholder/Mock Components for demonstration completeness (Assume they exist in your environment)

const NAVY_BLUE = '#001F3F';
const GOLD_ACCENT = '#FFD700';


interface ConfirmActionProps {
    onConfirm: (id: string) => void;
    itemId: string;
    action: 'Read'| 'Archive' |'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore"; 
    heading?: string;
    description?: string;
    buttonIcon?: React.ReactNode;
    disabled?: boolean;
    disabledReason?: string;
    showHint?: boolean;
    triggerButton?: React.ReactNode; 
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
    showHint=true,
    triggerButton
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const actualHeading = heading || `Confirm ${action}`;

    // --- Dynamic Icon Calculation ---
    const getActionIcon = () => {
        const lucideIconClasses = cn(
            "h-4 w-4 transition duration-150", 
            action === 'Delete' ? "text-red-500 hover:text-red-400" :
            action === 'Archive' ? `text-[${NAVY_BLUE}] hover:text-gray-500` :
            action === 'Restore' ? "text-green-500 hover:text-green-400" :
            `text-[${NAVY_BLUE}] hover:text-gray-500`
        );

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
            case 'Detach': 
            case 'Read': 
            case 'Archive': 
            case 'Delete': 
            case 'Add': 
            case 'Clone': 
            case 'Update': 
            case 'Export': 
            case 'Update Levels': 
            case 'Restore': return act;
            default: return "Confirm";
        }
    };

    const hintDescription = disabled && disabledReason
        ? disabledReason
        : `Click to ${action.toLowerCase()}`;

    // Conditional styling for the Confirmation Button
    const getConfirmButtonStyles = (act: string) => {
        // Red for Delete (high danger)
        if (act === 'Delete') {
            return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
        }
        // Gold for Restore/Add (Positive actions)
        if (act === 'Restore' || act === 'Add' || act === 'Clone') {
            return `bg-[${GOLD_ACCENT}] text-[${NAVY_BLUE}] font-bold hover:bg-yellow-400 focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
        }
        // Navy Blue for other actions (Neutral/Standard)
        return `bg-[${NAVY_BLUE}] text-white font-semibold hover:bg-[#0a3154] focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
            <DialogTrigger asChild>
                {/* If a custom trigger button is provided */}
                {triggerButton ? (
                    <div onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) setIsDialogOpen(true);
                    }}>
                        {/* Clone the triggerButton and pass necessary props */}
                        {React.cloneElement(triggerButton as React.ReactElement, {
                            disabled: disabled,
                            onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!disabled) setIsDialogOpen(true);
                            }
                        })}
                    </div>
                ) : (
                    // Default behavior: Button with Hint
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
                    {showHint ? (
                        <Hint sideOffset={2} description={hintDescription}>
                            <Button
                                variant="ghost" 
                                size="icon"   
                                disabled={disabled} // Already controls the trigger button
                            >
                                {getActionIcon()}
                            </Button>
                        </Hint>
                    ) : (
                        <Button
                            variant="ghost" 
                            size="icon"   
                            disabled={disabled} // Already controls the trigger button
                        >
                            {getActionIcon()}
                        </Button>
                    )}
                    </div>
                )}
            </DialogTrigger>
            <DialogContent
                className={cn(
                    `bg-gray-950 text-white border-t-4 border-[${GOLD_ACCENT}] rounded-xl shadow-2xl w-[384px] max-w-md p-6`,
                    "md:w-[400px]",
                    "max-h-[60vh] overflow-y-auto"
                )}
            >
                <DialogHeader>
                    <DialogTitle className={cn("text-2xl font-bold", `text-[${GOLD_ACCENT}]`)}>{actualHeading}</DialogTitle>
                    <DialogDescription className="text-gray-300 pt-2">{description || `Are you sure you want to ${action?.toLocaleLowerCase()} this item? This action may be irreversible.`}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-3 pt-6 sm:flex-row-reverse sm:justify-end sm:gap-3">
                    <Button
                        // Apply dynamic corporate colors based on action type
                        className={cn(
                            "text-white w-full sm:w-auto font-bold transition duration-200",
                            getConfirmButtonStyles(action)
                        )}
                        onClick={handleConfirm}
                        disabled={disabled} // ⬅️ NEW: The confirmation button is now controlled by the 'disabled' prop.
                    >
                        {getActionText(action)}
                    </Button>
                    <Button
                        variant="secondary"
                        // Make Cancel button match the dark corporate theme
                        className={cn(
                            `bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto font-medium transition duration-200`,
                            `focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2 focus:ring-offset-gray-950`
                        )}
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