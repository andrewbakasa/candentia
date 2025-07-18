/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MapPin, ToggleRight, ToggleLeft } from 'lucide-react'; // Import icons
import { toast } from 'sonner'; // For user notifications

import CareerForm from '../input-jobs/InputJobsClient';
import { Career } from '@prisma/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // For delete confirmation

import Search from '../components/Search';
import ReactPaginate from "react-paginate";
import { useAction } from '@/hooks/use-action'; // Import useAction hook
import { updateCareerActive } from '@/actions/update-jobApplicationStatus';
//import { updateCareerActive } from '@/actions/update-job-application-status'; // Import the new server action

// Define the type for our form data
interface CareerFormValues {
    id?: string;
    title: string;
    listingTitle?: string | null;
    shortDescription?: string | null;
    fullDescription: string;
    slug: string;
    active: boolean; // Add active status
    location: string;
    type: string;
    department: string;
}

interface CareerFormProps {
    dbCareers: Career[];
}

const CareerClient: React.FC<CareerFormProps> = ({ dbCareers }) => {
    const [selectedCareer, setSelectedCareer] = useState<CareerFormValues | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [careerToDeleteId, setCareerToDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [pageSize, setPageSize] = useState<number>(8);
    const [pageCount, setPageCount] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);

    const [fList, setFList] = useState(dbCareers);
    const [fListPage, setFListPage] = useState<Career[]>([]);

    const router = useRouter();

    // Use the useAction hook for the new updateCareerActive server action
    const { execute: executeToggleActive } = useAction(updateCareerActive, {
        onSuccess: (data) => {
            toast.success(`Career "${data?.title}" status updated to ${data?.active ? 'Active' : 'Inactive'}`);
            router.refresh(); // Revalidate data to show updated list
        },
        onError: (error) => {
            toast.error(`Failed to update career status: ${error}`);
        },
    });

    const filteredAndSearchedRecords = useMemo(() => {
        let careerList = dbCareers; // Always start with the original dbCareers

        if (searchTerm !== "") {
            let arrFirst = searchTerm.split(';');
            const arr = arrFirst.filter(element => element);
            const results = careerList.filter((record) =>
                arr.some(
                    (x) => {
                        const searchTerms = x.split(',').map(s => s.trim().toLowerCase());
                        return searchTerms.every(term =>
                            record.title?.toLowerCase().includes(term) ||
                            (record.listingTitle || '').toLowerCase().includes(term) ||
                            (record.shortDescription || '').toLowerCase().includes(term) ||
                            record.fullDescription.toLowerCase().includes(term) ||
                            record.slug.toLowerCase().includes(term) ||
                            record.location.toLowerCase().includes(term) ||
                            record.type.toLowerCase().includes(term) ||
                            record.department.toLowerCase().includes(term)
                        );
                    }
                )
            );
            return results;
        }
        return careerList;
    }, [dbCareers, searchTerm]);

    useEffect(() => {
        setFList(filteredAndSearchedRecords);
        setItemOffset(0);
    }, [filteredAndSearchedRecords]);

    useEffect(() => {
        const calculatePageSlice = (list: Career[], offset: number, size: number): Career[] => {
            const end = Math.min(offset + size, list.length);
            return list.slice(offset, end);
        };
        setFListPage(calculatePageSlice(fList, itemOffset, pageSize));
    }, [itemOffset, fList, pageSize]);

    useEffect(() => {
        if (fList && pageSize) {
            const newPageCount = Math.ceil(fList.length / pageSize);
            if (pageCount !== newPageCount) {
                setPageCount(newPageCount);
            }
        }
    }, [fList, pageSize, pageCount]);

    useEffect(() => {
        setItemOffset(0);
    }, [pageCount]);


    // --- Edit Functionality ---
    const handleEditClick = useCallback((career: Career) => {
        const initialData: CareerFormValues = {
            id: career.id,
            title: career?.title || "",
            listingTitle: career.listingTitle || null,
            shortDescription: career.shortDescription || null,
            fullDescription: career.fullDescription,
            slug: career.slug,
            active: career.active, // Pass active status
            location: career.location,
            type: career.type,
            department: career.department,
        };
        setSelectedCareer(initialData);
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCareer(null);
        router.refresh(); // Revalidate data after potential edit
    }

    // --- Delete Functionality ---
    const handleDeleteClick = useCallback((careerId: string) => {
        setCareerToDeleteId(careerId);
        setIsDeleteConfirmOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!careerToDeleteId) return;

        try {
            const response = await fetch(`/api/careers/${careerToDeleteId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete career.');
            }

            toast.success('Career deleted successfully!');
            router.refresh(); // Revalidate data to show updated list
            setCareerToDeleteId(null);
            setIsDeleteConfirmOpen(false);
        } catch (error: any) {
            toast.error(`Error deleting career: ${error.message || 'An unknown error occurred.'}`);
            console.error("Delete error:", error);
            setCareerToDeleteId(null);
            setIsDeleteConfirmOpen(false);
        }
    };

    // --- Toggle Active Status Functionality ---
    const handleToggleActive = useCallback((careerId: string, currentActiveStatus: boolean) => {
        // Optimistically update the UI
        setFList(prevList =>
            prevList.map(career =>
                career.id === careerId ? { ...career, active: !currentActiveStatus } : career
            )
        );
        setFListPage(prevListPage =>
            prevListPage.map(career =>
                career.id === careerId ? { ...career, active: !currentActiveStatus } : career
            )
        );

        // Call the server action to persist the change
        executeToggleActive({ id: careerId, active: !currentActiveStatus });
    }, [executeToggleActive]);


    /* ----------------Pagination logic------------ */
    type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        setItemOffset(0);
    };

    const handlePageClick = (event: { selected: number }) => {
        const newOffset = (event.selected * pageSize) % fList.length;
        setItemOffset(newOffset);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        buttons.push(
            <ReactPaginate
                breakLabel="..."
                containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2"
                activeClassName="active bg-orange-300 text-white"
                previousLabel="«"
                nextLabel="»"
                key={'career-pagination'}
                onPageChange={handlePageClick}
                pageRangeDisplayed={5}
                pageCount={pageCount || 0}
                forcePage={Math.floor(itemOffset / pageSize)}
                renderOnZeroPageCount={null}
            />
        );
        buttons.push(
            <select
                className='border-gray-300 rounded border text-rose-500'
                value={pageSize}
                key={'career-page-size-select'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            >
                <option value="1" >1 per Page</option>
                <option value="2">2 per Page</option>
                <option value="3">3 per Page</option>
                <option value="4">4 per Page</option>
                <option value="8">8 per Page</option>
                <option value="16">16 per Page</option>
                <option value="24">24 per Page</option>
                <option value="32">32 per Page</option>
                <option value="48">48 per Page</option>
                <option value="60">60 per Page</option>
            </select>
        );
        return <div className="flex justify-center gap-3">{buttons}</div>;
    };
    /* ----------------End Pagination logic------------ */


    return (
        <>
            <div className="flex-col justify-between sm:px-1 xs:px-2 mb-2.5 ">
                <div className='flex flex-col justify-between py-1 sm:flex-row gap-1 md:gap-5 lg:max-w-[90%] sm:max-w-[95%] mx-auto'>
                    <div
                        role="button"
                        onClick={() => { router.push('/input-jobs') }}
                        className="sm:w-[200px] w-full mt-1 md:mt-10 aspect-video relative h-[38px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                        <p className="text-sm">Create new Career</p>
                    </div>
                    <div className="">
                        <Search
                            setSearchTerm={setSearchTerm}
                            searchTerm={searchTerm}
                            debounce={1500}
                            placeholderText="filter records..."
                        />
                    </div>
                </div>

                <div className="my-2 mb-2 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-green-100 lg:max-w-[90%] sm:max-w-[95%] mx-auto">
                    {fListPage?.length > 0 ? fListPage?.map((career) => (
                        <Card
                            key={career.id}
                            className={cn(
                                "transition-all duration-300",
                                "border-0 shadow-md",
                                "hover:shadow-lg hover:border-blue-500/30",
                                "group",
                                "backdrop-blur-md",
                                "flex flex-col h-full", // Added flexbox for consistent height
                                career.active ? "bg-white/90 border border-white/10" : "bg-gray-200/90 border border-gray-300 opacity-80" // Different colors based on active status
                            )}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                                    {career.title}
                                </CardTitle>
                                <CardDescription className="flex items-center text-gray-500">
                                    <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                                    {career.location}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between"> {/* flex-grow to push buttons down */}
                                <div className="mb-4"> {/* Added margin-bottom for spacing */}
                                    <p className="text-gray-700 mb-2 line-clamp-3"> {/* line-clamp for consistent description height */}
                                        {career.shortDescription || 'No description provided.'}
                                    </p>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold">Type:</span> {career.type}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold">Department:</span> {career.department}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200"> {/* mt-auto and pt-4 for consistent button position */}
                                    {/* Toggle Active/Inactive Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(career.id, career.active)}
                                        className={cn(
                                            "flex items-center gap-1 rounded-md shadow-sm",
                                            career.active ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"
                                        )}
                                    >
                                        {career.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                        {career.active ? 'Deactivate' : 'Activate'}
                                    </Button>

                                    {/* Edit and Delete Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditClick(career)}
                                            className="flex items-center gap-1 rounded-md shadow-sm hover:bg-blue-100"
                                        >
                                            <Edit className="h-4 w-4 mr-1 text-blue-500" /> Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(career.id)}
                                            className="flex items-center gap-1 rounded-md shadow-sm hover:bg-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="col-span-full text-center py-10 min-h-[calc(100vh-200px)] flex items-center justify-center bg-white rounded-lg shadow-md">
                            <p className='text-red-500 text-3xl font-semibold'>No career postings found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {fList && fList.length > 0 && (
                    <div className="mt-8 flex justify-center gap-4"> {/* Increased margin-top, centered */}
                        {renderPaginationButtons()}
                    </div>
                )}
                {!fList && (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">Loading career data...</p>
                    </div>
                )}

            </div>

            {/* Edit Career Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[90vw] overflow-y-auto max-h-[80vh] rounded-lg shadow-xl">
                    <DialogHeader className="pb-4 border-b border-gray-200">
                        <DialogTitle className='text-2xl font-bold text-indigo-600'>Edit Career Posting</DialogTitle>
                        <DialogDescription className='text-gray-600'>
                            Make changes to the career posting below. Click save when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="w-full max-h-[calc(80vh-120px)] overflow-y-auto pr-2"> {/* Added w-full and removed overflow-x-hidden */}
                        {selectedCareer && (
                            <CareerForm
                                initialData={selectedCareer}
                                onClose={handleCloseEditModal} // Pass a callback to close the modal
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-lg shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-red-700">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                            This action cannot be undone. This will permanently delete this career posting
                            and remove its data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md px-4 py-2 hover:bg-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CareerClient;

// /* eslint-disable @next/next/no-img-element */
// 'use client';
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Button } from '@/components/ui/button';
// import { Edit, Trash2, MapPin, ToggleRight, ToggleLeft } from 'lucide-react'; // Import icons
// import { toast } from 'sonner'; // For user notifications

// import CareerForm from '../input-jobs/InputJobsClient';
// import { Career } from '@prisma/client';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog"
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from "@/components/ui/alert-dialog"; // For delete confirmation

// import Search from '../components/Search';
// import ReactPaginate from "react-paginate";
// import { useAction } from '@/hooks/use-action'; // Import useAction hook
// import { updateCareerActive } from '@/actions/update-jobApplicationStatus';
// //import { updateCareerActive } from '@/actions/update-job-application-status'; // Import the new server action

// // Define the type for our form data
// interface CareerFormValues {
//     id?: string;
//     title: string;
//     listingTitle?: string | null;
//     shortDescription?: string | null;
//     fullDescription: string;
//     slug: string;
//     active: boolean; // Add active status
//     location: string;
//     type: string;
//     department: string;
// }

// interface CareerFormProps {
//     dbCareers: Career[];
// }

// const CareerClient: React.FC<CareerFormProps> = ({ dbCareers }) => {
//     const [selectedCareer, setSelectedCareer] = useState<CareerFormValues | null>(null);
//     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//     const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
//     const [careerToDeleteId, setCareerToDeleteId] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState("");

//     const [pageSize, setPageSize] = useState<number>(8);
//     const [pageCount, setPageCount] = useState(0);
//     const [itemOffset, setItemOffset] = useState(0);

//     const [fList, setFList] = useState(dbCareers);
//     const [fListPage, setFListPage] = useState<Career[]>([]);

//     const router = useRouter();

//     // Use the useAction hook for the new updateCareerActive server action
//     const { execute: executeToggleActive } = useAction(updateCareerActive, {
//         onSuccess: (data) => {
//             toast.success(`Career "${data?.title}" status updated to ${data?.active ? 'Active' : 'Inactive'}`);
//             router.refresh(); // Revalidate data to show updated list
//         },
//         onError: (error) => {
//             toast.error(`Failed to update career status: ${error}`);
//         },
//     });

//     const filteredAndSearchedRecords = useMemo(() => {
//         let careerList = dbCareers; // Always start with the original dbCareers

//         if (searchTerm !== "") {
//             let arrFirst = searchTerm.split(';');
//             const arr = arrFirst.filter(element => element);
//             const results = careerList.filter((record) =>
//                 arr.some(
//                     (x) => {
//                         const searchTerms = x.split(',').map(s => s.trim().toLowerCase());
//                         return searchTerms.every(term =>
//                             record.title?.toLowerCase().includes(term) ||
//                             (record.listingTitle || '').toLowerCase().includes(term) ||
//                             (record.shortDescription || '').toLowerCase().includes(term) ||
//                             record.fullDescription.toLowerCase().includes(term) ||
//                             record.slug.toLowerCase().includes(term) ||
//                             record.location.toLowerCase().includes(term) ||
//                             record.type.toLowerCase().includes(term) ||
//                             record.department.toLowerCase().includes(term)
//                         );
//                     }
//                 )
//             );
//             return results;
//         }
//         return careerList;
//     }, [dbCareers, searchTerm]);

//     useEffect(() => {
//         setFList(filteredAndSearchedRecords);
//         setItemOffset(0);
//     }, [filteredAndSearchedRecords]);

//     useEffect(() => {
//         const calculatePageSlice = (list: Career[], offset: number, size: number): Career[] => {
//             const end = Math.min(offset + size, list.length);
//             return list.slice(offset, end);
//         };
//         setFListPage(calculatePageSlice(fList, itemOffset, pageSize));
//     }, [itemOffset, fList, pageSize]);

//     useEffect(() => {
//         if (fList && pageSize) {
//             const newPageCount = Math.ceil(fList.length / pageSize);
//             if (pageCount !== newPageCount) {
//                 setPageCount(newPageCount);
//             }
//         }
//     }, [fList, pageSize, pageCount]);

//     useEffect(() => {
//         setItemOffset(0);
//     }, [pageCount]);


//     // --- Edit Functionality ---
//     const handleEditClick = useCallback((career: Career) => {
//         const initialData: CareerFormValues = {
//             id: career.id,
//             title: career?.title || "",
//             listingTitle: career.listingTitle || null,
//             shortDescription: career.shortDescription || null,
//             fullDescription: career.fullDescription,
//             slug: career.slug,
//             active: career.active, // Pass active status
//             location: career.location,
//             type: career.type,
//             department: career.department,
//         };
//         setSelectedCareer(initialData);
//         setIsEditModalOpen(true);
//     }, []);

//     const handleCloseEditModal = () => {
//         setIsEditModalOpen(false);
//         setSelectedCareer(null);
//         router.refresh(); // Revalidate data after potential edit
//     }

//     // --- Delete Functionality ---
//     const handleDeleteClick = useCallback((careerId: string) => {
//         setCareerToDeleteId(careerId);
//         setIsDeleteConfirmOpen(true);
//     }, []);

//     const confirmDelete = async () => {
//         if (!careerToDeleteId) return;

//         try {
//             const response = await fetch(`/api/careers/${careerToDeleteId}`, {
//                 method: 'DELETE',
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to delete career.');
//             }

//             toast.success('Career deleted successfully!');
//             router.refresh(); // Revalidate data to show updated list
//             setCareerToDeleteId(null);
//             setIsDeleteConfirmOpen(false);
//         } catch (error: any) {
//             toast.error(`Error deleting career: ${error.message || 'An unknown error occurred.'}`);
//             console.error("Delete error:", error);
//             setCareerToDeleteId(null);
//             setIsDeleteConfirmOpen(false);
//         }
//     };

//     // --- Toggle Active Status Functionality ---
//     const handleToggleActive = useCallback((careerId: string, currentActiveStatus: boolean) => {
//         // Optimistically update the UI
//         setFList(prevList =>
//             prevList.map(career =>
//                 career.id === careerId ? { ...career, active: !currentActiveStatus } : career
//             )
//         );
//         setFListPage(prevListPage =>
//             prevListPage.map(career =>
//                 career.id === careerId ? { ...career, active: !currentActiveStatus } : career
//             )
//         );

//         // Call the server action to persist the change
//         executeToggleActive({ id: careerId, active: !currentActiveStatus });
//     }, [executeToggleActive]);


//     /* ----------------Pagination logic------------ */
//     type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

//     const handlePageSizeChange = (newPageSize: PageSizeOption) => {
//         const numericPageSize = parseInt(newPageSize, 10);
//         setPageSize(numericPageSize);
//         setItemOffset(0);
//     };

//     const handlePageClick = (event: { selected: number }) => {
//         const newOffset = (event.selected * pageSize) % fList.length;
//         setItemOffset(newOffset);
//     };

//     const renderPaginationButtons = () => {
//         const buttons = [];
//         buttons.push(
//             <ReactPaginate
//                 breakLabel="..."
//                 containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2"
//                 activeClassName="active bg-orange-300 text-white"
//                 previousLabel="«"
//                 nextLabel="»"
//                 key={'career-pagination'}
//                 onPageChange={handlePageClick}
//                 pageRangeDisplayed={5}
//                 pageCount={pageCount || 0}
//                 forcePage={Math.floor(itemOffset / pageSize)}
//                 renderOnZeroPageCount={null}
//             />
//         );
//         buttons.push(
//             <select
//                 className='border-gray-300 rounded border text-rose-500'
//                 value={pageSize}
//                 key={'career-page-size-select'}
//                 onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
//             >
//                 <option value="1" >1 per Page</option>
//                 <option value="2">2 per Page</option>
//                 <option value="3">3 per Page</option>
//                 <option value="4">4 per Page</option>
//                 <option value="8">8 per Page</option>
//                 <option value="16">16 per Page</option>
//                 <option value="24">24 per Page</option>
//                 <option value="32">32 per Page</option>
//                 <option value="48">48 per Page</option>
//                 <option value="60">60 per Page</option>
//             </select>
//         );
//         return <div className="flex justify-center gap-3">{buttons}</div>;
//     };
//     /* ----------------End Pagination logic------------ */


//     return (
//         <>
//             <div className="flex-col justify-between sm:px-1 xs:px-2 mb-2.5 ">
//                 <div className='flex flex-col justify-between py-1 sm:flex-row gap-1 md:gap-5 lg:max-w-[90%] sm:max-w-[95%] mx-auto'>
//                     <div
//                         role="button"
//                         onClick={() => { router.push('/input-jobs') }}
//                         className="sm:w-[200px] w-full mt-1 md:mt-10 aspect-video relative h-[38px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
//                     >
//                         <p className="text-sm">Create new Career</p>
//                     </div>
//                     <div className="">
//                         <Search
//                             setSearchTerm={setSearchTerm}
//                             searchTerm={searchTerm}
//                             debounce={1500}
//                             placeholderText="filter records..."
//                         />
//                     </div>
//                 </div>

//                 <div className="my-2 mb-2 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-green-100 lg:max-w-[90%] sm:max-w-[95%] mx-auto">
//                     {fListPage?.length > 0 ? fListPage?.map((career) => (
//                         <Card
//                             key={career.id}
//                             className={cn(
//                                 "transition-all duration-300",
//                                 "border-0 shadow-md",
//                                 "hover:shadow-lg hover:border-blue-500/30",
//                                 "group",
//                                 "backdrop-blur-md",
//                                 "flex flex-col h-full", // Added flexbox for consistent height
//                                 career.active ? "bg-white/90 border border-white/10" : "bg-gray-200/90 border border-gray-300 opacity-80" // Different colors based on active status
//                             )}
//                         >
//                             <CardHeader>
//                                 <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
//                                     {career.title}
//                                 </CardTitle>
//                                 <CardDescription className="flex items-center text-gray-500">
//                                     <MapPin className="w-4 h-4 mr-1 text-blue-500" />
//                                     {career.location}
//                                 </CardDescription>
//                             </CardHeader>
//                             <CardContent className="flex-grow flex flex-col justify-between"> {/* flex-grow to push buttons down */}
//                                 <div className="mb-4"> {/* Added margin-bottom for spacing */}
//                                     <p className="text-gray-700 mb-2 line-clamp-3"> {/* line-clamp for consistent description height */}
//                                         {career.shortDescription || 'No description provided.'}
//                                     </p>
//                                     <div className="text-sm text-gray-600">
//                                         <span className="font-semibold">Type:</span> {career.type}
//                                     </div>
//                                     <div className="text-sm text-gray-600">
//                                         <span className="font-semibold">Department:</span> {career.department}
//                                     </div>
//                                 </div>
//                                 <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200"> {/* mt-auto and pt-4 for consistent button position */}
//                                     {/* Toggle Active/Inactive Button */}
//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handleToggleActive(career.id, career.active)}
//                                         className={cn(
//                                             "flex items-center gap-1 rounded-md shadow-sm",
//                                             career.active ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"
//                                         )}
//                                     >
//                                         {career.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
//                                         {career.active ? 'Deactivate' : 'Activate'}
//                                     </Button>

//                                     {/* Edit and Delete Buttons */}
//                                     <div className="flex gap-2">
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => handleEditClick(career)}
//                                             className="flex items-center gap-1 rounded-md shadow-sm hover:bg-blue-100"
//                                         >
//                                             <Edit className="h-4 w-4 mr-1 text-blue-500" /> Edit
//                                         </Button>
//                                         <Button
//                                             variant="destructive"
//                                             size="sm"
//                                             onClick={() => handleDeleteClick(career.id)}
//                                             className="flex items-center gap-1 rounded-md shadow-sm hover:bg-red-600"
//                                         >
//                                             <Trash2 className="h-4 w-4 mr-1" /> Delete
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )) : (
//                         <div className="col-span-full text-center py-10 min-h-[calc(100vh-200px)] flex items-center justify-center bg-white rounded-lg shadow-md">
//                             <p className='text-red-500 text-3xl font-semibold'>No career postings found matching your criteria.</p>
//                         </div>
//                     )}
//                 </div>

//                 {/* Pagination Controls */}
//                 {fList && fList.length > 0 && (
//                     <div className="mt-8 flex justify-center gap-4"> {/* Increased margin-top, centered */}
//                         {renderPaginationButtons()}
//                     </div>
//                 )}
//                 {!fList && (
//                     <div className="text-center py-10">
//                         <p className="text-gray-500 text-lg">Loading career data...</p>
//                     </div>
//                 )}

//             </div>

//             {/* Edit Career Modal */}
//             <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//                 <DialogContent className="sm:max-w-[90vw] overflow-y-auto max-h-[80vh] rounded-lg shadow-xl">
//                     <DialogHeader className="pb-4 border-b border-gray-200">
//                         <DialogTitle className='text-2xl font-bold text-indigo-600'>Edit Career Posting</DialogTitle>
//                         <DialogDescription className='text-gray-600'>
//                             Make changes to the career posting below. Click save when you&apos;re done.
//                         </DialogDescription>
//                     </DialogHeader>
//                     <div className="max-h-[calc(80vh-120px)] overflow-x-hidden overflow-y-auto pr-2"> {/* Adjusted max-height and added pr-2 for scrollbar */}
//                         {selectedCareer && (
//                             <CareerForm
//                                 initialData={selectedCareer}
//                                 onClose={handleCloseEditModal} // Pass a callback to close the modal
//                             />
//                         )}
//                     </div>
//                 </DialogContent>
//             </Dialog>

//             {/* Delete Confirmation Dialog */}
//             <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
//                 <AlertDialogContent className="rounded-lg shadow-xl">
//                     <AlertDialogHeader>
//                         <AlertDialogTitle className="text-xl font-bold text-red-700">Are you absolutely sure?</AlertDialogTitle>
//                         <AlertDialogDescription className="text-gray-700">
//                             This action cannot be undone. This will permanently delete this career posting
//                             and remove its data from our servers.
//                         </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel className="rounded-md px-4 py-2 hover:bg-gray-100">Cancel</AlertDialogCancel>
//                         <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2">
//                             Delete
//                         </AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </>
//     );
// };

// export default CareerClient;