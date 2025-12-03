'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { 
    Bug, AlertTriangle, Clock, Target, User, Calendar, LucideIcon, FileText, Zap, Aperture, CheckCircle, Package, PlusCircle, ListTodo, Layers, ArrowLeft,
    XCircle,
    Trophy,
    ChevronUp,
    ChevronDown,
    Trash2,
    Edit,
    Save
} from 'lucide-react';
import toast from 'react-hot-toast'; // Recommended for better user feedback

// --- Imports (Adjust paths as necessary) ---
import { 
    ActionStatus, 
    BreakdownModel, 
    CorrectiveActionModel, 
    DefectDetailModel, 
    //DefectStatus, 
    Priority, 
    AnalysisRecordModel, 
    AnalysisMethod 
} from "../_components/types/types";
import { formatDate } from '@/app/contracts/_components/utils';
import ConfirmAction from '../_components/ConfirmAction';

// --- Type Definitions (Assuming these are available) ---
interface ImprovementOpportunity {
    id: string;
    dateIdentified: string;
    description: string;
    targetArea: string;
    sourceModule: string | null;
    proposedAction: string;
    implementationDate: string | null;
    isImplemented: boolean;
}

enum DefectStatus {
    IDENTIFIED = 'IDENTIFIED',
    IN_ANALYSIS = 'IN_ANALYSIS',
    ACTION_DEFINED = 'ACTION_DEFINED',
    ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
    CLOSED_VERIFIED = 'CLOSED_VERIFIED',
}

interface Defect {
    id: string;
    title: string;
    status: DefectStatus;
    area: string | null;
    improvementOpportunities: ImprovementOpportunity[];
    // Include other necessary defect fields here
}
// --- UTILITY COMPONENTS ---
 const API_BASE_URL = '/api/defects/io'; // Assuming API path
// Utility function to get priority color classes for styling
const getPriorityClasses = (priority: Priority | DefectStatus): string => {
  switch (priority) {
    case Priority.CRITICAL:
      return 'bg-red-700 text-white border-red-900';
    case Priority.HIGH:
      return 'bg-red-100 text-red-700 border-red-300'; // Slightly softer red for high
    case DefectStatus.IN_ANALYSIS:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'; // Slightly softer yellow
    case DefectStatus.CLOSED_VERIFIED:
        return 'bg-green-700 text-white border-green-900'; // Darker green for closed status
    case Priority.LOW:
      return 'bg-green-100 text-green-700 border-green-300';
    case DefectStatus.IDENTIFIED:
      return 'bg-gray-200 text-gray-700 border-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-500';
  }
};

interface DetailItemProps {
    icon: LucideIcon;
    label: string;
    value: string | number | JSX.Element;
    span?: number;
}

// Component for a single detail item (Icon + Label + Value)
const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, span = 1 }) => (
  <div className={`col-span-1 p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition hover:border-indigo-200`}>
    <div className="flex items-start space-x-3">
      <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="text-base font-bold text-gray-800 break-words mt-0.5">{value}</p>
      </div>
    </div>
  </div>
);
  // --- PLACEHOLDER FORM COMPONENTS (Wrapped for desktop) ---
    // Forms use an 'onClose' prop to allow the parent to hide them
    const BaseFormCard = ({ title, icon: Icon, children, color, onClose }: { title: string, icon: LucideIcon, children: React.ReactNode, color: string, onClose: () => void }) => (
        <div className={`p-4 border-2 border-dashed ${color} bg-white rounded-xl shadow-lg mt-6`}>
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h4 className={`text-lg font-bold text-${color.split('-')[1]}-700 flex items-center`}>
                    <Icon className="w-5 h-5 mr-2"/> {title}
                </h4>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 font-bold text-xl leading-none">&times;</button>
            </div>
            {children}
        </div>
    );

    const CorrectiveActionForm = ({ defectId, onClose }: { defectId: string, onClose: () => void }) => (
        <BaseFormCard title="Define Corrective Action" icon={Zap} color="border-blue-300" onClose={onClose}>
            <p className="text-sm text-gray-600 mb-3">Linked to Defect: **{defectId}**</p>
            <div className="space-y-3">
                <input type="text" placeholder="Action Description" className="w-full p-2 border rounded" />
                <input type="text" placeholder="Responsible Person" className="w-full p-2 border rounded" />
                <input type="date" placeholder="Due Date" className="w-full p-2 border rounded" />
                <button className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">Submit Action</button>
            </div>
        </BaseFormCard>
    );

    // --- UPDATED COMPONENT: RootCauseAnalysisForm with API Submission Logic ---
    const RootCauseAnalysisForm = ({ defectId, onClose }: { defectId: string, onClose: () => void }) => {
        const [analystName, setAnalystName] = useState('');
        const [methodUsed, setMethodUsed] = useState<AnalysisMethod | ''>('');
        const [summaryOfFindings, setSummaryOfFindings] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const onSubmit = useCallback(async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!analystName || !methodUsed || !summaryOfFindings) {
                toast.error('Please fill out all fields for the analysis.');
                return;
            }

            setIsLoading(true);
            
            try {
                const response = await fetch(`/api/defects/rca`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        defectId,
                        analystName,
                        methodUsed,
                        summaryOfFindings,
                        analysisDate: new Date().toISOString(), // Use current date/time
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create analysis record.');
                }

                toast.success('Root Cause Analysis submitted successfully!');
                
                // Close the form and refresh the page to display the new analysis record
                onClose();
                window.location.reload(); 

            } catch (error: any) {
                console.error('[RCA_SUBMISSION_ERROR]', error);
                toast.error(error.message || 'An unexpected error occurred during submission.');
            } finally {
                setIsLoading(false);
            }
        }, [defectId, analystName, methodUsed, summaryOfFindings, onClose]);


        return (
            <BaseFormCard title="New Root Cause Analysis" icon={Aperture} color="border-indigo-300" onClose={onClose}>
                <p className="text-sm text-gray-600 mb-3">Linked to Defect: **{defectId}**</p>
                <form onSubmit={onSubmit} className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Analyst Name" 
                        className="w-full p-2 border rounded" 
                        value={analystName}
                        onChange={(e) => setAnalystName(e.target.value)}
                        disabled={isLoading}
                    />
                    <select 
                        className="w-full p-2 border rounded"
                        value={methodUsed}
                        onChange={(e) => setMethodUsed(e.target.value as AnalysisMethod)}
                        disabled={isLoading}
                    >
                        <option value="">Select Method</option>
                        {/* Ensure keys in AnalysisMethod match the values in the option */}
                        <option value={AnalysisMethod.FIVE_WHYS}>Five Whys</option>
                        <option value={AnalysisMethod.APOLLO}>Apollo</option>
                        <option value={AnalysisMethod.FMECA}>FMECA</option>
                    </select>
                    <textarea 
                        placeholder="Summary of Findings/Root Cause Text" 
                        rows={3} 
                        className="w-full p-2 border rounded"
                        value={summaryOfFindings}
                        onChange={(e) => setSummaryOfFindings(e.target.value)}
                        disabled={isLoading}
                    ></textarea>
                    <button 
                        type="submit"
                        className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition disabled:bg-indigo-400"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Submitting...' : 'Complete Analysis'}
                    </button>
                </form>
            </BaseFormCard>
        );
    };
// --- MAIN COMPONENT INTERFACE & IMPLEMENTATION ---
// --- ImprovementOpportunityForm Component (CREATE/EDIT) ---
// We make the form reusable by checking if 'initialData' is passed (for editing).
interface OpportunityFormProps {
    sourceId: string;
    onClose: () => void;
    onSuccess: (io: ImprovementOpportunity, mode: 'create' | 'edit') => void;
    initialData?: ImprovementOpportunity; // Optional prop for editing
}

const ImprovementOpportunityForm: React.FC<OpportunityFormProps> = ({ sourceId, onClose, onSuccess, initialData }) => {
    const isEditMode = !!initialData;
    const [proposedAction, setProposedAction] = useState(initialData?.proposedAction || '');
    const [targetArea, setTargetArea] = useState(initialData?.targetArea || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [isImplemented, setIsImplemented] = useState(initialData?.isImplemented || false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitOpportunity = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposedAction.trim() || !targetArea.trim()) {
            toast.error('Proposed Action and Target Area are required.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            id: initialData?.id, // Only sent in edit mode
            description: description.trim(),
            targetArea: targetArea.trim(),
            proposedAction: proposedAction.trim(),
            isImplemented: isImplemented,
            // Source ID is only needed for creation
            sourceId: !isEditMode ? sourceId : undefined, 
        };
       

        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode ? `${API_BASE_URL}/${initialData!.id}` : API_BASE_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to ${method === 'PUT' ? 'update' : 'create'} opportunity.`);
            }

            const result: ImprovementOpportunity = await response.json();
            
            toast.success(`Opportunity ${isEditMode ? 'updated' : 'submitted'} successfully!`);
            onSuccess(result, isEditMode ? 'edit' : 'create'); 
            onClose();

        } catch (error: any) {
            console.error('Submission Error:', error);
            toast.error(`Error: ${error.message || 'Network error.'}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [sourceId, proposedAction, targetArea, description, isImplemented, isEditMode, initialData, onClose, onSuccess]);

    return (
        <form onSubmit={handleSubmitOpportunity} className="p-4 mt-4 border border-green-300 bg-green-50 rounded-lg shadow-inner space-y-3">
            <h4 className="text-lg font-semibold text-green-700">
                {isEditMode ? `Edit Opportunity ${initialData?.id.substring(0, 8)}` : `New Opportunity for Defect ${sourceId.substring(0, 8)}`}
            </h4>
            
            <input 
                type="text" 
                placeholder="Target Area (e.g., Maintenance SOPs)" 
                value={targetArea}
                onChange={(e) => setTargetArea(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isSubmitting}
            />

            <input 
                type="text" 
                placeholder="Proposed Action (Required)" 
                value={proposedAction}
                onChange={(e) => setProposedAction(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isSubmitting}
            />
            
            <textarea
                placeholder="Detailed Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                disabled={isSubmitting}
            />

            {isEditMode && (
                <div className="flex items-center space-x-2">
                    <input
                        id="isImplemented"
                        type="checkbox"
                        checked={isImplemented}
                        onChange={(e) => setIsImplemented(e.target.checked)}
                        className="rounded text-green-600 focus:ring-green-500"
                        disabled={isSubmitting}
                    />
                    <label htmlFor="isImplemented" className="text-sm font-medium text-gray-700">
                        Mark as Implemented
                    </label>
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="text-sm font-medium px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded disabled:opacity-50 flex items-center"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Opportunity' : 'Submit Opportunity')}
                    {!isSubmitting && <Save className="w-4 h-4 ml-2" />}
                </button>
            </div>
        </form>
    );
};

// --- ImprovementOpportunityCard Component (READ/DELETE/TRIGGER EDIT) ---
interface OpportunityCardProps {
    opportunity: ImprovementOpportunity;
    onEditStart: (io: ImprovementOpportunity) => void;
    onDelete: (id: string) => Promise<void>;
}

const ImprovementOpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onEditStart, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleDelete = async () => {
       // if (window.confirm('Are you sure you want to permanently delete this Improvement Opportunity?')) {
            setIsDeleting(true);
            await onDelete(opportunity.id);
            setIsDeleting(false);
        //}
    };

    const StatusIcon = opportunity.isImplemented ? CheckCircle : Clock;
    const statusColor = opportunity.isImplemented ? 'text-green-500' : 'text-yellow-500';

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center space-x-3 w-full">
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{opportunity.proposedAction}</p>
                        <p className="text-xs text-gray-500">
                            ID: {opportunity.id.substring(0, 8)} | Identified: {formatDate(opportunity.dateIdentified)}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse Details" : "Expand Details"}
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => onEditStart(opportunity)}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition"
                        aria-label="Edit Opportunity"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    {/* <button 
                        onClick={handleDelete}
                        className="p-1 rounded-full text-red-500 hover:bg-red-100 transition disabled:opacity-50"
                        disabled={isDeleting}
                        aria-label="Delete Opportunity"
                    >
                        {isDeleting ? <Clock className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button> */}
                   
                    <ConfirmAction 
                            onConfirm={handleDelete} 
                            itemId={opportunity.id}
                            action="Delete" 
                            disabled={false} // Opposite of the main state
                            heading="Delete Opportunity"
                            description="This action will delete this comment. Press the Delete button to continue."
                            showHint={true}
                        />
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2 text-sm">
                    <p><strong>Target Area:</strong> {opportunity.targetArea}</p>
                    <p><strong>Source Module:</strong> {opportunity.sourceModule || 'N/A'}</p>
                    <p><strong>Description:</strong> {opportunity.description}</p>
                    <p><strong>Status:</strong> <span className={`font-semibold ${statusColor}`}>{opportunity.isImplemented ? 'Implemented' : 'Pending'}</span></p>
                    {opportunity.implementationDate && <p><strong>Implemented On:</strong> {formatDate(opportunity.implementationDate)}</p>}
                </div>
            )}
        </div>
    );
};
interface DefectDetailViewProps {
  currentUser: any; // Type your user model correctly
  defect: DefectDetailModel;
  allDefectsHref: string; // NEW PROP for the back link target
}



const DefectDetailView: React.FC<DefectDetailViewProps> = ({ defect, allDefectsHref }) => {

    const [activeTab, setActiveTab] = useState<'details' | 'analysis' | 'actions' | 'improvement'>('details');
   // 1. INITIALIZE STATE: Use the incoming 'defect' prop to seed the local state.
    const [localDefect, setLocalDefect] = useState<DefectDetailModel>(defect);
    // 2. USE MEMO: The memoized value now depends on the local state, NOT the prop.
    const opportunities: ImprovementOpportunity[] = useMemo(
        () => localDefect.improvementOpportunities || [], 
        [localDefect.improvementOpportunities] // Dependency is the LOCAL state array
    );

  
    const [opportunityToEdit, setOpportunityToEdit] = useState<ImprovementOpportunity | null>(null);


    // New state for toggling form visibility
    const [showActionForm, setShowActionForm] = useState(false);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);
    const [showImprovementForm, setShowImprovementForm] = useState(false);

 

    const getActionProgress = (actions: CorrectiveActionModel[]) => {
        if (actions.length === 0) return 0;
        const completed = actions.filter(a => a.status === ActionStatus.COMPLETE).length;
        return Math.round((completed / actions.length) * 100);
    };

    const actionProgress = getActionProgress(defect.actions);

    // --- RENDER FUNCTIONS ---

    const renderAction = (action: CorrectiveActionModel) => {
        const isComplete = action.status === ActionStatus.COMPLETE;
        const statusClasses = isComplete ? 'bg-green-100 text-green-700 border-green-500' : 'bg-yellow-100 text-yellow-700 border-yellow-500';

        return (
            <div key={action.id} className="border-l-4 border-blue-500 pl-4 py-3 mb-4 bg-white rounded shadow hover:shadow-md transition">
                <div className="flex justify-between items-start">
                    <p className={`font-semibold text-gray-800 text-base ${isComplete ? 'line-through text-gray-500' : ''}`}>{action.description}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap border ${statusClasses}`}>
                        {action.status}
                    </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">Responsible: **{action.responsible}**</p>
                <p className="text-xs text-gray-500 mt-1">Due: **{new Date(action.dueDate).toLocaleDateString()}**</p>
            </div>
        );
    };

    const renderBreakdown = (breakdown: BreakdownModel) => (
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 shadow-md">
            <h4 className="font-bold text-lg text-red-700 flex items-center"><Package className="w-5 h-5 mr-2"/> Breakdown Event</h4>
            <p className="mt-2 text-sm text-gray-700"><strong>Start Time:</strong> {new Date(breakdown.startTime).toLocaleString()}</p>
            <p className="text-sm text-gray-700"><strong>Duration:</strong> <span className="font-bold">{breakdown.durationMinutes || 'N/A'}</span> minutes</p>
        </div>
    );

    const renderAnalysis = (analysis: AnalysisRecordModel) => (
        <div key={analysis.id} className="mb-4 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 shadow-sm hover:bg-indigo-100 transition">
            <p className="text-sm text-indigo-800 font-medium">**{analysis.methodUsed}** Analysis by **{analysis.analystName}** on {new Date(analysis.analysisDate).toLocaleDateString()}</p>
            <p className="mt-2 text-gray-700 text-sm italic border-t border-indigo-200 pt-2">Findings: {analysis.summaryOfFindings}</p>
        </div>
    );

  
interface BaseFormCardProps {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    onClose: () => void;
    children: React.ReactNode;
}



    
    // Icon mapping for tabs
    const tabIcons: Record<typeof activeTab, LucideIcon> = {
        details: ListTodo,
        analysis: Aperture,
        actions: Zap,
        improvement: Target,
    };



    // CREATE Success Handler
    const handleCreateSuccess = useCallback((newIo: ImprovementOpportunity) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            improvementOpportunities: [newIo, ...prevDefect.improvementOpportunities],
            // Update defect status to reflect active action definition
            status: DefectStatus.ACTION_DEFINED, 
        }));
        setShowImprovementForm(false);
    }, []);

    // EDIT Success Handler
    const handleEditSuccess = useCallback((updatedIo: ImprovementOpportunity) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            improvementOpportunities: prevDefect.improvementOpportunities.map(io => 
                io.id === updatedIo.id ? updatedIo : io
            ),
        }));
        setOpportunityToEdit(null); // Exit edit mode
    }, []);

    // DELETE Handler (Called from OpportunityCard)
    const handleDelete = useCallback(async (id: string) => {
        try {
            // API call to delete the opportunity
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to delete opportunity.');
            }

            // Update local state to remove the deleted opportunity
            setLocalDefect(prevDefect => ({
                ...prevDefect,
                improvementOpportunities: prevDefect.improvementOpportunities.filter(io => io.id !== id),
            }));

            toast.success('Opportunity deleted successfully.');

        } catch (error: any) {
            console.error('Deletion Error:', error);
            toast.error(`Error: ${error.message || 'Network error.'}`);
        }
    }, []);


    const renderForm = () => {
        if (opportunityToEdit) {
            return (
                <ImprovementOpportunityForm 
                    sourceId={localDefect.id} 
                    onClose={() => setOpportunityToEdit(null)} 
                    onSuccess={handleEditSuccess}
                    initialData={opportunityToEdit}
                />
            );
        }

        if (showImprovementForm) {
            return (
                <ImprovementOpportunityForm 
                    sourceId={localDefect.id} 
                    onClose={() => setShowImprovementForm(false)} 
                    onSuccess={handleCreateSuccess}
                />
            );
        }
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-1 sm:p-3 lg:p-6">
            <div className="max-w-7xl mx-auto">
        
            {/* HEADER SECTION: Improved Shadow/Border for Visual Hierarchy */}
            <section className="bg-white p-1 sm:p-2 rounded-xl shadow-2xl border-t-8 border-indigo-600 mb-0 sticky top-0 z-10 lg:static lg:top-auto">
                
                {/* <<<--- START OF ADDED: Back to List Link --->>> */}
                <a href={allDefectsHref} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-150 mb-4 font-semibold text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2"/> Back to All Defect List
                </a>
                {/* <<<--- END OF ADDED: Back to List Link --->>> */}
                
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{defect.title}</h1>
                <p className="text-gray-600 mt-1 text-base hidden sm:block">{defect.description}</p>
                <div className="mt-0 flex flex-wrap gap-1 text-sm items-center">
                    <span className={`px-3 py-0 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(defect.status)}`}>
                        <Clock className="w-4 h-4 inline mr-1"/> {defect.status}
                    </span>
                    <span className={`px-3 py-1 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(defect.priority)}`}>
                        <AlertTriangle className="w-4 h-4 inline mr-1"/> Priority: {defect.priority}
                    </span>
                    <span className="text-gray-500 font-medium text-xs">ID: **{defect.id}**</span>
                </div>
            </section>
                
            {/* MAIN CONTENT LAYOUT: Two Columns on Large Screens (2/3 + 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

                {/* LEFT COLUMN: MAIN TABS (2/3 width on desktop) */}
                <div className="lg:col-span-3 bg-white shadow-xl rounded-xl p-2 sm:p-3">
                    
                    {/* Tabs for Navigation */}
                    <div className="flex flex-wrap border-b mb-2 gap-x-1 sm:gap-x-2">
                        {['details', 'analysis', 'actions', 'improvement'].map((tab) => {
                            const TabIcon = tabIcons[tab as typeof activeTab];
                            return (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold transition duration-150 rounded-t-lg flex items-center ${activeTab === tab ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
                            >
                                <TabIcon className="w-4 h-4 mr-2"/>
                                {tab.replace(/./, c => c.toUpperCase()).replace(/([a-z])([A-Z])/g, '$1 $2')}
                            </button>
                            );
                        })}
                    </div>

                    {/* --- TAB CONTENT: DETAILS --- */}
                    {activeTab === 'details' && (
                        <div className="space-y-1">
                            
                            <h3 className="text-xl font-semibold mb-1 border-b pb-1 flex items-center text-gray-700"><Layers className="w-5 h-5 mr-2 text-indigo-500"/> Defect Root/Area Details</h3>
                            <p className="text-gray-600">{defect.description}</p>
                            
                            {/* Detailed Metadata Grid */}
                            <div className="flex flex-col sm:flex-row gap-1 pt-2 border-t border-gray-100">
                                <DetailItem icon={Calendar} label="Identified Date" value={new Date(defect.identificationDate).toLocaleDateString()} />
                                <DetailItem icon={User} label="Reported By" value={defect?.reportedBy || 'Unknown'} />
                                <DetailItem icon={FileText} label="Equipment Tag" value={defect.equipmentTag || 'N/A'} />
                                <DetailItem icon={Target} label="Area/Location" value={defect.area || 'N/A'} />
                            </div>


                            {defect.breakdown && renderBreakdown(defect.breakdown)}
                            
                            <div className="p-4 bg-white border rounded-xl shadow-md border-t-4 border-green-300">
                                <h3 className="text-xl font-semibold mb-3 border-b pb-1 flex items-center text-green-700"><CheckCircle className="w-5 h-5 mr-2"/> Elimination Record</h3>
                                {defect.eliminationRecord ? (
                                    <p className="p-3 bg-green-50 rounded text-green-800">
                                        **Closed Date:** {defect.eliminationRecord.dateClosed ? new Date(defect.eliminationRecord.dateClosed).toLocaleDateString() : 'Pending Closure'}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 italic p-3 bg-yellow-50 rounded">Defect has not been formally eliminated. Proceed to Analysis and Actions.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* --- TAB CONTENT: ANALYSIS --- */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-2">
                            
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex justify-between items-center text-indigo-700">
                                Root Cause Analysis History ({defect.analyses.length})
                                <button
                                onClick={() => setShowAnalysisForm(!showAnalysisForm)}
                                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl flex items-center shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-95"
                                >
                                <PlusCircle className="w-4 h-4 mr-1"/> New Analysis
                                </button>
                            </h3>
                            <div className="space-y-4">
                                {defect.analyses.length > 0 ? defect.analyses.map(renderAnalysis) : <p className="text-gray-500 p-3 bg-gray-50 rounded">No root cause analysis records found.</p>}
                            </div>
                            {showAnalysisForm && <RootCauseAnalysisForm defectId={defect.id} onClose={() => setShowAnalysisForm(false)} />}
                        </div>
                    )}

                    {/* --- TAB CONTENT: ACTIONS --- */}
                    {activeTab === 'actions' && (
                        <div className="space-y-2">


                            <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                                
                                {/* Title: Uses text-lg on mobile, text-xl on larger screens (sm:) */}
                                <h3 className="text-lg sm:text-xl font-semibold text-blue-700 leading-tight flex items-center">
                                    Defined Corrective Actions 
                                    {/* Count: Styled as a clean, distinctive badge */}
                                    <span className="ml-2 px-2 py-0.5 text-sm bg-blue-100 text-blue-800 rounded-full font-medium flex-shrink-0">
                                        ({defect.actions.length})
                                    </span>
                                </h3>
                                
                                {/* Action Button: Compact on mobile (icon-only), full text on desktop */}
                                <button 
                                    onClick={() => setShowActionForm(!showActionForm)}
                                    // Button Styling: Consistent shadow, rounded-lg, responsive padding
                                    className="
                                        bg-blue-600 text-white 
                                        px-3 py-1 sm:px-4 sm:py-2 rounded-lg 
                                        flex items-center 
                                        hover:bg-blue-700 transition duration-150 
                                        shadow-md
                                    "
                                    aria-label="Define New Corrective Action" 
                                >
                                    {/* Icon: Always visible and slightly larger (w-5 h-5) */}
                                    <PlusCircle className="w-5 h-5 flex-shrink-0" />
                                    
                                    {/* Text: Hidden on mobile (default), visible on desktop (sm:inline) */}
                                    <span className="hidden sm:inline ml-2 text-sm font-medium">
                                        Define Action
                                    </span>
                                </button>
                                
                            </div>

                            {/* Progress Bar for Actions */}
                            <div className="p-4 bg-gray-100 rounded-lg shadow-inner">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Completion Progress: {actionProgress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${actionProgress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {defect.actions.length > 0 ? defect.actions.map(renderAction) : <p className="text-gray-500 p-3 bg-gray-50 rounded">No corrective actions defined.</p>}
                            </div>
                            {showActionForm && <CorrectiveActionForm defectId={defect.id} onClose={() => setShowActionForm(false)} />}
                        </div>
                    )}
                    
                

            {/* --- TAB CONTENT: IMPROVEMENT --- */}
                {activeTab === 'improvement' && (
                    <div className="space-y-4">
                        
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            
                            {/* Title: Smaller on mobile, larger on desktop, clear primary color */}
                            <h3 className="text-lg sm:text-xl font-semibold text-green-700">
                                Continuous Improvement Opportunities
                            </h3>
                            
                            {/* Button: Highly optimized for mobile */}
                            <button 
                                onClick={() => setShowImprovementForm(!showImprovementForm)}
                                className="
                                    bg-green-600 text-white 
                                    px-3 py-1 sm:px-4 sm:py-2 rounded-lg 
                                    flex items-center 
                                    hover:bg-green-700 transition duration-150 
                                    shadow-md
                                "
                                aria-label="Add New Continuous Improvement Opportunity" 
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span className="hidden sm:inline ml-2 text-sm font-medium">
                                    New Opportunity
                                </span>
                            </button>
                            
                        </div>
                        
                        <p className="text-gray-600 p-3 bg-gray-50 rounded">
                            Use this section to log systematic process or CI opportunities identified during the defect resolution process.
                        </p>



                         {/* Render the Create or Edit Form */}
                    {renderForm()}

                    
                    {/* --- DYNAMIC OPPORTUNITY LISTING --- */}
                    {opportunities.length > 0 ? (
                        <div className="space-y-3 pt-4">
                            {opportunities.map((opportunity) => (
                                <ImprovementOpportunityCard 
                                    key={opportunity.id} 
                                    opportunity={opportunity} 
                                    onEditStart={setOpportunityToEdit} // Function to start editing
                                    onDelete={handleDelete} // Function to delete
                                />
                            ))}
                        </div>
                    ) : (
                        // Placeholder for when no opportunities exist
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-gray-700 flex items-center">
                            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            <span className="text-sm italic">
                                No logged CI Opportunities for this defect. Use the New Opportunity button to record one.
                            </span>
                        </div>
                    )}


                </div>
                        
                )}

                </div>

                {/* RIGHT COLUMN: SUMMARY SIDEBAR (1/3 width on desktop) */}
                <div className="lg:col-span-3 space-y-2">
                    
                    {/* Key Metrics Card */}
                    <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-t-4 border-gray-400">
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Key Metrics</h3>
                        {/* Note: DetailItem is designed for single item. Using flex-col here works well for the sidebar. */}
                        <div className="flex flex-col sm:flex-row gap-4"> 
                            <DetailItem icon={Aperture} label="Analyses Count" value={defect.analyses.length} />
                            <DetailItem icon={Zap} label="Actions Count" value={defect.actions.length} />
                            <DetailItem icon={CheckCircle} label="Actions Completed" value={`${actionProgress}%`} />
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default DefectDetailView;