// app/job-applications/[jobApplicationId]/_components/job-application-container.tsx

import { JobApplication, Career, User } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { useState } from 'react'; // Import useState

// Extend JobApplication type to include relations if they are fetched
interface JobApplicationWithRelations extends JobApplication {
    career?: Career | null; // The job opening this application is for
    user?: User | null;     // The user who submitted this application
}

interface JobApplicationContainerProps {
    jobApplication: any;//JobApplicationWithRelations;
    // Add onStatusChange prop: a function to call when the status is updated
    onStatusChange: (applicationId: string, newStatus: string) => void;
}

export const JobApplicationContainer: React.FC<JobApplicationContainerProps> = ({ jobApplication, onStatusChange }) => {
    // State to manage the current status displayed in the dropdown
    // Initialize with the jobApplication's status
    const [currentStatus, setCurrentStatus] = useState(jobApplication.status);

    // Define all possible status options for the dropdown
    // These should match the possible enum values in your Prisma schema or backend logic
    const statusOptions = ['PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

    /**
     * Determines the Tailwind CSS variant for the Badge component based on the application status.
     * @param status The current status of the job application.
     * @returns The appropriate badge variant string.
     */
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'outline';
            case 'REVIEWED': return 'default';
            case 'INTERVIEW': return 'secondary';
            case 'ACCEPTED': return 'success'; // Assuming 'success' is a defined variant in your Badge component
            case 'REJECTED': return 'destructive';
            default: return 'outline'; // Fallback for unknown statuses
        }
    };

    /**
     * Handles the change event from the status dropdown.
     * Updates the local state and calls the parent's onStatusChange prop.
     * @param event The change event from the select element.
     */
    const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = event.target.value;
        setCurrentStatus(newStatus); // Update local state for immediate UI feedback
        onStatusChange(jobApplication.id, newStatus); // Notify parent component of the change
        // Crucially, stop event propagation to prevent the Link from being triggered
        event.stopPropagation();
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col rounded-lg overflow-hidden">
            {/* The main content of the card, wrapped in a Link for navigation */}
            <Link href={`/job-applications/${jobApplication.id}`} passHref>
                {/* A div inside the Link to make its content clickable and apply cursor style */}
                <div className="cursor-pointer p-4 pb-0 flex-grow"> {/* Added flex-grow to push dropdown to bottom if content is short */}
                    <CardHeader className="p-0 pb-2"> {/* Adjust padding to fit within the div */}
                        <CardTitle className="text-xl font-semibold text-blue-700">
                            Application for: {jobApplication.career?.title || 'Unknown Job'}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Applicant: {jobApplication.applicantName || 'N/A'} (Email: {jobApplication.applicantEmail || 'N/A'})
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0"> {/* Adjust padding to fit within the div */}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700 line-clamp-2">
                                Applied on: {new Date(jobApplication.createdAt).toLocaleDateString()}
                            </p>
                            {/* Display the current status using Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                                <Badge
                                    variant={getStatusVariant(currentStatus)}
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                >
                                    {currentStatus.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            {jobApplication.coverLetterText && (
                                <p className="text-sm text-gray-500 line-clamp-3">
                                    Cover Letter snippet: {jobApplication.coverLetterText}
                                </p>
                            )}
                            {/* You might also show resume link, other fields here */}
                        </div>
                    </CardContent>
                </div>
            </Link>

            {/* Status update dropdown, placed outside the Link's direct influence but within the Card */}
            <div className="p-4 pt-2 border-t border-gray-200 bg-gray-50"> {/* Add border-top and background for visual separation */}
                <label htmlFor={`status-select-${jobApplication.id}`} className="block text-sm font-medium text-gray-700 mb-1">Update Status:</label>
                <select
                    id={`status-select-${jobApplication.id}`}
                    value={currentStatus}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()} // Prevent click from propagating to the Link
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm appearance-none bg-white bg-no-repeat bg-right-center bg-contain"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")` }}
                >
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>
        </Card>
    );
};

// // app/job-applications/[jobApplicationId]/_components/job-application-container.tsx
// // This is a placeholder component. You'll need to create this file and implement its actual UI.

// import { JobApplication, Career, User } from '@prisma/client';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component
// import Link from 'next/link';

// // Extend JobApplication type to include relations if they are fetched
// interface JobApplicationWithRelations extends JobApplication {
//     career?: Career | null; // The job opening this application is for
//     user?: User | null;     // The user who submitted this application
// }

// interface JobApplicationContainerProps {
//     jobApplication: JobApplicationWithRelations;
//     // Add any other props needed for interaction, e.g., onSelect, onDelete
// }

// export const JobApplicationContainer: React.FC<JobApplicationContainerProps> = ({ jobApplication }) => {
//     // Determine the status color or text
//     const getStatusVariant = (status: string) => {
//         switch (status) {
//             case 'PENDING': return 'outline';
//             case 'REVIEWED': return 'default';
//             case 'INTERVIEW': return 'secondary';
//             case 'ACCEPTED': return 'success'; // Assuming you have a success variant
//             case 'REJECTED': return 'destructive';
//             default: return 'outline';
//         }
//     };

//     return (
//         <Link href={`/job-applications/${jobApplication.id}`} passHref>
//             <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
//                 <CardHeader>
//                     <CardTitle className="text-xl font-semibold text-blue-700">
//                         Application for: {jobApplication.career?.title || 'Unknown Job'}
//                     </CardTitle>
//                     <CardDescription className="text-gray-600">
//                         Applicant: {jobApplication.applicantName || 'N/A'} (Email: {jobApplication.applicantEmail || 'N/A'})
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent className="flex-grow">
//                     <div className="space-y-2">
//                         <p className="text-sm text-gray-700 line-clamp-2">
//                             Applied on: {new Date(jobApplication.createdAt).toLocaleDateString()}
//                         </p>
//                         <div className="flex items-center gap-2">
//                             <span className="text-sm font-medium text-gray-700">Status:</span>
//                             <Badge 
//                                 variant={getStatusVariant(jobApplication.status)}
//                             >
//                                 {jobApplication.status.replace(/_/g, ' ')}
//                             </Badge>
//                         </div>
//                         {jobApplication.coverLetterText && (
//                             <p className="text-sm text-gray-500 line-clamp-3">
//                                 Cover Letter snippet: ${jobApplication.coverLetterText}
//                             </p>
//                         )}
//                         {/* You might also show resume link, other fields here */}
//                     </div>
//                 </CardContent>
//             </Card>
//         </Link>
//     );
// };