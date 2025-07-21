/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types"; // Assuming SafeUser is defined elsewhere
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import { cn } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import useIsMobile from "../hooks/isMobile";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { JobApplication, Career, User } from "@prisma/client";
import { JobApplicationContainer } from "./_components/job-application-container";
import { useWindowSize } from "@/hooks/use-screenWidth";
import { updateJobApplicationStatus } from "@/actions/update-jobApplicationStatus";
import { deleteJobApplication } from "@/actions/delete-job-application";

// Extend JobApplication type to include relations if they are fetched by getJobApplications
interface JobApplicationWithRelations extends JobApplication {
    career?: Career | null; // The job opening this application is for
    user?: User | null;     // The user who submitted this application
}

interface JobApplicationsClientProps {
    initialJobApplications: JobApplicationWithRelations[]; // Renamed prop to clarify it's the initial data
    currentUser?: SafeUser | null;
}

const JobApplicationsClient: React.FC<JobApplicationsClientProps> = ({
    initialJobApplications,
    currentUser,
}) => {
    const router = useRouter();
    // Use initialJobApplications to populate a state that can be filtered/modified
    const [allJobApplications, setAllJobApplications] = useState(initialJobApplications);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredApplications, setFilteredApplications] = useState(initialJobApplications); // This state holds the result of all filters
    const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8);
    const [itemOffset, setItemOffset] = useState(0);

    const isMobile = useIsMobile();
    const [fListPage, setFListPage] = useState<JobApplicationWithRelations[]>([]); // Current page slice for rendering

    const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Action to update user page size
    const { execute, fieldErrors } = useAction(updatePagSize, {
        onSuccess: (data) => {
            toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Action to update job application status
    const { execute: executeStatusUpdate } = useAction(updateJobApplicationStatus, {
        onSuccess: (data) => {
            toast.success(`Application status updated to ${data.status.replace(/_/g, ' ')}`);
        },
        onError: (error) => {
            toast.error(`Failed to update status: ${error}`);
            // Optionally, revert the status in the UI if the backend update fails
            // This would require storing the previous status or refetching
        },
    });

    // Action to delete job application
    const { execute: executeDeleteApplication } = useAction(deleteJobApplication, {
        onSuccess: (data) => {
            // Remove the deleted application from the main list of applications
            setAllJobApplications(prevApplications =>
                prevApplications.filter(app => app.id !== data.id)
            );
            toast.success(`Job application deleted successfully.`);
        },
        onError: (error) => {
            toast.error(`Failed to delete application: ${error}`);
            console.error("Error deleting job application:", error);
        },
    });

    // Effect to filter applications based on various criteria
    useEffect(() => {
        let currentApplications = allJobApplications; // Start with the full list of applications

        // 1. Filter by selectedApplicationId if one is active (single view)
        if (selectedApplicationId.length > 0) {
            currentApplications = currentApplications.filter(app => app.id === selectedApplicationId);
        }

        // 2. Filter by status
        if (statusFilter !== '') {
            currentApplications = currentApplications.filter(app => app.status.toLowerCase() === statusFilter.toLowerCase());
        }

        // 3. Filter by search term
        if (searchTerm !== "") {
            const searchTermsArray = searchTerm.split(';').filter(Boolean);

            const results = currentApplications.filter((app) =>
                searchTermsArray.some((term) => {
                    const lowerCaseTerm = term.trim().toLowerCase();
                    if (app.applicantName.toLowerCase().includes(lowerCaseTerm)) return true;
                    if (app.applicantEmail.toLowerCase().includes(lowerCaseTerm)) return true;
                    if (app.career?.title?.toLowerCase().includes(lowerCaseTerm)) return true;
                    if (app.coverLetterText?.toLowerCase().includes(lowerCaseTerm)) return true;
                    if (app.id.toLowerCase().includes(lowerCaseTerm)) return true;
                    return false;
                })
            );
            currentApplications = results;
        }

        setFilteredApplications(currentApplications); // Update the list used for pagination
        setItemOffset(0); // Reset pagination to the first page after filtering
    }, [allJobApplications, selectedApplicationId, statusFilter, searchTerm]);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const { width } = useWindowSize(); // Keep width for responsive adjustments if needed
    const mobileWidth = 400; // Define mobile breakpoint

    // Handler for updating application status
    const handleStatusUpdate = useCallback((id: string, status: string) => {
        // Optimistically update the UI for allJobApplications and filteredApplications
        setAllJobApplications(prevList =>
            prevList.map(app =>
                app.id === id ? { ...app, status: status } : app
            )
        );
        // The useEffect for filtering will re-run and update filteredApplications accordingly
        // after allJobApplications is updated.

        // Call the backend action to persist the change
        executeStatusUpdate({ id, status });
    }, [executeStatusUpdate]);


    // Handler for deleting a job application
    const handleDeleteJobApplication = useCallback(async (applicationId: string) => {
        // executeDeleteApplication handles the state update (removing from allJobApplications)
        // and displays toasts based on its onSuccess/onError callbacks.
        executeDeleteApplication({ id: applicationId });
    }, [executeDeleteApplication]);


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
        const newOffset = (event.selected * pageSize) % filteredApplications.length;
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
        const pageSlice = calculatePageSlice(filteredApplications, itemOffset, pageSize);
        setFListPage(pageSlice);
    }, [itemOffset, filteredApplications, pageSize]); // Depend on filteredApplications for changes

    // Calculate pageCount based on filteredApplications
    const pageCount = Math.ceil(filteredApplications.length / pageSize);

    // Only reset itemOffset if the pageCount changes and the current offset is out of bounds
    useEffect(() => {
        if (itemOffset >= filteredApplications.length && filteredApplications.length > 0) {
            setItemOffset(0);
        }
    }, [filteredApplications, itemOffset]);


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
                pageCount={pageCount} // Use the derived pageCount
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
    let title_ = `Job Applications (${filteredApplications.length} of ${allJobApplications.length})`; // Use filteredApplications for current count
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
                            //placeholder="Search by name, email, job title or ID..." // Updated placeholder
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
                                        onStatusChange={handleStatusUpdate}
                                        currentUser={currentUser}
                                        onDelete={handleDeleteJobApplication} 
                                        
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-8">No job applications found matching your criteria.</p>
                    )}

                    {filteredApplications && filteredApplications.length > 0 && ( // Use filteredApplications here
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