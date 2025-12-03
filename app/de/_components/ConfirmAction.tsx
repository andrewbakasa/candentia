import React, { useState } from 'react';
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
import { FaArchive } from 'react-icons/fa'; // FaTrashAlt was unused, so removed for cleanliness
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Hint } from '@/app/components/hint';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAVY_BLUE = '#001F3F';
const GOLD_ACCENT = '#FFD700';


interface ConfirmActionProps {
    onConfirm: (id: string) => void;
    itemId: string;
    action: 'Read' | 'Archive' | 'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore";
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
    showHint = true,
    triggerButton
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const actualHeading = heading || `Confirm ${action}`;

    // --- Dynamic Icon Calculation ---
    const getActionIcon = () => {
        // NOTE: Dynamic Tailwind classes defined with template literals like `text-[${NAVY_BLUE}]`
        // should be added to your `tailwind.config.js` safelist or they won't be generated.
        // For demonstration, we'll keep the template literal usage as in the original code.
        const lucideIconClasses = cn(
            "h-5 w-5 transition duration-150", 
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
                case 'Delete': return <Trash2 className={lucideIconClasses} />;
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
        if (act === 'Delete') {
            return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
        }
        if (act === 'Restore' || act === 'Add' || act === 'Clone') {
            return `bg-[${GOLD_ACCENT}] text-[${NAVY_BLUE}] font-bold hover:bg-yellow-400 focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
        }
        return `bg-[${NAVY_BLUE}] text-white font-semibold hover:bg-[#0a3154] focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
            <DialogTrigger asChild>
                {/* *** FIX FOR React.Children.only ERROR ***
                The DialogTrigger must only have ONE immediate child element.
                We use the ternary operator to return exactly one element: 
                - If triggerButton is provided: a wrapper <div> containing the cloned element.
                - Otherwise: a wrapper <div> containing the default Button/Hint logic.
                */}
                {triggerButton ? (
                    <div 
                        // The click handler goes on the wrapper to stop propagation reliably
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) setIsDialogOpen(true);
                        }}
                    >
                        {/* Clone the triggerButton, applying disabled state and ensuring 
                        the click action opens the dialog. 
                        */}
                        {React.cloneElement(triggerButton as React.ReactElement, {
                            disabled: disabled,
                            // Override or augment the child's onClick
                            onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!disabled) setIsDialogOpen(true);
                                
                                // Call original onClick if it exists on the triggerButton props
                                const originalOnClick = (triggerButton as any).props?.onClick;
                                if (typeof originalOnClick === 'function') {
                                    originalOnClick(e);
                                }
                            }
                        })}
                    </div>
                ) : (
                    // Default behavior: Button with Hint
                    <div
                        className={cn(
                            'w-6 h-6 flex-shrink-0',
                            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) setIsDialogOpen(true);
                        }}
                    >
                        {showHint ? (
                            <Hint sideOffset={2} description={hintDescription}>
                                <Button
                                    variant="ghost" 
                                    size="icon"   
                                    disabled={disabled}
                                    className="w-6 h-6" 
                                >
                                    {getActionIcon()}
                                </Button>
                            </Hint>
                        ) : (
                            <Button
                                variant="ghost" 
                                size="icon"   
                                disabled={disabled}
                                className="w-6 h-6" 
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
                        className={cn(
                            "text-white w-full sm:w-auto font-bold transition duration-200",
                            getConfirmButtonStyles(action)
                        )}
                        onClick={handleConfirm}
                        disabled={disabled}
                    >
                        {getActionText(action)}
                    </Button>
                    <Button
                        variant="secondary"
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