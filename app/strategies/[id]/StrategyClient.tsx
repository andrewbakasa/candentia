'use client'
import { AlertTriangle, Plus, Zap, ArrowLeft } from "lucide-react"; // 💡 Added ArrowLeft icon
import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "@/app/strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm, { StrategyWithRBMFull } from "@/app/strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
import { SafeUser } from "@/app/types";
import useLoginModal from "@/app/hooks/useLoginModal";
import Link from 'next/link'; // 💡 IMPORTED Link from next/link

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

// 1. UPDATED PROPS: Expects a single strategy object (Full type) or null
interface StrategyClientProps {
    currentUser: SafeUser | null;
    mockStrategy: StrategyWithUserVotes| null ;
}
    
const StrategyClient: React.FC<StrategyClientProps> = ({
    currentUser,
    mockStrategy, // Destructure the single strategy
}) => {
    const mockAuthorId = 'user-123-alice';
    const loginModal = useLoginModal();

    // --- ACCESS CONTROL CHECK (For actions/forms) ---
    const allowedRoles: string[] = ['admin', 'executive'];

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) return false;
        const isGlobalAdmin = currentUser.isAdmin === true;
        const hasRoleAccess = currentUser.roles 
            && currentUser.roles.some(role => 
                allowedRoles.includes(role.toLowerCase())
            );
        return isGlobalAdmin || hasRoleAccess;
    }, [currentUser]);

   
    const [strategy, setStrategy] = useState<StrategyWithUserVotes | null>(mockStrategy);
    
    const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithUserVotes | null>(null); 

    // 💡 NEW: State to manage the expanded/collapsed state of the single card.
    // Set to true by default for a single-strategy view.
    const [isStrategyExpanded, setIsStrategyExpanded] = useState(true);

    // 💡 NEW: Handler to toggle the expanded state of the single card.
    // It takes an ID for compatibility with StrategyCard's prop signature, 
    // but ignores the ID and just toggles the local state.
    const handleToggleExpand = (id: string) => {
        setIsStrategyExpanded(prev => !prev);
    };

    // [The rest of the vote/save handlers remain identical]
    // ...
    const handleVoteAction = async (strategyId: string,voteType: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => {
        const method = action === 'NEW' ? 'POST' : 'PUT';
        const endpoint = `/api/strategies/${strategyId}/vote`; 

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
                } catch (e) {}
                toast.error(`Vote failed: ${errorDetail}`);
                return;
            }

            const result: StrategyWithUserVotes = await response.json(); 
            setStrategy(result); 
            
            toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
                
        } catch (error) {
            console.error("Voting API error:", error);
            toast.error("An unexpected network error occurred while voting.");
        }
    };


    const handleCancelVote = async (strategyId: string) => {
        if (!currentUser?.id) {
            toast.error("You must be logged in to cancel a vote.");
            loginModal.onOpen();
            return;
        }

        if (!strategy || strategy.id !== strategyId) {
            toast.error("Strategy data is unavailable for vote cancellation.");
            return;
        }

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
                } catch (e) {}
                toast.error(`Cancellation failed: ${errorDetail}`);
                return;
            }

            const result: StrategyWithUserVotes = await response.json(); 
            setStrategy(result); 
            
            toast.success("Your vote was successfully canceled.", {
                description: "You can now cast a new vote."
            });

        } catch (error) {
            console.error("Cancel Vote API error:", error);
            toast.error("An unexpected network error occurred while canceling the vote.");
        }
    };


    // 5. Navigation Handlers
    const handleStrategyClick = (strategyToEdit: StrategyWithUserVotes) => {
        // Only authorized users can click the card to edit (go to form)
        if (!hasRequiredRole) {
            toast.error("You must be an admin or executive to edit this proposal.");
            return;
        }
        setSelectedStrategy(strategyToEdit);
        setView('form');
    };

    const handleCancelForm = () => {
        setSelectedStrategy(null);
        setView('list');
    };

    // 6. Form Save Handler - Updates the single strategy state 
    const handleSave = (updatedStrategy: StrategyWithRBM) => {
        
        if (strategy) {
            const updatedFullStrategy: StrategyWithUserVotes = {
                ...strategy, 
                ...updatedStrategy,
            };
            setStrategy(updatedFullStrategy);
            toast.success(`Strategy "${updatedStrategy.title}" updated successfully.`);
        } else {
            toast.error("Cannot save: Strategy state is null.");
        }
        
        handleCancelForm(); 
    };


    // --- Render Logic ---

    // Show the form only if user is authorized AND view is 'form'
    if (view === 'form') {
        if (!hasRequiredRole) {
             toast.error("Access denied. You cannot view the editing form.");
             setView('list'); // Fallback to list view
             return null;
        }
        return (
            <StrategyForm 
                initialStrategy={selectedStrategy}
                authorId={currentUser?.id || mockAuthorId} 
                onSave={handleSave as (strategy: StrategyWithUserVotes) => void}
                onCancel={handleCancelForm}
                currentUser={currentUser}
            />
        );
    }
    
    // The single strategy to show is the state variable itself
    const singleStrategyToShow = strategy; 


  

     return (
         <div className="min-h-screen bg-gray-50 font-sans p-1 sm:p-4">
             <Toaster position="top-right" richColors />
            
          <header className="max-w-7xl mx-auto mb-8">
                {/* 1. Link is always full width and at the very top */}
                <div className="w-full mb-4">
                    <Link href="/strategies" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 font-medium text-sm py-2">
                        <ArrowLeft className="w-4 h-4 mr-1"/> Return to All Strategies
                    </Link>
                </div>

                {/* 2. Header and Spacer: Use flex only on large screens (lg:flex) */}
                {/* On mobile (default), this div acts as a block element, forcing H1 to the next line. */}
                <div className="flex-col lg:flex lg:justify-between lg:items-center w-full"> 
                    
                    {/* Empty placeholder for lg screens to push H1 right */}
                    <div className="hidden lg:block lg:flex-grow"></div> 

                    {/* 💡 Header Title: Centered on mobile (text-center) but pushed right on large screens (lg:ml-auto) */}
                    <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block w-full text-center lg:w-auto lg:text-left lg:ml-auto">
                        Strategy Proposal Review
                    </h1>
                </div>

                {/* The rest of the content (description/status) follows below the main line. 
                    We add text-center on mobile for consistency, and lg:text-left for desktop. */}
                <p className="text-gray-600 mt-2 text-center lg:text-left">
                    Review and vote on this specific strategy identified by ID. You are currently: 
                    <span className="text-red-500 font-bold ml-1">
                        {currentUser ? (hasRequiredRole ? `${currentUser.name} (Authorized)` : `${currentUser.name} (View Only)`) : 'Unauthenticated (View Only)'}
                    </span>
                </p>
            </header>
            
             <hr className="my-8"/>

             <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                 {/* Sidebar - Retain structure for navigation/notes */}
                 <div className="lg:col-span-1">
                     <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                         <h3 className="font-bold text-gray-800 mb-2">Access Status</h3>
                         <p className="text-xs text-gray-500">
                             {hasRequiredRole ? 'You can view, edit, and submit new strategy.' : 'You can only view this strategy.'}
                         </p>
                     </div>
                    
                     {/* Conditional rendering of the "Submit New Proposal" button */}
                     {hasRequiredRole ? (
                         <button 
                             onClick={() => {
                                 setSelectedStrategy(null); // Clear selected to start new form
                                 setView('form');
                             }}
                             className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                         >
                             <Plus className="w-5 h-5"/> Submit New Strategy
                         </button>
                     ) : (
                         <div className="mt-6 p-3 w-full border border-gray-300 bg-gray-200 text-gray-700 rounded-xl text-sm text-center font-medium">
                             Log in as Admin/Executive to Submit or Edit.
                         </div>
                     )}

                     {/* Policy Note */}
                     <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                         <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
                         <p className='mt-1 text-xs'>
                             All submissions are assessed against <strong>Guideline 1 of 2025 (Business Model Requirements)</strong> before moving to the VOTING\_OPEN status, as per the rules dated 14 September 2025.
                         </p>
                     </div>
                 </div>
                
                 {/* Proposal Detail */}
                 <div className="lg:col-span-3">
                     <h2 className="text-2xl font-bold text-gray-800 mb-6">
                         {singleStrategyToShow ? `Strategy: ${singleStrategyToShow.title}` : "Loading Strategy"}
                     </h2>

                     <div className="grid grid-cols-1 gap-6">
                         {singleStrategyToShow ? (
                            <StrategyCard
                                 key={singleStrategyToShow.id}
                                 strategy={singleStrategyToShow}
                                 onStrategyClick={handleStrategyClick}
                                 onVote={handleVoteAction}
                                 onCancelVote={handleCancelVote} 
                                 currentUser={currentUser}
                                 counter={0} 
                                // 💡 NEW: Control expansion state from here
                                isExpanded={isStrategyExpanded}
                                // 💡 NEW: Pass the local toggle handler
                                onToggleExpand={handleToggleExpand}
                            />
                        ) : (
                            <div className="p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
                                <p className="text-lg font-semibold text-gray-700">Strategy Not Found</p>
                                <p className="text-sm text-gray-500 mt-1">The strategy ID you requested may be invalid.</p>
                            </div>
                        )}
                     </div>
                 </div>
             </main>
         </div>
     );
};
export default StrategyClient;