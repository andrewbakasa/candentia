// import React, { useState } from 'react';
// // Assuming 'Button' is available from shadcn/ui or a similar library
// // NOTE: Since I cannot access your actual local components/paths, I'll assume standard imports.
// // For demonstration, I will use a simplified structure here, but I will keep your original import paths.

// // Note: For this single-file React component to run independently in the canvas, 
// // the imported components like Button, Dialog, Hint, and utility functions 
// // would typically need to be defined or mocked within this file, 
// // but based on your input, I am preserving the component structure as if 
// // all imports (like '@/components/ui/button') resolve correctly in your environment.

// import {
//     Scissors,
//     Trash2,
//     PlusCircle,
//     Copy,
//     RotateCw,
//     Download,
//     Layers,
//     Undo2
// } from 'lucide-react';
// import { FaArchive, FaTrashAlt } from 'react-icons/fa';

// // Placeholder/Mock Components for demonstration completeness (Assume they exist in your environment)

// const NAVY_BLUE = '#001F3F';
// const GOLD_ACCENT = '#FFD700';


// interface ConfirmActionProps {
//     onConfirm: (id: string) => void;
//     itemId: string;
//     action: 'Read'| 'Archive' |'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore"; 
//     heading?: string;
//     description?: string;
//     buttonIcon?: React.ReactNode;
//     disabled?: boolean;
//     disabledReason?: string;
//     showHint?: boolean;
//     triggerButton?: React.ReactNode; 
// }

// const ConfirmAction: React.FC<ConfirmActionProps> = ({
//     onConfirm,
//     itemId,
//     action,
//     heading,
//     description,
//     buttonIcon,
//     disabled = false,
//     disabledReason,
//     showHint=true,
//     triggerButton
// }) => {
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const actualHeading = heading || `Confirm ${action}`;

//     // --- Dynamic Icon Calculation ---
//     const getActionIcon = () => {
//         const lucideIconClasses = cn(
//             "h-4 w-4 transition duration-150", 
//             action === 'Delete' ? "text-red-500 hover:text-red-400" :
//             action === 'Archive' ? `text-[${NAVY_BLUE}] hover:text-gray-500` :
//             action === 'Restore' ? "text-green-500 hover:text-green-400" :
//             `text-[${NAVY_BLUE}] hover:text-gray-500`
//         );

//         return buttonIcon ? buttonIcon : (() => {
//             switch (action) {
//                 case 'Read': return <Scissors className={lucideIconClasses} />;
//                 case 'Archive': return <FaArchive className={lucideIconClasses} />;
//                 case 'Detach': return <Scissors className={lucideIconClasses} />;
//                 case 'Delete': return <FaTrashAlt className={lucideIconClasses} />;
//                 case 'Add': return <PlusCircle className={lucideIconClasses} />;
//                 case 'Update': return <RotateCw className={lucideIconClasses} />;
//                 case 'Clone': return <Copy className={lucideIconClasses} />;
//                 case 'Export': return <Download className={lucideIconClasses} />;
//                 case 'Update Levels': return <Layers className={lucideIconClasses} />;
//                 case 'Restore': return <Undo2 className={lucideIconClasses} />;
//                 default: return null;
//             }
//         })();
//     };

//     const handleConfirm = () => {
//         onConfirm(itemId);
//         setIsDialogOpen(false);
//     };

//     const getActionText = (act: string) => {
//         switch (act) {
//             case 'Detach': 
//             case 'Read': 
//             case 'Archive': 
//             case 'Delete': 
//             case 'Add': 
//             case 'Clone': 
//             case 'Update': 
//             case 'Export': 
//             case 'Update Levels': 
//             case 'Restore': return act;
//             default: return "Confirm";
//         }
//     };

//     const hintDescription = disabled && disabledReason
//         ? disabledReason
//         : `Click to ${action.toLowerCase()}`;

//     // Conditional styling for the Confirmation Button
//     const getConfirmButtonStyles = (act: string) => {
//         // Red for Delete (high danger)
//         if (act === 'Delete') {
//             return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
//         }
//         // Gold for Restore/Add (Positive actions)
//         if (act === 'Restore' || act === 'Add' || act === 'Clone') {
//             return `bg-[${GOLD_ACCENT}] text-[${NAVY_BLUE}] font-bold hover:bg-yellow-400 focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
//         }
//         // Navy Blue for other actions (Neutral/Standard)
//         return `bg-[${NAVY_BLUE}] text-white font-semibold hover:bg-[#0a3154] focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2`;
//     }

//     return (
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
//             <DialogTrigger asChild>
//                 {/* If a custom trigger button is provided */}
//                 {triggerButton ? (
//                     <div onClick={(e) => {
//                         e.stopPropagation();
//                         if (!disabled) setIsDialogOpen(true);
//                     }}>
//                         {/* Clone the triggerButton and pass necessary props */}
//                         {React.cloneElement(triggerButton as React.ReactElement, {
//                             disabled: disabled,
//                             onClick: (e: React.MouseEvent) => {
//                                 e.stopPropagation();
//                                 if (!disabled) setIsDialogOpen(true);
//                             }
//                         })}
//                     </div>
//                 ) : (
//                     // Default behavior: Button with Hint
//                     <div
//                         className={cn(
//                             disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
//                         )}
//                         onClick={(e) => {
//                             if (disabled) {
//                                 e.stopPropagation();
//                                 return;
//                             }
//                             e.stopPropagation();
//                             setIsDialogOpen(true);
//                         }}
//                     >
//                     {showHint ? (
//                         <Hint sideOffset={2} description={hintDescription}>
//                             <Button
//                                 variant="ghost" 
//                                 size="icon"   
//                                 disabled={disabled} // Already controls the trigger button
//                             >
//                                 {getActionIcon()}
//                             </Button>
//                         </Hint>
//                     ) : (
//                         <Button
//                             variant="ghost" 
//                             size="icon"   
//                             disabled={disabled} // Already controls the trigger button
//                         >
//                             {getActionIcon()}
//                         </Button>
//                     )}
//                     </div>
//                 )}
//             </DialogTrigger>
//             <DialogContent
//                 className={cn(
//                     `bg-gray-950 text-white border-t-4 border-[${GOLD_ACCENT}] rounded-xl shadow-2xl w-[384px] max-w-md p-6`,
//                     "md:w-[400px]",
//                     "max-h-[60vh] overflow-y-auto"
//                 )}
//             >
//                 <DialogHeader>
//                     <DialogTitle className={cn("text-2xl font-bold", `text-[${GOLD_ACCENT}]`)}>{actualHeading}</DialogTitle>
//                     <DialogDescription className="text-gray-300 pt-2">{description || `Are you sure you want to ${action?.toLocaleLowerCase()} this item? This action may be irreversible.`}</DialogDescription>
//                 </DialogHeader>
//                 <DialogFooter className="flex flex-col gap-3 pt-6 sm:flex-row-reverse sm:justify-end sm:gap-3">
//                     <Button
//                         // Apply dynamic corporate colors based on action type
//                         className={cn(
//                             "text-white w-full sm:w-auto font-bold transition duration-200",
//                             getConfirmButtonStyles(action)
//                         )}
//                         onClick={handleConfirm}
//                         disabled={disabled} // ⬅️ NEW: The confirmation button is now controlled by the 'disabled' prop.
//                     >
//                         {getActionText(action)}
//                     </Button>
//                     <Button
//                         variant="secondary"
//                         // Make Cancel button match the dark corporate theme
//                         className={cn(
//                             `bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto font-medium transition duration-200`,
//                             `focus:ring-2 focus:ring-[${GOLD_ACCENT}] focus:ring-offset-2 focus:ring-offset-gray-950`
//                         )}
//                         onClick={() => setIsDialogOpen(false)}
//                     >
//                         Cancel
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// };

// // This default export is only for the purpose of the single-file React Immersive.
// // In your actual app, you would export ConfirmAction and the other components individually.
// export default function App() {
//     const handleAction = (id) => {
//         console.log(`Action confirmed for item: ${id}`);
//     };

//     const DemoButton = ({ isDisabled, reason }) => (
//         <div className="p-4 flex flex-col items-center space-y-4 bg-gray-100 min-h-screen">
//             <h1 className="text-2xl font-bold mb-4">ConfirmAction Demo</h1>
//             <div className="flex space-x-4 p-4 border rounded-lg bg-white shadow-lg">
//                 <ConfirmAction 
//                     onConfirm={handleAction} 
//                     itemId="item-123" 
//                     action="Delete" 
//                     disabled={isDisabled}
//                     disabledReason={reason}
//                     heading="Permanent Deletion"
//                     description="This item will be permanently removed from the system. This action cannot be undone."
//                     showHint={true}
//                 />
//                 <ConfirmAction 
//                     onConfirm={handleAction} 
//                     itemId="item-456" 
//                     action="Archive" 
//                     disabled={!isDisabled} // Opposite of the main state
//                     showHint={true}
//                 />
//             </div>
            
//             <div className="p-4 border rounded-lg bg-white shadow-lg">
//                 <p className="text-lg font-semibold mb-2">Current State:</p>
//                 <p>Delete Button is **{isDisabled ? 'Disabled' : 'Enabled'}**</p>
//             </div>
//         </div>
//     );

//     return <DemoButton isDisabled={false} reason="Cannot delete active items." />;
// }
import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; 
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
    action: 'Read'| 'Archive' |'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore"; 
    heading?: string;
    description?: string;
    buttonIcon?: React.ReactNode;
    disabled?: boolean;
    disabledReason?: string;
    showHint?: boolean;
    triggerButton?: React.ReactNode; // NEW: Allow passing a fully custom button element
}


// Define custom Tailwind classes (assuming they are in tailwind.config.js)
const NAVY_BLUE = '#001F3F';
const GOLD_ACCENT = '#FFD700';

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
    triggerButton // Use the new prop
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const actualHeading = heading || `Confirm ${action}`;

    // --- Dynamic Class Calculation ---

    const getActionIcon = () => {
        // Enforce h-4 w-4 for consistency
        const lucideIconClasses = cn(
            "h-4 w-4 transition duration-150", 
            // Apply corporate color to non-destructive actions
            action === 'Delete' ? "text-red-500 hover:text-red-400" :
            action === 'Archive' ? `text-[${NAVY_BLUE}] hover:text-gray-500` : // Navy Blue on white background
            action === 'Restore' ? "text-green-500 hover:text-green-400" :
            // Default icon color is a slightly lighter Navy or dark gray
            `text-[${NAVY_BLUE}] hover:text-gray-500`
        );

        // If a custom buttonIcon is provided, use it.
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
                {/* If a custom trigger button is provided (like from EnquiryDetailsClient) */}
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
                                disabled={disabled} 
                            >
                                {getActionIcon()}
                            </Button>
                        </Hint>
                    ) : (
                        <Button
                            variant="ghost" 
                            size="icon"   
                            disabled={disabled} 
                        >
                            {getActionIcon()}
                        </Button>
                    )}
                    </div>
                )}
            </DialogTrigger>
            <DialogContent
                className={cn(
                    // Deep, corporate Navy theme for the modal
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
// ConfirmAction.tsx
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button'; // <--- Make sure Button is imported!
// import {
//     Scissors,
//     Trash2,
//     PlusCircle,
//     Copy,
//     RotateCw,
//     Download,
//     Layers,
//     Undo2
// } from 'lucide-react';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Hint } from '@/app/components/hint';
// import { cn } from '@/lib/utils';
// import { FaArchive, FaTrashAlt } from 'react-icons/fa';

// interface ConfirmActionProps {
//     onConfirm: (id: string) => void;
//     itemId: string;
//     action: 'Read'| 'Archive' |'Detach' | 'Delete' | 'Add' | 'Clone' | 'Update' | 'Export' | 'Update Levels' | "Restore"; // Added 'Restore'
//     heading?: string;
//     description?: string;
//     buttonIcon?: React.ReactNode;
//     disabled?: boolean; // Add disabled property, optional
//     disabledReason?: string; // NEW: Add a reason for being disabled
//     showHint?: boolean;
// }


// const ConfirmAction: React.FC<ConfirmActionProps> = ({
//     onConfirm,
//     itemId,
//     action,
//     heading,
//     description,
//     buttonIcon,
//     disabled = false,
//     disabledReason,
//     showHint=true
// }) => {
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const actualHeading = heading || `Confirm ${action}`;

//     const getActionIcon = () => {
//         // IMPORTANT: Ensure consistent icon sizing (h-4 w-4) across all buttons and ConfirmActions
//         // Your BOQCard.tsx already uses h-4 w-4 for its direct buttons.
//         // And your buttonIcon props for ConfirmAction also use h-4 w-4.
//         // So, this lucideIconClasses should also use h-4 w-4 for the default icons.
//         const lucideIconClasses = cn(
//             "h-5 w-5", // <--- Make sure this is h-4 w-4, not h-5 w-5
//             action === 'Delete' ? "text-red-600 hover:text-red-400" :
//             action === 'Update' ? "text-blue-600 hover:text-blue-400" :
//             action === 'Export' ? "text-purple-600 hover:text-purple-400" :
//             action === 'Update Levels' ? "text-indigo-600 hover:text-indigo-400" :
//             action === 'Restore' ? "text-green-600 hover:text-green-400" :
//             "text-gray-600 hover:text-gray-400"
//         );

//         // If a custom buttonIcon is provided (e.g., from BOQCard), use it.
//         // Otherwise, render the default Lucide icon based on the action.
//         return buttonIcon ? buttonIcon : (() => {
//             switch (action) {
//                 case 'Read': return <Scissors className={lucideIconClasses} />;
//                 case 'Archive': return <FaArchive className={lucideIconClasses} />;
//                 case 'Detach': return <Scissors className={lucideIconClasses} />;
//                 case 'Delete': return <FaTrashAlt className={lucideIconClasses} />;
//                 case 'Add': return <PlusCircle className={lucideIconClasses} />;
//                 case 'Update': return <RotateCw className={lucideIconClasses} />;
//                 case 'Clone': return <Copy className={lucideIconClasses} />;
//                 case 'Export': return <Download className={lucideIconClasses} />;
//                 case 'Update Levels': return <Layers className={lucideIconClasses} />;
//                 case 'Restore': return <Undo2 className={lucideIconClasses} />;
              
//                 default: return null;
//             }
//         })();
//     };
  
//     const handleConfirm = () => {
//         onConfirm(itemId);
//         setIsDialogOpen(false);
//     };

//     const getActionText = (act: string) => {
//         switch (act) {
//             case 'Detach': return "Detach";
//             case 'Read': return "Read";
//             case 'Archive': return "Archive";
//             case 'Delete': return "Delete";
//             case 'Add': return "Add";
//             case 'Clone': return "Clone";
//             case 'Update': return "Update";
//             case 'Export': return "Export";
//             case 'Update Levels': return "Update Levels";
//             case 'Restore': return "Restore";
//             default: return "Confirm";
//         }
//     };

//     const hintDescription = disabled && disabledReason
//         ? disabledReason
//         : `Click to ${action.toLowerCase()}`;

//     return (
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
//             <DialogTrigger asChild>
               
//                  <div
//                     className={cn(
//                         disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
//                     )}
//                     onClick={(e) => {
//                         if (disabled) {
//                             e.stopPropagation();
//                             return;
//                         }
//                         e.stopPropagation();
//                         setIsDialogOpen(true);
//                     }}
//                 >
//                 {showHint? (<Hint sideOffset={2} description={hintDescription}>
//                     {/* THIS IS THE KEY CHANGE: Use <Button> here instead of a plain <div> */}
//                     <Button
//                         variant="ghost" // Match the variant used for your other Buttons in BOQCard.tsx
//                         size="icon"   // Match the size used for your other Buttons in BOQCard.tsx
//                         disabled={disabled} // Pass the disabled prop directly to the Button
//                         // Any additional styling for the button itself can go here if needed.
//                         // The text colors are primarily handled by the icon's className from getActionIcon.
//                     >
//                         {/* The icon element is rendered directly inside the Button */}
//                         {getActionIcon()}
//                     </Button>
//                 </Hint>):(<Button
//                         variant="ghost" // Match the variant used for your other Buttons in BOQCard.tsx
//                         size="icon"   // Match the size used for your other Buttons in BOQCard.tsx
//                         disabled={disabled} // Pass the disabled prop directly to the Button
//                         // Any additional styling for the button itself can go here if needed.
//                         // The text colors are primarily handled by the icon's className from getActionIcon.
//                     >
//                         {/* The icon element is rendered directly inside the Button */}
//                         {getActionIcon()}
//                     </Button>)}
//                 </div>
//             </DialogTrigger>
//             <DialogContent
//                 className={cn(
//                     "bg-gray-900 text-white border border-gray-800 rounded-lg shadow-lg w-[384px] max-w-md",
//                     "md:w-[400px]",
//                     "max-h-[60vh] overflow-y-auto"
//                 )}
//             >
//                 <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-white">{actualHeading}</DialogTitle>
//                     <DialogDescription className="text-gray-400">{description || `Are you sure you want to ${action?.toLocaleLowerCase()} this item?`}</DialogDescription>
//                 </DialogHeader>
//                 <DialogFooter className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-end sm:gap-2">
//                     <Button
//                         variant="destructive"
//                         className={cn(
//                             "text-white w-full sm:w-auto",
//                             action === 'Delete' ? "bg-red-500 hover:bg-red-600" :
//                             action === 'Update' ? "bg-blue-500 hover:bg-blue-600" :
//                             action === 'Export' ? "bg-purple-500 hover:bg-purple-600" :
//                             action === 'Update Levels' ? "bg-indigo-500 hover:bg-indigo-600" :
//                             action === 'Restore' ? "bg-green-500 hover:bg-green-600" :
//                             "bg-gray-500 hover:bg-gray-600"
//                         )}
//                         onClick={handleConfirm}
//                     >
//                         {getActionText(action)}
//                     </Button>
//                     <Button
//                         variant="secondary"
//                         className="bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto"
//                         onClick={() => setIsDialogOpen(false)}
//                     >
//                         Cancel
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default ConfirmAction;