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
  const [filters, setFilters] = useState<StrategyFilters>(initialFilters);

  const handleFilterChange = (name: keyof StrategyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Call the prop function to update the parent component's filter state
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters); // Immediately propagate the reset
  };

  // Mock list of years and statuses for the dropdowns
  const availableYears = ['2025', '2026', '2027'];
  // Casting ensures runtime compatibility since ProposalStatus type isn't globally available here
  const allStatuses = ['DRAFT', 'PENDING_REVIEW', 'VOTING_OPEN', 'APPROVED', 'REJECTED'] as ProposalStatus[]; 


  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 sticky top-4">
      <h3 className="text-xl font-bold mb-1 flex items-center">
        🔎 Filter Proposals
      </h3>
      
      <div className="space-y-1">
        {/* 1. Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status (M1-M3)
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="mt-0 block w-full rounded-md border-gray-300 shadow-sm py-0 px-3 text-base focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        
        {/* 2. Year Filter */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-0">
            Strategy Target Year
          </label>
          <select
            id="year"
            name="year"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 text-base focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="ALL">All Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* 3. Minimum Score Filter */}
        <div>
          <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Score (0-10)
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 text-base focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., 5"
          />
        </div>
      </div>
      
      <button 
        onClick={handleApplyFilters}
        className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
      >
        Apply Filters
      </button>

      <button 
        onClick={handleResetFilters}
        className="mt-1 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
      >
        Reset Filters
      </button>
    </div>
  );
}