'use client'
import { AlertTriangle, Plus, Zap } from "lucide-react";
import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "../strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm, { StrategyWithRBMFull } from "../strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
// Import the FilterSidebarProps interface from the FilterSidebar component to ensure consistency
import FilterSidebar, { StrategyFilters as FilterSidebarFilters } from "../strategy/_components/FilterSideBar"; 
import { SafeUser } from "../types";
import { redirect } from 'next/navigation';
import useLoginModal from "../hooks/useLoginModal";
import StrategiesExportButton from "../strategy/_components/StrategiesExportButton";

// Assuming Filters structure based on FilterSidebar
type Filters = FilterSidebarFilters;

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const; 

// Update initialFilters to include searchTerm
const initialFilters: Filters = { status: 'ALL', year: 'ALL', minScore: null, searchTerm: '' };
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
        const isGlobalAdmin = currentUser.isAdmin === true;
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
    
    // State to track the currently expanded card ID
    const [expandedCardId, setExpandedCardId] = useState<string | null>(
        // Initialize the first card to be expanded
        mockStrategies.length > 0 ? mockStrategies[0].id : null
    );

    // Handler to toggle card expansion
    const handleToggleExpand = (id: string) => {
        setExpandedCardId(prevId => {
            if (prevId === id) {
                return null;
            }
            return id;
        });
    };

    // [Handler functions for Voting, CancelVote, Navigation, and Save are omitted for brevity, as they were unchanged]
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
        setExpandedCardId(strategy.id); // Also expand the card when viewing form
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
                toast.success(`New strategy "${updatedStrategy.title}" submitted for review.`);
                return [newStrategyWithDefaults, ...prevStrategies]; // Add to the top
            }
        });
        handleCancelForm(); // Go back to the list
    };

    // 4. Filtering Logic
    const filteredStrategies = useMemo(() => {
        // Normalize search term for case-insensitive search
        const lowerSearchTerm = currentFilters.searchTerm.toLowerCase().trim();

        return strategies?.filter(strategy => {
            // 1. Filter by status
            const statusMatch = currentFilters.status === 'ALL' || strategy.status === currentFilters.status;

            // 2. Filter by year
            const yearMatch = currentFilters.year === 'ALL' || String(strategy.year) === currentFilters.year;

            // 3. Filter by minimum score
            const minScore = currentFilters.minScore;
            const scoreMatch = minScore === null || (strategy.averageStrategicScore !== null && strategy.averageStrategicScore >= minScore);

            // 4. Corrected Text Search Match
            const textSearchMatch = lowerSearchTerm === '' ||
                // Check primary fields: title and content
                strategy.title.toLowerCase().includes(lowerSearchTerm) ||
                strategy.content.toLowerCase().includes(lowerSearchTerm) || 
                strategy?.author?.name && strategy?.author?.name.toLowerCase().includes(lowerSearchTerm) || 
                 strategy?.author?.email && strategy?.author?.email.toLowerCase().includes(lowerSearchTerm) || 
                // Check nested RBM goals
                strategy.goals?.some(goal => {
                    // Check Goal Title and Description
                    const goalMatch = 
                        (goal.title && goal.title.toLowerCase().includes(lowerSearchTerm)) ||
                        (goal.title && goal.title.toLowerCase().includes(lowerSearchTerm));

                    // Check Outcomes within the goal
                    const outcomeMatch = goal.outcomes?.some(outcome => {
                        // Check Outcome Title and Description
                        const descriptionMatch = 
                            (outcome.title && outcome.title.toLowerCase().includes(lowerSearchTerm)) ||
                            (outcome.title && outcome.title.toLowerCase().includes(lowerSearchTerm));

                        // Check Outputs within the outcome
                        const outputMatch = outcome.outputs?.some(output => 
                            // Check Output Title and Description
                            (output.title && output.title.toLowerCase().includes(lowerSearchTerm)) ||
                            (output.title && output.title.toLowerCase().includes(lowerSearchTerm)) ||
                            (output.responsible && output.responsible.toLowerCase().includes(lowerSearchTerm)) 
                        );

                        return descriptionMatch || outputMatch;
                    });
                    
                    return goalMatch || outcomeMatch;
                });

            return statusMatch && yearMatch && scoreMatch && textSearchMatch;
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
                    Review, filter, and vote on current strategies. You are logged in as <span className="text-red-500 font-bold">{currentUser?.name || 'Guest'}</span>
                </p>
            </header>
            
            <hr className="my-8"/>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* FilterSidebar will now pass the searchTerm when filters change */}
                    <FilterSidebar onFilterChange={setCurrentFilters} /> 
                    
                    {/* 1. SUBMIT BUTTON */}
                    <button 
                        onClick={() => {
                            setSelectedStrategy(null);
                            setView('form');
                        }}
                        className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5"/> Submit New Strategy
                    </button>
                    
                    {/* 2. EXPORT BUTTON (New Addition) */}
                    <StrategiesExportButton strategies= {filteredStrategies}/>
                    
                    {/* Personalized Note referencing Saved Information */}
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
                        <p className='mt-1 text-xs'>
                            All submissions are assessed against **Guideline 1 of 2025 (Business Model Requirements)** before moving to the VOTING\_OPEN status, as per the rules dated 14 September 2025.
                        </p>
                    </div>
                </div>
                
                {/* Proposal List */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Active Strategies [{filteredStrategies?.length}]
                        <span className='text-base font-medium text-gray-500 ml-2'>(Filtered)</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-2">
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
                                    isExpanded={strategy.id === expandedCardId}
                                    onToggleExpand={handleToggleExpand} 
                                    searchText={currentFilters.searchTerm.toLowerCase().trim()}                                
                            />
                            ))
                        ) : (
                            <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-1"/>
                                <p className="text-lg font-semibold text-gray-700">No Strategies Found</p>
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