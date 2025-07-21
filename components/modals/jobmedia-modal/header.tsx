"use client";

import { toast } from "sonner";
import { ElementRef, useRef, useState } from "react";
import { ImageMinus, ImagePlus, Layout, X } from "lucide-react"; // Import X icon
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { SafeUser } from '@/app/types';
import { Career, JobApplication, JobAttachment } from "@prisma/client";

interface HeaderProps {
    data: JobApplication & { career: Career; jobAttachment: JobAttachment; }; // Corrected this line
    jobId:string;
    showEditJobMedia: boolean;
    toggleEditJobMedia: () => void;
    onClose: () => void; // Add this prop for the dialog close button
    currentUser?: SafeUser | null;
}

export const Header = ({
    data,
    jobId,
    showEditJobMedia,
    toggleEditJobMedia,
    onClose, // Destructure onClose
    currentUser
}: HeaderProps) => {
    console.log("data",data, jobId )
 
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
                       
                        <p className="text-sm text-muted-foreground break-words truncate">
                            attachment for <span className="underline truncate">{data?.applicantName||data?.applicantEmail||"Unknown"} for {data?.career?.title}</span>
                        </p>
                    </div>
                    <div className="ml-4 shrink-0">
                       { currentUser && <Button
                            className={cn(
                                "py-2 px-4 flex items-center gap-x-2 text-sm",
                                showEditJobMedia
                                    ? 'bg-blue-100 text-green-700 border-green-700 hover:bg-green-200'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            )}
                            onClick={toggleEditJobMedia}
                            variant="outline"
                            aria-label={showEditJobMedia ? "Hide drawing media editor" : "Show drawing media editor"}
                        >
                            {showEditJobMedia ? (
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
                                {showEditJobMedia ? 'Hide Media Editor' : 'Show Media Editor'}
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
