"use client";

import { toast } from "sonner";
import { ElementRef, useRef, useState } from "react";
import { ImageMinus, ImagePlus, Layout, X } from "lucide-react"; // Import X icon
import { useQueryClient } from "@tanstack/react-query";
import { CardWithList } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { SafeUser } from '@/app/types';

interface HeaderProps {
    data: CardWithList;
    boardId:string;
    showEditCardMedia: boolean;
    toggleEditCardMedia: () => void;
    onClose: () => void; // Add this prop for the dialog close button
    currentUser?: SafeUser | null;
}

export const Header = ({
    data,
    boardId,
    showEditCardMedia,
    toggleEditCardMedia,
    onClose, // Destructure onClose
    currentUser
}: HeaderProps) => {
    const queryClient = useQueryClient();
    
    const { execute } = useAction(updateCard, {
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["card", data.id]
            });

            queryClient.invalidateQueries({
                queryKey: ["card-logs", data.id]
            });

            toast.success(`Renamed to "${data.title}"`);
            setTitle(data.title);
        },
        onError: (error) => {
            toast.error(error);
        }
    });

    const inputRef = useRef<ElementRef<"input">>(null);
    const [title, setTitle] = useState(data?.title);

    const onBlur = () => {
        inputRef.current?.form?.requestSubmit();
    };

    const onSubmit = (formData: FormData) => {
        const title = formData.get("title") as string;
        //if no changes detected pass DB persistence
        if (title === data?.title) {
            return;
        }

        execute({
            title,
            boardId,
            id: data.id,
        });
    }
    return (
        <div className="flex items-start mb-1 gap-x-3 w-full">
            {/* Custom Close Button */}
            <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-2 text-neutral-700 hover:bg-neutral-200"
                aria-label="Close dialog"
            >
                <X className="h-4 w-4" />
            </Button>
            <Layout className="h-5 w-5 mt-1 text-neutral-700" />
            <div className="flex-grow">
                <div className="flex flex-row justify-between items-start">
                    <div className="flex-grow truncate overflow-hidden ">
                        <form id="id1" name="name1" action={onSubmit} className="w-full">
                            <FormInput
                                ref={inputRef}
                                onBlur={onBlur}
                                id="title"
                                defaultValue={title}
                                disabled={true}
                                className="font-semibold text-xl px-1 text-neutral-700 bg-transparent border-transparent relative -left-1.5 w-full focus-visible:bg-white focus-visible:border-input mb-0.5 truncate overflow-hidden whitespace-nowrap text-ellipsis" 
                            />
                        </form>
                        <p className="text-sm text-muted-foreground break-words truncate">
                            in list <span className="underline truncate">{data?.list.title}</span>
                        </p>
                    </div>
                    <div className="ml-4 shrink-0">
                       { currentUser && <Button
                            className={cn(
                                "py-2 px-4 flex items-center gap-x-2 text-sm",
                                showEditCardMedia
                                    ? 'bg-blue-100 text-green-700 border-green-700 hover:bg-green-200'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            )}
                            onClick={toggleEditCardMedia}
                            variant="outline"
                            aria-label={showEditCardMedia ? "Hide drawing media editor" : "Show drawing media editor"}
                        >
                            {showEditCardMedia ? (
                                <Hint
                                    sideOffset={20}
                                    description={`Click to Hide Media Editor`}
                                >
                                    <ImageMinus className="h-4 w-4" />
                                </Hint>
                            ) : (
                                <Hint
                                    sideOffset={20}
                                    description={`Click to Show Media Editor`}
                                >
                                    <ImagePlus className="h-5 w-5" />
                                </Hint>
                            )}
                            <span className="hidden sm:inline-block">
                                {showEditCardMedia ? 'Hide Media Editor' : 'Show Media Editor'}
                            </span>
                        </Button>
                      }
                    </div>
                </div>
            </div>
        </div>
    );
};

Header.Skeleton = function HeaderSkeleton() {
    return (
        <div className="flex items-start gap-x-3 mb-6">
            <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
            <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
        </div>
    );
};
// "use client";

// import { toast } from "sonner";
// import { ElementRef, useRef, useState } from "react";
// import { ImageMinus, ImagePlus, Layout } from "lucide-react";
// import { useQueryClient } from "@tanstack/react-query";

// import { CardWithList } from "@/types";
// import { useAction } from "@/hooks/use-action";
// import { updateCard } from "@/actions/update-card";
// import { Skeleton } from "@/components/ui/skeleton";
// import { FormInput } from "@/components/form/form-input";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { Hint } from "@/components/hint";

// interface HeaderProps {
//   data: CardWithList;
//   boardId:string;
//   showEditCardMedia: boolean; // Add this prop
//   toggleEditCardMedia: () => void; // Add this prop
// }

// export const Header = ({
//   data,
//   boardId,
//   showEditCardMedia,
//   toggleEditCardMedia,
// }: HeaderProps) => {
//   const queryClient = useQueryClient();
 
//   const { execute } = useAction(updateCard, {
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({
//         queryKey: ["card", data.id]
//       });

//       queryClient.invalidateQueries({
//         queryKey: ["card-logs", data.id]
//       });

//       toast.success(`Renamed to "${data.title}"`);
//       setTitle(data.title);
//     },
//     onError: (error) => {
//       toast.error(error);
//     }
//   });

//   const inputRef = useRef<ElementRef<"input">>(null);
//   const [title, setTitle] = useState(data?.title);

//   const onBlur = () => {
//     inputRef.current?.form?.requestSubmit();
//   };

//   const onSubmit = (formData: FormData) => {
//     const title = formData.get("title") as string;
//     //if no changes detected pass DB persistence
//     if (title === data?.title) {
//       return;
//     }

//     execute({
//       title,
//       boardId,
//       id: data.id,
//     });
//   }
//  return (
//     <div className="flex items-start mb-1 gap-x-3 w-full">
//     <Layout className="h-5 w-5 mt-1 text-neutral-700" />
//     <div className="flex-grow">
//         <div className="flex flex-row justify-between items-start">
//             <div className="flex-grow truncate overflow-hidden ">
//                 <form id="id1" name="name1" action={onSubmit} className="w-full">
//                     <FormInput
//                         ref={inputRef}
//                         onBlur={onBlur}
//                         id="title"
//                         defaultValue={title}
//                         disabled={true}
//                         className="font-semibold text-xl px-1 text-neutral-700 bg-transparent border-transparent relative -left-1.5 w-full focus-visible:bg-white focus-visible:border-input mb-0.5 truncate overflow-hidden whitespace-nowrap text-ellipsis" 
//                     />
//                 </form>
//                 <p className="text-sm text-muted-foreground break-words truncate">
//                     in list <span className="underline truncate">{data?.list.title}</span>
//                 </p>
             
//             </div>
//             <div className="ml-4 shrink-0">
//                 <Button
//                     className={cn(
//                         "py-2 px-4 flex items-center gap-x-2 text-sm",
//                         showEditCardMedia
//                             ? 'bg-blue-100 text-green-700 border-green-700 hover:bg-green-200'
//                             : 'border-gray-300 text-gray-700 hover:bg-gray-100'
//                     )}
//                     onClick={toggleEditCardMedia}
//                     variant="outline"
//                     aria-label={showEditCardMedia ? "Hide drawing media editor" : "Show drawing media editor"}
//                 >
//                     {showEditCardMedia ? (
//                         <Hint
//                             sideOffset={20}
//                             description={`Click to Hide Media Editor`}
//                         >
//                             <ImageMinus className="h-4 w-4" /> {/* Removed text-gray-400 hover:text-gray-200 */}
//                         </Hint>
//                     ) : (
//                         <Hint
//                             sideOffset={20}
//                             description={`Click to Show Media Editor`}
//                         >
//                             <ImagePlus className="h-5 w-5" /> {/* Removed text-gray-400 hover:text-gray-200 */}
//                         </Hint>
//                     )}
//                     {/* Text labels for the button. You can choose to show text or rely on icons + tooltips */}
//                     <span className="hidden sm:inline-block"> {/* Optional: Hide text on small screens */}
//                         {showEditCardMedia ? 'Hide Media Editor' : 'Show Media Editor'}
//                     </span>
//                 </Button>
//             </div>
//         </div>
//     </div>
// </div>
//   );
// };

// Header.Skeleton = function HeaderSkeleton() {
//   return (
//     <div className="flex items-start gap-x-3 mb-6">
//       <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
//       <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
//     </div>
   
//   );
// };
