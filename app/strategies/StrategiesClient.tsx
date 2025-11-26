'use client'
import { AlertTriangle, Plus, Zap } from "lucide-react";
import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "../strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm, { StrategyWithRBMFull } from "../strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
import FilterSidebar from "../strategy/_components/FilterSideBar";
import { SafeUser } from "../types";
import { redirect } from 'next/navigation';
import useLoginModal from "../hooks/useLoginModal";
import StrategiesExportButton from "../strategy/_components/StrategiesExportButton";

// Assuming StrategiesExportButton is defined in its own file and imported:
//import StrategiesExportButton from "./StrategiesExportButton"; 
// NOTE: Adjust the import path for StrategiesExportButton based on where you save the component.

// Interface definitions (assuming these are imported or defined elsewhere)
interface Filters { status: string; year: string; minScore: number | null; }

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const; 

const initialFilters: Filters = { status: 'ALL', year: 'ALL', minScore: null };
const mockAuthorId = 'user-123-alice';

interface StrategyClientProps {
    currentUser: SafeUser | null;
    mockStrategies: StrategyWithUserVotes[];
}
    
const StrategyClient: React.FC<StrategyClientProps> = ({
    currentUser,
    mockStrategies,
}) => {

    // --- ACCESS CONTROL GUARD ---
    const allowedRoles: string[] = ['admin', 'executive'];
    const loginModal = useLoginModal();

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

        return isGlobalAdmin || hasRoleAccess;

    }, [currentUser]);

    // --- State Management ---
    const [strategies, setStrategies] = useState<StrategyWithUserVotes[]>(mockStrategies);
    const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);
    const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithUserVotes | null>(null); 

    // [All handler functions omitted for brevity, they remain unchanged]
    // ...
    // ...
    
    // 1. Voting/Switching Logic (Handles POST/PUT)
    const handleVoteAction = async (strategyId: string, voteType: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => {
        const method = action === 'NEW' ? 'POST' : 'PUT';
        const endpoint = `/api/strategies/${strategyId}/vote`;
        console.log(`method: ${method}, voteType: ${voteType}`)
        if (!currentUser?.id) {
            toast.error("You must be logged in to vote.");
            loginModal.onOpen();
            return;
        }

        const payload = {
            voterId: currentUser.id,
            voteType: voteType,
        };

        try {
            const response = await fetch(endpoint, {
                method: method,
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
                // Throw error to be caught by the front-end display component (VotingSection)
                throw new Error(errorDetail); 
            }

            // Success Path: Use the returned data for an accurate state update.
            const result: StrategyWithUserVotes = await response.json(); 
            setStrategies(prevStrategies => 
                prevStrategies.map(s => s.id === strategyId ? result : s)
            );
            
            toast.success(`Your vote for "${result.title}" was ${action === 'NEW' ? 'recorded' : 'switched to'} "${voteType}"!`);
            
        } catch (error) {
            // Log the error for developer view
            console.error("Voting API error:", error);
            // Re-throw the error so the lower component can handle the failure state display
            throw error; 
        }
    };


    // 2. Cancel Vote Logic (Handles DELETE)
    const handleCancelVote = async (strategyId: string) => {
        if (!currentUser?.id) {
            toast.error("You must be logged in to cancel a vote.");
            loginModal.onOpen();
            return;
        }

        try {
            // Use DELETE method to remove the existing vote
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

            // Success Path: Use the returned data to update the state
            const result: StrategyWithUserVotes = await response.json(); 

            setStrategies(prevStrategies => 
                prevStrategies.map(s => s.id === strategyId ? result : s)
            );

            toast.success("Your vote was successfully canceled.", {
                description: `You can now cast a new vote for "${result.title}".`
            });

        } catch (error) {
            console.error("Cancel Vote API error:", error);
            throw error; // Re-throw to allow component to handle failure
        }
    };

    // 3. Navigation Handlers
    const handleStrategyClick = (strategy: StrategyWithUserVotes) => {
        setSelectedStrategy(strategy);
        setView('form');
    };

    const handleCancelForm = () => {
        setSelectedStrategy(null);
        setView('list');
    };


    const handleSave = (updatedStrategy: StrategyWithUserVotes) => {
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
                // Case 2: Add new strategy (mocking API return structure)
                const newStrategyWithDefaults: StrategyWithUserVotes = { 
                    ...updatedStrategy, 
                    goals: updatedStrategy.goals || [], 
                    id: `temp-${Date.now()}`, 
                    status: ProposalStatus.PENDING_REVIEW, 
                    averageStrategicScore: null, 
                    totalVotesYes: 0, 
                    totalVotesNo: 0, 
                    votes: { YES: 0, NO: 0 },
                    individualVotes: [], // Default empty array for new strategies
                    authorId: currentUser?.id || mockAuthorId, // Ensure authorId is set
                };
                toast.success(`New proposal "${updatedStrategy.title}" submitted for review.`);
                return [newStrategyWithDefaults, ...prevStrategies]; // Add to the top
            }
        });
        handleCancelForm(); // Go back to the list
    };

    // 4. Filtering Logic
    const filteredStrategies = useMemo(() => {
        return strategies?.filter(strategy => {
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
                authorId={currentUser?.id || mockAuthorId} 
                onSave={handleSave as (strategy: StrategyWithRBMFull) => void}
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
                    Review, filter, and vote on current proposals. You are logged in as <span className="text-red-500 font-bold">{currentUser?.name || 'Guest'}</span>
                </p>
            </header>
            
            <hr className="my-8"/>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <FilterSidebar onFilterChange={setCurrentFilters} />
                    
                    {/* 1. SUBMIT BUTTON */}
                    <button 
                        onClick={() => {
                            setSelectedStrategy(null);
                            setView('form');
                        }}
                        className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5"/> Submit New Proposal
                    </button>
                    
                    {/* 2. EXPORT BUTTON (New Addition) */}
                    <StrategiesExportButton />
                    
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
                        Active Proposals [{filteredStrategies?.length}]
                        <span className='text-base font-medium text-gray-500 ml-2'>(Filtered)</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-6">
                        {filteredStrategies?.length > 0 ? (
                            filteredStrategies?.map((strategy, index) => (
                                <StrategyCard
                                    key={strategy.id}
                                    strategy={strategy}
                                    onStrategyClick={handleStrategyClick}
                                    onVote={handleVoteAction}
                                    onCancelVote={handleCancelVote}
                                    currentUser={currentUser}
                                    counter={index} 
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