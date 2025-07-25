'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CardWithList2 } from "@/types"; // Assuming CardWithList2 is a type defined in your project
import { fetcher } from "@/lib/fetcher";
import { Career, JobApplication, JobAttachment } from "@prisma/client"; // Prisma model for CardImage
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Header } from "./header";
import { Separator } from "@radix-ui/react-separator";
import EditJobMedia from "./editPage";
import { useAction } from "@/hooks/use-action";
import toast from "react-hot-toast";
import { createJobImage } from "@/actions/create-job-application-attachment";
import { Skeleton } from '@/components/ui/skeleton';
import Slider from './slider';
import { useJobMediaModal } from '@/hooks/use-job-media-modal';
import CardImageReorderList from './cardImage-reorder-list';
import { updateJobMediaDescription } from '@/app/actions/update-jobMedia-descriptions';
import { updateJobMediaFileName } from '@/app/actions/update-jobMedia-filename';

export const JobMediaModal = () => {
    // Hooks to get modal state and data
    const id = useJobMediaModal((state) => state.id || null);
    const jobId = useJobMediaModal((state) => state.jobId || "");
    const isOpen = useJobMediaModal((state) => state.isOpen);
    const currentUser = useJobMediaModal((state) => state.currentUser);
  
    const onClose = useJobMediaModal((state) => state.onClose);

    // Local states for managing slider and media editing
    const [currentjobId, setCurrentjobId] = useState<string | null>(null);
    const [filteredMediaCount, setFilteredMediaCount] = useState(0);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [localCardImagesForSlider, setLocalCardImagesForSlider] = useState<JobAttachment[]>([]);
    const [showEditJobMedia, setShowEditJobMedia] = useState(false);
    // State to track if it's the initial render for setting default showEditJobMedia
    const [isInitialRenderForMediaPanel, setIsInitialRenderForMediaPanel] = useState(true);

    const queryClient = useQueryClient();

    // Define allowed roles for editing permissions
    const allowedRoles: string[] = ['admin', 'manager']; // Customize as per your application's roles

    // Determine if the current user has editing permissions
    const canEdit = currentUser?.isAdmin || currentUser?.roles?.some(role =>
        allowedRoles.includes(role.toLowerCase())
    ) || false; // Ensure roles array exists before calling .some()

    // useAction hook for updating card image description
    const { execute: updateCardImageDescriptionMutation } = useAction(updateJobMediaDescription, {
        onSuccess: (data) => {
            // Invalidate the specific card image query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
            toast.success("Description updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // useAction hook for updating card image filename
    const { execute: updateCardImageFilenameMutation } = useAction(updateJobMediaFileName, {
        onSuccess: (data) => {
            // Invalidate the specific card image query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
            toast.success("Filename updated successfully!");
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Handler for description change
    const handleDescriptionChange = (mediaId: string, newDescription: string | null) => {
        if (!mediaId) {
            toast.error("Media ID is missing for description update.");
            return;
        }
        updateCardImageDescriptionMutation({ id: mediaId, description: newDescription });
    };

    // Handler for filename change
    const handleFileNameChange = (mediaId: string, newFileName: string | null) => {
        if (!mediaId) {
            toast.error("Media ID is missing for filename update.");
            return;
        }
        updateCardImageFilenameMutation({ id: mediaId, fileName: newFileName });
    };

    // Fetch card images data
    const { data: jobImages, status, error } = useQuery<JobAttachment[] | null>({
        queryKey: ["jobImage", id],
        queryFn: () => (id ? fetcher(`/api/jobImages/${id}`) : Promise.resolve(null)),
        enabled: !!id,
        // Ensure initial data is sorted by the 'order' field
        select: (data) => data ? [...data].sort((a, b) => a.order - b.order) : null,
    });

    // Fetch card data (e.g., for header)
    const { data: jobData } = useQuery<(JobApplication & { career: Career; jobAttachment: JobAttachment; }) | null>({
        queryKey: ["job", id],
        queryFn: () => (id ? fetcher(`/api/jobApplications/${id}`) : Promise.resolve(null)),
        enabled: !!id,
    });

    // Sync local images for slider with fetched cardImages whenever cardImages changes
    useEffect(() => {
        if (jobImages) {
            setLocalCardImagesForSlider(jobImages);
            setFilteredMediaCount(jobImages.length);
        } else {
            setLocalCardImagesForSlider([]);
            setFilteredMediaCount(0);
        }
    }, [jobImages]);

    // Control showEditJobMedia only on initial load if no images are present
    useEffect(() => {
        if (status === 'success' && isInitialRenderForMediaPanel) {
            if (!jobImages || jobImages.length === 0) {
                setShowEditJobMedia(true);
            }
            setIsInitialRenderForMediaPanel(false); // Mark initial render complete
        }
    }, [status, jobImages, isInitialRenderForMediaPanel]);

    // Handler for slider's card ID and index change
    const handlejobIdChange = (jobAppId: string | null, index: number) => {
        setCurrentjobId(jobAppId);
        setSliderIndex(index);
    };

    // Action hook for creating a new card image
    const { execute: createJobImageMutation } = useAction(createJobImage, {
        onSuccess: (data) => {
            // Invalidate the query for the specific card's images to ensure re-fetch and re-sort
            queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
            toast.success(`Media "${data.url}" created`); // Assuming 'url' is available
            setShowEditJobMedia(false); // Hide edit panel after successful upload
        },
        onError: (error) => {
            toast.error(error); // Display error toast
        },
    });

    // Toggle function for the media editing panel
    const toggleEditJobMedia = () => {
        setShowEditJobMedia(!showEditJobMedia);
    };

    // Function to manually refresh card images query
    const refreshCardImages = () => {
        queryClient.invalidateQueries({ queryKey: ["jobImage", id] });
    };

    // This useEffect ensures that if cardImages become empty after an operation (e.g., deletion),
    // the edit panel automatically opens.
    useEffect(() => {
        if (status === 'success') {
            if (!jobImages || jobImages.length === 0) {
                setShowEditJobMedia(true);
            } else {
                // If images are present, ensure edit panel is closed unless explicitly opened
                // This prevents it from staying open if images are added, but user didn't toggle it
                // setShowEditJobMedia(false); // Commenting out to preserve user's last toggle state
            }
        }
    }, [status, jobImages]);


    return (
        <Dialog open={isOpen} 
         onOpenChange={onClose} 
        >
            <DialogContent
                // hideDefaultClose={true} // Commented out as it might hide the default close button
                className="max-w-5xl w-[95%] p-4 sm:p-8 rounded-xl shadow-2xl bg-white border border-gray-100 overflow-y-auto [&>button:last-child]:hidden "
            >
              {!jobData ? <Header.Skeleton /> : <Header
                    data={jobData}
                    jobId={jobId}
                    showEditJobMedia={showEditJobMedia}
                    toggleEditJobMedia={toggleEditJobMedia}
                    onClose={onClose} // Pass onClose to Header
                    currentUser={currentUser}
                />}
                {/* Main content div with responsive padding */}
                <div className="mt-6 px-2 sm:px-6">
                    {/* Media Slider Section */}
                    <div className="relative w-full flex flex-col items-center p-2 sm:p-6 bg-gray-50 rounded-lg shadow-inner min-h-[250px] justify-center border border-gray-200">
                        {status === 'pending' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg z-10">
                                <Skeleton className="h-full w-full rounded-lg" />
                            </div>
                        )}
                        {status === 'error' && (
                            <p className="text-red-500 text-center text-lg">Error loading media. Please try again.</p>
                        )}
                        {status === 'success' && localCardImagesForSlider && localCardImagesForSlider.length > 0 ? (
                            <>
                                <Slider
                                    mediaList={localCardImagesForSlider}
                                    fullView={!showEditJobMedia}
                                    onCardIdChange={handlejobIdChange}
                                    onDescriptionChange={handleDescriptionChange}
                                    onFileNameChange={handleFileNameChange}
                                    canEdit={canEdit}
                                    // sliderIndex={sliderIndex}          // Pass sliderIndex */}
                                    // filteredMediaCount={filteredMediaCount}// Pass filteredMediaCount 
                                />
                               
                            </>
                        ) : (
                            status === 'success' && (
                                <p className="text-gray-500 text-center text-lg font-medium">No media associated with this item.</p>
                            )
                        )}
                    </div>

                    {/* Separator for visual division */}
                    {showEditJobMedia && (
                        <Separator className="my-8 bg-gray-300 h-px" />
                    )}

                    {/* Media Editing Section */}
                    {showEditJobMedia && (
                        <div className="space-y-6">
                            <EditJobMedia
                                newImageList={[]} // Assuming this is managed internally or from another source
                                dbImages={jobImages || []}
                                createJobImageMutation={createJobImageMutation}
                                refreshCardImages={refreshCardImages}
                                jobId={jobId}
                                currentUser={currentUser}
                            />
                            {jobData?.id && (
                                <CardImageReorderList
                                    initialCardImages={jobImages || []}
                                    jobAppId={jobData?.id || ""}
                                    onReorderSuccess={refreshCardImages}
                                />
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { CardWithList2 } from "@/types"; // Assuming CardWithList2 is a type defined in your project
// import { fetcher } from "@/lib/fetcher";
// import { Career, JobApplication, JobAttachment } from "@prisma/client"; // Prisma model for CardImage
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { Header } from "./header";
// import { Separator } from "@radix-ui/react-separator";
// import EditJobMedia from "./editPage";
// import { useAction } from "@/hooks/use-action";
// import toast from "react-hot-toast";
// import { createJobImage } from "@/actions/create-job-application-attachment";
// import { Skeleton } from '@/components/ui/skeleton';
// import Slider from './slider';
// import { useJobMediaModal } from '@/hooks/use-job-media-modal';
// import CardImageReorderList from './cardImage-reorder-list';
// import { updateJobMediaDescription } from '@/app/actions/update-jobMedia-descriptions';
// import { updateJobMediaFileName } from '@/app/actions/update-jobMedia-filename';

// export const JobMediaModal = () => {
//     // Hooks to get modal state and data
//     const id = useJobMediaModal((state) => state.id || null);
//     const jobId = useJobMediaModal((state) => state.jobId || "");
//     const isOpen = useJobMediaModal((state) => state.isOpen);
//     const currentUser = useJobMediaModal((state) => state.currentUser);
//     const onClose = useJobMediaModal((state) => state.onClose);

//     // Local states for managing slider and media editing
//     const [currentjobId, setCurrentjobId] = useState<string | null>(null);
//     const [filteredMediaCount, setFilteredMediaCount] = useState(0);
//     const [sliderIndex, setSliderIndex] = useState(0);
//     const [localCardImagesForSlider, setLocalCardImagesForSlider] = useState<JobAttachment[]>([]);
//     const [showEditJobMedia, setShowEditJobMedia] = useState(false);
//     // State to track if it's the initial render for setting default showEditJobMedia
//     const [isInitialRenderForMediaPanel, setIsInitialRenderForMediaPanel] = useState(true);

//     const queryClient = useQueryClient();

//     // Define allowed roles for editing permissions
//     const allowedRoles: string[] = ['admin', 'manager']; // Customize as per your application's roles

//     // Determine if the current user has editing permissions
//     const canEdit = currentUser?.isAdmin || currentUser?.roles?.some(role =>
//         allowedRoles.includes(role.toLowerCase())
//     ) || false; // Ensure roles array exists before calling .some()

//     // useAction hook for updating card image description
//     const { execute: updateCardImageDescriptionMutation } = useAction(updateJobMediaDescription, {
//         onSuccess: (data) => {
//             // Invalidate the specific card image query to refetch updated data
//             queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
//             toast.success("Description updated successfully!");
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     // useAction hook for updating card image filename
//     const { execute: updateCardImageFilenameMutation } = useAction(updateJobMediaFileName, {
//         onSuccess: (data) => {
//             // Invalidate the specific card image query to refetch updated data
//             queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
//             toast.success("Filename updated successfully!");
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     // Handler for description change
//     const handleDescriptionChange = (mediaId: string, newDescription: string | null) => {
//         if (!mediaId) {
//             toast.error("Media ID is missing for description update.");
//             return;
//         }
//         updateCardImageDescriptionMutation({ id: mediaId, description: newDescription });
//     };

//     // Handler for filename change
//     const handleFileNameChange = (mediaId: string, newFileName: string | null) => {
//         if (!mediaId) {
//             toast.error("Media ID is missing for filename update.");
//             return;
//         }
//         updateCardImageFilenameMutation({ id: mediaId, fileName: newFileName });
//     };

//     // Fetch card images data
//     const { data: jobImages, status, error } = useQuery<JobAttachment[] | null>({
//         queryKey: ["jobImage", id],
//         queryFn: () => (id ? fetcher(`/api/jobImages/${id}`) : Promise.resolve(null)),
//         enabled: !!id,
//         // Ensure initial data is sorted by the 'order' field
//         select: (data) => data ? [...data].sort((a, b) => a.order - b.order) : null,
//     });

//     // Fetch card data (e.g., for header)
//     const { data: jobData } = useQuery<(JobApplication & { career: Career; jobAttachment: JobAttachment; }) | null>({
//         queryKey: ["job", id],
//         queryFn: () => (id ? fetcher(`/api/jobApplications/${id}`) : Promise.resolve(null)),
//         enabled: !!id,
//     });

//     // Sync local images for slider with fetched cardImages whenever cardImages changes
//     useEffect(() => {
//         if (jobImages) {
//             setLocalCardImagesForSlider(jobImages);
//             setFilteredMediaCount(jobImages.length);
//         } else {
//             setLocalCardImagesForSlider([]);
//             setFilteredMediaCount(0);
//         }
//     }, [jobImages]);

//     // Control showEditJobMedia only on initial load if no images are present
//     useEffect(() => {
//         if (status === 'success' && isInitialRenderForMediaPanel) {
//             if (!jobImages || jobImages.length === 0) {
//                 setShowEditJobMedia(true);
//             }
//             setIsInitialRenderForMediaPanel(false); // Mark initial render complete
//         }
//     }, [status, jobImages, isInitialRenderForMediaPanel]);

//     // Handler for slider's card ID and index change
//     const handlejobIdChange = (jobId: string | null, index: number) => {
//         setCurrentjobId(jobId);
//         setSliderIndex(index);
//     };

//     // Action hook for creating a new card image
//     const { execute: createJobImageMutation } = useAction(createJobImage, {
//         onSuccess: (data) => {
//             // Invalidate the query for the specific card's images to ensure re-fetch and re-sort
//             queryClient.invalidateQueries({ queryKey: ["jobImage", data.jobAppId] });
//             toast.success(`Media "${data.url}" created`); // Assuming 'url' is available
//             setShowEditJobMedia(false); // Hide edit panel after successful upload
//         },
//         onError: (error) => {
//             toast.error(error); // Display error toast
//         },
//     });

//     // Toggle function for the media editing panel
//     const toggleEditJobMedia = () => {
//         setShowEditJobMedia(!showEditJobMedia);
//     };

//     // Function to manually refresh card images query
//     const refreshCardImages = () => {
//         queryClient.invalidateQueries({ queryKey: ["jobImage", id] });
//     };

//     // This useEffect ensures that if cardImages become empty after an operation (e.g., deletion),
//     // the edit panel automatically opens.
//     useEffect(() => {
//         if (status === 'success') {
//             if (!jobImages || jobImages.length === 0) {
//                 setShowEditJobMedia(true);
//             } else {
//                 // If images are present, ensure edit panel is closed unless explicitly opened
//                 // This prevents it from staying open if images are added, but user didn't toggle it
//                 // setShowEditJobMedia(false); // Commenting out to preserve user's last toggle state
//             }
//         }
//     }, [status, jobImages]);


//     return (
//         <Dialog open={isOpen} onOpenChange={onClose} >
//             <DialogContent
//                // hideDefaultClose={true}
//                 className="max-w-5xl w-[95%] p-4 sm:p-8 rounded-xl shadow-2xl bg-white border border-gray-100 overflow-y-auto [&>button:last-child]:hidden "
//             >
//                 {/* Header section */}
//                 {!jobData ? <Header.Skeleton /> : <Header
//                     data={jobData}
//                     jobId={jobId}
//                     showEditJobMedia={showEditJobMedia}
//                     toggleEditJobMedia={toggleEditJobMedia}
//                     onClose={onClose} // Pass onClose to Header
//                     currentUser={currentUser}
//                 />}
//                 {/* Main content div with responsive padding */}
//                 <div className="mt-6 px-2 sm:px-6">
//                     {/* Media Slider Section */}
//                     <div className="relative w-full flex flex-col items-center p-2 sm:p-6 bg-gray-50 rounded-lg shadow-inner min-h-[250px] justify-center border border-gray-200">
//                         {status === 'pending' && (
//                             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg z-10">
//                                 <Skeleton className="h-full w-full rounded-lg" />
//                             </div>
//                         )}
//                         {status === 'error' && (
//                             <p className="text-red-500 text-center text-lg">Error loading media. Please try again.</p>
//                         )}
//                         {status === 'success' && localCardImagesForSlider && localCardImagesForSlider.length > 0 ? (
//                             <>
//                                 <Slider
//                                     mediaList={localCardImagesForSlider}
//                                     fullView={!showEditJobMedia}
//                                     onCardIdChange={handlejobIdChange}
//                                     onDescriptionChange={handleDescriptionChange} // Pass the new handler
//                                     onFileNameChange={handleFileNameChange}     // Pass the new handler
//                                     canEdit={canEdit}                          // Pass canEdit prop
//                                 />
//                                 <div className="mt-4 text-sm text-gray-600 font-medium">
//                                     Media {sliderIndex + 1} of {filteredMediaCount}
//                                 </div>
//                             </>
//                         ) : (
//                             status === 'success' && (
//                                 <p className="text-gray-500 text-center text-lg font-medium">No media associated with this item.</p>
//                             )
//                         )}
//                     </div>

//                     {/* Separator for visual division */}
//                     {showEditJobMedia && (
//                         <Separator className="my-8 bg-gray-300 h-px" />
//                     )}

//                     {/* Media Editing Section */}
//                     {showEditJobMedia && (
//                         <div className="space-y-6">
//                             <EditJobMedia
//                                 newImageList={[]} // Assuming this is managed internally or from another source
//                                 dbImages={jobImages || []}
//                                 createJobImageMutation={createJobImageMutation}
//                                 refreshCardImages={refreshCardImages}
//                                 jobId={jobId}
//                                 currentUser={currentUser}
//                             />
//                             {jobData?.id && (
//                                 <CardImageReorderList
//                                     initialCardImages={jobImages || []}
//                                     jobAppId={jobData?.id || ""}
//                                     onReorderSuccess={refreshCardImages}
//                                 />
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };

