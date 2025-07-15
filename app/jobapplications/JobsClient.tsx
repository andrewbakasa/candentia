/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types"; // Assuming SafeUser is defined elsewhere
import Heading from "../components/Heading";
import Search from "../components/Search"; // This will need adjustments for application-specific search
import Container from "../components/Container";
import { cn } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import useIsMobile from "../hooks/isMobile";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize"; // Still relevant for user preferences
// import { createTag } from "@/actions/create-tag"; // Less likely to be directly used here for applications
// import { PageView } from "./_components/page-view"; // This might be a specific component for job openings, consider its relevance
import { JobApplication, Career, User } from "@prisma/client"; // Import JobApplication, Career, User
import { JobApplicationContainer } from "./_components/job-application-container";
import { useWindowSize } from "@/hooks/use-screenWidth";
//import { JobApplicationContainer } from "./[jobApplicationId]/_components/job-application-container"; // New component for displaying applications

// Extend JobApplication type to include relations if they are fetched by getJobApplications
interface JobApplicationWithRelations extends JobApplication {
    career?: Career | null; // The job opening this application is for
    user?: User | null;     // The user who submitted this application
}

interface JobApplicationsClientProps {
    jobApplications: any[];//JobApplicationWithRelations[]; // Changed from jobs to jobApplications
    currentUser?: SafeUser | null;
}

const JobApplicationsClient: React.FC<JobApplicationsClientProps> = ({
    jobApplications, // Changed prop name
    currentUser,
}) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState(''); // Keep if you have delete functionality
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredApplications, setFilteredApplications] = useState(jobApplications); // Renamed state
    const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8);
    const [pageCount, setPageCount] = useState(Math.ceil(jobApplications.length / (currentUser ? currentUser.pageSize : 8)));
    const [itemOffset, setItemOffset] = useState(0);
    const isMobile = useIsMobile();
    const [fList, setFList] = useState(jobApplications);
    const [fListPage, setFListPage] = useState<JobApplicationWithRelations[]>([]); // Renamed and typed

    // `uniqueJobId` doesn't make sense for applications directly.
    // Perhaps `uniqueApplicationId` for a detailed view, or `filterByJobId`?
    // Let's replace it with `selectedApplicationId` for single application view.
    const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');

    // Renamed for clarity - this is for filtering by a specific application ID
    const handleToggleSelectApplication = (id: string) => {
        if (selectedApplicationId === id) { // If clicking the same one, deselect
            setSelectedApplicationId('');
            setSearchTerm(''); // Clear search when deselecting single view
        } else {
            setSelectedApplicationId(id);
            setSearchTerm(''); // Clear search when selecting a single view
        }
    };

    // `category` might be used for filtering by application status, or job department
    const [statusFilter, setStatusFilter] = useState<string>(''); // Example: "PENDING", "REVIEWED"

    const { execute, fieldErrors } = useAction(updatePagSize, {
        onSuccess: (data) => {
            toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // `createTag` action is likely not relevant for a list of applications
    // const { execute: executeTag } = useAction(createTag, { /* ... */ });

    // No need for Cookies.set('originString', origin); unless you have a specific use case

    useEffect(() => {
        let currentApplications = jobApplications;

        // 1. Filter by selectedApplicationId if one is active
        if (selectedApplicationId.length > 0) {
            currentApplications = currentApplications.filter(app => app.id === selectedApplicationId);
        }

        // 2. Filter by status
        if (statusFilter !== '') {
            currentApplications = currentApplications.filter(app => app.status === statusFilter);
        }

        // 3. Filter by search term
        if (searchTerm !== "") {
            const searchTermsArray = searchTerm.split(';').filter(Boolean); // Split by ';', remove empty strings

            const results = currentApplications.filter((app) =>
                searchTermsArray.some((term) => {
                    const lowerCaseTerm = term.trim().toLowerCase();
                    // Search by applicant name (if user is included)
                    if (app.user?.name?.toLowerCase().includes(lowerCaseTerm)) return true;
                    // Search by applicant email (if user is included)
                    if (app.user?.email?.toLowerCase().includes(lowerCaseTerm)) return true;
                    // Search by job title (if career is included)
                    if (app.career?.title?.toLowerCase().includes(lowerCaseTerm)) return true;
                    // Search by cover letter content (if present)
                    if (app.coverLetterText?.toLowerCase().includes(lowerCaseTerm)) return true;
                    // Search by application ID
                    if (app.id.toLowerCase().includes(lowerCaseTerm)) return true;
                    return false;
                })
            );
            currentApplications = results;
        }

        setFilteredApplications(currentApplications);
        setFList(currentApplications); // Update fList with the final filtered results
        setItemOffset(0); // Reset pagination to the first page after filtering
    }, [jobApplications, selectedApplicationId, statusFilter, searchTerm]);


    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // No direct use of `width` and `height` from `useWindowSize` here for popover position,
    // but keep `isMobile` if needed for responsive grid layout.
    const { width } = useWindowSize(); // Keep width for responsive adjustments if needed
    const mobileWidth = 400; // Define mobile breakpoint



    /* ----------------Pagination------------ */
    type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

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

    // Ensure type safety for calculatePageSlice
    const calculatePageSlice = (
        list: JobApplicationWithRelations[] | undefined,
        offset: number | undefined,
        size: number | undefined
    ): JobApplicationWithRelations[] => {
        if (!list || !size || offset === undefined) {
            return [];
        }
        const endpoint = Math.min(offset + size, list.length);
        return list.slice(offset, endpoint);
    };

    useEffect(() => {
        const pageSlice = calculatePageSlice(fList, itemOffset, pageSize);
        setFListPage(pageSlice);
    }, [itemOffset, fList, pageSize]);

    useEffect(() => {
        if (fList && pageSize) {
            const newPageCount = Math.ceil(fList.length / pageSize);
            if (pageCount !== newPageCount) {
                setPageCount(newPageCount);
            }
        }
    }, [fList, pageSize, pageCount]); // Added pageCount to dependency array to prevent infinite loop

    useEffect(() => {
        setItemOffset(0);
    }, [pageCount]);


    const renderPaginationButtons = () => {
        const buttons = [];
        buttons.push(
            <ReactPaginate
                breakLabel="..."
                containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2"
                activeClassName="active bg-orange-300 text-white"
                previousLabel="«"
                nextLabel="»"
                key={'pagination-buttons'}
                onPageChange={handlePageClick}
                pageRangeDisplayed={5}
                pageCount={Math.ceil(fList?.length / pageSize) || 0}
                forcePage={Math.floor(itemOffset / pageSize)}
                renderOnZeroPageCount={null}
            />
        );
        buttons.push(
            <select
                className='border-gray-300 rounded border text-rose-500'
                value={pageSize}
                key={'page-size-select'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            >
                <option value="1">1 per Page</option>
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

    // Title and subtitle adjusted for job applications
    let title_ = `Job Applications (${fList.length} of ${jobApplications.length})`;
    let subtitle_ = "Manage and review job submissions.";

    // Access roles for the current user
    let allowedRoles: String[];
    allowedRoles = ['admin', 'manager', 'recruiter']; // Roles allowed to view applications

    // Check if the current user has at least one of the allowed roles
    const isAllowedAccess = currentUser?.roles.some((role: string) =>
        allowedRoles.includes(role.toLowerCase()) // Case-insensitive check
    );

    // If access is not allowed, redirect or display an error
    if (!isAllowedAccess) {
        // You might want to show a message or a less harsh redirect depending on UX
        // For now, let's redirect to home or a forbidden page
        router.push('/'); // Or '/forbidden'
        toast.error("You do not have permission to view job applications.");
        return null; // Don't render anything if not allowed
    }

    return (
        <Container>
            <div className="z-51 mt-[-40px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
                <Heading
                    title={selectedApplicationId.length === 0 ? title_ : 'Application Details View. Click on the application card or here to exit.'}
                    subtitle={subtitle_}
                    isSetBackground={selectedApplicationId.length > 0} // Background if a specific application is selected
                    // onClick={selectedApplicationId.length > 0 ? () => handleToggleSelectApplication('') : undefined} // Allow clicking heading to exit single view
                />

                <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
                    {/* Filter by Status Dropdown */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            className='border-gray-300 rounded border text-gray-700 p-2'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="REVIEWED">Reviewed</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="REJECTED">Rejected</option>
                            {/* Add more statuses as defined in your Prisma schema for JobApplication */}
                        </select>
                    </div>

                    <div className="flex-grow" />
                    <div className="flex flex-row">
                        <Search
                            setSearchTerm={setSearchTerm}
                            searchTerm={searchTerm}
                            // placeholder="Search by name, email, job title or ID..." // Updated placeholder
                        />
                    </div>
                </div>
            </div>
            <div className={cn("mt-1 pb-5", selectedApplicationId.length > 0 ? 'shadow-xl rounded-md p-1 border-yellow-400 border-2' : '')}>
                <div>
                    {fListPage.length > 0 ? (
                        <div
                            className={cn(
                                "grid gap-4",
                                // Adjust grid for mobile/desktop if needed. For applications, a single column is often fine.
                                isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' // Example: 1 or 2 columns
                            )}
                        >
                            {fListPage.map((application) => (
                                <div
                                    key={application.id}
                                    // Add styling for single application view if active
                                    className={cn(selectedApplicationId === application.id ? "border-2 border-blue-500 rounded-lg p-2" : "")}
                                >
                                    <JobApplicationContainer
                                        jobApplication={application}
                                        // You might pass a prop to indicate if it's the selected one for styling
                                        // isSelected={selectedApplicationId === application.id}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-8">No job applications found matching your criteria.</p>
                    )}

                    {fList && fList.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-1">
                            {renderPaginationButtons()}
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
};

export default JobApplicationsClient;