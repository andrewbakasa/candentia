'use client';
import React from 'react';
import Link from 'next/link';
import { FaBriefcase, FaMapMarkerAlt, FaUsers } from 'react-icons/fa'; // Changed FaBuilding to FaUsers for applicants icon
import useIsMobile from '../hooks/isMobile';
import { Career as PrismaCareer, JobApplication } from '@prisma/client'; // Import Prisma types

// Define the type for CareerWithApplication, reusing the definition from jobs-client
type CareerWithApplication = PrismaCareer & { jobApplication: JobApplication[] };

interface CareerProps {
    jobOpenings:any[];// CareerWithApplication[]; // Use the specific type
}

const Career: React.FC<CareerProps> = ({ jobOpenings }: CareerProps) => {
    const isMobile = useIsMobile();
    // Limit to only two jobs on mobile and four on desktop for the initial display
    const max_ = isMobile ? 2 : 4;
    const visibleJobs = jobOpenings.slice(0, max_);
    const hasMoreJobs = jobOpenings.length > max_;

    return (
        <div className="my-8 py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg" id="careers">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-4xl font-extrabold text-yellow-800 mb-4 drop-shadow-sm">
                    Join the Brilliant Team at Candentia
                </h2>
                <p className="text-center text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Explore our current job openings and become a part of our innovative and dynamic team.
                </p>
                <div className="flex justify-center mb-10">
                    <div className="w-24 h-1 bg-yellow-500 rounded-full"></div> {/* Thicker, rounded separator */}
                </div>

                {jobOpenings.length > 0 ? (
                    // Display job listings if there are any
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"> {/* Increased gap */}
                        {visibleJobs.map((job, index) => (
                            <Link
                                key={job.id} // Use job.id as key for better performance and stability
                                href={`/job/${job.id}`}
                                className="block bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full" // Added h-full and flex-col
                            >
                                <div className="flex-grow"> {/* This div will take up available space, pushing button to bottom */}
                                    <h3 className="text-xl font-bold text-blue-700 mb-2 leading-tight">
                                        {job.title}
                                    </h3>
                                    {job.location && (
                                        <p className="text-gray-600 text-sm mb-1 flex items-center">
                                            <FaMapMarkerAlt className="inline mr-2 text-blue-500" /> {job.location}
                                        </p>
                                    )}
                                    {/* Display number of applicants */}
                                    {job.jobApplication && job.jobApplication.length > 0 && (
                                        <p className="text-gray-600 text-sm mb-1 flex items-center">
                                            <FaUsers className="inline mr-2 text-blue-500" /> {job.jobApplication.length} Applicants
                                        </p>
                                    )}
                                    {job.type && (
                                        <p className="text-gray-600 text-sm mb-2 flex items-center">
                                            <FaBriefcase className="inline mr-2 text-blue-500" /> {job.type}
                                        </p>
                                    )}
                                    <p className="text-gray-700 text-sm mb-4 line-clamp-3"> {/* line-clamp for consistent description height */}
                                        {job.shortDescription}
                                    </p>
                                </div>
                                <button
                                    className="mt-auto bg-yellow-400 hover:bg-yellow-500 text-blue-800 font-semibold py-2 px-5 rounded-full text-base shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                >
                                    Learn More / Apply
                                </button>
                            </Link>
                        ))}
                    </div>
                ) : (
                    // Display this UI when there are no job openings
                    <div className="text-center py-12 bg-white rounded-lg shadow-md max-w-lg mx-auto">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">
                            No Current Job Openings
                        </h3>
                        <p className="mt-2 text-base text-gray-500">
                            We don&apos;t have any open positions at the moment. Please check back
                            later for new opportunities.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="/contact"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold inline-flex items-center justify-center px-6 py-3 rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/"
                                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold inline-flex items-center justify-center px-6 py-3 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Back to Homepage
                            </Link>
                        </div>
                    </div>
                )}

                {hasMoreJobs && (
                    <div className="mt-12 text-center">
                        <Link
                            href="/careerjobs"
                            className="text-blue-600 hover:text-blue-800 font-semibold text-lg inline-flex items-center group"
                        >
                            View All Opportunities
                            <svg
                                className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Career;