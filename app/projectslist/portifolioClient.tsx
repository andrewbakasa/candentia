
/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeBoard, SafeUser } from "../types";
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
import { Career, JobApplication } from "@prisma/client";
// Import Draft.js components
import { CompositeDecorator, Editor, EditorState, ContentState, convertFromRaw } from "draft-js";
import Link from 'next/link';
//import { SafeBoard } from "@/types";

import { Prisma } from '@prisma/client';


const getTextFromEditor3 = (item: any): ContentState => {
  if (item && item.description) {
    try {
      // Attempt to parse as Draft.js raw content
      const rawContent = JSON.parse(item.description);
      // Check if it looks like Draft.js raw content (has blocks and entityMap)
      if (rawContent.blocks && Array.isArray(rawContent.blocks)) {
        return convertFromRaw(rawContent);
      }
    } catch (e) {
      // If parsing fails or it's not raw content, treat as plain text
      // console.warn("Description is not valid Draft.js raw content, treating as plain text:", e);
    }
    // Fallback: treat as plain text
    return ContentState.createFromText(item.description);
  }
  return ContentState.createFromText(''); // Return empty content if no description
};

 // Utility to extract plain text from Draft.js content or treat as string
    const getPlainText = (description: string | null | undefined): string => {
        if (!description) {
            return '';
        }
        try {
            // Check if it's Draft.js raw JSON
            const rawContent = JSON.parse(description);
            if (rawContent.blocks && Array.isArray(rawContent.blocks)) {
                // Join block text to get the plain text content
                return rawContent.blocks.map((block: any) => block.text).join(' ');
            }
        } catch (e) {
            // Not valid JSON or not Draft.js content, treat as plain text
        }
        return description;
    };

// Corrected interface to include jobApplication array on Career
interface JobsClientProps {
    portifolios: any[];
    currentUser?: SafeUser | null;
}


const PortifolioClient: React.FC<JobsClientProps> = ({
    portifolios,
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
    const [fList, setFList] = useState(portifolios); // fList now holds the filtered/searched jobs
    const [fListPage, setFListPage] = useState<any[]>([]); // Current page's jobs

    const [uniqueJobId, setUniqueJobId] = useState('');

    const [category, setCategory] = useState<string>(''); // This state is declared but not used in the filter logic below
    const [compositeDecorator] = useState(new CompositeDecorator([]));

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
        let currentPortifolios = portifolios;

        if (uniqueJobId.length > 0) {
            currentPortifolios = currentPortifolios.filter(x => x.id === uniqueJobId.trim());
        }

       if (searchTerm !== "") {
            // Split search terms by ';' for OR logic (any term must match)
            const searchPhrases = searchTerm.split(';').filter(Boolean).map(s => s.trim().toLowerCase());

            currentPortifolios = currentPortifolios.filter((list) => {
                // Check if ANY search phrase matches ANY part of the board data structure
                return searchPhrases.some((phrase) => {
                    // Split the phrase by ',' for AND logic (all sub-terms must match)
                    const subTerms = phrase.split(',').filter(Boolean).map(t => t.trim());

                    // Function to check if ALL sub-terms are included in a given text
                    const matchesAllSubTerms = (text: string | null | undefined): boolean => {
                        if (!text) return false;
                        const lowerText = text.toLowerCase();
                        return subTerms.every(term => lowerText.includes(term));
                    };

                    // A board matches if:
                    // 1. Board Title matches ALL sub-terms
                    if (matchesAllSubTerms(list.title)) {
                        return true;
                    }

                     if (matchesAllSubTerms(list.description)) {
                        return true;
                    }

                   

                    return false; // No match for this search phrase
                });
            });
        }
        console.log("currentPortifolios", currentPortifolios)

        setFList(currentPortifolios);
        setItemOffset(0); // Reset pagination to the first page after filtering/searching
    }, [portifolios, uniqueJobId, searchTerm]); // Removed `category` from dependencies as it's not used in the filter logic.

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
    const calculatePageSlice = (list: any[], offset: number, size: number): any[] => {
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

    let title_ = `Project ${fList.length} of ${portifolios.length}`
    let subtitle_ = "Portifolio you might follow" //"Manage your projects and teams online"

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
                            placeholderText="Search projects..."
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
                                {fListPage.map((item, index) => (
                                   <div
                                                   key={item.id} // Use a unique key for each item, essential for React lists
                                                   className="bg-white transition-all ease-in-out duration-400 overflow-hidden text-gray-700 hover:scale-105 rounded-lg shadow-2xl p-3 flex flex-col justify-between"
                                                 >
                                                   <div className="m-2 text-justify text-sm flex-grow flex flex-col">
                                                     <h4 className="font-semibold my-4 text-lg md:text-xl text-center mb-4 h-12">
                                                       {item.title}
                                                     </h4>
                                                     {/* Container for the Editor with fixed height and overflow hidden to limit content */}
                                                     <div className="relative h-32 overflow-hidden mb-4">
                                                      <Editor
                                                         // Create EditorState from the content generated by getTextFromEditor3
                                                         editorState={EditorState.createWithContent(getTextFromEditor3(item), compositeDecorator)}
                                                         readOnly // Ensure the editor is not editable
                                                         onChange={() => {}} // Dummy function for onChange, required by Draft.js Editor
                                                       />
                                                       {/* Gradient overlay to visually indicate truncated content */}
                                                       <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"></div>
                                                     </div>
                                   
                                                     <div className="flex justify-center mt-auto"> {/* mt-auto pushes the button to the bottom */}
                                                       <Link
                                                         href={`/m/${item.id}`} // Link to a detail page for the full content
                                                         className="w-full inline-flex items-center justify-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                       >
                                                         Learn More {/* Generic call to action for more details */}
                                                         <svg
                                                           className="w-4 h-4 ml-2" // Increased left margin for better spacing
                                                           xmlns="http://www.w3.org/2000/svg"
                                                           viewBox="0 0 20 20"
                                                           fill="currentColor"
                                                         >
                                                           <path
                                                             fillRule="evenodd"
                                                             d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                                             clipRule="evenodd"
                                                           ></path>
                                                         </svg>
                                                       </Link>
                                                     </div>
                                                   </div>
                                                 </div>
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full text-center py-16 min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 rounded-lg shadow-inner border border-gray-200"> {/* Improved styling for no jobs message */}
                                <p className='text-red-500 text-3xl font-semibold'>No projects found matching your criteria.</p>
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

export default PortifolioClient;