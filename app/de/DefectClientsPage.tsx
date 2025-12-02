'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    ArrowUpRight, 
    Search, 
    ChevronLeft, 
    ChevronRight,
    Tag,
    AlertCircle, 
    AlertTriangle, 
    User, 
    CheckCircle, 
    Clock, 
    ClipboardList, 
    Activity, 
    Zap,
    Plus, // Added for Add button
    Edit, // Added for Edit button
    X, // Added for closing form
} from 'lucide-react';
import { SafeUser } from '../types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


// --- TYPE DEFINITIONS & CONSTANTS ---

type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'LOW';
type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; // Added IN_PROGRESS, RESOLVED
type DefectStatusCategory = 'ALL' | 'CLOSED' | 'HIGH_PRIORITY' | 'OPEN';

interface DefectListModel {
    id: string;
    title: string;
    description: string | null;
    assignee: string | null; 
    defectType: string; 
    severity: DefectSeverity; 
    isClosed: boolean; 
    closedDate: string | null; 
    targetResolutionDate: string | null; 
    status: DefectStatus; // New field for detailed status
    _count: {
        comments: number;
    }
}

// Data options for the Form
const SEVERITY_OPTIONS: DefectSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'LOW'];
const TYPE_OPTIONS = ['UI/UX', 'Backend', 'Content', 'Security', 'Performance', 'Accessibility', 'Integration', 'Refactor', 'Other'];
const ASSIGNEE_OPTIONS = ['Unassigned', 'Alice', 'Bob', 'Charlie', 'David', 'Eve'];
const STATUS_OPTIONS: DefectStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZE_OPTIONS = [4, 8, 16, 24];

// Tailwind class placeholders
const INDIGO_PRIMARY = "text-indigo-600";
const GRAY_ACCENT = "text-gray-500";
const INDIGO_HOVER_BG = "hover:bg-indigo-50";


// --- UI HELPERS ---

const getDefectStatusCategory = (defect: DefectListModel): Exclude<DefectStatusCategory, 'ALL'> => {
    if (defect.isClosed || defect.status === 'CLOSED') {
        return 'CLOSED';
    }

    // High Priority status based on CRITICAL/MAJOR severity (and not closed)
    if (defect.severity === 'CRITICAL' || defect.severity === 'MAJOR') {
        return 'HIGH_PRIORITY';
    }

    return 'OPEN';
};

const DefectStatusBadge: React.FC<{ category: Exclude<DefectStatusCategory, 'ALL'> }> = ({ category }) => {
    const base = "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap flex items-center gap-1";
    let icon;
    let text;
    let classes;

    switch (category) {
        case 'CLOSED':
            icon = <CheckCircle className="w-3 h-3" />;
            text = 'Closed';
            classes = `${base} bg-green-100 text-green-700 border border-green-200`;
            break;
        case 'HIGH_PRIORITY':
            icon = <Zap className="w-3 h-3" />;
            text = 'High Priority';
            classes = `${base} bg-red-100 text-red-700 border border-red-200`;
            break;
        case 'OPEN':
        default:
            icon = <Clock className="w-3 h-3" />;
            text = 'Open';
            classes = `${base} bg-blue-100 text-blue-700 border border-blue-200`;
            break;
    }

    return (
        <span className={classes}>
            {icon}
            {text}
        </span>
    );
};

const SeverityDisplay: React.FC<{ severity: DefectSeverity }> = ({ severity }) => {
    const base = "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap flex items-center gap-1";
    let icon;
    let text = severity;
    let classes;

    switch (severity) {
        case 'CRITICAL':
            icon = <AlertCircle className="w-3 h-3" />;
            classes = `${base} bg-red-50 text-red-600 border border-red-200`;
            break;
        case 'MAJOR':
            icon = <AlertTriangle className="w-3 h-3" />;
            classes = `${base} bg-orange-50 text-orange-600 border border-orange-200`;
            break;
        case 'MINOR':
        case 'LOW':
        default:
            icon = <Tag className="w-3 h-3" />;
            classes = `${base} bg-gray-100 text-gray-600 border border-gray-200`;
            break;
    }

    return (
        <span className={classes}>
            {icon}
            {text}
        </span>
    );
};


// --- DEFECT FORM COMPONENT ---
interface DefectFormData {
    title: string;
    description: string;
    assignee: string;
    defectType: string;
    severity: DefectSeverity;
    status: DefectStatus;
}

interface DefectFormProps {
    initialData?: DefectListModel;
    onSubmit: (data: DefectFormData & { id?: string }) => void;
    onCancel: () => void;
}

const DefectForm: React.FC<DefectFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const isEditing = !!initialData;
    
    // Initial state setup
    const initialFormState: DefectFormData = {
        title: initialData?.title || '',
        description: initialData?.description || '',
        assignee: initialData?.assignee || ASSIGNEE_OPTIONS[0],
        defectType: initialData?.defectType || TYPE_OPTIONS[0],
        severity: initialData?.severity || SEVERITY_OPTIONS[2], // Default to MINOR
        status: initialData?.status || STATUS_OPTIONS[0], // Default to OPEN
    };

    const [formData, setFormData] = useState<DefectFormData>(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSubmit = {
            ...formData,
            // Only include ID if editing
            ...(isEditing && { id: initialData.id }),
            // Ensure description is not empty string but null if truly empty
            description: formData.description.trim() || null, 
        };
        
        onSubmit(dataToSubmit as DefectFormData & { id?: string });
    };

    const formTitle = isEditing ? `Edit Defect: ${initialData.id}` : 'Create New Defect';
    const submitButtonText = isEditing ? 'Save Changes' : 'Report Defect';

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform scale-100 transition-all duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-800">{formTitle}</h2>
                    <button 
                        onClick={onCancel} 
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        title="Close Form"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Row 1: Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                            placeholder="A concise summary of the issue"
                            maxLength={100}
                        />
                    </div>

                    {/* Row 2: Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                            placeholder="Detailed steps to reproduce, expected vs. actual behavior..."
                        />
                    </div>

                    {/* Row 3: Severity, Type, Assignee, Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        
                        {/* Severity */}
                        <div>
                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                            <select
                                name="severity"
                                id="severity"
                                value={formData.severity}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-white"
                            >
                                {SEVERITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Defect Type */}
                        <div>
                            <label htmlFor="defectType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                name="defectType"
                                id="defectType"
                                value={formData.defectType}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-white"
                            >
                                {TYPE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                            <select
                                name="assignee"
                                id="assignee"
                                value={formData.assignee}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-white"
                            >
                                {ASSIGNEE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status (Only editable when defect exists) */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                id="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={!isEditing} // Status is only editable when editing an existing defect
                                className={cn(
                                    "w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3", 
                                    !isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                                )}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                ))}
                            </select>
                            {!isEditing && <p className="text-xs text-gray-500 mt-1">Defaults to OPEN</p>}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl shadow-md text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition duration-150 hover:scale-[1.02]"
                        >
                            {submitButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- DESKTOP TABLE ROW COMPONENT ---

interface DesktopTableRowProps {
    defect: DefectListModel;
    index: number;
    itemOffset: number;
    onEdit: (defect: DefectListModel) => void;
}

const DesktopTableRow: React.FC<DesktopTableRowProps> = ({ defect, index, itemOffset, onEdit }) => {
    const statusCategory = getDefectStatusCategory(defect);

    return (
        <tr key={defect.id} className="hover:bg-indigo-50/20 transition duration-150 ease-in-out">
            
            {/* Title / Type (Truncated) */}
            <td className="px-6 py-3">
                <a 
                    href={`/de/${defect.id}`} 
                    className="block group/title"
                    title={defect.description || defect.title}
                >
                    <div 
                        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition max-w-xs truncate" 
                    >
                        {itemOffset + index + 1}. {defect.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        {defect.defectType}
                    </div>
                </a>
            </td>

            {/* Severity */}
            <td className="px-6 py-3 whitespace-nowrap">
                <SeverityDisplay severity={defect.severity} />
            </td>
            
            {/* Status Category */}
            <td className="px-6 py-3 whitespace-nowrap">
                <DefectStatusBadge category={statusCategory} />
            </td>

            {/* Responsible (Assignee) */}
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 flex items-center">
                <User className="w-3 h-3 mr-1 text-gray-400" />
                {defect.assignee || 'Unassigned'}
            </td>

            {/* Actions */}
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-3">
                    {/* Edit Button */}
                    <button
                        onClick={() => onEdit(defect)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 transition duration-150"
                        title="Edit Defect"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    
                    {/* View Link */}
                    <a 
                        href={`/de/${defect.id}`} 
                        className="text-gray-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                        <span className="hidden sm:inline">View</span>
                        {defect._count?.comments > 0 && (
                        <sup className="text-xs -ml-0.5 bg-indigo-100 text-indigo-700 rounded-full px-1 py-0.5 shadow-sm">
                            {defect._count?.comments}
                        </sup>
                        )}
                        <ArrowUpRight className="w-4 h-4" />
                    </a>
                </div>
            </td>
        </tr>
    );
};

// --- MOBILE CARD VIEW COMPONENT ---

interface MobileCardViewProps {
    defectsToDisplay: DefectListModel[];
    itemOffset: number;
    onEdit: (defect: DefectListModel) => void;
}

const MobileCardView: React.FC<MobileCardViewProps> = ({ defectsToDisplay, itemOffset, onEdit }) => (
    <div className="md:hidden space-y-4"> 
        {defectsToDisplay.map((defect,index) => {
            const statusCategory = getDefectStatusCategory(defect);

            return (
                <div 
                    key={defect.id} 
                    className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition duration-200 relative group"
                >
                    {/* Header Row: Title & Status Badge */}
                    <div className="flex justify-between items-start mb-2 ">
                        <h3 className="text-base font-semibold text-indigo-700 pr-6 max-w-[calc(100%-0px)]">
                            {itemOffset + index+1}. {defect.title}
                        </h3>
                    </div>
                    
                    {/* Metadata & Status */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 border-b border-gray-100 pb-2">
                         <DefectStatusBadge category={statusCategory} />
                         <SeverityDisplay severity={defect.severity} />
                         <div className="flex items-center text-xs text-gray-500">
                             <User className="w-3 h-3 mr-1" />
                             <span className="font-medium text-gray-600">{defect?.assignee || 'Unassigned'}</span>
                         </div>
                    </div>
                    
                    {/* Description and Action */}
                    <div className="flex justify-between items-center pt-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <ClipboardList className="w-3 h-3 text-indigo-400"/> 
                            <span className="font-semibold text-gray-600">{defect.defectType}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onEdit(defect)}
                                className="px-3 py-1 text-xs font-medium rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition"
                            >
                                <Edit className="w-4 h-4 inline mr-1" /> Edit
                            </button>
                            <a 
                                href={`/de/${defect.id}`} 
                                className="px-3 py-1 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center"
                            >
                                View 
                                {defect._count?.comments > 0 && (
                                <sup className="text-xs ml-1 bg-indigo-300 text-indigo-900 rounded-full px-1 py-0.5 shadow-sm">
                                    {defect._count?.comments}
                                </sup>
                                )}
                            </a>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);


// --- PAGINATION CONTROLS COMPONENT (Unchanged) ---
interface PaginationControlsProps {
    filteredDefectsLength: number;
    pageSize: number;
    itemOffset: number;
    handlePageClick: (args: { selected: number }) => void;
    handlePageSizeChange: (newPageSize: string) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    filteredDefectsLength,
    pageSize,
    itemOffset,
    handlePageClick,
    handlePageSizeChange,
}) => {
    if (filteredDefectsLength === 0) return null;
        
    const currentPageIndex = Math.floor(itemOffset / pageSize);
    const totalPages = Math.ceil(filteredDefectsLength / pageSize);
    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, filteredDefectsLength);
    const paginationSummary = `${startRange}-${endRange} of ${filteredDefectsLength}`;
    
    // Mocking updatePagSize execution for runnable code
    const mockHandlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handlePageSizeChange(e.target.value);
        toast.success(`Page size updated to ${e.target.value}`);
    };
    
    return (
        <div className="mt-6 flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-md border border-gray-100">
            
            <div className="text-sm text-gray-500 font-semibold hidden md:block">
                Page {currentPageIndex + 1} of {totalPages}
            </div>

            <div className="flex items-center">
                <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
                    {paginationSummary}
                </div>
                
                <select
                    className={cn('h-9 px-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', "bg-white")}
                    value={pageSize}
                    key={'pagesize-selector'}
                    onChange={mockHandlePageSizeChange}
                > 
                    {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size} per page</option>
                    ))}
                </select>

                <button 
                    key="prev"
                    onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
                    disabled={itemOffset === 0}
                    className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button 
                    key="next"
                    onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
                    disabled={endRange >= filteredDefectsLength}
                    className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

interface DefectListClientProps {
    currentUser: SafeUser | null;
}
    
const DefectsListPage: React.FC<DefectListClientProps> = ({
    currentUser 
}) => {
    const [defects, setDefects] = useState<DefectListModel[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Set to false since data is mocked upfront
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<string | null>(null);

    // --- Form/View State ---
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [editingDefect, setEditingDefect] = useState<DefectListModel | undefined>(undefined);

    // --- Search & Filter State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<DefectStatusCategory>('ALL'); 
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); 
    const [itemOffset, setItemOffset] = useState(0); 

        // --- Data Fetching Effect ---
        useEffect(() => {
            async function fetchOutputs() {
                try {
                    // NOTE: The API MUST now return the new fields (isCompleted, completionDate, dueDate)
                    const response = await fetch('/api/defects'); 
                    if (!response.ok) {
                        throw new Error('Failed to load outputs list.');
                    }
                    const data: DefectListModel[] = await response.json();
                    setDefects(data);
                    if (currentUser && currentUser.pageSize) {
                        setPageSize(currentUser.pageSize);
                    }
                } catch (err) {
                    setError((err as Error).message);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchOutputs();
        }, [currentUser]);

    // --- FORM HANDLERS ---
    const openAddForm = () => {
        setEditingDefect(undefined);
        setView('add');
    }

    const openEditForm = (defect: DefectListModel) => {
        setEditingDefect(defect);
        setView('edit');
    }

    const handleCancelForm = () => {
        setView('list');
        setEditingDefect(undefined);
    }
    
   const handleCreateOrUpdate = async (data: DefectFormData & { id?: string }) => {
    const isUpdate = !!data.id;
    // Assuming setShowToast, setIsLoading, handleCancelForm, and setDefects are available in scope.
    setIsLoading(true); 
    setShowToast(null);

    // 1. Prepare the payload (data to send to API)
    const defectDataToSave: DefectFormData & { isClosed: boolean, closedDate: string | null } = {
        ...data,
        // Calculate status-dependent fields for the payload
        isClosed: data.status === 'CLOSED',
        // Send closedDate if closed, otherwise null
        closedDate: data.status === 'CLOSED' ? new Date().toISOString() : null, 
    };
    
    const method = isUpdate ? 'PUT' : 'POST';
    const endpoint = isUpdate ? `/api/defects/${data.id}` : '/api/defects';
    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defectDataToSave),
        });

        // Assuming the API returns the full updated/created object (DefectListModel)
        const result: DefectListModel = await response.json(); 

        if (!response.ok) {
            // Handle HTTP error status (4xx, 5xx)
            const errorMessage = (result as any).message || `Failed to ${isUpdate ? 'update' : 'create'} defect.`;
            throw new Error(errorMessage);
        }

        // 2. Successful API Call - Update Local State with Server Response
        if (isUpdate) {
            // Update the existing defect in the list
            setDefects(prev => prev.map(d => (d.id === result.id ? result : d)));
            setShowToast(`SUCCESS: Defect ${result.id} updated.`);
        } else {
            // Creation: Add the new defect returned by the server to the list
            setDefects(prev => [result, ...prev]);
            setShowToast(`SUCCESS: New defect ${result.id} reported successfully!`);
        }
        
    } catch (e: any) {
        // Handle network or JSON parsing errors
        console.error('API Error:', e);
        // Using 'e.message' from the thrown error
        setShowToast(`ERROR: ${e.message || 'A network error occurred.'}`); 
    } finally {
        // 3. Cleanup (runs regardless of success or failure)
        setIsLoading(false);
        handleCancelForm();
        setTimeout(() => setShowToast(null), 3000);
    }
};

    // --- Filtering and Pagination Logic (Unchanged) ---
    const filteredDefects = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return defects.filter(defect => {
            
            // 1. Search Filtering (Title, Description, Assignee)
            const matchesSearch = 
                defect.title.toLowerCase().includes(lowerSearchTerm) ||
                defect.description?.toLowerCase().includes(lowerSearchTerm) ||
                defect.assignee?.toLowerCase().includes(lowerSearchTerm);
                
            // 2. Status Category Filtering
            if (statusFilter === 'ALL') {
                return matchesSearch;
            }
            
            const category = getDefectStatusCategory(defect);
            const matchesStatus = category === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [defects, searchTerm, statusFilter]);

    const paginatedDefects = useMemo(() => {
        const endpoint = Math.min(itemOffset + pageSize, filteredDefects.length);
        return filteredDefects.slice(itemOffset, endpoint);
    }, [filteredDefects, itemOffset, pageSize]);
    
    // Reset offset when filters or page size change
    useEffect(() => {
        setItemOffset(0);
    }, [searchTerm, pageSize, statusFilter]); 

    // --- PAGINATION HANDLERS (Simplified/Mocked) ---
    const handlePageClick = useCallback(({ selected }: { selected: number }) => {
        const totalPages = Math.max(1, Math.ceil(filteredDefects.length / pageSize));
        const clampedSelected = Math.min(Math.max(0, selected), totalPages - 1);
        const newOffset = clampedSelected * pageSize;
        
        setItemOffset(newOffset);
    }, [pageSize, filteredDefects.length]);

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        // Removed execute() call for external action
        setItemOffset(0); 
    }, []); 
    
    
    // --- Render Guards ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <div className="p-4 text-lg font-medium text-gray-600">Loading Defects...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 m-6 max-w-xl mx-auto text-red-700 border border-red-300 bg-red-50 rounded-lg shadow-md">
                <h3 className="font-bold mb-2">Error Loading Data</h3>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const defectsToDisplay = paginatedDefects;
    
    // --- MAIN RENDER ---
    
    return (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6 font-[Inter]"> 
            
            {/* Defect Form Modal: Renders when adding or editing */}
            {(view === 'add' || view === 'edit') && (
                <DefectForm 
                    initialData={editingDefect}
                    onSubmit={handleCreateOrUpdate}
                    onCancel={handleCancelForm}
                />
            )}
            
            {/* Mock Toast Notification */}
            {showToast && (
                <div className={cn("fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-sm font-medium transition-opacity duration-300", 
                    showToast.startsWith("SUCCESS") ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
                    <div className="flex items-center">
                        {showToast.startsWith("SUCCESS") ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                        {showToast}
                    </div>
                </div>
            )}

            {/* Header and Action Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white py-3 px-0 sm:py-2 sm:px-0 border-b border-gray-200 mb-4"> 
                <div className="flex flex-col mb-3 sm:mb-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Defect Tracking Register
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-sm">
                        Real-time overview of reported bugs, issues, and requested improvements.
                    </p>
                </div>
                
                {/* Add Defect Button */}
                <button
                    onClick={openAddForm}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-[1.02] disabled:opacity-50"
                    disabled={view !== 'list'}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Report New Defect
                </button>
                
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6"> 
                
                {/* Search Input */}
                <div className="relative flex-grow md:w-8/12">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Title, Description, or Assignee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm"
                        disabled={view !== 'list'}
                    />
                </div>
                
                {/* Status Filter */}
                <div className="relative md:w-4/12">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as DefectStatusCategory)}
                        className="w-full appearance-none py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm cursor-pointer"
                        disabled={view !== 'list'}
                    >
                        <option value="ALL">Filter by Status Category (All)</option>
                        <option value="CLOSED">Closed 🟢</option>
                        <option value="HIGH_PRIORITY">High Priority 🔴</option>
                        <option value="OPEN">Open / In Progress 🔵</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            {/* Full Table View (Desktop/Tablet: md and up) */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 border-b border-indigo-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Defect / Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th> 
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Status</th> 
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th> {/* Updated column header */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {defectsToDisplay.map((defect, index) => (
                            <DesktopTableRow 
                                key={defect.id} 
                                defect={defect} 
                                index={index} 
                                itemOffset={itemOffset} 
                                onEdit={openEditForm} // Passed the new handler
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View (Mobile) */}
            <MobileCardView 
                defectsToDisplay={defectsToDisplay} 
                itemOffset={itemOffset} 
                onEdit={openEditForm} // Passed the new handler
            />
            
            {/* Pagination Controls */}
            <PaginationControls
                filteredDefectsLength={filteredDefects.length}
                pageSize={pageSize}
                itemOffset={itemOffset}
                handlePageClick={handlePageClick}
                handlePageSizeChange={handlePageSizeChange}
            />

            {/* Empty States */}
            {filteredDefects.length === 0 && !isLoading && searchTerm.length > 0 && (
                <div className="mt-6 p-10 text-center bg-yellow-50 rounded-xl border border-yellow-200">
                    <h3 className="text-xl font-semibold text-gray-700">No Defects Found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search term or status filter.</p>
                </div>
            )}

            {defects.length === 0 && !isLoading && filteredDefects.length === 0 && (
                <div className="mt-12 p-10 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700">No Defects Reported</h3>
                    <p className="text-gray-500 mt-2">Start by reporting your first issue!</p>
                </div>
            )}
        </div>
    );
}

export default DefectsListPage;