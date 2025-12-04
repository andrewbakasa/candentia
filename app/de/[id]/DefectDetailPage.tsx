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
    ClipboardList,
    Check,
    ToggleLeft,
    ToggleRight,
    X,
    Clapperboard, 
    Clipboard
} from 'lucide-react';
import toast from 'react-hot-toast'; // Recommended for better user feedback

// --- Imports (Adjust paths as necessary) ---
import { 
   // ActionStatus, 
   // BreakdownModel, 
    //CorrectiveActionModel, 
    //DefectDetailModel, 
    DefectStatus, 
   Priority, 
    //AnalysisRecordModel, 
    AnalysisMethod 
} from "../_components/types/types";

// Enums
// enum DefectStatus {
//     NEW = 'NEW',
//     ANALYSIS = 'ANALYSIS',
//     ACTION_DEFINED = 'ACTION_DEFINED',
//     CLOSED = 'CLOSED',
// }

// enum Priority {
//     HIGH = 'HIGH',
//     MEDIUM = 'MEDIUM',
//     LOW = 'LOW',
// }

enum ActionStatus {
    PENDING = 'PENDING',
    COMPLETE = 'COMPLETE',
}

// Data Models
interface BreakdownModel {
    startTime: string; // ISO Date String
    durationMinutes: number | null;
}



interface CorrectiveActionModel {
    id: string;
    description: string;
    responsible: string;
    dueDate: string; // ISO Date String
    status: ActionStatus;
    dateCompleted?: string; // ISO Date String
    sourceId: string; // The ID of the defect or IO this action addresses
}

interface ImprovementOpportunity {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    type: 'Preventive' | 'Systemic';
    dateLogged: string;
}

interface EliminationRecordModel {
    dateClosed: string;
    summary: string;
}

export interface DefectDetailModel {
    id: string;
    title: string;
    description: string;
    status: DefectStatus;
    priority: Priority;
    identificationDate: string;
    reportedBy: string;
    equipmentTag: string;
    area: string;
    breakdown: BreakdownModel | null;
    analyses: RootCauseAnalysisModel[];
    actions: CorrectiveActionModel[];
    improvementOpportunities: ImprovementOpportunity[];
    eliminationRecord: EliminationRecordModel | null;
}

interface CorrectiveActionModel {
    id: string;
    description: string;
    responsible: string;
    dueDate: string; // ISO Date String
    status: ActionStatus;
    dateCompleted?: string; // ISO Date String
    sourceId: string; // The ID of the defect or IO this action addresses
}
import { formatDate } from '@/app/contracts/_components/utils';
import ConfirmAction from '../_components/ConfirmAction';
import { SafeUser } from '@/app/types';
import { truncateString } from '@/lib/utils';
import useIsMobile from '@/app/hooks/isMobile';

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

// --- UTILITY COMPONENTS ---
 const API_BASE_URL_IO = '/api/defects/io'; // Assuming API path
 const API_BASE_URL_CA = '/api/defects/ca'; // Assuming API path
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
  
const HeaderHeight = 64; // h-16 (4rem)

// --- FORM TYPE DEFINITIONS ---

// Type for the data structure of a Corrective Action
type ActionData = {
    id: string;
    defectId: string;
    description: string;
    responsible: string;
    dueDate: string;
    isCompleted: boolean;
};

// Props for the Corrective Action Form
type CorrectiveActionProps = {
    defectId: string;
    onClose: () => void;
    onSuccess: (action: ActionData, mode: 'create' | 'edit') => void;
    initialData?: ActionData; // Used for edit mode
};

// Form for Corrective Actions
interface CorrectiveActionFormProps {
    defectId: string;
    initialData?: CorrectiveActionModel; // For edit mode
    onClose: () => void;
    onSuccess: (action: CorrectiveActionModel, mode: 'create' | 'edit') => void;
}
const CorrectiveActionForm: React.FC<CorrectiveActionFormProps> = ({ defectId, initialData, onClose, onSuccess }) => {
    const isEdit = !!initialData;
    const [description, setDescription] = useState(initialData?.description || '');
    const [responsible, setResponsible] = useState(initialData?.responsible || '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.split('T')[0] : '');
    const [status, setStatus] = useState(initialData?.status || ActionStatus.PENDING);
    const [isLoading, setIsLoading] = useState(false);

   const handleSubmitCorrectiveAction = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!description.trim() || !responsible.trim() || !dueDate) {
            toast.error('Description, Responsible, and Due Date are required fields.');
            return;
        }

        setIsLoading(true);

        // 1. Construct the Corrective Action Payload
        const payload: Partial<CorrectiveActionModel> = {
            description: description.trim(),
            responsible: responsible.trim(),
            // Keep the date as YYYY-MM-DD for the backend to handle, or convert to ISO if required by API
            dueDate: new Date(dueDate).toISOString().split('T')[0], 
            status: status,
        };

        // Add sourceId only for new creations (POST)
        if (!isEdit) {
            payload.sourceId = defectId;
        } else {
            // For editing, ensure the ID is included in the payload if needed by the backend 
            // (or rely only on the URL parameter)
            payload.id = initialData!.id;
        }

        // Handle dateCompleted logic for status change
        if (status === ActionStatus.COMPLETE) {
            // If completing now and no previous completion date exists, set it to now
            if (!initialData?.dateCompleted) {
                 // Use initialData!.id for the ID if it's an edit action.
                payload.dateCompleted = new Date().toISOString(); 
            } else {
                // If editing and already complete, preserve the existing completion date
                payload.dateCompleted = initialData.dateCompleted; 
            }
        } else {
             // Ensure dateCompleted is not sent or is null/undefined if status is PENDING
             payload.dateCompleted = undefined; 
        }

        // 2. Determine Method and URL
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE_URL_CA}/${initialData!.id}` : API_BASE_URL_CA;
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Try to extract a specific error message from the response body
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to ${method === 'PUT' ? 'update' : 'create'} corrective action.`);
            }

            // 3. Process Success
            const result: CorrectiveActionModel = await response.json();
            
            toast.success(`Corrective action ${isEdit ? 'updated' : 'submitted'} successfully!`);
            onSuccess(result, isEdit ? 'edit' : 'create'); 
            onClose();

        } catch (error: any) {
            // 4. Handle Error
            console.error('Submission Error:', error);
            // Fallback for network or parsing errors
            toast.error(`Error: ${error.message || 'A network or server error occurred.'}`);
        } finally {
            // 5. Cleanup
            setIsLoading(false); 
        }
    };

    return (
        <div className="p-4 bg-white border border-blue-300 rounded-xl shadow-lg mb-6">
            <h3 className="text-xl font-bold text-blue-700 mb-4">{isEdit ? 'Edit Corrective Action' : 'Define New Action'}</h3>
            <form onSubmit={handleSubmitCorrectiveAction} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 transition"
                        rows={3}
                        placeholder="Detailed steps for the corrective action."
                        disabled={isLoading}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsible</label>
                        <input 
                            type="text"
                            value={responsible}
                            onChange={(e) => setResponsible(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Assignee Name"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ActionStatus)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value={ActionStatus.PENDING}>Pending</option>
                            <option value={ActionStatus.COMPLETE}>Complete</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <Save className="w-4 h-4 mr-1"/>
                        )}
                        {isEdit ? 'Save Changes' : 'Create Action'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// Define the shape of the data submitted/returned (optional but good practice)
interface RootCauseAnalysisModel {
    id: string;
    defectId: string;
    analystName: string;
    methodUsed: AnalysisMethod;
    summaryOfFindings: string;
    analysisDate: string; // ISO string format
}


// Define the component's props
interface RootCauseAnalysisFormProps {
    defectId: string;
    onClose: () => void;
    initialData?: RootCauseAnalysisModel; // For edit mode
    // Callback for successful submission, returns the created/updated RCA object and the mode
    onSuccess: (rca: RootCauseAnalysisModel, mode: 'create' | 'edit') => void; 
}

const API_BASE_URL_RCA = '/api/defects/rca'; // Define your API endpoint base URL

// --- End of assumed definitions ---


const RootCauseAnalysisForm: React.FC<RootCauseAnalysisFormProps> = ({ defectId, initialData, onClose, onSuccess }) => {
    // Check if we are in edit mode
    const isEdit = !!initialData;

    // 1. State Initialization: Use initialData for defaults if in edit mode
    const [analystName, setAnalystName] = useState(initialData?.analystName || '');
    const [methodUsed, setMethodUsed] = useState<AnalysisMethod | ''>(initialData?.methodUsed || '');
    const [summaryOfFindings, setSummaryOfFindings] = useState(initialData?.summaryOfFindings || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitRCA = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!analystName.trim() || !methodUsed || !summaryOfFindings.trim()) {
            toast.error('Please fill out all required fields: Analyst Name, Method, and Summary.');
            return;
        }

        setIsLoading(true);
        
        // 2. Construct the RCA Payload
        const payload: Partial<RootCauseAnalysisModel> = {
            defectId,
            analystName: analystName.trim(),
            methodUsed: methodUsed,
            summaryOfFindings: summaryOfFindings.trim(),
            // For POST (new), set the date to now. For PUT (edit), preserve the original date.
            analysisDate: isEdit ? initialData!.analysisDate : new Date().toISOString(), 
        };

        // 3. Determine Method and URL
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE_URL_RCA}/${initialData!.id}` : API_BASE_URL_RCA;
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to ${isEdit ? 'update' : 'create'} analysis record.`);
            }

            // 4. Process Success
            const result: RootCauseAnalysisModel = await response.json();
            
            toast.success(`Root Cause Analysis ${isEdit ? 'updated' : 'submitted'} successfully!`);
            onSuccess(result, isEdit ? 'edit' : 'create'); 
            onClose();

        } catch (error: any) {
            // 5. Handle Error
            console.error('[RCA_SUBMISSION_ERROR]', error);
            toast.error(error.message || 'An unexpected error occurred during submission.');
        } finally {
            // 6. Cleanup
            setIsLoading(false);
        }
    }, [defectId, analystName, methodUsed, summaryOfFindings, isEdit, initialData, onClose, onSuccess]);

    return (
        <div className="p-4 bg-white border border-indigo-300 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-700">
                    {isEdit ? 'Edit Root Cause Analysis' : 'New Root Cause Analysis'}
                </h3>
                {/* Close button for card/modal */}
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition"
                    disabled={isLoading}
                    aria-label="Close form"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
                Linked to Defect: **{defectId}** {isEdit && `(RCA ID: ${initialData!.id})`}
            </p>
            
            <form onSubmit={handleSubmitRCA} className="space-y-4">
                <div>
                    <label htmlFor="analystName" className="block text-sm font-medium text-gray-700 mb-1">Analyst Name</label>
                    <input 
                        id="analystName"
                        type="text" 
                        placeholder="Enter Analyst Name" 
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition" 
                        value={analystName}
                        onChange={(e) => setAnalystName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="methodUsed" className="block text-sm font-medium text-gray-700 mb-1">Analysis Method</label>
                        <select 
                            id="methodUsed"
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
                            value={methodUsed}
                            onChange={(e) => setMethodUsed(e.target.value as AnalysisMethod)}
                            disabled={isLoading}
                        >
                            <option value="">Select Method</option>
                            <option value={AnalysisMethod.FIVE_WHYS}>Five Whys</option>
                            <option value={AnalysisMethod.APOLLO}>Apollo Root Cause Analysis</option>
                            <option value={AnalysisMethod.FMECA}>FMECA (Failure Mode, Effects, and Criticality Analysis)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="analysisDate" className="block text-sm font-medium text-gray-700 mb-1">Analysis Date</label>
                        <input
                            id="analysisDate"
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500" 
                            // Display the existing date, or a placeholder if creating a new one
                            value={isEdit ? new Date(initialData!.analysisDate).toLocaleDateString() : 'Set on Submission'}
                            disabled={true} // Date is auto-managed on submit
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="summaryOfFindings" className="block text-sm font-medium text-gray-700 mb-1">Summary of Findings / Root Cause Text</label>
                    <textarea 
                        id="summaryOfFindings"
                        placeholder="Detail the analysis findings and the final determined root cause here." 
                        rows={5} 
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
                        value={summaryOfFindings}
                        onChange={(e) => setSummaryOfFindings(e.target.value)}
                        disabled={isLoading}
                    ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg flex items-center shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <Save className="w-4 h-4 mr-1"/>
                        )}
                        {isEdit ? 'Save Changes' : 'Complete Analysis'}
                    </button>
                </div>
            </form>
        </div>
    );
};
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
        const url = isEditMode ? `${API_BASE_URL_IO}/${initialData!.id}` : API_BASE_URL_IO;

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
    allowEditing:boolean
}

const ImprovementOpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onEditStart, onDelete,allowEditing }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleIODeleteInternal = async () => {
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
    
            {/* LEFT DIV (Content/Text) - Now uses flex-1 */}
            <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4"> 
                <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusColor}`} />
                <div className="flex-1 min-w-0">
                    {/* The inner min-w-0 and truncate ensure the text respects the space given by flex-1 */}
                    <p className="font-semibold text-gray-900 truncate">{truncateString(opportunity.proposedAction, 150)}</p>
                    <p className="text-xs text-gray-500">
                        ID: {opportunity.id.substring(0, 8)} | Identified: {formatDate(opportunity.dateIdentified)}
                    </p>
                </div>
            </div>
            
            {/* RIGHT DIV (Actions/Buttons) - Stays fixed, claims its space first */}
            <div className="flex items-center space-x-2 flex-shrink-0">
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
                    disabled={!allowEditing}
                >
                    <Edit className="w-5 h-5" />
                </button>
                <ConfirmAction 
                    onConfirm={handleIODeleteInternal} 
                    itemId={opportunity.id}
                    action="Delete"                            
                    disabled={!allowEditing}
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

interface CorrectiveActionCardProps {
    action: CorrectiveActionModel;
    onEditStart: (action: CorrectiveActionModel) => void;
    onDelete: (actionId: string) => Promise<void>;
    onToggleStatus: (actionId: string, newStatus: ActionStatus) => Promise<void>;
    allowEditing:boolean;
    truncationLimit:number

}
const CorrectiveActionCard: React.FC<CorrectiveActionCardProps> = ({ 
    action, 
    onEditStart, 
    onDelete,
    onToggleStatus,
    allowEditing,
    truncationLimit
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const isComplete = action.status === ActionStatus.COMPLETE;
    const statusClasses = isComplete ? 'bg-green-100 text-green-700 border-green-500' : 'bg-yellow-100 text-yellow-700 border-yellow-500';
    const StatusIcon = isComplete ? CheckCircle : Clock;
    const statusColor = isComplete ? 'text-green-500' : 'text-yellow-500';

 
    const handleActionDeleteTrigger = async () => {
        setIsDeleting(true);
        try {
            //call external
            await onDelete(action.id);
                     
        } catch (error) {
            toast.error('Failed to delete corrective action.');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleToggleStatus = async () => {
        setIsToggling(true);
        const newStatus = isComplete ? ActionStatus.PENDING : ActionStatus.COMPLETE;
        try {
            await onToggleStatus(action.id, newStatus);
            toast.success(`Action marked as ${newStatus}.`);
        } catch (error) {
            toast.error('Failed to update action status.');
            console.error(error);
        } finally {
            setIsToggling(false);
        }
    };

    const isPending = isToggling || isDeleting;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
            
            {/* Header / Summary Section */}
           <div className="p-4 flex items-start justify-between">
    
        {/* FIRST DIV (Content/Details) - Use flex-1 to grow and take remaining space */}
        <div className="flex items-start space-x-3 flex-1 min-w-0 pr-4"> 
            <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusColor}`} />
            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-gray-900 text-lg ${isComplete ? 'line-through text-gray-500' : ''}`}>
                    {truncateString(action.description,truncationLimit)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    Responsible: <span className="font-medium text-gray-800">{action.responsible}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    Due: {formatDate(action.dueDate)}
                </p>
                <span className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full border ${statusClasses}`}>
                    {action.status}
                </span>
            </div>
        </div>
    
    {/* Actions Group (SECOND DIV) - Use flex-shrink-0 to maintain its fixed width */}
    <div className="flex items-center space-x-1.5 flex-shrink-0"> 
        
        {/* Toggle Status Button */}
        <button 
            onClick={handleToggleStatus}
            disabled={isPending}
            className={`p-1 rounded-full transition ${isPending ? 'opacity-50 cursor-not-allowed' : (isComplete ? 'text-gray-500 hover:bg-gray-100' : 'text-green-500 hover:bg-green-100')}`}
            aria-label={isComplete ? "Mark as In Progress" : "Mark as Complete"}
        >
            {isToggling ? (
                 <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
            ) : (
                isComplete ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />
            )}
        </button>

        {/* Edit Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); onEditStart(action); }}
            disabled={isPending||!allowEditing}
            className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition disabled:opacity-50"
            aria-label="Edit Corrective Action"
        >
            <Edit className="w-5 h-5" />
        </button>

        {/* Delete Confirmation Button */}
        <ConfirmAction 
            onConfirm={handleActionDeleteTrigger} 
            itemId={action.id}
            action="Delete" 
            disabled={isPending || isDeleting||!allowEditing}
            heading="Delete Action"
            description="This action will delete this corrective action permanently."
            showHint={false} 
        />
        
        {/* Expand/Collapse Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse Details" : "Expand Details"}
        >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
    </div>
            </div>

            {/* Expanded Details Section */}
            {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2 text-sm">
                    <p><strong>Date complete:</strong> {action.dateCompleted}</p>
                    <p><strong>Decritption:</strong> {action.description || 'N/A'}</p>
                    <p><strong>DueDaten:</strong> {formatDate(action.dueDate)}</p>
                      <p><strong>Responsible</strong> {action.responsible}</p>
                    {action.sourceId && <p><strong>Completed On:</strong> {formatDate(action.status)}</p>}
                </div>
            )}
        </div>
    );
};

interface DefectDetailViewProps {
  currentUser: SafeUser|null; // Type your user model correctly
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

 const DefectDetailView: React.FC<DefectDetailViewProps> = ({ defect, allDefectsHref, currentUser }) => {
    // We use a local state initialized from the prop to simulate data mutation (e.g., adding an IO)
    const [localDefect, setLocalDefect] = useState<DefectDetailModel>(defect);
    const [activeSection, setActiveSection] = useState<SectionKey>('details');
    const [actionToEdit, setActionToEdit] = useState<CorrectiveActionModel | null>(null); // NEW: State for editing an action
    
    const isMobile = useIsMobile();
    const truncationLimit = isMobile ? 25 : 70; // Use 20 for mobile, 50 for desktop

    const [opportunityToEdit, setOpportunityToEdit] =  useState<ImprovementOpportunity | null>(null);
    const [showActionForm, setShowActionForm] = useState(false);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);
    const [showImprovementForm, setShowImprovementForm] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl)
                .then(() => {
                    setCopied(true);
                    setSuccessMessage('Link copied to clipboard!'); // Show success message for copy
                    setTimeout(() => {setCopied(false); setSuccessMessage(null);}, 2000); 
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    setError('Failed to copy link.');
                });
        }
    };

    // NEW STATE FOR ANALYSIS EDITING
    const [analysisToEdit, setAnalysisToEdit] = useState<RootCauseAnalysisModel | null>(null); // <--- NEW

    // Refs for scrolling (using MutableRefObject<HTMLElement | null> for generic DOM element)
    const detailRef = useRef<HTMLDivElement>(null);
    const analysisRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const improvementRef = useRef<HTMLDivElement>(null);

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

    const renderBreakdown = (breakdown: BreakdownModel) => (
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 shadow-md mt-4">
            <h4 className="font-bold text-lg text-red-700 flex items-center"><Package className="w-5 h-5 mr-2"/> Breakdown Event</h4>
            <p className="mt-2 text-sm text-gray-700"><strong>Start Time:</strong> {new Date(breakdown.startTime).toLocaleString()}</p>
            <p className="text-sm text-gray-700"><strong>Duration:</strong> <span className="font-bold">{breakdown.durationMinutes || 'N/A'}</span> minutes</p>
        </div>
    );

   

   // --- RCA HANDLERS (NEW) ---

    // Handler for successful Analysis submission (Create)
    const handleCreateAnalysisSuccess = useCallback((newAnalysis: RootCauseAnalysisModel) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            analyses: [newAnalysis, ...prevDefect.analyses],
        }));
        setShowAnalysisForm(false);
        toast.success('Analysis record created successfully.');
    }, []);

    // Handler for successful Analysis submission (Edit) - NEW
    const handleEditAnalysisSuccess = useCallback((updatedAnalysis: RootCauseAnalysisModel) => {
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            analyses: prevDefect.analyses.map(a => 
                a.id === updatedAnalysis.id ? updatedAnalysis : a
            ),
        }));
        setAnalysisToEdit(null); // Close the edit form
        toast.success('Analysis record updated successfully.');
    }, []);

    // Function called when the Edit button on an Analysis card is pressed - NEW
    const handleEditStartAnalysis = useCallback((analysis: RootCauseAnalysisModel) => {
        setAnalysisToEdit(analysis); // <--- Sets the state that triggers the Edit Form
        setShowAnalysisForm(false); // Ensure the New Analysis form is closed
    }, []);

    // Function to handle the deletion of an analysis record - NEW
    const handleAnalysisDeleteExternal = useCallback(async (id: string) => {
        
        const apiRoute = `/api/defects/rca/${id}`;
        //console.log(`Attempting to delete Analysis record`);
        try {
            // Mocking a successful fetch response
             const response = await fetch(apiRoute, { method: 'DELETE' }); 
             if (!response.ok) throw new Error('API delete failed');
           
            // *** OPTIMISTIC STATE UPDATE: Remove the analysis from the list ***
            setLocalDefect(prevDefect => ({
                ...prevDefect,
                analyses: prevDefect.analyses.filter(a => a.id !== id),
            }));
            toast.success('Analysis record deleted successfully.');
        } catch (error) {
            console.error(`Error while deleting Analysis ${id}:`, error);
            toast.error(`Error deleting Analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, []);

    // Analysis Card Renderer with Edit/Delete Controls - UPDATED
    const renderAnalysis = (analysis: RootCauseAnalysisModel,allowEditing:boolean) => (
        <div 
            key={analysis.id} 
            className="mb-4 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 shadow-sm hover:bg-indigo-100 transition relative" // Added relative for positioning buttons
        >
            <div className="absolute top-2 right-2 flex space-x-2">
                <button
                    onClick={() => handleEditStartAnalysis(analysis)}
                    className="p-1 rounded-full text-indigo-600 hover:bg-indigo-200 transition"
                    title="Edit Analysis"
                    disabled={!allowEditing}
                >
                    <Edit className="w-5 h-5"/>
                </button>                
                <ConfirmAction 
                            onConfirm={handleAnalysisDeleteExternal} 
                            itemId={analysis.id}
                            action="Delete" 
                            disabled={!allowEditing} // Opposite of the main state
                            heading="Delete Opportunity"
                            description="This action will delete this comment. Press the Delete button to continue."
                            showHint={true}
                        />
            </div>
            <p className="text-sm text-indigo-800 font-medium pr-16">
                <span className="font-bold">{analysis.methodUsed}</span> Analysis by <span className="font-bold">{analysis.analystName}</span> on {new Date(analysis.analysisDate).toLocaleDateString()}
            </p>
            <p className="mt-2 text-gray-700 text-sm italic border-t border-indigo-200 pt-2">Findings: {analysis.summaryOfFindings}</p>
        </div>
    );
    
    // Analysis Form Renderer - NEW
    const renderAnalysisForm = () => {
        if (analysisToEdit) {
            return (
                <RootCauseAnalysisForm
                    defectId={localDefect.id}
                    initialData={analysisToEdit}
                    onClose={() => setAnalysisToEdit(null)}
                    onSuccess={handleEditAnalysisSuccess} // Uses the new edit success handler
                />
            );
        }
        if (showAnalysisForm) {
             return (
                 <RootCauseAnalysisForm
                     defectId={localDefect.id}
                     onClose={() => setShowAnalysisForm(false)}
                     onSuccess={handleCreateAnalysisSuccess} // Uses the new create success handler
                 />
             );
        }
        return null;
    }

    // Handler for successful Action submission (Create or Edit)
     const handleCreateIOSuccess = useCallback((newIo: ImprovementOpportunity) => {
            setLocalDefect(prevDefect => ({
                ...prevDefect,
                improvementOpportunities: [newIo, ...prevDefect.improvementOpportunities],
                status: DefectStatus.ACTION_DEFINED, 
            }));
            setShowImprovementForm(false);
        }, []);
    
        const handleEditIOSuccess = useCallback((updatedIo: ImprovementOpportunity) => {
            setLocalDefect(prevDefect => ({
                ...prevDefect,
                improvementOpportunities: prevDefect.improvementOpportunities.map(io => 
                    io.id === updatedIo.id ? updatedIo : io
                ),
            }));
            setOpportunityToEdit(null);
        }, []);
  
    const handleIODeleteExternal = useCallback(async (id: string) => {
        //call api/defect/io method delete....
        const apiRoute = `/api/defects/io/${id}`;
        console.log(`Attempting to delete IO`);
        try {
            const response = await fetch(apiRoute, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // *** OPTIMISTIC STATE UPDATE: Remove the comment from the list ***
                setLocalDefect(prevDefect => ({
                    ...prevDefect,
                    improvementOpportunities: prevDefect.improvementOpportunities.filter(io => io.id !== id),
                }));
                toast.success('IO record deleted successfully.');
            } else if (response.status === 401 || response.status === 403 || response.status === 404) {
                const errorData = await response.json();
                console.error('Deletion failed:', errorData.message);
                toast.error(errorData.message || 'Deletion failed.');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Network or unexpected error while deleting IO ${id}:`, error);
            toast.error(`Error deleting IO: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        
    }, []);


 // --- HANDLERS FOR CORRECTIVE ACTIONS ---
    
    // Handler for successful Action submission (Create or Edit)
    const handleActionCorrectiveActionSuccess = useCallback((actionData:CorrectiveActionModel, mode:string) => {
        setLocalDefect(prevDefect => {
            let newActions;
            
            if (mode === 'create') {
                // Add new action to the beginning of the list for visibility
                newActions = [actionData, ...prevDefect.actions];
            } else {
                // Map over existing actions to find and replace the edited one
                newActions = prevDefect.actions.map(a => 
                    a.id === actionData.id ? actionData : a
                );
            }

            // Determine new defect status
            const allComplete = newActions.length > 0 && newActions.every(a => a.status === ActionStatus.COMPLETE);
            const newStatus = allComplete ? DefectStatus.CLOSED_VERIFIED : DefectStatus.ACTION_DEFINED;

            return {
                ...prevDefect,
                actions: newActions,
                status: newStatus,
            };
        });

        // Close forms
        setShowActionForm(false);
        setActionToEdit(null);
        toast.success(`Action ${mode === 'create' ? 'created' : 'updated'} successfully.`);
    }, []);

    // Function called when the Edit button on a card is pressed
    const handleEditStartCorrectiveAction = useCallback((action:CorrectiveActionModel) => {
        setActionToEdit(action); // <--- Sets the state that triggers the Edit Form
        setShowActionForm(false); // Ensure the New Action form is closed
       // toast.success(`Editing action: ${action.id}`);
    }, []);

    // Function to handle the deletion of a corrective action
    const handleDeleteCorrectiveAction = useCallback(async (id:string) => {
        //call api/defect/ca method Delete
        const apiRoute = `/api/defects/ca/${id}`;
        console.log(`Attempting to delete Correct Action`);
        try {
            const response = await fetch(apiRoute, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // *** OPTIMISTIC STATE UPDATE: Remove the CA from the list ***
                setLocalDefect(prevDefect => ({
                    ...prevDefect,
                    actions: prevDefect.actions.filter(a => a.id !== id),
                }));
                toast.success('Corrective Action deleted successfully.');
            } else if (response.status === 401 || response.status === 403 || response.status === 404) {
                const errorData = await response.json();
                console.error('Deletion failed:', errorData.message);
                toast.error(errorData.message || 'Deletion failed.');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Network or unexpected error while deleting CA ${id}:`, error);
            toast.error(`Error deleting CA: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        
    }, []);

    // Function to handle status toggling (not fully implemented in form, but card has prop)
    const handleToggleStatusCorrectiveAction = useCallback(async (actionId:string, newStatus:ActionStatus) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setLocalDefect(prevDefect => ({
            ...prevDefect,
            actions: prevDefect.actions.map(a => 
                a.id === actionId ? { 
                    ...a, 
                    status: newStatus,
                    implementationDate: newStatus === ActionStatus.COMPLETE ? new Date().toISOString() : undefined
                } : a
            ),
        }));
        toast.success(`Action ${actionId} status changed to ${newStatus}.`);
    }, []);

       const renderActionForm = () => {
        if (actionToEdit) {
            return (
                <CorrectiveActionForm
                    defectId={localDefect.id}
                    initialData={actionToEdit}
                    onClose={() => setActionToEdit(null)}
                    onSuccess={handleActionCorrectiveActionSuccess}
                />
            );
        }
        if (showActionForm) {
             return (
                <CorrectiveActionForm
                    defectId={localDefect.id}
                    onClose={() => setShowActionForm(false)}
                    onSuccess={handleActionCorrectiveActionSuccess}
                />
            );
        }
        return null;
    }
    const renderIOForm = () => {
        if (opportunityToEdit) {
            return (
                <ImprovementOpportunityForm 
                    sourceId={localDefect.id} 
                    onClose={() => setOpportunityToEdit(null)} 
                    onSuccess={handleEditIOSuccess}
                    initialData={opportunityToEdit}
                />
            );
        }

        if (showImprovementForm) {
            return (
                <ImprovementOpportunityForm 
                    sourceId={localDefect.id} 
                    onClose={() => setShowImprovementForm(false)} 
                    onSuccess={handleCreateIOSuccess}
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
                <section className="bg-white p-4 rounded-xl shadow-2xl border-t-8 border-indigo-600 mb-4 sticky top-0 z-20">
                    
                    {/* TOP ROW: Back Link and Share Button aligned horizontally */}
                    <div className="flex justify-between items-center mb-3">
                        {currentUser && (
                            <a 
                                href={allDefectsHref} 
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-150 font-semibold text-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2"/> Back to All Defects
                            </a>
                        )}
                        
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap ml-auto"
                            //disabled={isLoading}
                        >
                            <Clipboard className="w-4 h-4 mr-1"/>
                            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
                            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
                        </button>
                    </div>
                    
                    {/* MAIN CONTENT: Title and Description */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate mb-1">
                        {localDefect.title}
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base hidden sm:block mb-3">
                        {localDefect.description}
                    </p>
                    
                    {/* STATUS AND PRIORITY TAGS */}
                    <div className="flex flex-wrap gap-2 text-sm items-center">
                        <span className={`px-3 py-1 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(localDefect.status)}`}>
                            <Clock className="w-4 h-4 inline mr-1"/> {localDefect.status}
                        </span>
                        <span className={`px-3 py-1 font-bold uppercase rounded-full text-xs sm:text-sm border-2 ${getPriorityClasses(localDefect.priority)}`}>
                            <AlertTriangle className="w-4 h-4 inline mr-1"/> Priority: {localDefect.priority}
                        </span>
                        <span className="text-gray-500 font-medium text-xs sm:text-sm">
                            ID: <span className="font-mono">{localDefect.id}</span>
                        </span>
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
                            
                            
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-gray-100"> 
                            {/* <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100"> */}
                                <DetailItem icon={Calendar} label="Identified Date" value={new Date(localDefect.identificationDate).toLocaleDateString()} />
                                <DetailItem icon={User} label="Reported By" value={localDefect?.reportedBy || 'Unknown'} />
                                <DetailItem icon={FileText} label="Equipment Tag" value={localDefect.equipmentTag || 'N/A'} />
                                <DetailItem icon={Target} label="Area/Location" value={localDefect.area || 'N/A'} />
                            </div>
                            
                            {localDefect.breakdown && renderBreakdown(localDefect.breakdown)} 
                        </div>

                        {/* 3. ANALYSIS HISTORY (UPDATED to use renderAnalysisForm) */}
                        <div ref={analysisRef} id="analysis" className="bg-white shadow-xl rounded-xl p-4 sm:p-6 border-l-4 border-indigo-500">
                            <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2 flex justify-between items-center">
                                <span className="flex items-center"><Aperture className="w-6 h-6 mr-2"/> Root Cause Analysis</span>
                                <button
                                    // Toggle only the New Analysis form if not editing
                                    onClick={() => {
                                        setAnalysisToEdit(null); 
                                        setShowAnalysisForm(!showAnalysisForm);
                                    }}
                                    className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-95"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> New
                                </button>
                            </h2>
                            
                            {/* NEW: Render the Analysis Form for create or edit */}
                            {renderAnalysisForm()}
                            
                            <div className="mt-4 space-y-4">
                                {localDefect.analyses.length > 0 ? 
                                    //localDefect.analyses.map(renderAnalysis()) : // <-- Uses the UPDATED renderAnalysis
                                     localDefect.analyses.map((analysis: RootCauseAnalysisModel) => renderAnalysis(analysis, hasRequiredRole)):
                                    <p className="text-gray-500 p-3 bg-gray-50 rounded">No root cause analysis records found. Start a new one above.</p>
                                }
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
                            
                            
                            {/* Corrective Action Form (handles both create and edit modes) */}
                            {renderActionForm()}
                           
                             <div className="space-y-4">
                                {localDefect.actions.map(action => (
                                    <CorrectiveActionCard
                                        key={action.id}
                                        action={action}
                                        onEditStart={handleEditStartCorrectiveAction}
                                        onDelete={handleDeleteCorrectiveAction}
                                        onToggleStatus={handleToggleStatusCorrectiveAction}
                                        allowEditing={hasRequiredRole}
                                         truncationLimit={truncationLimit}                                                                          
                                    />
                                ))}
                                {localDefect.actions.length === 0 && (
                                    <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-md">
                                        No corrective actions found.
                                    </div>
                                )}
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

                            {renderIOForm()}
                            
                            <div className="mt-4 space-y-3">
                                {opportunities.length > 0 ? (
                                    opportunities.map((opportunity) => (
                                        <ImprovementOpportunityCard 
                                            key={opportunity.id} 
                                            opportunity={opportunity} 
                                            onEditStart={setOpportunityToEdit}
                                            onDelete={handleIODeleteExternal}
                                            allowEditing={hasRequiredRole} 
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