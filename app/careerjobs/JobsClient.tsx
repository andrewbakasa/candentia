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