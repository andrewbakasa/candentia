import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors, Trash2, PlusCircle, Copy } from 'lucide-react'; // Import icons
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Hint } from '@/app/components/hint';
import { cn } from '@/lib/utils';

interface ConfirmActionProps {
    onConfirm: (id: string) => void;
    itemId: string;
    action: 'Detach' | 'Delete' | 'Add'| 'Clone'; // Use a union type for the action
    heading?: string;
    description?: string; // Add description prop
}

const ConfirmAction: React.FC<ConfirmActionProps> = ({ onConfirm, itemId, action, heading, description }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const actualHeading = heading || `Confirm ${action}`;
    const getActionIcon = () => {
        switch (action) {
            case 'Detach':
                return (
                        <Hint
                            sideOffset={20}
                            description={`Click to detach`}
                        >
                            <Scissors className="h-5 w-5 text-gray-600 hover:text-gray-400" />
                        </Hint>
                    );
            case 'Delete':
                return (
                        <Hint
                            sideOffset={20}
                            description={`Click to delete`}
                        >
                           <Trash2 className="h-5 w-5 text-red-600 hover:text-red-400" />
                        </Hint>
                    );
            case 'Add':
                return  (
                        <Hint
                            sideOffset={20}
                            description={`Click to Add`}
                        >
                           <PlusCircle className="h-5 w-5 text-gray-600 hover:text-gray-400" />
                        </Hint>
                    );
                    case 'Clone':
                        return  (
                                <Hint
                                    sideOffset={20}
                                    description={`Click to Clone`}
                                >
                                <Copy className="h-5 w-5 text-gray-600 hover:text-gray-400"/>
                                </Hint>
                            );    
            default:
                
                return null;
        }
    };

    const handleConfirm = () => {
        onConfirm(itemId);
        setIsDialogOpen(false);
    };

    const getActionText = (act: string) => {
      switch (act) {
        case 'Detach': return "Detach";
        case 'Delete': return "Delete";
        case 'Add': return "Add";
        default: return "Confirm";
      }
    }

    return (
            // <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
            //     <DialogTrigger asChild>
            //         <div
            //             className='mt-3 cursor-pointer'
            //             onClick={(e) => {
            //                 e.stopPropagation();
            //                 setIsDialogOpen(true);
            //             }}
            //         >
            //             {getActionIcon()}
            //         </div>
            //     </DialogTrigger>
            //     <DialogContent className="bg-gray-900 text-white border-gray-300 w-[384px] h-[300px] lg:h-[300px] lg:w-[400px] xl:h-[300px] xl:w-[400px] rounded-md">
            //         <DialogHeader>
            //             <DialogTitle className="text-lg text-white">{actualHeading}</DialogTitle>
            //             <DialogDescription className="text-gray-400">
            //                 {description || `Are you sure you want to ${action?.toLocaleLowerCase()} this item?`}
            //             </DialogDescription>
            //         </DialogHeader>
            //         <DialogFooter className="flex flex-col gap-2">
            //             <Button
            //                 variant="secondary"
            //                 className="bg-gray-700 hover:bg-gray-600 text-white w-full"
            //                 onClick={() => setIsDialogOpen(false)}
            //             >
            //                 Cancel
            //             </Button>
            //             <Button
            //                 variant="destructive"
            //                 className={cn('text-white w-full', action === 'Delete' ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600")}
            //                 onClick={handleConfirm}
            //             >
            //                 {getActionText(action)}
            //             </Button>
            //         </DialogFooter>
            //     </DialogContent>
            // </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
    <DialogTrigger asChild>
        <div
            className='mt-3 cursor-pointer'
            onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(true);
            }}
        >
            {getActionIcon()}
        </div>
    </DialogTrigger>
    <DialogContent
        className={cn(
            "bg-gray-900 text-white border border-gray-800 rounded-lg shadow-lg w-[384px] max-w-md",
            "md:w-[400px]" // Slightly wider on medium screens and up
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
                    action === 'Delete' ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
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