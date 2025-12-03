'use client';
import React, { useState, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { 
    Bug, AlertTriangle, Clock, Target, User, Calendar, LucideIcon, FileText, Zap, Aperture, CheckCircle, Package, PlusCircle, ListTodo, Layers, ArrowLeft,
    XCircle,
    Trophy,
    ChevronUp,
    ChevronDown,
    Trash2,
    Edit,
    Save,
    ClipboardList
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
// Define the shape of a single navigation item to enforce type safety
type NavItem = {
    key: SectionKey;
    label: string;
    Icon: React.ElementType; 
    ref: React.RefObject<HTMLDivElement>;
    color: string;
};
/** The type that represents the valid keys for our scroll ref map. */
type SectionKey = 'details' | 'analysis' | 'actions' | 'improvement';

 const DefectDetailView: React.FC<DefectDetailViewProps> = ({ defect, allDefectsHref }) => {
    // We use a local state initialized from the prop to simulate data mutation (e.g., adding an IO)
    const [localDefect, setLocalDefect] = useState<DefectDetailModel>(defect);
    
    
     // State to manage quick-jump for mobile (correctly typed using SectionKey)
    const [activeSection, setActiveSection] = useState<SectionKey>('details');


    const [opportunityToEdit, setOpportunityToEdit] =  useState<ImprovementOpportunity | null>(null);
    const [showActionForm, setShowActionForm] = useState(false);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);
    const [showImprovementForm, setShowImprovementForm] = useState(false);

    // Refs for scrolling (using MutableRefObject<HTMLElement | null> for generic DOM element)
    const detailRef = useRef<HTMLDivElement>(null);
    const analysisRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const improvementRef = useRef<HTMLDivElement>(null);
    
    
    // Memoized opportunities list
    const opportunities = useMemo(
        () => localDefect.improvementOpportunities || [], 
        [localDefect.improvementOpportunities] 
    );
    
    // Calculate progress
    const getActionProgress = (actions: CorrectiveActionModel[]) => {
        if (actions.length === 0) return 0;
        const completed = actions.filter(a => a.status === ActionStatus.COMPLETE).length;
        return Math.round((completed / actions.length) * 100);
    };
    
    const actionProgress = getActionProgress(localDefect.actions);


        // Define the refMap using the SectionKey type
    // We explicitly define the keys using SectionKey to prevent indexing errors.
    const refMap: Record<SectionKey, MutableRefObject<HTMLDivElement | null>> = {
        details: detailRef,
        analysis: analysisRef,
        actions: actionsRef,
        improvement: improvementRef,
    };


     // Scroll function for mobile navigation
    const scrollToSection = useCallback((section: SectionKey) => {
        // TypeScript now knows 'section' is guaranteed to be one of the keys in refMap
        setActiveSection(section);
        
        const ref = refMap[section]; // No error here because 'section' is type SectionKey
        
        if (ref && ref.current) {
            // Smooth scroll with an offset to account for the sticky header
            const yOffset = -80; // Adjusted for header height
            const y = ref.current.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, []);

 

    // --- RENDER HELPERS (kept from original) ---

    const renderAction = (action: CorrectiveActionModel) => {
        const isComplete = action.status === ActionStatus.COMPLETE;
        const statusClasses = isComplete ? 'bg-green-100 text-green-700 border-green-500' : 'bg-yellow-100 text-yellow-700 border-yellow-500';

        return (
            <div key={action.id} className="border-l-4 border-blue-500 pl-4 py-3 mb-4 bg-white rounded shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                    <p className={`font-semibold text-gray-800 text-base ${isComplete ? 'line-through text-gray-500' : ''}`}>{action.description}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap border ${statusClasses}`}>
                        {action.status}
                    </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">Responsible: <span className="font-bold">{action.responsible}</span></p>
                <p className="text-xs text-gray-500 mt-1">Due: <span className="font-bold">{new Date(action.dueDate).toLocaleDateString()}</span></p>
            </div>
        );
    };

    const renderBreakdown = (breakdown: BreakdownModel) => (
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 shadow-md mt-4">
            <h4 className="font-bold text-lg text-red-700 flex items-center"><Package className="w-5 h-5 mr-2"/> Breakdown Event</h4>
            <p className="mt-2 text-sm text-gray-700"><strong>Start Time:</strong> {new Date(breakdown.startTime).toLocaleString()}</p>
            <p className="text-sm text-gray-700"><strong>Duration:</strong> <span className="font-bold">{breakdown.durationMinutes || 'N/A'}</span> minutes</p>
        </div>
    );

    const renderAnalysis = (analysis: AnalysisRecordModel) => (
        <div key={analysis.id} className="mb-4 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 shadow-sm hover:bg-indigo-100 transition">
            <p className="text-sm text-indigo-800 font-medium">
                <span className="font-bold">{analysis.methodUsed}</span> Analysis by <span className="font-bold">{analysis.analystName}</span> on {new Date(analysis.analysisDate).toLocaleDateString()}
            </p>
            <p className="mt-2 text-gray-700 text-sm italic border-t border-indigo-200 pt-2">Findings: {analysis.summaryOfFindings}</p>
        </div>
    );

    // Success handlers
    const handleCreateSuccess = useCallback((newIo: ImprovementOpportunity) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            improvementOpportunities: [newIo, ...prevDefect.improvementOpportunities],
            status: DefectStatus.ACTION_DEFINED, 
        }));
        setShowImprovementForm(false);
    }, []);

    const handleEditSuccess = useCallback((updatedIo: ImprovementOpportunity) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            improvementOpportunities: prevDefect.improvementOpportunities.map(io => 
                io.id === updatedIo.id ? updatedIo : io
            ),
        }));
        setOpportunityToEdit(null);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        // Mock deletion
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            improvementOpportunities: prevDefect.improvementOpportunities.filter(io => io.id !== id),
        }));
        toast.success('Opportunity deleted successfully (mocked).');
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
        // 2. Define the navigation items using the NavItem type
    const navItems: NavItem[] = useMemo(() => [
        { key: 'details', label: 'Details', Icon: ListTodo, ref: detailRef, color: 'text-indigo-600' },
        { key: 'analysis', label: 'Analysis', Icon: Aperture, ref: analysisRef, color: 'text-indigo-600' },
        { key: 'actions', label: 'Actions', Icon: Zap, ref: actionsRef, color: 'text-blue-600' },
        { key: 'improvement', label: 'Improvement', Icon: Target, ref: improvementRef, color: 'text-green-600' },
    ], []);


    return (
        <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                
                {/* HEADER SECTION: Sticky on mobile, acts as context bar */}
                <section className="bg-white p-3 rounded-xl shadow-2xl border-t-8 border-indigo-600 mb-4 sticky top-0 z-20">
                    
                    <a href={allDefectsHref} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-150 mb-3 font-semibold text-sm">
                        <ArrowLeft className="w-4 h-4 mr-2"/> Back to All Defects
                    </a>
                    
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate mb-1">{localDefect.title}</h1>
                    <p className="text-gray-600 text-sm sm:text-base hidden sm:block">{localDefect.description}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-sm items-center">
                        <span className={`px-3 py-1 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(localDefect.status)}`}>
                            <Clock className="w-4 h-4 inline mr-1"/> {localDefect.status}
                        </span>
                        <span className={`px-3 py-1 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(localDefect.priority)}`}>
                            <AlertTriangle className="w-4 h-4 inline mr-1"/> Priority: {localDefect.priority}
                        </span>
                        <span className="text-gray-500 font-medium text-xs sm:text-sm">ID: <span className="font-mono">{localDefect.id}</span></span>
                    </div>
                </section>
                
                {/* MAIN CONTENT LAYOUT: Two Columns on Large Screens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT/MAIN COLUMN (2/3 width on desktop) - The Flow */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* 1. KEY METRICS (Moved here to be prominent on mobile/desktop flow) */}
                        <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-gray-400">
                            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-gray-500"/> Defect Flow Metrics</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4"> 
                                <DetailItem icon={Aperture} label="Analyses" value={localDefect.analyses.length} />
                                <DetailItem icon={Zap} label="Actions" value={localDefect.actions.length} />
                                <DetailItem icon={CheckCircle} label="Actions Done" value={`${actionProgress}%`} />
                                <DetailItem icon={Target} label="CI Opps" value={opportunities.length} />
                            </div>
                        </div>

                        {/* 2. DETAILS (Ref point for navigation) */}
                        <div ref={detailRef} id="details" className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-indigo-600">
                            <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2 flex items-center">
                                <ListTodo className="w-6 h-6 mr-2"/> Defect & Breakdown Details
                            </h2>
                            <p className="text-gray-700 mb-4">{localDefect.description}</p>
                            
                            {/* Detailed Metadata Grid (using the DetailItem) */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                <DetailItem icon={Calendar} label="Identified Date" value={new Date(localDefect.identificationDate).toLocaleDateString()} />
                                <DetailItem icon={User} label="Reported By" value={localDefect?.reportedBy || 'Unknown'} />
                                <DetailItem icon={FileText} label="Equipment Tag" value={localDefect.equipmentTag || 'N/A'} />
                                <DetailItem icon={Target} label="Area/Location" value={localDefect.area || 'N/A'} />
                            </div>
                            
                            {localDefect.breakdown && renderBreakdown(localDefect.breakdown)} 
                        </div>

                        {/* 3. ANALYSIS HISTORY (Ref point for navigation) */}
                        <div ref={analysisRef} id="analysis" className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-indigo-500">
                            <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2 flex justify-between items-center">
                                <span className="flex items-center"><Aperture className="w-6 h-6 mr-2"/> Root Cause Analysis</span>
                                <button
                                    onClick={() => setShowAnalysisForm(!showAnalysisForm)}
                                    className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-95"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> New
                                </button>
                            </h2>
                            {showAnalysisForm && <RootCauseAnalysisForm defectId={localDefect.id} onClose={() => setShowAnalysisForm(false)} />}
                            <div className="mt-4 space-y-4">
                                {localDefect.analyses.length > 0 ? localDefect.analyses.map(renderAnalysis) : <p className="text-gray-500 p-3 bg-gray-50 rounded">No root cause analysis records found. Start a new one above.</p>}
                            </div>
                        </div>
                        
                        {/* 4. CORRECTIVE ACTIONS (Ref point for navigation) */}
                        <div ref={actionsRef} id="actions" className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-blue-600">
                            <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2 flex justify-between items-center">
                                <span className="flex items-center"><Zap className="w-6 h-6 mr-2"/> Corrective Actions ({localDefect.actions.length})</span>
                                <button 
                                    onClick={() => setShowActionForm(!showActionForm)}
                                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center shadow-lg hover:bg-blue-700 transition transform hover:scale-[1.02] active:scale-95"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> Define
                                </button>
                            </h2>
                            
                            {/* Progress Bar */}
                            <div className="p-3 bg-gray-100 rounded-lg shadow-inner mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Action Completion: {actionProgress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                                        style={{ width: `${actionProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {showActionForm && <CorrectiveActionForm defectId={localDefect.id} onClose={() => setShowActionForm(false)} />}

                            <div className="mt-4 space-y-4">
                                {localDefect.actions.length > 0 ? localDefect.actions.map(renderAction) : <p className="text-gray-500 p-3 bg-gray-50 rounded">No corrective actions defined.</p>}
                            </div>
                        </div>
                        
                        {/* 5. IMPROVEMENT OPPORTUNITIES (Ref point for navigation) */}
                        <div ref={improvementRef} id="improvement" className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-green-600">
                            <h2 className="text-2xl font-bold text-green-700 mb-4 border-b pb-2 flex justify-between items-center">
                                <span className="flex items-center"><Target className="w-6 h-6 mr-2"/> Continuous Improvement ({opportunities.length})</span>
                                <button 
                                    onClick={() => setShowImprovementForm(!showImprovementForm)}
                                    className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center shadow-lg hover:bg-green-700 transition transform hover:scale-[1.02] active:scale-95"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> New CI
                                </button>
                            </h2>
                            
                            <p className="text-gray-600 p-3 bg-gray-50 rounded mb-4 text-sm">
                                Log systematic process or CI opportunities identified during the defect resolution process.
                            </p>

                            {renderForm()}
                            
                            <div className="mt-4 space-y-3">
                                {opportunities.length > 0 ? (
                                    opportunities.map((opportunity) => (
                                        <ImprovementOpportunityCard 
                                            key={opportunity.id} 
                                            opportunity={opportunity} 
                                            onEditStart={setOpportunityToEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                ) : (
                                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-gray-700 flex items-center">
                                        <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span className="text-sm italic">
                                            No logged CI Opportunities for this defect.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ELIMINATION RECORD (As a closing card) */}
                        <div className="p-4 sm:p-6 bg-white border rounded-xl shadow-md border-t-4 border-green-500 mt-6">
                            <h3 className="text-xl font-semibold mb-3 border-b pb-1 flex items-center text-green-700"><CheckCircle className="w-5 h-5 mr-2"/> Defect Elimination Record</h3>
                            {localDefect.eliminationRecord ? (
                                <p className="p-3 bg-green-50 rounded text-green-800 text-sm">
                                    **Closed Date:** {localDefect.eliminationRecord.dateClosed ? new Date(localDefect.eliminationRecord.dateClosed).toLocaleDateString() : 'Pending Closure'}
                                </p>
                            ) : (
                                <p className="text-gray-500 italic p-3 bg-yellow-50 rounded text-sm">Defect has not been formally eliminated (Closed).</p>
                            )}
                        </div>

                    </div>
                    
                    {/* RIGHT COLUMN: EMPTY (Kept for future sidebar content, currently collapses content into left column) */}
                    <div className="lg:col-span-1 hidden lg:block">
                        {/* This column is available for future related data, like document attachments or recent history feed. */}
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION NAVIGATION (FAN) - MOBILE ONLY */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {navItems.map(({ key, label, Icon, color }) => (
                        <button 
                            key={key}
                            onClick={() => scrollToSection(key)}
                            className={`flex flex-col items-center p-2 text-xs font-medium transition duration-150 ${activeSection === key ? `${color} border-t-2 border-current pt-1` : 'text-gray-500 hover:text-indigo-600'}`}
                            aria-current={activeSection === key ? 'page' : undefined}
                        >
                            <Icon className="w-5 h-5 mb-1"/>
                            {label}
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default DefectDetailView;