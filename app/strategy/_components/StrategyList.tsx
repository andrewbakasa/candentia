
'use client';

import { SafeUser } from "@/app/types";
// import { StrategyWithRBM } from "../types/strategy"; // Assuming StrategyWithRBM is defined here
//import FilterSidebar, { StrategyFilters } from "./FilterSidebar";
import StrategyCard, { StrategyWithRBM } from "./StrategyCard";
import { useState, useMemo } from 'react';
import FilterSidebar, { StrategyFilters } from "./FilterSideBar";
import { AlertTriangle, Zap } from "lucide-react";
import { toast, Toaster } from "sonner";



// Strategy structure used by this list component
interface StrategyWithRBMExample {
    id: string;
    title: string;
    content: string;
    status: string; 
    year: string;
    averageScore: number | null; // Changed to allow null if scoring is not complete
    votes: { YES: number; NO: number; };
    authorId: string;
}
const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };

interface StrategyListProps {
    strategies: StrategyWithRBM[];
    currentUser: SafeUser | null;
}

const StrategyDashboardList: React.FC<StrategyListProps> = ({ strategies, currentUser }) => {
    const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);

    // Function passed to the FilterSidebar to update the state
    const handleFilterChange = (newFilters: StrategyFilters) => {
        setActiveFilters(newFilters);
    };
    
    // Placeholder actions for the StrategyCard component
    const handleStrategyClick = (strategy: StrategyWithRBM) => {
        toast.info(`Navigating to details for: ${strategy.title}`);
        // In a real app, this would change the view state or navigate.
    };
    
    const handleVote = (strategyId: string, voteType: 'YES' | 'NO') => {
        toast.success(`Simulated ${voteType} vote recorded for ${strategyId}.`);
        // In a real app, this would dispatch an API call and update the global state.
    };


    // Use useMemo to filter strategies only when activeFilters or strategies change
    const filteredStrategies = useMemo(() => {
        return strategies.filter(strategy => {
            
            // 1. Status Filter
            const statusMatch = activeFilters.status === 'ALL' || strategy.status === activeFilters.status;

            // 2. Year Filter
            const yearMatch = activeFilters.year === 'ALL' || String(strategy.year) === activeFilters.year;

            // 3. Minimum Score Filter
            const minScore = activeFilters.minScore;
            const scoreMatch = minScore === null || (strategy.averageScore !== null && strategy.averageScore >= minScore);

            return statusMatch && yearMatch && scoreMatch;
        });
    }, [strategies, activeFilters]);

    // Check for strategies *before* filtering
    if (strategies.length === 0) {
        return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
            <Toaster position="top-right" richColors />
            
            <header className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
                    DAO Strategy List
                </h1>
                <p className="text-gray-600 mt-2">
                    {strategies.length} total proposals available.
                </p>
                <div className="mt-4 p-3 flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-sm shadow-sm">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                        Proposals are scored against **Guideline 1 of 2025** (Business Model Requirements).
                    </p>
                </div>
            </header>
        
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* 1. Filtering Area */}
                <div className="lg:col-span-1">
                    <FilterSidebar onFilterChange={handleFilterChange} />
                </div>

                {/* 2. Strategy List Area */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Active Proposals ({filteredStrategies.length} / {strategies.length})
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredStrategies.length > 0 ? (
                            filteredStrategies.map((strategy) => (
                                <StrategyCard 
                                    key={strategy.id} 
                                    strategy={strategy} 
                                    currentUser={currentUser} 
                                    onVote={handleVote} 
                                    onStrategyClick={handleStrategyClick}
                                />
                            ))
                        ) : (
                            <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
                                <p className="text-lg font-semibold text-gray-700">No Proposals Match Filters</p>
                                <p className="text-sm text-gray-500 mt-1">Try adjusting the status, year, or minimum score.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
// Define the shape for StrategyWithRBM to enable filtering
// export interface StrategyWithRBMExample extends StrategyWithRBM {
//     year: string;
//     averageScore: number;
// }

// interface StrategyListProps {
//   strategies: StrategyWithRBMExample[]; // Using the enriched type
//   currrentUser: SafeUser | null;
// }

// export default function StrategyList({ strategies, currrentUser }: StrategyListProps) {
//     const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };
//     const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);

//     // Function passed to the FilterSidebar to update the state
//     const handleFilterChange = (newFilters: StrategyFilters) => {
//         setActiveFilters(newFilters);
//     };

//     // Use useMemo to filter strategies only when activeFilters or strategies change
//     const filteredStrategies = useMemo(() => {
//         return strategies.filter(strategy => {
            
//             // 1. Status Filter
//             const statusMatch = activeFilters.status === 'ALL' || strategy.status === activeFilters.status;

//             // 2. Year Filter
//             const yearMatch = activeFilters.year === 'ALL' || strategy.year === activeFilters.year;

//             // 3. Minimum Score Filter (Assuming a mock score field called 'averageScore' is available)
//             const scoreMatch = activeFilters.minScore === null || strategy.averageScore >= activeFilters.minScore;

//             return statusMatch && yearMatch && scoreMatch;
//         });
//     }, [strategies, activeFilters]);


//     // Placeholder for the list of strategies
//     if (strategies.length === 0) {
//         return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
//     }

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 p-4">
//       
//       {/* 1. Filtering Area */}
//       <div className="lg:w-1/4">
//         <FilterSidebar onFilterChange={handleFilterChange} />
//       </div>

//       {/* 2. Strategy List Area */}
//       <div className="lg:w-3/4 space-y-6">
//         <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">
//             Active Proposals ({filteredStrategies.length} / {strategies.length})
//         </h2>
//         
//         {filteredStrategies.length > 0 ? (
//           filteredStrategies.map((strategy) => (
//             <StrategyCard key={strategy.id} strategy={strategy} currentUser={currrentUser} onVote={undefined} onStrategyClick={function (x: any) {
//                   throw new Error("Function not implemented.");
//               } } void={undefined} />
//           ))
//         ) : (
//              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
//                  <p className="text-lg text-yellow-800 font-semibold">No results match the current filters.</p>
//                  <p className="text-sm text-yellow-600 mt-1">Try adjusting the status, year, or minimum score.</p>
//              </div>
//         )}
//       </div>
//     </div>
//   );
// }// // components/StrategyList.tsx
// // This component should be a Server Component to fetch the data initially

// import { SafeUser } from "@/app/types";
// import { StrategyWithRBM } from "../types/strategy";
// import FilterSidebar from "./FilterSideBar";
// import StrategyCard from "./StrategyCard";

// interface StrategyListProps {
//   strategies: StrategyWithRBM[];
//   currrentUser:SafeUser|null
// }

// export default function StrategyList({ strategies , currrentUser}: StrategyListProps) {
  
//   // Placeholder for the list of strategies
//   if (strategies.length === 0) {
//     return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
//   }

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 p-4">
      
//       {/* 1. Filtering Area (Sidebar on Desktop, Hidden/Modal on Mobile) */}
//       <div className="lg:w-1/4">
//         {/* The FilterSidebar component would use CSS classes 
//             like 'hidden lg:block' to hide it on small screens, 
//             and a mobile-only button to show a filter modal. */}
//         <FilterSidebar />
//       </div>

//       {/* 2. Strategy List Area (Full width on Mobile, 3/4 on Desktop) */}
//       <div className="lg:w-3/4 space-y-6">
//         <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">Active Proposals ({strategies.length})</h2>
        
//         {strategies.map((strategy) => (
//           // We use the StrategyCard component from earlier, which displays key data.
//           <StrategyCard key={strategy.id} strategy={strategy} currentUser={currrentUser} />
//         ))}
//       </div>
//     </div>
//   );
// }