// components/FilterSidebar.tsx
'use client';

import React, { useState } from 'react';
// Assuming the ProposalStatus enum is available via Prisma client import
import { ProposalStatus } from '@prisma/client'; 

// Define the state structure for the filters
interface StrategyFilters {
  status: ProposalStatus | 'ALL';
  year: string | 'ALL';
  minScore: number | null;
}

const initialFilters: StrategyFilters = {
  status: 'ALL',
  year: 'ALL',
  minScore: null,
};

export default function FilterSidebar() {
  const [filters, setFilters] = useState<StrategyFilters>(initialFilters);

  const handleFilterChange = (name: keyof StrategyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // 🧭 ACTION: In a real application, this is where a prop function 
    // (e.g., `onFilterChange(filters)`) would be called to trigger a data re-fetch 
    // in the parent StrategyList component, applying the filters to the API call.
    console.log("Applying filters:", filters);
    // You could also use a library like Zustand or Redux to manage the global filter state.
  };

  // Mock list of years and statuses for the dropdowns
  const availableYears = ['2025', '2026', '2027'];
  const allStatuses = Object.values(ProposalStatus);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        🔎 Filter Proposals
      </h3>
      
      <div className="space-y-4">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 text-base"
          >
            <option value="ALL">All Statuses</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        {/* ... Other filter inputs for Year and Score... */}
      </div>
      
      <button 
        onClick={handleApplyFilters}
        className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Apply Filters
      </button>

      <button 
        onClick={() => setFilters(initialFilters)}
        className="mt-2 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Reset Filters
      </button>
    </div>
  );
}