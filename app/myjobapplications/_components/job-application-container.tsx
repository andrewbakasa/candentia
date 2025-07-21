"use client";

import { JobApplication, Career, User, JobAttachment } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { useState } from 'react';
import { useJobMediaModal } from '@/hooks/use-job-media-modal';
import { Button } from '@/components/ui/button';
import { AiFillPicture } from 'react-icons/ai';
import { SafeUser } from '@/app/types';
import ConfirmAction from '@/app/components/ConfirmAction';

// Extend JobApplication type to include relations if they are fetched
interface JobApplicationWithRelations extends JobApplication {
    career?: Career | null;
    user?: User | null;
    jobAttachment?: JobAttachment[];
}

interface JobApplicationContainerProps {
    jobApplication: JobApplicationWithRelations;
    onStatusChange: (applicationId: string, newStatus: string) => void;
    onDelete: (applicationId: string) => void; // New prop for delete functionality
    currentUser?: SafeUser | null;
}

export const JobApplicationContainer: React.FC<JobApplicationContainerProps> = ({
    jobApplication,
    onStatusChange,
    onDelete, // Destructure the new onDelete prop
    currentUser
}) => {
    const [currentStatus, setCurrentStatus] = useState(jobApplication.status);

    const statusOptions = ['PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'outline';
            case 'REVIEWED': return 'default';
            case 'INTERVIEW': return 'secondary';
            case 'ACCEPTED': return 'success';
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = event.target.value;
        setCurrentStatus(newStatus);
        onStatusChange(jobApplication.id, newStatus);
        event.stopPropagation();
    };

    const jobMediaModal = useJobMediaModal();

    const attachmentCount = jobApplication.jobAttachment?.length || 0;
    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col rounded-lg overflow-hidden">
            <div className=" p-4 pb-0 flex-grow">
                <CardHeader className="p-0 pb-2 flex-row justify-between items-start"> {/* Adjusted for delete button */}
                    <div className="flex-grow">
                        <CardTitle className="cursor-pointer text-xl font-semibold text-blue-700">
                            <Link href={`/job/${jobApplication.career?.id}`} passHref>
                                Application for: {jobApplication.career?.title || 'Unknown Job'}
                            </Link>
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Applicant: {jobApplication.applicantName || 'N/A'} (Email: {jobApplication.applicantEmail || 'N/A'})
                        </CardDescription>
                    </div>
                    {/* Delete Button - only visible if currentUser is present */}
                    {currentUser && (
                        <ConfirmAction
                            onConfirm={onDelete}
                            itemId={jobApplication.id}
                            action="Delete"
                            heading={`Delete application for ${jobApplication.applicantName ||jobApplication.applicantName || "Unknown" }`}
                            description="Are you sure you want to delete this application? This action cannot be undone."
                        />
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700 line-clamp-2">
                            Applied on: {new Date(jobApplication.createdAt).toLocaleDateString()}
                        </p>
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
                        {jobApplication.resumeUrl && (
                            <p className="text-sm text-gray-700">
                                Resume: <Link href={jobApplication.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</Link>
                            </p>
                        )}

                        {/* Display Job Attachments with count */}
                        {attachmentCount > 0 && (
                            <div className="mt-4 flex items-center">
                                <h4 className="text-md font-semibold text-gray-800 mr-2">Attachments:</h4>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        jobMediaModal.onOpen(jobApplication.id, jobApplication.career?.id || "", currentUser);
                                    }}
                                    className="h-auto px-2 py-1.5 justify-end text-muted-foreground text-[11px] hover:text-sm flex items-center gap-1"
                                    size="sm"
                                    variant="ghost"
                                >
                                    <AiFillPicture
                                        size={10}
                                        className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                    />
                                    <span className="text-xs font-medium">({attachmentCount})</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </div>

            <div className="p-4 pt-2 border-t border-gray-200 bg-gray-50">
                <label htmlFor={`status-select-${jobApplication.id}`} className="block text-sm font-medium text-gray-700 mb-1">Update Status:</label>
                <select
                    id={`status-select-${jobApplication.id}`}
                    value={currentStatus}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()}
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