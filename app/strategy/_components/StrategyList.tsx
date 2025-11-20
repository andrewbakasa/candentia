'use client';

import { SafeUser } from "@/app/types";
import StrategyCard, { StrategyWithRBM } from "./StrategyCard";
import { useState, useMemo, useCallback } from 'react';
// FIX: Corrected casing from "./FilterSideBar" to "./FilterSidebar"
//import FilterSidebar, { StrategyFilters } from "./FilterSidebar";
import { AlertTriangle, Zap, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import FilterSidebar, { StrategyFilters } from "./FilterSideBar";



// Strategy structure used by this list component
// NOTE: StrategyWithRBM is used from StrategyCard import for consistency
const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };

interface StrategyListProps {
    strategies: StrategyWithRBM[];
    currentUser: SafeUser | null;
}

const StrategyDashboardList: React.FC<StrategyListProps> = ({ strategies, currentUser }) => {
    const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);
    // State to track loading status of ongoing vote requests
    const [isVoting, setIsVoting] = useState<string | null>(null); // strategyId being voted on

    // Function passed to the FilterSidebar to update the state
    const handleFilterChange = (newFilters: StrategyFilters) => {
        setActiveFilters(newFilters);
    };
    
    // Placeholder actions for the StrategyCard component
    const handleStrategyClick = (strategy: StrategyWithRBM) => {
        toast.info(`Navigating to details for: ${strategy.title}`);
        // In a real app, this would change the view state or navigate.
    };
    
    // --- Core API Implementation for Voting ---
    const handleVote = useCallback(async (strategyId: string, voteType: 'YES' | 'NO') => {
        console.log("i am in...............>")
        if (!currentUser) {
            toast.error("You must be logged in to cast a vote.");
            return;
        }

        if (isVoting) {
            toast.warning("Please wait for the current vote to complete.");
            return;
        }

        setIsVoting(strategyId);

        try {
            const payload = {
                voterId: currentUser.id, // Mandatory check for the API
                voteType: voteType,
            };

            let attempt = 0;
            const maxRetries = 3; 

            //while (attempt < maxRetries) {
                try {
                    const response = await fetch(`/api/strategies/${strategyId}/vote`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        // Attempt to read JSON error message
                        let errorDetail = response.statusText;
                        try {
                            const errorBody = await response.json();
                            errorDetail = errorBody.message || errorDetail;
                        } catch (e) {
                            // Ignore if not JSON
                        }
                        
                        // If it's the final attempt, throw the descriptive error
                        if (attempt >= maxRetries - 1) {
                             throw new Error(errorDetail);
                        } else {
                            // On retry attempt, just log the warning
                            console.warn(`Vote failed (Attempt ${attempt + 1}/${maxRetries}): ${errorDetail}`);
                        }
                    } else {
                        // Success path
                        const result = await response.json();
                        //toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
                        
                        // NOTE: In a production app, you would dispatch a state update here 
                        // to refresh the strategies list, or ideally, the parent component 
                        // handles re-fetching or listens to a real-time update.
                        // For this example, we rely on the parent component's data fetching.
                   //     break; // Exit loop on success
                    }
                } catch (error) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        throw error; // Re-throw last error to be caught by the outer catch
                    }
                    
                    // Exponential backoff delay
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
           // }

        } catch (error) {
            // Handle final error from the API or fetch process
            const errorMessage = (error as Error).message || "An unknown error occurred during voting.";
            toast.error(`Voting failed: ${errorMessage}`);
            console.error("Voting API Error:", error);

        } finally {
            setIsVoting(null); // Clear loading state regardless of outcome
        }
    }, [currentUser, isVoting]);


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
                    
                    {/* Voting Loader Overlay */}
                    {isVoting && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl">
                            <div className="flex items-center text-white bg-indigo-600 p-4 rounded-lg shadow-2xl">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Casting vote...
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredStrategies.length > 0 ? (
                            filteredStrategies.map((strategy) => (
                                <StrategyCard 
                                    key={strategy.id} 
                                    strategy={strategy} 
                                    currentUser={currentUser} 
                                    // Pass the implemented handleVote function
                                    onVote={handleVote} 
                                    onStrategyClick={handleStrategyClick}
                                    // Pass the current voting status to disable buttons
                                   // isVoting={isVoting === strategy.id}
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
export default StrategyDashboardList;