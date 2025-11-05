'use client';
import { useCallback, useState, useEffect, useMemo } from "react"; // Added useMemo
import { useRouter } from "next/navigation";
import { SafeUser } from "../../types";
import Heading from "../../components/Heading"; 
import Search from "../../components/Search"; 
import Container from "../../components/Container"; 
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import Cookies from 'js-cookie';
import { cn } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import useIsMobile from "../../hooks/isMobile";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { createTag } from "@/actions/create-tag";
import { Enquiry } from "@prisma/client";
import Link from "next/link";
import EnquiryRow from "./_components/EnquiryRow";
import { useInboxCountVarStore } from "@/hooks/use-inbox-count";
import Footer from "../../components/Footer";

interface EnquiriesClientProps {
  records: (Enquiry & { isRead: boolean })[]; // Ensure records includes isRead status
  currentUser?: SafeUser | null;
}

const EnquiresClient: React.FC<EnquiriesClientProps> = ({
  records,
  currentUser,
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredrecords, setfilteredrecords] = useState(records);
  const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8); 
  //const [pageCount, setPageCount] = Math.ceil(records?.length / (currentUser ? currentUser.pageSize : 8));
  const [pageCount, setPageCount] = useState(Math.ceil(records?.length / (currentUser ? currentUser.pageSize : 8))); 

  const [itemOffset, setItemOffset] = useState(0);
  const isMobile = useIsMobile();
  const [fList, setFList] = useState(records);
  const [fListPage, setFListPage] = useState<Enquiry[]>([]); 

  const [uniquerecordId, setUniquerecordId] = useState('');

  const {setUnreadMessages}=useInboxCountVarStore();
    

  const handleToggleSelectUniquerecord = (id: string) => {
    if (uniquerecordId?.length == 0) {
      setSearchTerm('');
      setUniquerecordId(id);
    } else {
      setUniquerecordId('');
    }
  };
  
  // Dummy row click handler
  const handleRowClick = (id: string) => {
      router.push(`/archivedEnquiry/${id}`);
  }


  const [category, setCategory] = useState<string>('');

  const { execute } = useAction(updatePagSize, {
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
    },
    onError: (error) => {
      toast.error(error);
    },
  });


  Cookies.set('originString', origin);

  useEffect(() => {
    // filter logic (omitted for brevity)
    let recordsPostTag = records;
    if (uniquerecordId.length > 0) {
      recordsPostTag = records?.filter(x => (x.id == uniquerecordId.trim()));
    }

    if (searchTerm !== "") {
      let arrFirst = searchTerm.split(';');
      const arr = arrFirst.filter(element => element);  

      if (category !== '') {
        let xy = category.split(',');

      }
      const results = recordsPostTag.filter((record) =>
        (
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.first_name?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.last_name?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.message?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )
        )
      );
      setfilteredrecords(results);
      setFList(results); 
      setItemOffset(0); 
    } else {
      setfilteredrecords(recordsPostTag);
      setFList(recordsPostTag); 
      setItemOffset(0); 
    }
  }, [records, category, uniquerecordId, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const { width, height } = useWindowSize();
  const mobileWidth = 400;

  let allowedRoles: String[]
  allowedRoles = [ 'admin', 'manager'];
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
    (
      allowedRoles.some((y) => (
        y.toLowerCase().includes(role.toLowerCase())
      ))
    )
  );

  /* ----------------Pagination------------ */
  type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

  const handlePageSizeChange = (newPageSize: PageSizeOption) => {
    const numericPageSize = parseInt(newPageSize, 10);
    setPageSize(numericPageSize);
    if (currentUser) {
      execute({
        id: currentUser?.id,
        pageSize: numericPageSize
      })
    }
    setItemOffset(0);
  };


  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * pageSize) % fList.length;
    setItemOffset(newOffset);
  };

  const calculatePageSlice = (fList?: Enquiry[], itemOffset?: number, pageSize?: number): Enquiry[] | undefined => {
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

  const renderPaginationButtons = (showPageSize = true) => {
    const buttons = [];

    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, fList.length);
    const paginationSummary = `${startRange}-${endRange} of ${fList.length}`;

    // Summary (always shown)
    buttons.push(
        // Hide on small mobile to save space, but show on larger screens
        <div key="summary" className="text-sm text-gray-600 mr-2 sm:mr-4">
            {paginationSummary}
        </div>
    );
    
    // Page Size Selector (Optional based on prop)
    if (showPageSize) {
        buttons.push(
            <select
                className='h-8 px-2 border-none rounded text-gray-600 text-sm focus:ring-0 cursor-pointer hidden sm:block' // Hide on tiny screens
                value={pageSize}
                key={'pagesize-selector'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            >   <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="24">24</option>
                <option value="32">32</option>
                <option value="48">48</option>
                <option value="60">60</option>
            </select>
        );
    }

    // Next/Previous buttons
    buttons.push(
        <button 
            key="prev"
            onClick={() => handlePageClick({ selected: Math.floor(itemOffset / pageSize) - 1 })}
            disabled={itemOffset === 0}
            className="p-1 mx-1 text-gray-600 hover:bg-gray-200 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
    );
    buttons.push(
        <button 
            key="next"
            onClick={() => handlePageClick({ selected: Math.floor(itemOffset / pageSize) + 1 })}
            disabled={endRange >= fList.length}
            className="p-1 mx-1 text-gray-600 hover:bg-gray-200 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </button>
    );
    
    return <div className="flex items-center">{buttons}</div>;
  };
   
  // --- NEW LOGIC: Calculate Total and Unread Counts ---
  const totalEnquiries = records.length;
  const unreadEnquiries = useMemo(() => {
    const x = records.filter(r => !r.isRead).length;
    setUnreadMessages(x)
    return x
  }, [records]);
  // --- END NEW LOGIC ---

  // Improved Headings for clarity and professionalism
  let title_ = `Enquiries` 
  let subtitle_ = `${fList.length} of ${records.length} total messages.` 


  if (isAllowedAccess?.length == 0) return redirect('/denied')
  if (!currentUser) return redirect('/denied')

  return (
    <>
      <Container>
        
        {/* ------------------------------------------------------------------
          STICKY HEADER/TOOLBAR AREA 
          ------------------------------------------------------------------ */}
        <div className="sticky top-0 w-full bg-white pt-0 pb-0 border-b border-gray-200 shadow-sm"> {/* Reduced pb-2 to pb-0 */}
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl items-center">
              
              {/* Search Bar and Pagination */}
              <div className={cn("flex gap-1 pb-0", isMobile ? 'flex-col' : 'flex-row items-center justify-between')}> {/* Added pb-2 here */}
                  
                  {/* Search bar */}
                <div className="flex-grow max-w-lg w-full -mt-3"> 
                      <Search
                          setSearchTerm={setSearchTerm}
                          searchTerm={searchTerm}
                          option={false}
                      />
                      <div className="flex justify-start text-sm pb-0 pt-0">
                          <p className="text-gray-600 font-medium">
                              Total Archived Enquiries: <span className="text-gray-900">{totalEnquiries}</span>
                          </p>
                          {unreadEnquiries > 0 && (
                              <p className="ml-6 text-red-600 font-bold">
                                  Unread: {unreadEnquiries}
                              </p>
                          )}
                          {unreadEnquiries === 0 && totalEnquiries > 0 && (
                              <p className="ml-6 text-green-600 font-medium">
                                  (All read! 🎉)
                              </p>
                          )}
                      </div>
                  </div> 
                  
                  {/* Pagination Controls - Visible on desktop, minimal on mobile */}
                  <div className="flex-shrink-0 hidden sm:block">
                      {renderPaginationButtons(true)}
                  </div>
              </div>

            

          </div>
        </div>
        
        {/* ------------------------------------------------------------------
          ENQUIRIES LIST 
          ------------------------------------------------------------------
      */}
        <div className={cn("mt-0 pb-5", )}>
          <div>
            {
              (
                <div
                  className={cn(
                    "grid grid-cols-1 space-y-0 border-t border-gray-200" 
                  )}
                >
                  {fListPage.map((record, index) => (
                    <div
                      className="col-span-1" 
                      key={record.id}
                    >
                      <EnquiryRow
                        record={record as Enquiry & { isRead: boolean }} 
                        onClick={handleRowClick}
                      />
                    </div>
                  ))}

                  {/* Empty State Handling (kept concise) */}
                  {fList.length === 0 && (
                      <div className="col-span-1 p-10 text-center bg-white border-b border-gray-100">
                          <p className="text-xl font-bold text-gray-700 mb-2">
                              {searchTerm === "" ? 
                                  "🎉 Inbox is empty." : 
                                  `No enquiries match search: "${searchTerm}"`
                              }
                          </p>
                      </div>
                  )}
                </div>
              )
            }
          </div>
        </div>

      {/* ------------------------------------------------------------------
          MOBILE FOOTER PAGINATION (Always visible on mobile)
          ------------------------------------------------------------------ */}
      <div className="fixed bottom-0 left-0 w-full sm:hidden bg-white border-t border-gray-200 p-2 z-50 shadow-lg">
          <div className="flex justify-center">
               {renderPaginationButtons(false)} {/* Pass false to hide page size selector */}
          </div>
      </div>
      

        <div className="mt-6 mb-20 sm:mb-6">
          <Link href="/#" className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>
      
      </Container>
      {/* <Footer /> */}
    </>
  );
}

export default EnquiresClient;