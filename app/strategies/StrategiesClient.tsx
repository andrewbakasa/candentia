'use client'
import { AlertTriangle, Plus, Zap } from "lucide-react";
import StrategyCard, { StrategyWithRBM } from "../strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm, { StrategyWithRBMFull } from "../strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
import FilterSidebar from "../strategy/_components/FilterSideBar";
import { SafeUser } from "../types";
import { redirect } from 'next/navigation'; // Import redirect

// Interface definitions (assuming these are imported or defined elsewhere)
interface StrategyGoal { id: string; title: string; targetYear: number; }
// Filters will check minScore against the strategy's averageStrategicScore
interface Filters { status: string; year: string; minScore: number | null; }

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

const initialFilters: Filters = { status: 'ALL', year: 'ALL', minScore: null };
const mockAuthorId = 'user-123-alice';

interface StrategyClientProps {
    currentUser: SafeUser | null;
    mockStrategies: StrategyWithRBM[];
}
    
const StrategyClient: React.FC<StrategyClientProps> = ({
    currentUser,
    mockStrategies,
}) => {

    // --- ACCESS CONTROL GUARD ---
    // Roles that are allowed to view this page
    const allowedRoles: string[] = ['admin', 'executive'];

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) {
            return false;
        }

        // Check 1: Is the user a global system admin?
        const isGlobalAdmin = currentUser.isAdmin === true;

        // Check 2: Does the user have a required role in their roles array?
        const hasRoleAccess = currentUser.roles 
            && currentUser.roles.some(role => 
                allowedRoles.includes(role.toLowerCase())
            );

        // Access is granted if they are a global admin OR they have one of the required roles
        return isGlobalAdmin || hasRoleAccess;

    }, [currentUser]);

  
    // --- End ACCESS CONTROL GUARD ---

    const [strategies, setStrategies] = useState<StrategyWithRBMFull[]>(mockStrategies);
    const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);
    const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithRBMFull | null>(null); 

    // --- Core Logic Handlers (Unchanged/Refined) ---

    // 1. Voting Logic 
    const handleVote = async (strategyId: string, voteType: 'YES' | 'NO') => {
        // Mandatory check for user
        if (!currentUser?.id) {
            toast.error("You must be logged in to vote.");
            return;
        }

        const payload = {
            voterId: currentUser.id,
            voteType: voteType,
        };
        
        try {
            const response = await fetch(`/api/strategies/${strategyId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorDetail = errorBody.message || errorDetail;
                } catch (e) {
                    // Ignore if not JSON
                }
                toast.error(`Vote failed: ${errorDetail}`);
                return;
            }

            // Success Path: Use the returned data for an accurate state update.
            const result: StrategyWithRBM = await response.json(); 
            
            setStrategies(prevStrategies => 
                prevStrategies.map(s => s.id === strategyId ? result : s)
            );
            
            toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
            
        } catch (error) {
            console.error("Voting API error:", error);
            toast.error("An unexpected network error occurred while voting.");
        }
    };

    // 2. Navigation Handlers
    const handleStrategyClick = (strategy: StrategyWithRBMFull) => {
        setSelectedStrategy(strategy);
        setView('form');
    };

    const handleCancelForm = () => {
        setSelectedStrategy(null);
        setView('list');
    };

    // 3. Form Save Handler (updates strategies array)
    const handleSave = (updatedStrategy: StrategyWithRBMFull) => {
        setStrategies(prevStrategies => {
            const index = prevStrategies.findIndex(s => s.id === updatedStrategy.id); 
            if (index !== -1) {
                // Case 1: Update existing strategy
                return prevStrategies.map(s => 
                    s.id === updatedStrategy.id 
                        ? updatedStrategy
                        : s
                );
            } else {
                // Case 2: Add new strategy
                const newStrategyWithDefaults: StrategyWithRBMFull = { 
                    ...updatedStrategy, 
                    goals: updatedStrategy.goals || [], 
                    // Set necessary defaults for a new submission:
                    id: `temp-${Date.now()}`, 
                    status: ProposalStatus.PENDING_REVIEW, 
                    averageStrategicScore: null, 
                    totalVotesYes: 0, 
                    totalVotesNo: 0,  
                    votes: { YES: 0, NO: 0 }, 
                };
                toast.success(`New proposal "${updatedStrategy.title}" submitted for review.`);
                return [...prevStrategies, newStrategyWithDefaults];
            }
        });
        handleCancelForm(); // Go back to the list
    };

    // 4. Filtering Logic
    const filteredStrategies = useMemo(() => {
        return strategies.filter(strategy => {
            // Filter by status
            const statusMatch = currentFilters.status === 'ALL' || strategy.status === currentFilters.status;

            // Filter by year
            const yearMatch = currentFilters.year === 'ALL' || String(strategy.year) === currentFilters.year;

            // Filter by minimum score using strategy.averageStrategicScore
            const minScore = currentFilters.minScore;
            const scoreMatch = minScore === null || (strategy.averageStrategicScore !== null && strategy.averageStrategicScore >= minScore);

            return statusMatch && yearMatch && scoreMatch;
        });
    }, [strategies, currentFilters]);

    // --- Render Logic ---

    if (view === 'form') {
        return (
            <StrategyForm 
                initialStrategy={selectedStrategy}
                // Use currentUser.id, fallback to mockAuthorId for typing consistency if needed
                authorId={currentUser?.id || mockAuthorId} 
                onSave={handleSave}
                onCancel={handleCancelForm}
                currentUser={currentUser}
            />
        );
    }
  // Redirect unallowed users
    if (!hasRequiredRole) {
        // NOTE: Redirect to a 'denied' or 'home' page if access is denied
        return redirect('/denied'); 
    }
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans p-1 sm:p-4">
            <Toaster position="top-right" richColors />
            
            <header className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
                    Strategy Proposals
                </h1>
                <p className="text-gray-600 mt-2">
                    Review, filter, and vote on current proposals. You are logged in as <span className="text-red-500 font-bold">{currentUser?.name || mockAuthorId}</span>
                </p>
            </header>
            
            <hr className="my-8"/>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <FilterSidebar onFilterChange={setCurrentFilters} />
                    
                    <button 
                        onClick={() => {
                            setSelectedStrategy(null);
                            setView('form');
                        }}
                        className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5"/> Submit New Proposal
                    </button>
                    
                    {/* Personalized Note referencing Saved Information */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
                        <p className='mt-1 text-xs'>
                            All submissions are assessed against **Guideline 1 of 2025 (Business Model Requirements)** before moving to the VOTING\_OPEN status, as per the rules dated 14 September 2025.
                        </p>
                    </div>
                </div>
                
                {/* Proposal List */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Active Proposals [{filteredStrategies.length}]
                        <span className='text-base font-medium text-gray-500 ml-2'>(Filtered)</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-6">
                        {filteredStrategies.length > 0 ? (
                            filteredStrategies.map((strategy, index) => (
                                <StrategyCard
                                    key={strategy.id}
                                    strategy={strategy}
                                    onStrategyClick={handleStrategyClick}
                                    onVote={handleVote}
                                    currentUser={currentUser}
                                    counter= {index}
                                />
                            ))
                        ) : (
                            <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
                                <p className="text-lg font-semibold text-gray-700">No Proposals Found</p>
                                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or submit a new strategy proposal!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StrategyClient;
// 'use client'
// import { AlertTriangle, Plus, Zap } from "lucide-react";
// import StrategyCard, { StrategyWithRBM } from "../strategy/_components/StrategyCard";
// import { useMemo, useState } from "react";
// import StrategyForm, { StrategyWithRBMFull } from "../strategy/_components/StrategyForm";
// import { toast, Toaster } from "sonner";
// import FilterSidebar from "../strategy/_components/FilterSideBar";
// import { SafeUser } from "../types";


// // Interface definitions (assuming these are imported or defined elsewhere)
// interface StrategyGoal { id: string; title: string; targetYear: number; }
// // Filters will check minScore against the strategy's averageStrategicScore
// interface Filters { status: string; year: string; minScore: number | null; }

// const ProposalStatus = {
//     DRAFT: 'DRAFT',
//     PENDING_REVIEW: 'PENDING_REVIEW',
//     VOTING_OPEN: 'VOTING_OPEN',
//     APPROVED: 'APPROVED',
//     REJECTED: 'REJECTED',
// };

// const initialFilters: Filters = { status: 'ALL', year: 'ALL', minScore: null };
// const mockAuthorId = 'user-123-alice';

// interface StrategyClientProps {
//     currentUser: SafeUser | null;
//     mockStrategies: StrategyWithRBM[];
// }
    
// const StrategyClient: React.FC<StrategyClientProps> = ({
//     currentUser,
//     mockStrategies,
// }) => {

//     const [strategies, setStrategies] = useState<StrategyWithRBMFull[]>(mockStrategies);
//     const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);
//     const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
//     const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithRBMFull | null>(null); 

//     // --- Core Logic Handlers ---

//     // 1. Voting Logic (No change needed here as the server returns the updated object)
//     const handleVote = async (strategyId: string, voteType: 'YES' | 'NO') => {
//         // Mandatory check for user
//         if (!currentUser?.id) {
//             toast.error("You must be logged in to vote.");
//             return;
//         }

//         const payload = {
//             voterId: currentUser.id,
//             voteType: voteType,
//         };
        
//         try {
//             const response = await fetch(`/api/strategies/${strategyId}/vote`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload),
//             });

//             if (!response.ok) {
//                 let errorDetail = response.statusText;
//                 try {
//                     const errorBody = await response.json();
//                     errorDetail = errorBody.message || errorDetail;
//                 } catch (e) {
//                     // Ignore if not JSON
//                 }
//                 toast.error(`Vote failed: ${errorDetail}`);
//                 return;
//             }

//             // Success Path: Use the returned data for an accurate state update.
//             const result: StrategyWithRBM = await response.json(); 
            
//             // FIX: Update the state using the full, fresh data from the server.
//             setStrategies(prevStrategies => 
//                 prevStrategies.map(s => s.id === strategyId ? result : s)
//             );
            
//             toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
            
//         } catch (error) {
//             console.error("Voting API error:", error);
//             toast.error("An unexpected network error occurred while voting.");
//         }
//     };

//     // 2. Navigation Handlers
//     const handleStrategyClick = (strategy: StrategyWithRBMFull) => {
//         setSelectedStrategy(strategy);
//         setView('form');
//     };

//     const handleCancelForm = () => {
//         setSelectedStrategy(null);
//         setView('list');
//     };

//     // 3. Form Save Handler (updates strategies array)
//     const handleSave = (updatedStrategy: StrategyWithRBMFull) => {
//         setStrategies(prevStrategies => {
//             const index = prevStrategies.findIndex(s => s.id === updatedStrategy.id); 
//             if (index !== -1) {
//                 // Case 1: Update existing strategy
//                 return prevStrategies.map(s => 
//                     s.id === updatedStrategy.id 
//                         ? updatedStrategy
//                         : s
//                 );
//             } else {
//                 // Case 2: Add new strategy
//                 const newStrategyWithDefaults: StrategyWithRBMFull = { 
//                     ...updatedStrategy, 
//                     goals: updatedStrategy.goals || [], 
//                     // Set necessary defaults for a new submission:
//                     id: `temp-${Date.now()}`, 
//                     status: ProposalStatus.PENDING_REVIEW, 
//                     // 🎯 CORRECTION: Use averageStrategicScore instead of score
//                     averageStrategicScore: null, 
//                     totalVotesYes: 0, // Add explicit default for votes
//                     totalVotesNo: 0,  // Add explicit default for votes
//                     votes: { YES: 0, NO: 0 },        // Initial empty votes array
//                     // Ensure other required fields for StrategyWithRBMFull are present if necessary
//                 };
//                 toast.success(`New proposal "${updatedStrategy.title}" submitted for review.`);
//                 return [...prevStrategies, newStrategyWithDefaults];
//             }
//         });
//         handleCancelForm(); // Go back to the list
//     };

//     // 4. Filtering Logic
//     const filteredStrategies = useMemo(() => {
//         return strategies.filter(strategy => {
//             // Filter by status
//             const statusMatch = currentFilters.status === 'ALL' || strategy.status === currentFilters.status;

//             // Filter by year
//             const yearMatch = currentFilters.year === 'ALL' || String(strategy.year) === currentFilters.year;

//             // 🎯 CORRECTION: Filter by minimum score using strategy.averageStrategicScore
//             const minScore = currentFilters.minScore;
//             // Check if minScore is null OR (strategy.averageStrategicScore is not null AND score >= minScore)
//             const scoreMatch = minScore === null || (strategy.averageStrategicScore !== null && strategy.averageStrategicScore >= minScore);

//             return statusMatch && yearMatch && scoreMatch;
//         });
//     }, [strategies, currentFilters]);

//     // --- Render Logic ---

//     if (view === 'form' && currentUser) {
//         return (
//             <StrategyForm 
//                 initialStrategy={selectedStrategy}
//                 authorId={currentUser?.id || mockAuthorId}
//                 onSave={handleSave}
//                 onCancel={handleCancelForm}
//                 currentUser={currentUser}
//             />
//         );
//     }

//     // ... (rest of the component remains the same)

//     return (
//         <div className="min-h-screen bg-gray-50 font-sans p-1 sm:p-4">
//             <Toaster position="top-right" richColors />
            
//             <header className="max-w-7xl mx-auto mb-8">
//                 <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
//                     Strategy Proposals
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                     Review, filter, and vote on current proposals. You are logged in as <span className="text-red-500 font-bold">{currentUser?.name || mockAuthorId}</span>
//                 </p>
//             </header>
            
//             <hr className="my-8"/>

//             <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
//                 {/* Sidebar */}
//                 <div className="lg:col-span-1">
//                     <FilterSidebar onFilterChange={setCurrentFilters} />
                    
//                     <button 
//                         onClick={() => {
//                             setSelectedStrategy(null);
//                             setView('form');
//                         }}
//                         className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
//                     >
//                         <Plus className="w-5 h-5"/> Submit New Proposal
//                     </button>
                    
//                     <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
//                         <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
//                         <p className='mt-1 text-xs'>
//                             All submissions are assessed against **Guideline 1 of 2025 (Business Model Requirements)** before moving to the VOTING\_OPEN status.
//                         </p>
//                     </div>
//                 </div>
                
//                 {/* Proposal List */}
//                 <div className="lg:col-span-3">
//                     <h2 className="text-2xl font-bold text-gray-800 mb-6">
//                          Active Proposals [{filteredStrategies.length}]
//                         <span className='text-base font-medium text-gray-500 ml-2'>(Filtered)</span>
//                     </h2>

//                     <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-6">
//                         {filteredStrategies.length > 0 ? (
//                             filteredStrategies.map((strategy, index) => (
//                                 <StrategyCard
//                                     key={strategy.id}
//                                     strategy={strategy}
//                                     onStrategyClick={handleStrategyClick}
//                                     onVote={handleVote}
//                                     currentUser={currentUser}
//                                     counter= {index}
//                                 />
//                             ))
//                         ) : (
//                             <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
//                                 <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
//                                 <p className="text-lg font-semibold text-gray-700">No Proposals Found</p>
//                                 <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or submit a new strategy proposal!</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default StrategyClient;