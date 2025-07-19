"use client";

import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import useIsMobile from "@/app/hooks/isMobile";
import { useRadiusStore } from "@/hooks/use-radius";
import { useRouter } from "next/navigation";

import axios from "axios";
import { Career } from "@prisma/client";
import Head from "next/head";
import Link from "next/link";

interface JobContainerProps { // Renamed from JobontainerProps for consistency
    job: Career;
    jobId: string;
    numberOfApplicants?: number; // Added prop for number of applicants
};

export const JobContainer = ({
    job,
    jobId,
    numberOfApplicants, // Destructure the new prop
}: JobContainerProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { radiusVar, setRadiusVar } = useRadiusStore();

    useEffect(() => {
        // wherever data from DB changes reset to 100%
        // toast.message('I a m working as designed!')
        setRadiusVar(100);
    }, [jobId]); // removed data but limited to change in board

    if (!job) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
                <p>The job you are looking for could not be found.</p>
                <Link href="/careers" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Careers
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 border border-gray-200 bg-white rounded-md hover:border-blue-500 shadow-sm hover:shadow-md transition duration-200">
            <Head>
                <title>{job.title} | Your Company Name</title>
                <meta name="description" content={job?.shortDescription || ""} />
            </Head>

            <h1 className="text-3xl font-bold mb-4 text-gray-900">{job.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mb-6 text-gray-700">
                <p>
                    <span className="font-semibold text-blue-700">Location:</span> {job?.location || 'Remote'}
                </p>
                <p>
                    <span className="font-semibold text-blue-700">Type:</span> {job?.type || 'Full-time'}
                </p>
                <p>
                    <span className="font-semibold text-blue-700">Department:</span> {job?.department || 'N/A'}
                </p>
                {/* Display Number of Applicants */}
                {typeof numberOfApplicants === 'number' && (
                    <p>
                        <span className="font-semibold text-blue-700">Applicants:</span> {numberOfApplicants}
                    </p>
                )}
            </div>

            <div className="mt-8 prose prose-blue max-w-none"> {/* Added prose classes for better markdown rendering */}
                <h2 className="text-2xl font-semibold mb-2 text-gray-800">Job Description</h2>
                {job.fullDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: job?.fullDescription }} />
                ) : (
                    <p className="text-gray-500">Full description not available.</p>
                )}
            </div>

            <div className="mt-8 text-center">
                <Link
                    href={`/job-apply/${job.id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                    Apply Now
                </Link>
            </div>
        </div>
    );
};

// "use client";

// import { toast } from "sonner";
// import { useEffect, useRef, useState } from "react";
// import useIsMobile from "@/app/hooks/isMobile";
// import { useRadiusStore } from "@/hooks/use-radius";
// import { useRouter } from "next/navigation";

// import axios from "axios";
// import { Career } from "@prisma/client";
// import Head from "next/head";
// import Link from "next/link";

// interface JobontainerProps {
//   job: Career;
//   jobId: string;
// };

// export const JobContainer = ({
//   job,
//   jobId,
// }: JobontainerProps) => {
//   const router = useRouter();
//   const isMobile = useIsMobile();
//   const { radiusVar, setRadiusVar } = useRadiusStore();

//   useEffect(() => {
//     // wherever data from DB changes reset to 100%
//     // toast.message('I a m working as designed!')
//     setRadiusVar(100);
//   }, [jobId]);// removed data but limited to change in board

//   if (!job) {
//     return (
//       <div className="container mx-auto px-4 py-16 text-center">
//         <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
//         <p>The job you are looking for could not be found.</p>
//         <Link href="/careers">
//           Back to Careers
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 border border-gray-200 bg-white rounded-md hover:border-blue-500 shadow-sm hover:shadow-md transition duration-200">
//       <Head>
//         <title>{job.title} | Your Company Name</title>
//         <meta name="description" content={job?.shortDescription || ""} />
//       </Head>

//       <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
//       <p className="text-gray-600 mb-4">
//         <span className="font-semibold">Location:</span> {job?.location || 'Remote'}
//       </p>
//       <p className="text-gray-600 mb-4">
//         <span className="font-semibold">Type:</span> {job?.type || 'Full-time'}
//       </p>
//       <p className="text-gray-600 mb-4">
//         <span className="font-semibold">Department:</span> {job?.department || 'N/A'}
//       </p>

//       <div className="mt-8">
//         <h2 className="text-2xl font-semibold mb-2">Job Description</h2>
//         {job.fullDescription && <div dangerouslySetInnerHTML={{ __html: job?.fullDescription }} />}
//         {!job.fullDescription && <p>Full description not available.</p>}
//       </div>

//       <div className="mt-8">
//         <Link 
//          href  = {`/job-apply/${job.id}`} 
//             className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md"
//         >

//           Apply Now
//         </Link>
//       </div>
//     </div>
//   );
// };
