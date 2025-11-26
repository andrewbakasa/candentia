'use client';

import { SafeUser } from "@/app/types";
import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "./StrategyCard";
import { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Zap, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import FilterSidebar, { StrategyFilters } from "./FilterSideBar";
import { StrategyWithRBMFull } from "./StrategyForm";


// Strategy structure used by this list component
// NOTE: StrategyWithRBM is used from StrategyCard import for consistency
const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };

interface StrategyListProps {
    strategies: StrategyWithUserVotes[];
    currentUser: SafeUser | null;
}

const StrategyDashboardList: React.FC<StrategyListProps> = ({ strategies, currentUser }) => {
    const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);
    // State to track loading status of ongoing vote requests
    const [isVoting, setIsVoting] = useState<string | null>(null); // strategyId being voted on
    
    // 💡 NEW: State to track which card is expanded (for the list view)
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    // Function passed to the FilterSidebar to update the state
    const handleFilterChange = (newFilters: StrategyFilters) => {
        setActiveFilters(newFilters);
    };
    
    // Function to handle toggling card expansion
    const handleToggleExpand = (strategyId: string) => {
        setExpandedCardId(prevId => (prevId === strategyId ? null : strategyId));
    };

    // Placeholder actions for the StrategyCard component
    const handleStrategyClick = (strategy: StrategyWithRBMFull) => {
        toast.info(`Navigating to details for: ${strategy.title}`);
        // In a real app, this would change the view state or navigate.
    };
    
    // --- Core API Implementation for Canceling a Vote (No change needed) ---
    const handleCancelVote = useCallback(async (strategyId: string) => {
        if (!currentUser) {
            toast.error("You must be logged in to cancel a vote.");
            return;
        }

        if (isVoting) {
            toast.warning("Please wait for the current action to complete.");
            return;
        }

        setIsVoting(strategyId); // Use loading state for cancel operation too

        try {
            const response = await fetch(`/api/strategies/${strategyId}/vote?voterId=${currentUser.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorDetail = errorBody.message || errorDetail;
                } catch (e) {
                    // Ignore if not JSON
                }
                throw new Error(errorDetail);
            }
            
            toast.success("Your vote has been successfully canceled.", {
                description: "You are now free to cast a new vote or keep the proposal neutral."
            });

            // NOTE: Data refresh needed here in production.

        } catch (error) {
            const errorMessage = (error as Error).message || "An unknown error occurred while canceling the vote.";
            toast.error(`Cancellation failed: ${errorMessage}`);
            console.error("Cancel Vote API Error:", error);

        } finally {
            setIsVoting(null); // Clear loading state
        }
    }, [currentUser, isVoting]);
    
    // 💡 UPDATED: Core API Implementation for Voting - NOW ACCEPTS 'action' ARGUMENT
    // onVote is defined in StrategyCard as: (strategyId: string, type: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => Promise<void>
    const handleVote = useCallback(async (strategyId: string, voteType: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => {
        if (!currentUser) {
            toast.error("You must be logged in to cast a vote.");
            return;
        }

        if (isVoting) {
            toast.warning("Please wait for the current action to complete.");
            return;
        }

        setIsVoting(strategyId);

        try {
            const payload = {
                voterId: currentUser.id, 
                voteType: voteType,
            };

            // Determine HTTP Method based on action
            const method = action === 'NEW' ? 'POST' : 'PUT'; 

            const response = await fetch(`/api/strategies/${strategyId}/vote`, {
                method: method, // 💡 Use method based on action
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorDetail = errorBody.message || errorDetail;
                } catch (e) {}
                throw new Error(errorDetail);
            } else {
                // Success path
                const successMessage = action === 'NEW' 
                    ? `Your vote was successfully recorded as "${voteType}"!`
                    : `Your vote was successfully switched to "${voteType}"!`;
                toast.success(successMessage);
                // NOTE: Data refresh needed here in production.
            }

        } catch (error) {
            const errorMessage = (error as Error).message || "An unknown error occurred during voting.";
            toast.error(`Voting failed: ${errorMessage}`);
            console.error("Voting API Error:", error);

        } finally {
            setIsVoting(null); // Clear loading state regardless of outcome
        }
    }, [currentUser, isVoting]);


    // Use useMemo to filter strategies only when activeFilters or strategies change (Unchanged)
    const filteredStrategies = useMemo(() => {
        return strategies.filter(strategy => {
            const statusMatch = activeFilters.status === 'ALL' || strategy.status === activeFilters.status;
            const yearMatch = activeFilters.year === 'ALL' || String(strategy.year) === activeFilters.year;
            const minScore = activeFilters.minScore;
            // NOTE: Check for averageStrategicScore, as averageScore is null in StrategyWithRBM.
            const scoreMatch = minScore === null || (strategy.averageStrategicScore !== null && strategy.averageStrategicScore >= minScore);
            return statusMatch && yearMatch && scoreMatch;
        });
    }, [strategies, activeFilters]);


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
                    **{strategies.length}** total proposals available.
                </p>
                <div className="mt-4 p-3 flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-sm shadow-sm">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                        Proposals are scored against **Guideline 1 of 2025 (Business Model Requirements)**.
                    </p>
                </div>
            </header>
        
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* 1. Filtering Area */}
                <div className="lg:col-span-1">
                    <FilterSidebar onFilterChange={handleFilterChange} />
                </div>

                {/* 2. Strategy List Area */}
                <div className="lg:col-span-3 relative"> {/* Added relative for the absolute loader */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Active Proposals ({filteredStrategies.length} / {strategies.length})
                    </h2>
                    
                    {/* Voting Loader Overlay */}
                    {isVoting && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl">
                            <div className="flex items-center text-white bg-indigo-600 p-4 rounded-lg shadow-2xl">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                {`Casting ${isVoting}...`}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredStrategies.length > 0 ? (
                            filteredStrategies.map((strategy, index) => (
                                <StrategyCard 
                                    key={strategy.id}
                                    strategy={strategy}
                                    currentUser={currentUser}
                                    onVote={handleVote}
                                    onCancelVote={handleCancelVote} 
                                    onStrategyClick={handleStrategyClick} 
                                    counter={index}
                                    // 💡 NEW: Pass card expansion state and handler
                                    isExpanded={expandedCardId === strategy.id}
                                    onToggleExpand={handleToggleExpand}
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
// 'use client';

// import { SafeUser } from "@/app/types";
// import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "./StrategyCard";
// import { useState, useMemo, useCallback } from 'react';
// import { AlertTriangle, Zap, Loader2 } from "lucide-react";
// import { toast, Toaster } from "sonner";
// import FilterSidebar, { StrategyFilters } from "./FilterSideBar";
// import { StrategyWithRBMFull } from "./StrategyForm";


// // Strategy structure used by this list component
// // NOTE: StrategyWithRBM is used from StrategyCard import for consistency
// const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };

// interface StrategyListProps {
//     strategies: StrategyWithUserVotes[];
//     currentUser: SafeUser | null;
// }

// const StrategyDashboardList: React.FC<StrategyListProps> = ({ strategies, currentUser }) => {
//     const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);
//     // State to track loading status of ongoing vote requests
//     const [isVoting, setIsVoting] = useState<string | null>(null); // strategyId being voted on

//     // Function passed to the FilterSidebar to update the state
//     const handleFilterChange = (newFilters: StrategyFilters) => {
//         setActiveFilters(newFilters);
//     };
//     
//     // Placeholder actions for the StrategyCard component
//     const handleStrategyClick = (strategy: StrategyWithRBMFull) => {
//         toast.info(`Navigating to details for: ${strategy.title}`);
//         // In a real app, this would change the view state or navigate.
//     };
//     
//     // --- NEW: Core API Implementation for Canceling a Vote ---
//     const handleCancelVote = useCallback(async (strategyId: string) => {
//         if (!currentUser) {
//             toast.error("You must be logged in to cancel a vote.");
//             return;
//         }

//         if (isVoting) {
//             toast.warning("Please wait for the current action to complete.");
//             return;
//         }

//         setIsVoting(strategyId); // Use loading state for cancel operation too

//         try {
//             // Send DELETE request to the voting endpoint, including the user's ID
//             // The API route should identify and delete the specific vote record.
//             const response = await fetch(`/api/strategies/${strategyId}/vote?voterId=${currentUser.id}`, {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' },
//             });

//             if (!response.ok) {
//                 let errorDetail = response.statusText;
//                 try {
//                     const errorBody = await response.json();
//                     errorDetail = errorBody.message || errorDetail;
//                 } catch (e) {
//                     // Ignore if not JSON
//                 }
//                 throw new Error(errorDetail);
//             }
            
//             // Success Path
//             toast.success("Your vote has been successfully canceled.", {
//                 description: "You are now free to cast a new vote or keep the proposal neutral."
//             });

//             // NOTE: In a production app, the parent component must trigger a data refresh 
//             // after a successful vote/cancel to update the 'strategies' prop with new vote counts.

//         } catch (error) {
//             const errorMessage = (error as Error).message || "An unknown error occurred while canceling the vote.";
//             toast.error(`Cancellation failed: ${errorMessage}`);
//             console.error("Cancel Vote API Error:", error);

//         } finally {
//             setIsVoting(null); // Clear loading state
//         }
//     }, [currentUser, isVoting]);
    
//     // --- Core API Implementation for Voting (Unchanged, except for removing retry loop for brevity) ---
//     const handleVote = useCallback(async (strategyId: string, voteType: 'YES' | 'NO') => {
//         if (!currentUser) {
//             toast.error("You must be logged in to cast a vote.");
//             return;
//         }

//         if (isVoting) {
//             toast.warning("Please wait for the current action to complete.");
//             return;
//         }

//         setIsVoting(strategyId);

//         try {
//             const payload = {
//                 voterId: currentUser.id, 
//                 voteType: voteType,
//             };

//             const response = await fetch(`/api/strategies/${strategyId}/vote`, {
//                 method: 'POST', // This endpoint must handle both POST (new) and PUT (switch)
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload),
//             });

//             if (!response.ok) {
//                 let errorDetail = response.statusText;
//                 try {
//                     const errorBody = await response.json();
//                     errorDetail = errorBody.message || errorDetail;
//                 } catch (e) {
//                     // Ignore if not JSON
//                 }
//                 throw new Error(errorDetail);
//             } else {
//                 // Success path
//                 toast.success(`Your vote was successfully recorded as "${voteType}"!`);
//             }

//         } catch (error) {
//             // Handle final error from the API or fetch process
//             const errorMessage = (error as Error).message || "An unknown error occurred during voting.";
//             toast.error(`Voting failed: ${errorMessage}`);
//             console.error("Voting API Error:", error);

//         } finally {
//             setIsVoting(null); // Clear loading state regardless of outcome
//         }
//     }, [currentUser, isVoting]);


//     // Use useMemo to filter strategies only when activeFilters or strategies change (Unchanged)
//     const filteredStrategies = useMemo(() => {
//         // ... (Filter logic remains unchanged) ...
//         return strategies.filter(strategy => {
//             const statusMatch = activeFilters.status === 'ALL' || strategy.status === activeFilters.status;
//             const yearMatch = activeFilters.year === 'ALL' || String(strategy.year) === activeFilters.year;
//             const minScore = activeFilters.minScore;
//             const scoreMatch = minScore === null || (strategy.averageScore !== null && strategy.averageScore >= minScore);
//             return statusMatch && yearMatch && scoreMatch;
//         });
//     }, [strategies, activeFilters]);

//     // Check for strategies *before* filtering (Unchanged)
//     if (strategies.length === 0) {
//         return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
//     }

//     return (
//         <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
//             <Toaster position="top-right" richColors />
//             
//             <header className="max-w-7xl mx-auto mb-8">
//                 <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
//                     DAO Strategy List
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                     {strategies.length} total proposals available.
//                 </p>
//                 <div className="mt-4 p-3 flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-sm shadow-sm">
//                     <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
//                     <p>
//                         Proposals are scored against <strong>Guideline 1 of 2025 (Business Model Requirements).</strong>
//                     </p>
//                 </div>
//             </header>
//         
//             <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
//                 
//                 {/* 1. Filtering Area */}
//                 <div className="lg:col-span-1">
//                     <FilterSidebar onFilterChange={handleFilterChange} />
//                 </div>

//                 {/* 2. Strategy List Area */}
//                 <div className="lg:col-span-3 relative"> {/* Added relative for the absolute loader */}
//                     <h2 className="text-2xl font-bold text-gray-800 mb-6">
//                         Active Proposals ({filteredStrategies.length} / {strategies.length})
//                     </h2>
//                     
//                     {/* Voting Loader Overlay */}
//                     {isVoting && (
//                         <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl">
//                             <div className="flex items-center text-white bg-indigo-600 p-4 rounded-lg shadow-2xl">
//                                 <Loader2 className="w-6 h-6 animate-spin mr-2" />
//                                 Casting vote...
//                             </div>
//                         </div>
//                     )}

//                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//                         {filteredStrategies.length > 0 ? (
//                             filteredStrategies.map((strategy, index) => (
//                                 <StrategyCard 
//                                     key={strategy.id}
//                                     strategy={strategy}
//                                     currentUser={currentUser}
//                                     onVote={handleVote}
//                                     onCancelVote={handleCancelVote} // <-- PASS THE NEW HANDLER
//                                     onStrategyClick={handleStrategyClick} 
//                                     counter={index}
//                                 />
//                             ))
//                         ) : (
//                             <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
//                                 <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
//                                 <p className="text-lg font-semibold text-gray-700">No Proposals Match Filters</p>
//                                 <p className="text-sm text-gray-500 mt-1">Try adjusting the status, year, or minimum score.</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
// export default StrategyDashboardList;