'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';


export const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
    // ... (NewProjectTemplate implementation is unchanged) ...
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