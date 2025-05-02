'use client'
import React from 'react';
import Link from 'next/link';
import { FaBriefcase, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa'; // Example icons
import useIsMobile from '../hooks/isMobile';

interface Job {
  id: string;
  title: string;
  location?: string;
  type?: string;
  shortDescription: string;
  link: string;
}

interface CareerProps {
  jobOpenings: any[];
}

const Career: React.FC<CareerProps> = ({ jobOpenings }: CareerProps) => {
  const isMobile =  useIsMobile();
  const max_ = isMobile? 2:4;// Limit to only two jobs in mobile and for when its desktop
  const visibleJobs = jobOpenings.slice(0, max_);
  const hasMoreJobs =  jobOpenings.length > max_;
  
  return (
    <div className="my-8 py-6 bg-gray-50 rounded-lg shadow-md" id="careers">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-yellow-900 mb-4">
        Join the Brilliant Team at Candentia
        </h2>
        <div className="flex justify-center mb-6">
          <div className="w-20 border-b-4 border-yellow-400"></div>
        </div>

        {jobOpenings.length > 0 ? (
          // Display job listings if there are any
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {visibleJobs.map((job, index) => (
                  <Link
                    key={index}
                    href={`/job/${job.id}`}
                    className="block hover:shadow-lg transition-shadow duration-300 rounded-md bg-white p-6 min-h-[200px] flex flex-col justify-between" // Apply flex to the Link
                  >
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-blue-700 mb-2">
                        {job.title}
                      </h3>
                      {job.location && (
                        <p className="text-gray-600 text-sm mb-1">
                          <FaMapMarkerAlt className="inline mr-1" /> {job.location}
                        </p>
                      )}
                      {job.type && (
                        <p className="text-gray-600 text-sm mb-2">
                          <FaBriefcase className="inline mr-1" /> {job.type}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm mb-4">
                        {job.shortDescription}
                      </p>
                    </div>
                    <button 
                    className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 font-bold py-2 px-4 rounded-full text-sm focus:outline-none focus:shadow-outline">
                      Learn More / Apply
                    </button>
                  </Link>
                ))}
          </div>
        ) : (
          // Display this UI when there are no job openings
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No Current Job Openings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              We don&apos;t have any open positions at the moment. Please check back
              later for new opportunities.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 inline-flex items-center justify-center w-full px-6 py-3 my-4 font-medium shadow-sm rounded-md sm:w-auto sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
         
                //className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contact Us
              </Link>
              <Link
                href="/"
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        )}

        {hasMoreJobs && (
          <div className="mt-8 text-center">
          
            <Link
              href="/careerjobs"
              className="text-blue-500 hover:underline font-medium"
            >
              View All Opportunities{' '}
              <svg
                className="w-4 h-4 inline ml-1"
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
