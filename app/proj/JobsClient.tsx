/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import { useWindowSize } from "@/hooks/use-screenWidth";
import Cookies from 'js-cookie';
import { cn } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import useIsMobile from "../hooks/isMobile";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { createTag } from "@/actions/create-tag";
import { PageView } from "./_components/page-view";
import { Career, JobApplication } from "@prisma/client";
import { JobContainer } from "../job/[jobId]/_components/job-container";

// Corrected interface to include jobApplication array on Career
interface JobsClientProps {
    jobs: (Career & { jobApplication: JobApplication[] })[];
    currentUser?: SafeUser | null;
}

type CareerWithApplication = Career & { jobApplication: JobApplication[] };


const JobsClient: React.FC<JobsClientProps> = ({
    jobs,
    currentUser,
}) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState(''); // Not used in this component's current functionality
    const [searchTerm, setSearchTerm] = useState("");

    // Initialize pageSize from currentUser or default to 8
    const [pageSize, setPageSize] = useState<number>(currentUser?.pageSize || 8);
    const [pageCount, setPageCount] = useState(0); // Will be calculated in useEffect
    const [itemOffset, setItemOffset] = useState(0);

    const isMobile = useIsMobile();
    const [fList, setFList] = useState(jobs); // fList now holds the filtered/searched jobs
    const [fListPage, setFListPage] = useState<CareerWithApplication[]>([]); // Current page's jobs

    const [uniqueJobId, setUniqueJobId] = useState('');

    // Handle toggling a unique job view
    const handleToggleSelectUniqueJob = (id: string) => {
        if (uniqueJobId === id) { // If clicking the same job, deselect it
            setUniqueJobId('');
        } else { // Select a new unique job
            setUniqueJobId(id);
            setSearchTerm(''); // Clear search term when a unique job is selected
        }
    };

    const [category, setCategory] = useState<string>(''); // This state is declared but not used in the filter logic below

    const { execute, fieldErrors } = useAction(updatePagSize, {
        onSuccess: (data) => {
            toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const { execute: executeTag } = useAction(createTag, {
        onSuccess: (data) => {
            toast.success(`Tag "${data.name}" created`);
            //formRef.current?.reset(); // Assuming formRef is for a tag creation form
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Removed Cookies.set('originString', origin); as 'origin' is not defined here.
    // If you need to store origin, get it from window.location.origin.

    // Effect to filter and search jobs
    useEffect(() => {
        let currentJobs = jobs;

        if (uniqueJobId.length > 0) {
            currentJobs = currentJobs.filter(x => x.id === uniqueJobId.trim());
        }

        if (searchTerm !== "") {
            const searchTermsArray = searchTerm.split(';').filter(Boolean).map(s => s.trim().toLowerCase());

            currentJobs = currentJobs.filter((job) => {
                return searchTermsArray.some(phrase => {
                    const individualTerms = phrase.split(',').map(t => t.trim());
                    return individualTerms.every(term =>
                        (job.title || '').toLowerCase().includes(term) ||
                        (job.listingTitle || '').toLowerCase().includes(term) ||
                        (job.shortDescription || '').toLowerCase().includes(term) ||
                        job.fullDescription.toLowerCase().includes(term) ||
                        job.slug.toLowerCase().includes(term) ||
                        job.location.toLowerCase().includes(term) || // Added location to search
                        job.type.toLowerCase().includes(term) || // Added type to search
                        job.department.toLowerCase().includes(term) // Added department to search
                    );
                });
            });
        }
        // The 'category' state is not used in the filtering logic here.
        // If category filtering is intended, you would add logic like:
        // if (category !== '') {
        //   currentJobs = currentJobs.filter(job => job.category === category);
        // }

        setFList(currentJobs);
        setItemOffset(0); // Reset pagination to the first page after filtering/searching
    }, [jobs, uniqueJobId, searchTerm]); // Removed `category` from dependencies as it's not used in the filter logic.

    const handleSearch = (value: string) => { // Changed event to value directly, assuming Search component passes value
        setSearchTerm(value);
    };

    const { width, height } = useWindowSize();
    const mobileWidth = 400;

    let allowedRoles: String[]
    allowedRoles = ['employee', 'admin', 'visitor', 'manager'];
    const isAllowedAccess = currentUser?.roles.filter((role: string) =>
        (
            allowedRoles.some((y) => (
                y.toLowerCase().includes(role.toLowerCase())
            ))
        )
    );
    const popover_content_pos = width ? (width < mobileWidth ? 'bottom' : 'right') : 'right';


    /* ----------------Pagination------------ */
    type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options

    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        if (currentUser) {
            execute({
                id: currentUser?.id,
                pageSize: numericPageSize
            });
        }
        setItemOffset(0); // Reset to the first page when page size changes
    };


    const handlePageClick = (event: { selected: number }) => {
        const newOffset = (event.selected * pageSize) % fList.length;
        setItemOffset(newOffset);
    };
    const calculatePageSlice = (list: CareerWithApplication[], offset: number, size: number): CareerWithApplication[] => {
        if (!list || !size || offset === undefined) { // Ensure all necessary parameters are defined
            return []; // Return empty array if data is missing
        }
        const endpoint = Math.min(offset + size, list.length);
        return list.slice(offset, endpoint);
    };

    useEffect(() => {
        const pageSlice = calculatePageSlice(fList, itemOffset, pageSize); // Removed 'as any' cast
        if (pageSlice) {
            setFListPage(pageSlice);
        }
    }, [itemOffset, fList, pageSize]);

    useEffect(() => {
        if (fList && pageSize) {
            const newPageCount = Math.ceil(fList.length / pageSize);
            if (pageCount !== newPageCount) {
                setPageCount(newPageCount);
            }
        }
    }, [fList, pageSize, pageCount]); // Added pageCount to dependencies for consistency

    useEffect(() => {
        setItemOffset(0);
    }, [pageCount]);

    const renderPaginationButtons = () => {
        const buttons = [];
        buttons.push(
            <ReactPaginate
                breakLabel="..."
                containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2" // Tailwind CSS classes
                activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
                previousLabel="«"
                nextLabel="»"
                key={'andgwgw!'}
                onPageChange={handlePageClick}
                pageRangeDisplayed={5}
                pageCount={pageCount || 0} // Use calculated pageCount
                forcePage={Math.floor(itemOffset / pageSize)} // Control the current page
                renderOnZeroPageCount={null}
            />
        );
        buttons.push(
            <select
                className='border-gray-300 rounded border text-rose-500'
                value={pageSize}
                key={'abanansgd'}
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

    let title_ = `Jobs ${fList.length} of ${jobs.length}`
    let subtitle_ = "Career you might follow" //"Manage your projects and teams online"

    return (
        <Container >
            <div className="z-51 mt-[-40px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
                <Heading
                    title={uniqueJobId.length === 0 ? title_ : 'Project View mode. To exit, either click here or on the project image.'}
                    subtitle={subtitle_}
                    isSetBackground={uniqueJobId?.length > 0}
                    // onClick={uniqueJobId.length > 0 ? () => handleToggleSelectUniqueJob('') : undefined}
                    // className={uniqueJobId.length > 0 ? "cursor-pointer transition-colors duration-200 hover:text-blue-600" : ""} // Added hover effect
                />


                <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
                    {/* Keep other elements here if any */}
                    <div className="flex-grow" /> {/* This will push the next element to the far end */}
                    <div className="flex flex-row">
                        <Search
                            setSearchTerm={handleSearch}
                            searchTerm={searchTerm}
                            debounce={1500}
                            placeholderText="Search jobs..."
                        />
                    </div>
                </div>

            </div>
            <div className={cn(
                "mt-6 pb-8 px-2 sm:px-4 lg:px-6", // Adjusted padding and margin
                "bg-white rounded-lg shadow-lg", // Added background and shadow to the main job list container
                uniqueJobId.length === 0 ? '' : 'border-yellow-400 border-2' // Conditional border for unique job view
            )}>
                <div>
                    {
                        fListPage.length > 0 ? (
                            <div
                                className={cn(
                                    "grid gap-6 py-4", // Added padding and gap
                                    isMobile ? 'grid-cols-1' : 'grid-cols-1' // Still single column
                                )}
                            >
                                {fListPage.map((job, index) => (
                                    <div
                                        className={cn(
                                            "mb-4", // Add some margin bottom for spacing between cards
                                            "h-full flex flex-col", // Ensure consistent height for each job item
                                            uniqueJobId.length > 0 ? "cursor-default" : "cursor-pointer", // Cursor based on view mode
                                            "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300" // Card-like styling for each job item
                                        )}
                                        key={job.id}
                                        onClick={uniqueJobId.length === 0 ? () => handleToggleSelectUniqueJob(job.id) : undefined} // Only clickable if not in unique view
                                    >
                                        <JobContainer
                                            job={job}
                                            jobId={job.id}
                                            numberOfApplicants={job.jobApplication.length} // Correctly access jobApplication.length
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full text-center py-16 min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 rounded-lg shadow-inner border border-gray-200"> {/* Improved styling for no jobs message */}
                                <p className='text-red-500 text-3xl font-semibold'>No jobs found matching your criteria.</p>
                            </div>
                        )
                    }

                    {fList && fList.length > 0 && (
                        <div className="mt-8 flex justify-center gap-4"> {/* Centered pagination */}
                            {renderPaginationButtons()}
                        </div>
                    )}
                    {!fList && (
                        <div className="text-center py-10 text-gray-500">
                            <p>Loading data...</p>
                        </div>
                    )}

                </div>
            </div>
        </Container>
    );
}

export default JobsClient;

// /* eslint-disable @next/next/no-img-element */
// 'use client';
// import { useCallback, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { SafeUser } from "../types";
// import Heading from "../components/Heading";
// import Search from "../components/Search";
// import Container from "../components/Container";
// // import { redirect } from "next/navigation"; // Not used directly in client component
// import { useWindowSize } from "@/hooks/use-screenWidth";
// import Cookies from 'js-cookie'; // Consider if this is still necessary or if better state management is preferred
// import { cn } from "@/lib/utils";
// import ReactPaginate from "react-paginate";
// import useIsMobile from "../hooks/isMobile";
// import { toast } from "sonner";
// import { useAction } from "@/hooks/use-action";
// import { updatePagSize } from "@/actions/update-user-pagesize";
// import { createTag } from "@/actions/create-tag";
// import { PageView } from "./_components/page-view"; // Assuming this component is still relevant
// import { Career, JobApplication } from "@prisma/client";
// import { JobContainer } from "../job/[jobId]/_components/job-container";

// // Corrected interface to include jobApplication array on Career
// interface JobsClientProps {
//     jobs: (Career & { jobApplication: JobApplication[] })[];
//     currentUser?: SafeUser | null;
// }

// type CareerWithApplication = Career & { jobApplication: JobApplication[] };


// const JobsClient: React.FC<JobsClientProps> = ({
//     jobs,
//     currentUser,
// }) => {
//     const router = useRouter();
//     const [deletingId, setDeletingId] = useState(''); // Not used in this component's current functionality
//     const [searchTerm, setSearchTerm] = useState("");

//     // Initialize pageSize from currentUser or default to 8
//     const [pageSize, setPageSize] = useState<number>(currentUser?.pageSize || 8);
//     const [pageCount, setPageCount] = useState(0); // Will be calculated in useEffect
//     const [itemOffset, setItemOffset] = useState(0);

//     const isMobile = useIsMobile();
//     const [fList, setFList] = useState(jobs); // fList now holds the filtered/searched jobs
//     const [fListPage, setFListPage] = useState<CareerWithApplication[]>([]); // Current page's jobs

    

//     const [category, setCategory] = useState<string>(''); // This state is declared but not used in the filter logic below

//     const { execute, fieldErrors } = useAction(updatePagSize, {
//         onSuccess: (data) => {
//             toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     const { execute: executeTag } = useAction(createTag, {
//         onSuccess: (data) => {
//             toast.success(`Tag "${data.name}" created`);
//             //formRef.current?.reset(); // Assuming formRef is for a tag creation form
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     // Removed Cookies.set('originString', origin); as 'origin' is not defined here.
//     // If you need to store origin, get it from window.location.origin.

//     // Effect to filter and search jobs
//     useEffect(() => {
//         let currentJobs = jobs;

        
//         if (searchTerm !== "") {
//             const searchTermsArray = searchTerm.split(';').filter(Boolean).map(s => s.trim().toLowerCase());

//             currentJobs = currentJobs.filter((job) => {
//                 return searchTermsArray.some(phrase => {
//                     const individualTerms = phrase.split(',').map(t => t.trim());
//                     return individualTerms.every(term =>
//                         (job.title || '').toLowerCase().includes(term) ||
//                         (job.listingTitle || '').toLowerCase().includes(term) ||
//                         (job.shortDescription || '').toLowerCase().includes(term) ||
//                         job.fullDescription.toLowerCase().includes(term) ||
//                         job.slug.toLowerCase().includes(term) ||
//                         job.location.toLowerCase().includes(term) || // Added location to search
//                         job.type.toLowerCase().includes(term) || // Added type to search
//                         job.department.toLowerCase().includes(term) // Added department to search
//                     );
//                 });
//             });
//         }
//         // The 'category' state is not used in the filtering logic here.
//         // If category filtering is intended, you would add logic like:
//         // if (category !== '') {
//         //   currentJobs = currentJobs.filter(job => job.category === category);
//         // }

//         setFList(currentJobs);
//         setItemOffset(0); // Reset pagination to the first page after filtering/searching
//     }, [jobs, searchTerm]); // Removed `category` from dependencies as it's not used in the filter logic.

//     const handleSearch = (value: string) => { // Changed event to value directly, assuming Search component passes value
//         setSearchTerm(value);
//     };

//     const { width, height } = useWindowSize();
//     const mobileWidth = 400;

//     let allowedRoles: String[]
//     allowedRoles = ['employee', 'admin', 'visitor', 'manager'];
//     const isAllowedAccess = currentUser?.roles.filter((role: string) =>
//         (
//             allowedRoles.some((y) => (
//                 y.toLowerCase().includes(role.toLowerCase())
//             ))
//         )
//     );
//     const popover_content_pos = width ? (width < mobileWidth ? 'bottom' : 'right') : 'right';


//     /* ----------------Pagination------------ */
//     type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options

//     const handlePageSizeChange = (newPageSize: PageSizeOption) => {
//         const numericPageSize = parseInt(newPageSize, 10);
//         setPageSize(numericPageSize);
//         if (currentUser) {
//             execute({
//                 id: currentUser?.id,
//                 pageSize: numericPageSize
//             });
//         }
//         setItemOffset(0); // Reset to the first page when page size changes
//     };


//   const handlePageClick = (event: { selected: number }) => {
//     const newOffset = (event.selected * pageSize) % fList.length;
//     setItemOffset(newOffset);
//   };
//     const calculatePageSlice = (list: CareerWithApplication[], offset: number, size: number):  CareerWithApplication[] => {
//         if (!list || !size || offset === undefined) { // Ensure all necessary parameters are defined
//             return []; // Return empty array if data is missing
//         }
//         const endpoint = Math.min(offset + size, list.length);
//         return list.slice(offset, endpoint);
//     };

//     useEffect(() => {
//         const pageSlice = calculatePageSlice(fList as any, itemOffset, pageSize); // Cast fList to match expected type for calculatePageSlice
//         if (pageSlice) {
//             setFListPage(pageSlice);
//         }
//     }, [itemOffset, fList, pageSize]);

//     useEffect(() => {
//         if (fList && pageSize) {
//             const newPageCount = Math.ceil(fList.length / pageSize);
//             if (pageCount !== newPageCount) {
//                 setPageCount(newPageCount);
//             }
//         }
//     }, [fList, pageSize, pageCount]); // Added pageCount to dependencies for consistency

//     useEffect(() => {
//         setItemOffset(0);
//     }, [pageCount]);

//     const renderPaginationButtons = () => {
//         const buttons = [];
//         buttons.push(
//             <ReactPaginate
//                 breakLabel="..."
//                 containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2" // Tailwind CSS classes
//                 activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
//                 previousLabel="«"
//                 nextLabel="»"
//                 key={'andgwgw!'}
//                 onPageChange={handlePageClick}
//                 pageRangeDisplayed={5}
//                 pageCount={pageCount || 0} // Use calculated pageCount
//                 forcePage={Math.floor(itemOffset / pageSize)} // Control the current page
//                 renderOnZeroPageCount={null}
//             />
//         );
//         buttons.push(
//             <select
//                 className='border-gray-300 rounded border text-rose-500'
//                 value={pageSize}
//                 key={'abanansgd'}
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

//     let title_ = `Jobs ${fList.length} of ${jobs.length}`
//     let subtitle_ = "Career you might follow" //"Manage your projects and teams online"

//     return (
//         <Container >
//             <div className="z-51 mt-[-40px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
//                 <Heading
//                     title={title_ }
//                     subtitle={subtitle_}
                  
//                    />


//                 <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
//                     {/* Keep other elements here if any */}
//                     <div className="flex-grow" /> {/* This will push the next element to the far end */}
//                     <div className="flex flex-row">
//                         <Search
//                             setSearchTerm={handleSearch} // Pass handleSearch
//                             searchTerm={searchTerm}
//                             debounce={1500}
//                             placeholderText="Search jobs..." // Added placeholder text
//                         />
//                     </div>
//                 </div>

//             </div>
//             <div className={cn("mt-1 pb-5")}>
//                 <div>
//                     {
//                         fListPage.length > 0 ? (
//                             <div
//                                 className={cn(
//                                     isMobile ? 'grid grid-cols-1' : 'grid grid-cols-1'
//                                 )}
//                             >
//                                 {fListPage.map((job, index) => (
//                                     <div
//                                         className={cn(
//                                             "mb-4", // Add some margin bottom for spacing between cards
//                                              "cursor-pointer" // Cursor based on view mode
//                                         )}
//                                         key={job.id}
//                                     >
//                                         <JobContainer
//                                             job={job}
//                                             jobId={job.id}
//                                             numberOfApplicants={job.jobApplication.length} // Correctly access jobApplication.length
//                                         />
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <div className="col-span-full text-center py-10 min-h-[calc(100vh-200px)] flex items-center justify-center bg-white rounded-lg shadow-md">
//                                 <p className='text-red-500 text-3xl font-semibold'>No jobs found matching your criteria.</p>
//                             </div>
//                         )
//                     }

//                     <div>
//                         {fList && fList.length > 0 && (
//                             <div className="mt-4 max-w-9 flex flex-wrap gap-1">
//                                 {renderPaginationButtons()}
//                             </div>
//                         )}
//                         {!fList && <p>Loading data...</p>}

//                     </div>
//                 </div>
//             </div>
//         </Container>
//     );
// }

// export default JobsClient;