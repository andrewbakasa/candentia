// app/job-applications/[jobApplicationId]/_components/job-application-container.tsx
// This is a placeholder component. You'll need to create this file and implement its actual UI.

import { JobApplication, Career, User } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component
import Link from 'next/link';

// Extend JobApplication type to include relations if they are fetched
interface JobApplicationWithRelations extends JobApplication {
    career?: Career | null; // The job opening this application is for
    user?: User | null;     // The user who submitted this application
}

interface JobApplicationContainerProps {
    jobApplication: JobApplicationWithRelations;
    // Add any other props needed for interaction, e.g., onSelect, onDelete
}

export const JobApplicationContainer: React.FC<JobApplicationContainerProps> = ({ jobApplication }) => {
    // Determine the status color or text
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'outline';
            case 'REVIEWED': return 'default';
            case 'INTERVIEW': return 'secondary';
            case 'ACCEPTED': return 'success'; // Assuming you have a success variant
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Link href={`/job-applications/${jobApplication.id}`} passHref>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-blue-700">
                        Application for: {jobApplication.career?.title || 'Unknown Job'}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Applicant: {jobApplication.user?.name || 'N/A'} (Email: {jobApplication.user?.email || 'N/A'})
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700 line-clamp-2">
                            Applied on: {new Date(jobApplication.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <Badge 
                                variant={getStatusVariant(jobApplication.status)}
                            >
                                {jobApplication.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        {jobApplication.coverLetterText && (
                            <p className="text-sm text-gray-500 line-clamp-3">
                                Cover Letter snippet: ${jobApplication.coverLetterText}
                            </p>
                        )}
                        {/* You might also show resume link, other fields here */}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};