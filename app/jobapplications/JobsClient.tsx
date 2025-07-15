
/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import { redirect } from "next/navigation";
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
import { Career } from "@prisma/client";
import { JobContainer } from "../job/[jobId]/_components/job-container";

interface JobsClientProps {
  jobs: Career[];
  currentUser?: SafeUser | null;
}

const JobsClient: React.FC<JobsClientProps> = ({
  jobs,
  currentUser,
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJobs, setfilteredJobs] = useState(jobs);
  const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8); // Adjust as needed
  const [pageCount, setPageCount] = useState(Math.ceil(jobs.length / (currentUser ? currentUser.pageSize : 8))); // Initialize based on total jobs
  const [itemOffset, setItemOffset] = useState(0);
  const isMobile = useIsMobile();
  const [fList, setFList] = useState(jobs);
  const [fListPage, setFListPage] = useState<Career[]>([]); // Initialize as empty array of Career

  const [uniqueJobId, setUniqueJobId] = useState('');
  
  
  const handleToggleSelectUniqueJob = (id: string) => {
    //filter only on
    if (uniqueJobId?.length == 0) {//(filteredJobs.length==1){//change logic
      setSearchTerm('');
      setUniqueJobId(id);
      // setUniqueSelection(false)
    } else {
      setUniqueJobId('');
    }
  };

  const [category, setCategory] = useState<string>('');//x==''?null:x)//tag);

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
      //formRef.current?.reset();
    },
    onError: (error) => {
      toast.error(error);
    },
  });


  Cookies.set('originString', origin);

  useEffect(() => {
    // filter
    let jobsPostTag = jobs;
    if (uniqueJobId.length > 0) {
      jobsPostTag = jobs?.filter(x => (x.id == uniqueJobId.trim()));
    }

    if (searchTerm !== "") {
      let arrFirst = searchTerm.split(';');
      const arr = arrFirst.filter(element => element);  // Using arrow function (ES6)

      if (category !== '') {
        let xy = category.split(',');
        
      }
      const results = jobsPostTag.filter((job) =>
        (
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (job.fullDescription.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          //Search Card Title (using shortDescription as title)
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (job?.shortDescription?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          //Search Card Title (using actual title)
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (job?.title?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )
        )
      );
      setfilteredJobs(results);
      setFList(results); // Update fList with filtered results
      setItemOffset(0); // Reset pagination to the first page after filtering
    } else {
      setfilteredJobs(jobsPostTag);
      setFList(jobsPostTag); // Update fList when search term is empty
      setItemOffset(0); // Reset pagination when search term is cleared
    }
  }, [jobs, category, uniqueJobId, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const { width, height } = useWindowSize();
  const mobileWidth = 400;

  let allowedRoles: String[]
  allowedRoles = ['employee', 'admin', 'visitor', 'manager'];
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
    (//Outer bracket ::forEach user role
      allowedRoles.some((y) => (// Allowed Roles
        //Search Card Title
        y.toLowerCase().includes(role.toLowerCase())
      ))// Return clossing bracket
    )// Out bracker
  );
  const popover_content_pos = width ? width < mobileWidth ? 'bottom' : 'right' : 'right';


  /* ----------------Pagination------------ */
  type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options

  const handlePageSizeChange = (newPageSize: PageSizeOption) => {
    // Type assertion (optional, but can improve type safety):
    const numericPageSize = parseInt(newPageSize, 10);
    setPageSize(numericPageSize);
    if (currentUser) {
      execute({
        id: currentUser?.id,
        pageSize: numericPageSize
      })
    }
    setItemOffset(0); // Reset to the first page when page size changes
  };


  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * pageSize) % fList.length;
    setItemOffset(newOffset);
  };

  const calculatePageSlice = (fList?: Career[], itemOffset?: number, pageSize?: number): Career[] | undefined => {
    if (!fList || !pageSize) {
      return undefined;
    }
    const endpoint = Math.min(itemOffset! + pageSize!, fList.length);
    return fList.slice(itemOffset!, endpoint);
  };

  useEffect(() => {
    const pageSlice = calculatePageSlice(fList, itemOffset, pageSize);
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
  }, [fList, pageSize]);

  useEffect(() => {
    setItemOffset(0);
  }, [pageCount]);

  const renderPaginationButtons = () => {
    const buttons = [];
    buttons.push(
      <ReactPaginate
        breakLabel="..."
        // nextLabel="next >"
        containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2" // Tailwind CSS classes
        activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
        previousLabel="«"
        nextLabel="»"
        key={'andgwgw!'}
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={Math.ceil(fList?.length / pageSize) || 0}
        forcePage={Math.floor(itemOffset / pageSize)} // Control the current page
        // previousLabel="< previous"
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
      <div className="z-51 mt-[-40px] flex flex-col  sm:flex-col  justify-between sm:px-1 xs:px-2">
        <Heading
          title={uniqueJobId.length == 0 ? title_ : 'Project View mode. To exit, either click here or on the project image.'}
          subtitle={subtitle_}
          isSetBackground={uniqueJobId?.length > 0 || (origin == 'pinnedprojects') || (origin == 'taggedprojects')}
         
        />


        <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
          {/* Keep other elements here if any */}
          <div className="flex-grow" /> {/* This will push the next element to the far end */}
          <div className="flex flex-row">
            <Search
              setSearchTerm={setSearchTerm}
              searchTerm={searchTerm}
            />
          </div>
        </div>
  
      </div>
      <div className={cn("mt-1 pb-5", uniqueJobId.length == 0 ? '' : 'shadow-xl rounded-md p-1 border-yellow-400 border-2')}>{/* space-y-4 pb-10*/}
        <div>
          {
            (
              <div
                className={cn(
                  // "grid grid-cols-2 lg:grid-cols-4 gap-4",
                  isMobile ? 'grid grid-cols-1' : 'grid grid-cols-1'
                )}
              >
                {fListPage.map((job, index) => (
                  <div
                    className=""
                    key={job.id}
                  >
                   <JobContainer          
                      job={job}
                      jobId={job.id}
                    />
                    
                  </div>
                ))}

                <div>
                  {fList && fList.length > 0 && (
                    <div className="mt-4  max-w-9 flex flex-wrap  gap-1">{renderPaginationButtons()}
                    </div>
                  )}
                  {!fList && <p>Loading data...</p>}

                </div>
              </div>
            )
          }
        </div>
      </div>
    </Container>
  );
}

export default JobsClient;


// app/components/JobApplicationForm.tsx (This path seems incorrect based on previous discussion, should be JobClient.tsx)
// Assume this is app/jobs/JobsClient.tsx or similar

/* eslint-disable @next/next/no-img-element */
// 'use client';

// import { useCallback, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { SafeUser } from "../types";
// import Heading from "../components/Heading"; // Ensure this is styled well
// import Search from "../components/Search"; // Ensure this uses shadcn/ui inputs
// import Container from "../components/Container"; // Should provide max-width and padding
// import { useWindowSize } from "@/hooks/use-screenWidth";
// import Cookies from 'js-cookie';
// import { cn } from "@/lib/utils";
// import ReactPaginate from "react-paginate";
// import useIsMobile from "../hooks/isMobile";
// import { toast } from "sonner";
// import { useAction } from "@/hooks/use-action";
// import { updatePagSize } from "@/actions/update-user-pagesize";
// import { createTag } from "@/actions/create-tag"; // Not directly used in UI improvement, but kept
// import { Career } from "@prisma/client";
// import { JobContainer } from "../job/[jobId]/_components/job-container"; // Ensure this component is well-styled

// // Shadcn UI components for better pagination controls
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton"; // Optional: For loading states

// interface JobsClientProps {
//   jobs: Career[];
//   currentUser?: SafeUser | null;
// }

// const JobsClient: React.FC<JobsClientProps> = ({
//   jobs,
//   currentUser,
// }) => {
//   const router = useRouter();
//   const [deletingId, setDeletingId] = useState(''); // Not used in current UI logic
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredJobs, setFilteredJobs] = useState<Career[]>(jobs); // Explicitly type
//   const [pageSize, setPageSize] = useState<number>(currentUser?.pageSize || 8); // Default to 8 if no user setting
//   const [itemOffset, setItemOffset] = useState(0);
//   const isMobile = useIsMobile(); // Custom hook for mobile detection
//   const [fList, setFList] = useState<Career[]>(jobs); // Filtered list for pagination
//   const [fListPage, setFListPage] = useState<Career[]>([]); // Current page slice of jobs

//   const [uniqueJobId, setUniqueJobId] = useState(''); // For single job view mode
//   const [category, setCategory] = useState<string>(''); // For category filtering, not fully implemented in UI but kept for logic

//   const { execute: updatePageSizeAction } = useAction(updatePagSize, {
//     onSuccess: (data) => {
//       toast.success(`Page size updated to ${data.pageSize}`);
//     },
//     onError: (error) => {
//       toast.error(error);
//     },
//   });

//   // Not directly used in UI, but kept for context
//   const { execute: createTagAction } = useAction(createTag, {
//     onSuccess: (data) => {
//       toast.success(`Tag "${data.name}" created`);
//     },
//     onError: (error) => {
//       toast.error(error);
//     },
//   });

//   Cookies.set('originString', window.location.origin); // Use window.location.origin instead of global 'origin'

//   // Effect for filtering jobs based on search term and uniqueJobId
//   useEffect(() => {
//     let jobsToFilter = jobs;

//     // Apply unique job filter first
//     if (uniqueJobId.length > 0) {
//       jobsToFilter = jobs.filter(x => x.id === uniqueJobId.trim());
//     }

//     // Apply search term filter
//     if (searchTerm !== "") {
//       const searchTermsArray = searchTerm.split(';').filter(Boolean); // Filter out empty strings
//       const results = jobsToFilter.filter((job) =>
//         searchTermsArray.some(term => {
//           const individualTerms = term.split(',').map(s => s.trim().toLowerCase());
//           return (
//             (job.fullDescription?.toLowerCase().includes(individualTerms.join(' ')) || // Search full description
//              job.shortDescription?.toLowerCase().includes(individualTerms.join(' ')) || // Search short description
//              job.title?.toLowerCase().includes(individualTerms.join(' ')) || // Search title
//              job.location?.toLowerCase().includes(individualTerms.join(' ')) || // Search location
//              job.department?.toLowerCase().includes(individualTerms.join(' ')) || // Search department
//              job.type?.toLowerCase().includes(individualTerms.join(' '))
//             ) // Search type
//           );
//         })
//       );
//       setFList(results);
//     } else {
//       setFList(jobsToFilter); // When search is empty, fList is jobs filtered by uniqueJobId
//     }

//     setItemOffset(0); // Always reset pagination to the first page after filtering
//   }, [jobs, uniqueJobId, searchTerm]); // Removed 'category' as it's not used in current filtering logic

//   const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(event.target.value);
//   }, []);

//   // Removed useWindowSize as `isMobile` hook is sufficient for conditional rendering
//   // If `popover_content_pos` is still needed based on exact width, re-add `useWindowSize`

//   // Define valid page size options (numeric values for Select)
//   const pageSizeOptions = [8, 16, 24, 32, 48, 60];

//   const handlePageSizeChange = useCallback((value: string) => {
//     const numericPageSize = parseInt(value, 10);
//     setPageSize(numericPageSize);
//     if (currentUser) {
//       updatePageSizeAction({
//         id: currentUser.id,
//         pageSize: numericPageSize
//       });
//     }
//     setItemOffset(0); // Reset to the first page when page size changes
//   }, [currentUser, updatePageSizeAction]);


//   const handlePageClick = useCallback((event: { selected: number }) => {
//     const newOffset = (event.selected * pageSize) % fList.length;
//     setItemOffset(newOffset);
//   }, [pageSize, fList.length]);

//   // Calculate the slice of jobs for the current page
//   useEffect(() => {
//     const endpoint = Math.min(itemOffset + pageSize, fList.length);
//     setFListPage(fList.slice(itemOffset, endpoint));
//   }, [itemOffset, fList, pageSize]);

//   // Update page count when fList or pageSize changes
//   const pageCount = Math.ceil(fList.length / pageSize) || 0; // Calculate directly here

//   // Reset itemOffset when pageCount changes (e.g., when search results change dramatically)
//   useEffect(() => {
//     setItemOffset(0);
//   }, [pageCount]);


//   // Helper for single job view mode toggle
//   const handleToggleUniqueJobView = useCallback((id: string) => {
//     setUniqueJobId(prevId => prevId === id ? '' : id); // Toggle on/off
//     setSearchTerm(''); // Clear search when toggling unique job view
//   }, []);

//   const title_ = uniqueJobId.length === 0
//     ? `Available Jobs (${fList.length} of ${jobs.length})`
//     : 'Viewing Single Job'; // Clearer title for unique job view
//   const subtitle_ = "Discover exciting career opportunities";

//   return (
//     <Container className="py-8"> {/* Added vertical padding */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         {/* Heading Section */}
//         <div className="flex-1">
//           <Heading
//             title={title_}
//             subtitle={subtitle_}
//             isSetBackground={uniqueJobId?.length > 0} // Conditionally set background for unique view
//             // onClick={uniqueJobId.length > 0 ? () => handleToggleUniqueJobView('') : undefined} // Click to exit unique view
//             // className={uniqueJobId.length > 0 ? "cursor-pointer hover:opacity-80 transition" : ""}
//           />
//           {uniqueJobId.length > 0 && (
//             <p className="text-sm text-gray-500 mt-1">
//               Click the title or the job card to exit single job view.
//             </p>
//           )}
//         </div>

//         {/* Search Bar */}
//         <div className="w-full sm:w-1/3 min-w-[250px]"> {/* Control width of search */}
//           <Search
//             setSearchTerm={setSearchTerm
//               // handleSearch
//             } // Pass the handler
//             searchTerm={searchTerm}
//             // placeholder="Search jobs by title, description, location..."
//           />
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className={cn(
//         "mt-4 pb-5 transition-all duration-300",
//         uniqueJobId.length > 0 ? 'shadow-xl rounded-lg p-4 border-2 border-blue-400 bg-white' : ''
//       )}>
//         {/* Conditional rendering for no jobs or no results */}
//         {fList.length === 0 && searchTerm !== "" && (
//           <p className="text-center text-gray-500 text-lg py-10">
//             No jobs found matching ${searchTerm}. Try a different search term.
//           </p>
//         )}
//          {fList.length === 0 && searchTerm === "" && ( // For when there are simply no jobs at all
//           <p className="text-center text-gray-500 text-lg py-10">
//             No job postings available at the moment. Please check back later!
//           </p>
//         )}

//         {/* Job Listings Grid */}
//         {fList.length > 0 && (
//           <div
//             className={cn(
//               "grid gap-6",
//               isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2',
//               uniqueJobId.length > 0 ? 'max-w-xl mx-auto' : '' // Center single job in desktop view
//             )}
//           >
//             {fListPage.length > 0 ? (
//               fListPage.map((job) => (
//                 <JobContainer
//                   key={job.id}
//                   job={job}
//                   jobId={job.id}
//                   // onClick={() => handleToggleUniqueJobView(job.id)} // Make job container clickable for single view
//                 />
//               ))
//             ) : (
//               // Loading Skeleton or specific "no jobs on this page" message
//               <div className="col-span-full text-center text-gray-500 py-4">
//                 Loading jobs...
//                 {/* Or a more complex skeleton */}
//                 <Skeleton className="h-48 w-full mt-4" />
//               </div>
//             )}
//           </div>
//         )}

//         {/* Pagination Controls */}
//         {fList.length > 0 && pageCount > 1 && ( // Only show pagination if there are items and more than one page
//           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 px-2 sm:px-0">
//             <ReactPaginate
//               breakLabel="..."
//               containerClassName="flex items-center space-x-2 border border-gray-300 rounded-md p-2 shadow-sm"
//               pageLinkClassName="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
//               previousLinkClassName="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
//               nextLinkClassName="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
//               activeLinkClassName="bg-blue-500 text-white hover:bg-blue-600"
//               disabledClassName="opacity-50 cursor-not-allowed"
//               previousLabel="« Previous"
//               nextLabel="Next »"
//               onPageChange={handlePageClick}
//               pageRangeDisplayed={isMobile ? 2 : 3} // Fewer page numbers on mobile
//               marginPagesDisplayed={1}
//               pageCount={pageCount}
//               forcePage={Math.floor(itemOffset / pageSize)}
//             />

//             <Select onValueChange={handlePageSizeChange} value={String(pageSize)}>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Items per page" />
//               </SelectTrigger>
//               <SelectContent>
//                 {pageSizeOptions.map((option) => (
//                   <SelectItem key={option} value={String(option)}>
//                     {option} per page
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         )}
//       </div>
//     </Container>
//   );
// }

// export default JobsClient;