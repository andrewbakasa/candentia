// Inside EnquiresClient.tsx

'use client';
import { useCallback, useState, useEffect, useMemo } from "react"; 
import { useRouter } from "next/navigation";
import { SafeUser } from "../../types";
import Search from "../../components/Search"; 
import Container from "../../components/Container"; 
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import useIsMobile from "../../hooks/isMobile";
import { Enquiry } from "@prisma/client";
import Link from "next/link";
//import EnquiryRow from "./_components/EnquiryRow"; 
import { useInboxCountVarStore } from "@/hooks/use-inbox-count";
import { FaArchive } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Better icons for navigation
import EnquiryRow from "./_components/EnquiryRow";
//import EnquiryRow from "../_components/EnquiryRow";

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
    // Determine the actual current user and records
    // const records = propRecords;
    // const currentUser = propCurrentUser;
    
    // --- State and Hooks ---
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredrecords, setfilteredrecords] = useState(records);
    const [pageSize, setPageSize] = useState(currentUser ? currentUser.pageSize : 8); 
    const isMobile = useIsMobile();
    const [fList, setFList] = useState(records);
    const [fListPage, setFListPage] = useState<Enquiry[]>([]); 
    const [itemOffset, setItemOffset] = useState(0);
    const [pageCount, setPageCount] = useState(Math.ceil(records?.length / (currentUser ? currentUser.pageSize : 8))); 
    // The following were unused in the original code, but kept for context:
    const [uniquerecordId, setUniquerecordId] = useState('');
    const {setUnreadMessages} = useInboxCountVarStore();
    const [category] = useState('');


    // --- Access Control Check ---
    const allowedRoles = [ 'admin', 'manager'];
    const isAllowedAccess = currentUser?.roles.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    );

    // If access is denied, use the mock router push instead of redirect
    useEffect(() => {
        if (!isAllowedAccess || !currentUser) {
            router.push('/denied');
        }
    }, [isAllowedAccess, currentUser, router]);


    // --- Action Handlers ---
    const handleRowClick = useCallback((id: any) => {
        // Mock navigation to the detail page
        router.push(`/archivedEnquiry/${id}`);
    }, [router]);


    // --- Filtering Logic ---
    useEffect(() => {
        let recordsPostTag = records;
        if (uniquerecordId.length > 0) {
            recordsPostTag = records?.filter(x => (x.id === uniquerecordId.trim()));
        }

        if (searchTerm !== "") {
            // Simplified search logic for readability in this context
            const lowerSearchTerm = searchTerm.toLowerCase();
            const results = recordsPostTag.filter((record) =>
                record?.first_name?.toLowerCase().includes(lowerSearchTerm) ||
                record?.last_name?.toLowerCase().includes(lowerSearchTerm) ||
                record?.email?.toLowerCase().includes(lowerSearchTerm) ||
                record?.message?.toLowerCase().includes(lowerSearchTerm)
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

    // --- Pagination Logic ---

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        // Update user preference mock here if needed:
        // if (currentUser) { saveUserPageSize(currentUser.id, numericPageSize); }
        setItemOffset(0);
    }, []);


    const handlePageClick = useCallback((selectedPage: number) => {
        const newOffset = (selectedPage * pageSize) % fList.length;
        setItemOffset(newOffset);
    }, [pageSize, fList.length]);


    const calculatePageSlice = useCallback(() => {
        if (!fList || fList.length === 0) return [];
        const endpoint = Math.min(itemOffset + pageSize, fList.length);
        return fList.slice(itemOffset, endpoint);
    }, [fList, itemOffset, pageSize]);

    useEffect(() => {
        const pageSlice = calculatePageSlice();
        setFListPage(pageSlice);
    }, [itemOffset, fList, pageSize, calculatePageSlice]);

    useEffect(() => {
        if (fList && pageSize) {
            const newPageCount = Math.ceil(fList.length / pageSize);
            if (pageCount !== newPageCount) {
                setPageCount(newPageCount);
            }
        }
    }, [fList, pageSize]);

    useEffect(() => {
        // Reset offset when page count changes (e.g., after filtering/page size change)
        setItemOffset(0);
    }, [pageCount]);


    // --- Count Calculations ---
    const totalEnquiries = records.length;
    const unreadEnquiries = useMemo(() => {
        const x = records.filter(r => !r.isRead).length;
        setUnreadMessages(x) // Mock store update
        return x
    }, [records, setUnreadMessages]);

    // --- Render Pagination Buttons ---
    const renderPaginationButtons = (showPageSize = true) => {
        const startRange = itemOffset + 1;
        const endRange = Math.min(itemOffset + pageSize, fList.length);
        const paginationSummary = `${startRange}-${endRange} of ${fList.length}`;
        const currentPage = Math.floor(itemOffset / pageSize);

        return (
            <div className="flex items-center space-x-2">
                
                {/* Summary */}
                <div key="summary" className={cn("text-sm mr-2 sm:mr-4 font-semibold", NAVY_BLUE)}>
                    {paginationSummary}
                </div>
                
                {/* Page Size Selector (Desktop Only) */}
                {showPageSize && (
                    <select
                        className={cn(
                            'h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFD700] cursor-pointer', 
                            NAVY_BLUE, "hidden md:block"
                        )}
                        value={pageSize}
                        key={'pagesize-selector'}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                    >   
                        <option value="4">4 per page</option>
                        <option value="8">8 per page</option>
                        <option value="16">16 per page</option>
                        <option value="32">32 per page</option>
                    </select>
                )}

                {/* Previous button */}
                <button 
                    key="prev"
                    onClick={() => handlePageClick(currentPage - 1)}
                    disabled={itemOffset === 0}
                    // Apply Gold hover
                    className={cn(
                        "p-2 rounded-full transition duration-150 disabled:text-gray-300 disabled:hover:bg-transparent", 
                        "text-gray-600 hover:bg-gray-100 hover:text-[#FFD700]"
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next button */}
                <button 
                    key="next"
                    onClick={() => handlePageClick(currentPage + 1)}
                    disabled={endRange >= fList.length}
                    // Apply Gold hover
                    className={cn(
                        "p-2 rounded-full transition duration-150 disabled:text-gray-300 disabled:hover:bg-transparent", 
                        "text-gray-600 hover:bg-gray-100 hover:text-[#FFD700]"
                    )}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    // Only render the component if access is allowed
    if (!isAllowedAccess || !currentUser) {
        return <div className="p-10 text-center text-red-500">Access Denied.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
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
                <div className="mt-14 sm:mt-6 pb-20 sm:pb-10">
                
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                        {/* List */}
                        <div className="grid grid-cols-1 divide-y divide-gray-100">
                            {fListPage.map((record) => (
                                <div className="col-span-1" key={record.id}>
                                    <EnquiryRow
                                        record={record} 
                                        onClick={handleRowClick}
                                    />
                                </div>
                            ))}

                            {/* Empty State Handling */}
                            {fList.length === 0 && (
                                <div className="col-span-1 p-10 text-center bg-white rounded-xl">
                                    <FaArchive className={cn("w-10 h-10 mx-auto mb-4", GOLD_ACCENT)} />
                                    <p className={cn("text-xl font-bold mb-2", NAVY_BLUE)}>
                                        {searchTerm === "" ? 
                                            "Archive is empty." : 
                                            `No archived enquiries match search: "${searchTerm}"`
                                        }
                                    </p>
                                    <p className="text-gray-500">
                                        Time to get back to the main inbox!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MOBILE FOOTER PAGINATION */}
                <div className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-gray-200 p-2 z-50 shadow-2xl">
                    <div className="flex justify-center">
                        {renderPaginationButtons(false)} 
                    </div>
                </div>
            </Container>
            
            {/* Footer Links (Moved outside Container for full width feel) */}
            <div className="py-4 sm:py-6 bg-gray-100 border-t border-gray-200 mt-auto">
                <Container>
                    {/* Back to Home Button */}
                    <button 
                        onClick={() => router.push('/')}
                        className={cn(
                            "inline-flex items-center font-medium py-2.5 px-6 rounded-full transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 text-white",
                            `${NAVY_BG} hover:bg-[#0a3154] focus:ring-[#FFD700]`
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Home
                    </button>
                </Container>
            </div>
        </div>
    );
}

export default EnquiresClient;