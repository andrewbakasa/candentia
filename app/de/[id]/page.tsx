'use client'
import React, { useState, useEffect, FC } from 'react';
import { Bug, AlertTriangle, Clock, Target, User, Calendar, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS ---

// Define the allowed types for priority and severity for stricter typing
type DefectPriority = 'High' | 'Critical' | 'Low';
type DefectSeverity = 'Critical' | 'Minor' | 'Unknown';
type DefectStatus = 'In Progress' | 'To Do';

// Interface for the Defect data structure
interface Defect {
  id: string;
  title: string;
  description: string;
  status: DefectStatus;
  priority: DefectPriority;
  reporter: string;
  dateReported: string;
  severity: DefectSeverity;
  attachments: number;
}

// Interface for the DetailItem props
interface DetailItemProps {
  icon: LucideIcon; // LucideIcon is the type for components exported from lucide-react
  label: string;
  value: string | number;
}

// --- MOCK DATA STORE (Typed) ---
const mockDefectsData: { [key: string]: Defect } = {
  'DEF-001': {
    id: 'DEF-001',
    title: 'Intermittent Authentication Failure on iOS 17',
    description: "Users on the latest iOS version are intermittently unable to complete the login process, often receiving a timeout error. This seems related to a recent backend patch affecting token validation.",
    status: 'In Progress',
    priority: 'High',
    reporter: 'Alice Johnson',
    dateReported: '2025-11-28',
    severity: 'Critical',
    attachments: 3
  },
  'DEF-002': {
    id: 'DEF-002',
    title: 'Minor CSS misalignment in footer on Safari',
    description: "The company logo in the footer shifts 2px to the right only in Safari browser versions 15+. Low priority visual bug.",
    status: 'To Do',
    priority: 'Low',
    reporter: 'Bob Smith',
    dateReported: '2025-12-01',
    severity: 'Minor',
    attachments: 0
  },
};


// Utility function to get priority color classes
const getPriorityClasses = (priority: DefectPriority | DefectStatus): string => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 border-red-500';
    case 'Critical':
      return 'bg-red-600 text-white border-red-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-500';
    case 'To Do':
      return 'bg-gray-200 text-gray-700 border-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-500';
  }
};

// Component for a single detail item (Icon + Label + Value)
const DetailItem: FC<DetailItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl shadow-inner transition duration-200 hover:bg-gray-100">
    <Icon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="text-base font-medium text-gray-800 break-words">{value}</p>
    </div>
  </div>
);

// Main Application Component
const PageList: FC = () => {
  // Hardcode the ID for demonstration. In a real app, this would be from React Router params.
  const defectId: string = 'DEF-001'; 
  const router =useRouter()
  // Use null or Defect for type safety in state
  const [defect, setDefect] = useState<Defect | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate data fetching
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setDefect(null);

    const timer = setTimeout(() => {
      const data: Defect | undefined = mockDefectsData[defectId];

      if (data) {
        setDefect(data);
        setError(null);
      } else {
        setError(`Defect with ID "${defectId}" not found.`);
      }
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [defectId]); // Dependency array ensures effect runs when ID changes (if it were dynamic)

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg text-indigo-600 font-medium">Loading defect details...</p>
      </div>
    );
  }

  // Handle Error State (Defect Not Found)
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-2xl border-t-4 border-red-500">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center text-red-700 mb-2">Error</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => console.log('Simulating navigation back')}
            className="mt-4 w-full py-3 px-4 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:bg-red-700 transition duration-150"
          >
            Go Back (Simulated)
          </button>
        </div>
      </div>
    );
  }

  // We know 'defect' is not null here, so we can use the non-null assertion operator or check
  if (!defect) return null; // Should be covered by error state, but good for TS narrowing

  // Main Defect View
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header and Back Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center">
            <Bug className="w-8 h-8 mr-3 text-red-600" />
            Defect Details
          </h1>
          <button
            onClick={() =>router.push("/de")}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-full shadow-lg hover:bg-indigo-700 transition duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            &larr; Back to List
          </button>
        </div>

        {/* Main Defect Card */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-2xl border-t-8 border-indigo-600">
          
          {/* Defect ID and Title */}
          <div className="mb-6 border-b pb-4">
            {/* The Priority type check ensures we use the correct utility function */}
            <span className={`inline-block px-4 py-1 text-sm font-bold uppercase rounded-full border-2 ${getPriorityClasses(defect.priority)}`}>
                {defect.id}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-3">{defect.title}</h2>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DetailItem icon={Clock} label="Status" value={defect.status} />
            <DetailItem icon={AlertTriangle} label="Priority" value={defect.priority} />
            <DetailItem icon={Target} label="Severity" value={defect.severity || 'Unknown'} />
            <DetailItem icon={User} label="Reported By" value={defect.reporter} />
            <DetailItem icon={Calendar} label="Date Reported" value={defect.dateReported} />
            <DetailItem icon={Bug} label="Attachments" value={`${defect.attachments} files`} />
          </div>

          {/* Description Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-gray-700 mb-3 border-b-2 pb-1 text-indigo-600">
              Description
            </h3>
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {defect.description}
                </p>
            </div>
          </div>

          {/* Action/Comment Section Placeholder */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Activity & Resolution Log
            </h3>
            <div className="text-gray-500 italic p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p>Status changed from To Do to  In Progress by Alice Johnson on 2025-11-29.</p>
                <p className="mt-2">This area would dynamically load comments and activity history from your database.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PageList;