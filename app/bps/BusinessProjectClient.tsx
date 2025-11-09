'use client'
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
// Assuming SafeUser is defined in '../types'
import { SafeUser } from '../types';

// Simplified Project List Item type, matching what the Server Component passes
type ProjectListItem = {
    id: string;
    title: string;
    progress: string;
    rating: number | null;
    commentCount: number;
    // Removed date fields as they are not used for display here, 
    // but ensured they are passed from the Server Component if needed elsewhere.
};

// Interface for the props received from the Server Component
interface ProjectListClientProps {
    projects: ProjectListItem[]; 
    currentUser: SafeUser | null;
}

// --- API Fetch Function for Client-Side Refresh ---
const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
    // API path matching the user's specified POST path for consistency
    const url = `/api/busprojects`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch projects (Status: ${response.status})`);
        }
        
        const projects: any[] = await response.json(); 
        
        // Map the result to match the expected ProjectListItem type
        return projects.map((p) => ({
            id: p.id,
            title: p.title,
            progress: p.progress,
            rating: p.rating,
            commentCount: p._count?.comments || 0, // Ensure comment count is mapped
        }));

    } catch (err: any) {
        console.error(`Error fetching projects:`, err);
        throw err;
    }
};

// --- Main Client Component (Handles List View) ---

const ProjectListPage: React.FC<ProjectListClientProps> = ({
    projects: initialProjects, // Use alias to get initial server data
    currentUser,
}) => {
    // Initialize state with the data passed from the Server Component
    const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
    
    // Use isRefreshing for client-side loading states
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [isAddingNew, setIsAddingNew] = useState(false);


    // Callback to perform the client-side refresh
    const refreshProjects = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const data = await fetchProjectsList();
            setProjects(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during refresh.');
        } finally {
            setIsRefreshing(false);
        }
    }, []);


    const handleNewProjectSubmit = async (data: { title: string, description: string }) => {
        if (!currentUser) {
            setError('You must be logged in to propose a project.');
            return;
        }

        setError(null);
        try {
            // Using the user's specified POST endpoint: /api/busprojects
            const response = await fetch('/api/busprojects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    throw new Error(`Failed to create project (Status: ${response.status}).`);
                }
                throw new Error(errorData.message || 'Failed to create project.');
            }

            console.log('Project created successfully.');
            setIsAddingNew(false);
            // On successful POST, trigger a client-side refresh of the list
            refreshProjects(); 
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">🤝 Project Collaboration Portal</h1>
            
            <button 
                onClick={() => setIsAddingNew(!isAddingNew)} 
                className="bg-indigo-600 text-white p-3 rounded-lg mb-6 shadow-md hover:bg-indigo-700 transition"
            >
                {isAddingNew ? 'Close Template' : '➕ Add New Project Proposal'}
            </button>

            {isAddingNew && (
                <NewProjectTemplate onSubmit={handleNewProjectSubmit} />
            )}

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Current Projects</h2>

            {/* Now uses the isRefreshing state for client-side loading feedback */}
            {isRefreshing && <p className="text-blue-500 italic">Refreshing project list...</p>}
            {error && <p className="text-red-700 font-semibold p-3 bg-red-100 border border-red-300 rounded-lg shadow-sm">Error: {error}</p>}
            
            {/* The list rendering condition now uses isRefreshing state */}
            {!isRefreshing && !error && projects.length === 0 && (
                <p className="text-gray-500 p-4 border rounded-lg bg-white">No projects found. Be the first to propose one!</p>
            )}

            {!isRefreshing && !error && projects.length > 0 && (
                <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comments</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link href={`/bp/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                        {project.title}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm 
                                        ${project.progress === 'proposal' 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-blue-100 text-blue-800'}`}>
                                        {project.progress}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                    {project.commentCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// Component for quick data entry (New Project Proposal) - Used in both files for consistency
const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        onSubmit({ title, description });
        setTitle('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl mb-6 bg-white shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">New Project Proposal Template</h3>
            
            <div className="mb-4">
                <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                    id="project-title"
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                    placeholder="E.g., Global E-commerce Platform Integration"
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
            </div>

            <div className="mb-6">
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                <textarea 
                    id="project-description"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                    rows={6}
                    placeholder="Describe the problem, solution, and estimated effort..."
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
                />
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md">
                Submit Proposal
            </button>
        </form>
    );
};

// Exporting the list component as the default export of the file
export default ProjectListPage;