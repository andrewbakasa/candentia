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
    X,
    ShieldCheck,
    TrendingDown,
    Wrench, // Added for closing form
} from 'lucide-react';
// Assuming SafeUser and cn are imported from external files.
import { SafeUser } from '../types'; 
import { cn } from '@/lib/utils'; 
import { toast } from 'sonner';
import { useAction } from '@/hooks/use-action';
import { updatePagSize } from '@/actions/update-user-pagesize';


// --- DATABASE ENUMS (MAPPED TO REACT TYPES) ---

/**
 * Corresponds to Prisma `enum Priority`
 */
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Corresponds to Prisma `enum DefectStatus`
 */
type DatabaseDefectStatus = 'IDENTIFIED' | 'IN_ANALYSIS' | 'ACTION_DEFINED' | 'ACTION_IMPLEMENTED' | 'CLOSED_VERIFIED';

// Logical groupings used by the UI for coloring/filtering
type DefectStatusCategory = 'ALL' | 'CLOSED' | 'HIGH_PRIORITY' | 'OPEN';

interface DefectListModel {
    id: string;
    title: string;
    description: string | null;
    assignee: string | null; 
    defectType: string; 
    priority: Priority; // Renamed from severity
    isClosed: boolean; // Retained, often helpful for filtering
    closedDate: string | null; 
    targetResolutionDate: string | null; 
    status: DatabaseDefectStatus; // Updated to match DB enum
    _count: {
        comments: number;
    }
}

// Data options for the Form
const SEVERITY_OPTIONS: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export type DefectType = 'MECHANICAL' | 'ELECTRICAL' | 'SOFTWARE' | 'PROCESS' | 'OTHER';
export type DefectStatus = 'IDENTIFIED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Assignee = 'Maintenance' | 'Engineering' | 'Operations' | 'Unassigned';
const TYPE_OPTIONS: DefectType[] = ['MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'PROCESS', 'OTHER'];
const ASSIGNEE_OPTIONS: Assignee[] = ['Maintenance', 'Engineering', 'Operations', 'Unassigned'];
const STATUS_OPTIONS: DatabaseDefectStatus[] = ['IDENTIFIED', 'IN_ANALYSIS', 'ACTION_DEFINED', 'ACTION_IMPLEMENTED', 'CLOSED_VERIFIED'];
const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZE_OPTIONS = [4, 8, 16, 24];

// Tailwind class placeholders
const INDIGO_PRIMARY = "text-indigo-600";
const GRAY_ACCENT = "text-gray-500";
const INDIGO_HOVER_BG = "hover:bg-indigo-50";

const getDefectStatusCategory = (defect: DefectListModel): Exclude<DefectStatusCategory, 'ALL'> => {
    // 1. Closed/Terminal Status
    if (defect.status === 'CLOSED_VERIFIED') {
        return 'CLOSED';
    }

    // 2. High Priority (Based on the new Priority enum)
    if (defect.priority === 'CRITICAL' || defect.priority === 'HIGH') {
        return 'HIGH_PRIORITY';
    }

    // 3. Open/In Progress/Non-terminal
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
            text = 'Verified Closed';
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
            text = 'In Progress';
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

const SeverityDisplay: React.FC<{ priority: Priority }> = ({ priority }) => {
    const base = "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap flex items-center gap-1";
    let icon;
    let text = priority;
    let classes;

    switch (priority) {
        case 'CRITICAL':
            icon = <AlertCircle className="w-3 h-3" />;
            classes = `${base} bg-red-50 text-red-600 border border-red-200`;
            break;
        case 'HIGH':
            icon = <Zap className="w-3 h-3" />;
            classes = `${base} bg-orange-50 text-orange-600 border border-orange-200`;
            break;
        case 'MEDIUM':
            icon = <AlertTriangle className="w-3 h-3" />;
            classes = `${base} bg-yellow-50 text-yellow-600 border border-yellow-200`;
            break;
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
    severity: Priority; // Updated type
    status: DatabaseDefectStatus; // Updated type
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
        severity: initialData?.priority || SEVERITY_OPTIONS[2] as Priority, // Default to MEDIUM (index 2)
        status: initialData?.status || STATUS_OPTIONS[0], // Default to IDENTIFIED
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

                    {/* Row 3: Severity (Priority), Type, Assignee, Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        
                        {/* Priority (Severity) */}
                        <div>
                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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
                            {!isEditing && <p className="text-xs text-gray-500 mt-1">Defaults to IDENTIFIED</p>}
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
    allowEditing:boolean
}

const DesktopTableRow: React.FC<DesktopTableRowProps> = ({ defect, index, itemOffset, onEdit,allowEditing }) => {
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

            {/* Priority (Severity) */}
            <td className="px-6 py-3 whitespace-nowrap">
                <SeverityDisplay priority={defect.priority} />
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
                        disabled={!allowEditing}
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
    allowEditing:boolean;
}

const MobileCardView: React.FC<MobileCardViewProps> = ({ defectsToDisplay, itemOffset, onEdit,allowEditing }) => (
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
                           <SeverityDisplay priority={defect.priority} />
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
                                disabled={!allowEditing}
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

// --- Skeleton Utility Components ---

// Creates the pulsing background for a loading element
const SkeletonLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-4' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${width} ${height}`}></div>
);

// --- MAIN SKELETON COMPONENT ---

const DefectListSkeleton: React.FC = () => {
    // Define the number of rows/cards to show in the skeleton
    const ROW_COUNT = 8;
    const skeletonRows = Array.from({ length: ROW_COUNT });

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 lg:p-12 font-inter">
            <div className="max-w-7xl mx-auto">
                
                {/* 1. Header Area Skeleton */}
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    {/* Title */}
                    <SkeletonLine width="w-64" height="h-8" /> 
                    {/* Report Button */}
                    <SkeletonLine width="w-40" height="h-10" />
                </div>

                ---

                {/* 2. Controls Area Skeleton (Filters & Search) */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-100 mb-6 space-y-4">
                    
                    {/* Filter Tabs Skeleton */}
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        <SkeletonLine width="w-24" height="h-8" />
                        <SkeletonLine width="w-32" height="h-8" />
                        <SkeletonLine width="w-28" height="h-8" />
                        <SkeletonLine width="w-36" height="h-8" />
                    </div>

                    {/* Search Input Skeleton */}
                    <div className="relative">
                        {/* Mimics the full-width search bar */}
                        <SkeletonLine width="w-full" height="h-10" />
                    </div>
                </div>

                ---

                {/* 3. Desktop Table View Skeleton */}
                <div className="hidden md:block bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Table Header (no animation needed here, just solid background) */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-2/5">Title / Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/5">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/5">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/5">Assignee</th>
                                <th className="relative px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {skeletonRows.map((_, index) => (
                                <tr key={index}>
                                    {/* Title / Type column */}
                                    <td className="px-6 py-4">
                                        <SkeletonLine width="w-4/5" height="h-4" />
                                        <div className="mt-1"><SkeletonLine width="w-1/3" height="h-3" /></div>
                                    </td>
                                    {/* Priority column */}
                                    <td className="px-6 py-4"><SkeletonLine width="w-16" height="h-4" /></td>
                                    {/* Status column */}
                                    <td className="px-6 py-4"><SkeletonLine width="w-20" height="h-4" /></td>
                                    {/* Assignee column */}
                                    <td className="px-6 py-4"><SkeletonLine width="w-24" height="h-4" /></td>
                                    {/* Actions column */}
                                    <td className="px-6 py-4 text-right">
                                        <div className='flex justify-end space-x-2'>
                                            <SkeletonLine width="w-10" height="h-6" />
                                            <SkeletonLine width="w-10" height="h-6" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. Mobile Card View Skeleton */}
                <div className="md:hidden space-y-4"> 
                    {skeletonRows.map((_, index) => (
                        <div 
                            key={`mobile-${index}`} 
                            className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg animate-pulse space-y-3"
                        >
                            {/* Title Line */}
                            <SkeletonLine width="w-10/12" height="h-5" />
                            
                            {/* Metadata/Badges */}
                            <div className="flex gap-4 border-b border-gray-100 pb-2">
                                <SkeletonLine width="w-16" height="h-4" />
                                <SkeletonLine width="w-16" height="h-4" />
                                <SkeletonLine width="w-20" height="h-4" />
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-end space-x-2 pt-2">
                                <SkeletonLine width="w-16" height="h-8" />
                                <SkeletonLine width="w-16" height="h-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
const DefectListClient: React.FC<DefectListClientProps> = ({ currentUser }) => {
    // --- State Management ---
    const [defects, setDefects] = useState<DefectListModel[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<DefectStatusCategory>('ALL');
    const [pageSize, setPageSize] = useState(currentUser?.pageSize||DEFAULT_PAGE_SIZE);
    const [itemOffset, setItemOffset] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingDefect, setEditingDefect] = useState<DefectListModel | undefined>(undefined);

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
    
    
    
    const [isLoading, setIsLoading] = useState(true); // Set to false since data is mocked upfront
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<string | null>(null);
    // --- Form/View State ---
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [statusFilter, setStatusFilter] = useState<DefectStatusCategory>('ALL'); 
    

     // --- Data Fetching Effect ---
        useEffect(() => {
            async function fetchOutputs() {
                try {
                     setIsLoading(true);
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


    // --- Filtering Logic ---
    const filteredDefects = useMemo(() => {
        let result = defects;

        // 1. Category Filter
        if (filterCategory !== 'ALL') {
            result = result.filter(defect => getDefectStatusCategory(defect) === filterCategory);
        }

        // 2. Search Filter
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            result = result.filter(defect => 
                defect.title.toLowerCase().includes(lowerCaseSearch) ||
                defect.description?.toLowerCase().includes(lowerCaseSearch) ||
                defect.assignee?.toLowerCase().includes(lowerCaseSearch) ||
                defect.defectType?.toLowerCase().includes(lowerCaseSearch)
            );
        }
        
        // Always sort by ID descending (newest first for simplicity)
        result.sort((a, b) => b.id.localeCompare(a.id)); 

        return result;
    }, [defects, filterCategory, searchTerm]);

    // --- Pagination Logic ---
    const endOffset = itemOffset + pageSize;
    const defectsToDisplay = filteredDefects.slice(itemOffset, endOffset);
    const totalPages = Math.ceil(filteredDefects.length / pageSize);

    // Reset offset when filters/search/pageSize change
    useEffect(() => {
        setItemOffset(0);
    }, [filterCategory, searchTerm, pageSize]);

    const handlePageClick = useCallback((event: { selected: number }) => {
        const newOffset = (event.selected * pageSize) % filteredDefects.length;
        setItemOffset(newOffset);
    }, [pageSize, filteredDefects.length]);

   

    const { execute } = useAction(updatePagSize, {
            onSuccess: (data) => {
                toast.success(`PageSize for ${data?.email} updated to ${data.pageSize}`);
            },
            onError: (error) => {
                toast.error(error);
            },
        });
    const handlePageSizeChange = useCallback((newPageSize: string) => {
            const numericPageSize = parseInt(newPageSize, 10);
            setPageSize(numericPageSize);
            
            if (currentUser) {
                execute({ id: currentUser?.id, pageSize: numericPageSize });
            }
            setItemOffset(0); 
        }, [currentUser, execute]); 
    

    // --- Form Handlers ---

    const handleOpenForm = (defect?: DefectListModel) => {
        setEditingDefect(defect);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setEditingDefect(undefined);
        setShowForm(false);
    };
    const handleSubmitDefect = (data: DefectFormData & { id?: string }) => {
        // 1. Call the API-driven function with the form data.
        // This function already handles:
        // - API communication (POST for create, PUT/PATCH for update)
        // - Local state update (setDefects) with the server response
        // - Loading/Error/Toast states (setShowToast, setIsLoading)
        // - Closing the form (handleCancelForm)
        handleCreateOrUpdate(data);
    };


    // (Your new API-driven function)
    const handleCreateOrUpdate = async (data: DefectFormData & { id?: string }) => {
        const isUpdate = !!data.id;
        const handleCancelForm = handleCloseForm; 
        setIsLoading(true); 
        // You can remove setShowToast(null) if you rely solely on toast.success/error
        setShowToast(null); 
        // 1. Prepare the payload (data to send to API)
        const statusForClosedCheck = data.status === 'CLOSED_VERIFIED'; 

        const defectDataToSave: DefectFormData & { isClosed: boolean, closedDate: string | null } = {
            ...data,
            isClosed: statusForClosedCheck,
            closedDate: statusForClosedCheck ? (isUpdate && editingDefect?.closedDate) || new Date().toISOString() : null, 
        };
        
        const method = isUpdate ? 'PUT' : 'POST';
        const endpoint = isUpdate ? `/api/defects/${data.id}` : '/api/defects';
        
        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defectDataToSave),
            });

            const result: DefectListModel = await response.json(); 

            if (!response.ok) {
                const errorMessage = (result as any).message || `Failed to ${isUpdate ? 'update' : 'create'} defect.`;
                throw new Error(errorMessage);
            }

            // 2. Successful API Call - Update Local State with Server Response
            if (isUpdate) {
                // Update the existing defect in the list
                setDefects(prev => prev.map(d => (d.id === result.id ? result : d)));
                
                // ✅ CORRECTED: Use external toast library for success
                toast.success(`Defect ${result.id} updated successfully.`);
                
            } else {
                // Creation: Add the new defect returned by the server to the list
                setDefects(prev => [result, ...prev]);
                
                // ✅ CORRECTED: Use external toast library for success
                toast.success(`New defect ${result.id} reported successfully!`);
            }
            
        } catch (e: any) {
            console.error('API Error:', e);
            setShowToast(`ERROR: ${e.message || 'A network error occurred.'}`); 

        } finally {
            // 3. Cleanup (runs regardless of success or failure)
            setIsLoading(false);
            handleCancelForm(); // Calls handleCloseForm
        }
    };

    // --- Render Content ---
    const categoryOptions: { id: DefectStatusCategory; label: string; }[] = [
        { id: 'ALL', label: 'All Defects' },
        { id: 'HIGH_PRIORITY', label: 'High Priority' },
        { id: 'OPEN', label: 'Open / In Progress' },
        { id: 'CLOSED', label: 'Closed / Verified' },
    ];
    
    // Calculate category counts for display
    const categoryCounts = useMemo(() => {
        const counts = { ALL: defects.length, CLOSED: 0, HIGH_PRIORITY: 0, OPEN: 0 };
        defects.forEach(d => {
            const category = getDefectStatusCategory(d);
            counts[category] = counts[category] + 1;
        });
        return counts;
    }, [defects]);

if (isLoading) {
    // Return a dedicated loading component
    return <DefectListSkeleton />; 
}
   return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-8 lg:p-12 font-inter">
        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; }
        `}</style>
        
        <div className="max-w-7xl mx-auto space-y-8">
            {/* 1. Header Area: High contrast, clear hierarchy */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-indigo-200 shadow-lg">
                        <Activity className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Defect Elimination</h1>
                        <p className="text-sm text-gray-500 font-medium">Systematic Asset Reliability</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm(undefined)}
                    className="group flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition duration-200 transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                    Report New Defect
                </button>
            </header>

            {/* 2. DE Methodology: Information design with minimal mobile toggle */}
            <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm ring-1 ring-black/5 transition-all">
                <div className="border-l-4 border-indigo-600 bg-indigo-50/40 p-5">
                    <p className="text-sm font-semibold text-gray-800 md:text-base">
                        <span className="text-indigo-700">Methodology:</span> Identification and elimination of defects in both fixed and mobile plants.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-px bg-indigo-50/50 md:grid-cols-4">
                    {[
                        { icon: ShieldCheck, label: "Safety", md: "Safety standards" },
                        { icon: Zap, label: "Production", md: "Downtime/Reliability" },
                        { icon: TrendingDown, label: "Costs", md: "Reduced spend" },
                        { icon: Wrench, label: "Maintenance", md: "Labor/Materials" }
                    ].map((aim, idx) => (
                        <div key={idx} className="bg-white p-4 md:p-6 text-center md:text-left hover:bg-gray-50/50 transition-colors">
                            <div className="flex flex-col md:flex-row items-center gap-2 text-indigo-700">
                                <aim.icon className="w-5 h-5" />
                                <span className="text-[11px] font-bold uppercase tracking-widest md:text-xs text-indigo-900">{aim.label}</span>
                            </div>
                            <p className="hidden md:block mt-2 text-xs text-gray-500 leading-snug">{aim.md}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Controls Area: Unified search and filtering */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-50 pb-4">
                    {categoryOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setFilterCategory(opt.id)}
                            className={cn(
                                "flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all",
                                filterCategory === opt.id
                                    ? "bg-gray-900 text-white shadow-md shadow-gray-200 scale-105"
                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
                            )}
                        >
                            {opt.label}
                            <span className={cn(
                                "ml-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold",
                                filterCategory === opt.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                            )}>
                                {categoryCounts[opt.id] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title, ID, or assignee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-300 transition-all text-sm"
                    />
                </div>
            </div>

            {/* 4. Desktop Table View: High-density readability */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ring-1 ring-gray-50">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {["Title / Type", "Priority", "Status", "Assignee"].map((th) => (
                                <th key={th} scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    {th}
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {defectsToDisplay.length > 0 ? (
                            defectsToDisplay.map((defect, index) => (
                                <DesktopTableRow 
                                    key={defect.id} 
                                    defect={defect} 
                                    index={index} 
                                    itemOffset={itemOffset}
                                    onEdit={handleOpenForm}
                                    allowEditing={hasRequiredRole}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-40">
                                        <Activity className="w-12 h-12 mb-3" />
                                        <p className="text-gray-500 font-medium">No results match your current filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View & Pagination Components */}
            <MobileCardView 
                defectsToDisplay={defectsToDisplay} 
                itemOffset={itemOffset}
                onEdit={handleOpenForm}
                allowEditing={hasRequiredRole} 
            />

            {filteredDefects.length > 0 && (
                <PaginationControls
                    filteredDefectsLength={filteredDefects.length}
                    pageSize={pageSize}
                    itemOffset={itemOffset}
                    handlePageClick={handlePageClick}
                    handlePageSizeChange={handlePageSizeChange}
                />
            )}

            {/* Modal Layer */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <DefectForm 
                        initialData={editingDefect}
                        onSubmit={handleSubmitDefect}
                        onCancel={handleCloseForm}
                    />
                </div>
            )}
        </div>
    </div>
);
}

export default DefectListClient;