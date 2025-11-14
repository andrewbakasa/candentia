// Inside EnquiresClient.tsx

'use client';
import { useCallback, useState, useEffect, useMemo } from "react"; 
import { useRouter } from "next/navigation";
import { SafeUser } from "../types";
import Search from "../components/Search"; 
import Container from "../components/Container"; 
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import useIsMobile from "../hooks/isMobile";
import { Enquiry } from "@prisma/client";
import Link from "next/link";
import EnquiryRow from "./_components/EnquiryRow"; 
import { useInboxCountVarStore } from "@/hooks/use-inbox-count";
import { FaArchive } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Better icons for navigation
import { updatePagSize } from "@/actions/update-user-pagesize";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";
//import EnquiryRow from "../(admin_route)/archivedEnquiries/_components/EnquiryRow";

// Define custom Tailwind classes (assuming they are in tailwind.config.js)
const NAVY_BLUE = 'text-[#001F3F]';
const NAVY_BG = 'bg-[#001F3F]';
const NAVY_HOVER_BG = 'hover:bg-[#0a3154]';
const GOLD_ACCENT = 'text-[#FFD700]';
const GOLD_BG = 'bg-[#FFD700]';
const GOLD_HOVER_BG = 'hover:bg-[#e0b800]';


interface EnquiriesClientProps {
  records: (Enquiry & { isRead: boolean })[]; // Ensure records includes isRead status
  currentUser?: SafeUser | null;
}

const EnquiresClient: React.FC<EnquiriesClientProps> = ({
  records,
  currentUser,
}) => {
  // ... (Existing State & Hooks remain unchanged for functionality)
  const router = useRouter();
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredrecords, setfilteredrecords] = useState(records);
  const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8); 
  const [pageCount, setPageCount] = useState(Math.ceil(records?.length / (currentUser ? currentUser.pageSize : 8))); 
  const [itemOffset, setItemOffset] = useState(0);
  const isMobile = useIsMobile();
  const [fList, setFList] = useState(records);
  const [fListPage, setFListPage] = useState<Enquiry[]>([]); 
  const [uniquerecordId, setUniquerecordId] = useState('');
  const {setUnreadMessages}=useInboxCountVarStore();
  const [category, setCategory] = useState<string>('');
   // Action to update user page size
    const { execute, fieldErrors } = useAction(updatePagSize, {
        onSuccess: (data) => {
            toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

  // ... (handleToggleSelectUniquerecord, handleRowClick, useAction hooks remain unchanged)
    
  const handleRowClick = (id: string) => {
      router.push(`/enquiry/${id}`);
  }

// --- (Existing useEffect/Filtering Logic remains unchanged) ---

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

// --- (Pagination Logic remains unchanged) ---

  type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

//   const handlePageSizeChange = (newPageSize: PageSizeOption) => {
//     const numericPageSize = parseInt(newPageSize, 10);
//     setPageSize(numericPageSize);
//     if (currentUser) {
//       // execute action...
//     }
//     setItemOffset(0);
//   };

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

// --- (renderPaginationButtons is significantly updated for Navy/Gold theme) ---
  const renderPaginationButtons = (showPageSize = true) => {
    const buttons = [];

    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, fList.length);
    const paginationSummary = `${startRange}-${endRange} of ${fList.length}`;

    // Summary (always shown)
    buttons.push(
        <div key="summary" className={cn("text-sm mr-2 sm:mr-4", NAVY_BLUE, "font-semibold")}>
            {paginationSummary}
        </div>
    );
    
    // Page Size Selector (Optional based on prop)
    if (showPageSize) {
        buttons.push(
            <select
                // Styled with Navy text and subtle border
                className={cn('h-8 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gold cursor-pointer hidden sm:block', NAVY_BLUE)}
                value={pageSize}
                key={'pagesize-selector'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            >   <option value="4">4 per page</option>
                <option value="8">8 per page</option>
                <option value="16">16 per page</option>
                <option value="24">24 per page</option>
                <option value="32">32 per page</option>
                <option value="48">48 per page</option>
                <option value="60">60 per page</option>
            </select>
        );
    }

    // Previous button
    buttons.push(
        <button 
            key="prev"
            onClick={() => handlePageClick({ selected: Math.floor(itemOffset / pageSize) - 1 })}
            disabled={itemOffset === 0}
            className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 hover:${GOLD_ACCENT}`)}
        >
            <ChevronLeft className="w-5 h-5" />
        </button>
    );
    // Next button
    buttons.push(
        <button 
            key="next"
            onClick={() => handlePageClick({ selected: Math.floor(itemOffset / pageSize) + 1 })}
            disabled={endRange >= fList.length}
            className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 hover:${GOLD_ACCENT}`)}
        >
            <ChevronRight className="w-5 h-5" />
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
 let allowedRoles: String[]
  allowedRoles = [ 'admin', 'manager'];
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
    (
      allowedRoles.some((y) => (
        y.toLowerCase().includes(role.toLowerCase())
      ))
    )
  );


  if (isAllowedAccess?.length == 0) return redirect('/denied')
  if (!currentUser) return redirect('/denied')

  return (
    <>
      <Container>
         {/* Sticky Header with Navy Blue/Gold Styling */}
                {/* <div className="sticky top-0 w-full bg-white pt-4 pb-3 border-b-4 shadow-md z-10" style={{ borderColor: '#FFD700' }}> */}
                 <div  className="sticky w-full bg-white pt-4 pb-3 border-b-4 shadow-md z-10 mt-[-100px] sm:mt-[-60px]"      style={{ borderColor: '#FFD700', top: '60px' }}>
                    <div className="mx-auto px-0 sm:px-0 lg:px-0 max-w-7xl">
                        
                        {/* <h1 className={cn("text-3xl font-extrabold mb-4 px-4 sm:px-6", NAVY_BLUE)}>Archived Enquiries</h1> */}

                        {/* Search Bar, Stats, and Pagination */}
                        <div className={cn("flex gap-4 px-4 sm:px-6", isMobile ? 'flex-col' : 'flex-row items-center justify-between')}>
                            
                            {/* Search bar and Counts */}
                            <div className="flex-grow w-full md:max-w-lg"> 
                                <Search
                                    setSearchTerm={setSearchTerm}
                                    searchTerm={searchTerm}
                                    option={false}
                                />
                                
                                {/* Stats Display */}
                                <div className="flex justify-start text-sm pt-3 space-x-6">
                                    <p className={cn("font-medium text-gray-700")}>
                                        Total: <span className="font-bold">{totalEnquiries}</span>
                                    </p>
                                    
                                    {unreadEnquiries > 0 && (
                                        <p className={cn("font-bold", GOLD_ACCENT)}>
                                            Unread: {unreadEnquiries} 
                                        </p>
                                    )}
                                    {unreadEnquiries === 0 && totalEnquiries > 0 && (
                                        <p className="text-green-600 font-medium">
                                            (All read! 🎉)
                                        </p>
                                    )}
                                </div>
                            </div> 
                            
                            {/* Pagination Controls (Desktop) */}
                            <div className="flex-shrink-0 hidden md:block">
                                {renderPaginationButtons(true)}
                            </div>
                        </div>
                    </div>
                </div>
        
        {/* ENQUIRIES LIST CONTAINER */}
        <div className="mt-0 pb-10">
    
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {
              (
                <div
                  className="grid grid-cols-1 divide-y divide-gray-200"
                >
                  {fListPage.map((record, index) => (
                    <div
                      className="col-span-1" 
                      key={record.id}
                    >
                      <EnquiryRow
                        record={record as Enquiry & { isRead: boolean }} 
                        onClick={handleRowClick}
                        itemNum={index+1}
                      />
                    </div>
                  ))}

                  {/* Empty State Handling */}
                  {fList.length === 0 && (
                      <div className="col-span-1 p-10 text-center bg-white">
                          <p className={cn("text-xl font-bold mb-2", NAVY_BLUE)}>
                              {searchTerm === "" ? 
                                  "🎉 Inbox is empty. Great work!" : 
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

      {/* MOBILE FOOTER PAGINATION */}
      <div className="fixed bottom-0 left-0 w-full sm:hidden bg-white border-t border-gray-200 p-2 z-50 shadow-lg">
          <div className="flex justify-center">
               {renderPaginationButtons(false)} 
          </div>
      </div>
      
 {/*  i need the botton div  with two buttons to move up 50px in mobile */}
        {/* Footer Links - Styled with Navy and Gold */}
{/*         <div className={cn("p-4 sm:p-6 flex space-x-3", isMobile && "mt-[-150px]")}> */}
        <div className={cn("p-4 sm:p-6 flex space-x-3 pb-5 mb-10")}>
          {/* Back to Home Button */}
          <Link href="/#" 
            className={cn(
                "inline-flex items-center font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                `bg-gray-100 ${NAVY_BLUE} hover:bg-gray-200 focus:ring-gold`
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          {/* Archived Mails Button - Prominent Navy/Gold Styling */}
        <button
            onClick={() => {router.push("/archivedEnquiries", { refresh: true } as any)}}                      
            className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                `${NAVY_BG} text-white ${NAVY_HOVER_BG} focus:ring-gold` // Navy background, white text
            )}
        >
            <FaArchive className={cn("w-4 h-4 mr-2", GOLD_ACCENT)} /> {/* Gold icon accent */}
             Archived Mails
        </button>
        </div>
      
      </Container>
    </>
  );
}

export default EnquiresClient;