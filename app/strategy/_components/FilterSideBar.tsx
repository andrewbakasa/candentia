'use client';

import React, { useState } from 'react';
// Assuming the ProposalStatus enum is available via Prisma client import
import { ProposalStatus } from '@prisma/client'; 

// Define the state structure for the filters
export interface StrategyFilters {
  status: ProposalStatus | 'ALL';
  year: string | 'ALL';
  minScore: number | null;
}

const initialFilters: StrategyFilters = {
  status: 'ALL',
  year: 'ALL',
  minScore: null,
};

interface FilterSidebarProps {
    // New prop: Function to communicate filter changes to the parent
    onFilterChange: (filters: StrategyFilters) => void;
}




export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
    const [filters, setFilters] = useState(initialFilters);

    // const handleFilterChange = (name, value) => {
    //     setFilters(prev => ({ ...prev, [name]: value }));
    // };

     const handleFilterChange = (name: keyof StrategyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

    const handleApplyFilters = () => {
        onFilterChange(filters);
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        onFilterChange(initialFilters); // Immediately propagate the reset
    };

    // Mock list of years and statuses for the dropdowns
    const availableYears = ['2025', '2026', '2027', '2028', '2029'];
    const allStatuses = Object.values(ProposalStatus); 


    return (
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-2xl border border-gray-100 sticky top-4 transition-all duration-300 h-fit">
            <h3 className="text-lg lg:text-xl font-extrabold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                ⚙️ Proposal Filters
            </h3>
            
            <div className="space-y-3">
                
                {/* 1. Status Filter */}
                <div>
                    <label htmlFor="status" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        📊 Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full text-sm rounded-md border-gray-300 shadow-sm py-1.5 px-2 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Statuses</option>
                        {allStatuses.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
                
                {/* 2. Year Filter */}
                <div>
                    <label htmlFor="year" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        📅 Target Year
                    </label>
                    <select
                        id="year"
                        name="year"
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        className="w-full text-sm rounded-md border-gray-300 shadow-sm py-1.5 px-2 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Years</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Minimum Score Filter */}
                <div>
                    <label htmlFor="minScore" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        ⭐ Min Score (0-10)
                    </label>
                    <input
                        id="minScore"
                        type="number"
                        name="minScore"
                        min="0"
                        max="10"
                        value={filters.minScore ?? ''}
                        onChange={(e) => 
                            handleFilterChange('minScore', e.target.value === '' ? null : parseInt(e.target.value))}
                        className="w-full text-sm rounded-md border-gray-300 shadow-sm py-1.5 px-2 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="e.g., 5"
                    />
                </div>
            </div>
            
            {/* Button Group: Made side-by-side for compactness */}
            <div className="mt-6 flex gap-2">
                <button 
                    onClick={handleApplyFilters}
                    className="flex-1 py-2 px-3 border border-transparent rounded-md shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.01]"
                >
                    Apply Filters
                </button>

                <button 
                    onClick={handleResetFilters}
                    className="py-2 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
}