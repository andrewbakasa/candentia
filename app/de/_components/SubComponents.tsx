import React, { useEffect, useRef, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { 
    Edit, User, Tag, ChevronLeft, ChevronRight, 
    ClipboardList, ArrowUpRight, MessageSquare, 
    Calendar,
    MapPin,
    X,
    Clock
} from 'lucide-react';
import { DatabaseDefectStatus, DefectFormData, DefectListModel, Priority } from '../types';
import { cn } from "@/lib/utils";
import { getDefectStatusCategory, getTimeAgo } from '../utils';
import { Settings2, Check, ChevronDown } from 'lucide-react';
import { searchableFields, SearchableFieldKey } from '../types'; // Adjust path
import { SeverityDisplay } from '../DefectListClient';

//import { getDefectStatusCategory } from "./utils";

// --- MOBILE CARD VIEW COMPONENT ---

interface MobileCardViewProps {
    defectsToDisplay: DefectListModel[];
    itemOffset: number;
    onEdit: (defect: DefectListModel) => void;
    allowEditing: boolean;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({ 
    defectsToDisplay, 
    itemOffset, 
    onEdit, 
    allowEditing 
}) => {
    return (
        <div className="md:hidden space-y-4 p-4"> 
            {defectsToDisplay.map((defect, index) => {
                const statusCategory = getDefectStatusCategory(defect);

                return (
                    <div 
                        key={defect.id} 
                        className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform duration-200"
                    >
                        {/* 1. Header: Reference & Status */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    #{itemOffset + index + 1} • {defect.id}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-500 uppercase">
                                    {defect.equipmentTag || 'No Tag'}
                                </span>
                            </div>
                            <div className="flex gap-2 items-center">
                                {defect.breakdownRelated && (
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                )}
                                <SeverityDisplay priority={defect.priority} />
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* 2. Title & Latest Update Preview */}
                            <div className="space-y-2">
                                <a href={`/de/${defect.id}`} className="block group">
                                    <h3 className="text-base font-black text-slate-900 leading-tight flex items-start justify-between gap-2">
                                        {defect.title}
                                        <ArrowUpRight className="w-5 h-5 text-slate-300 shrink-0" />
                                    </h3>
                                </a>

                                {/* UX UPDATE: Latest Update Preview */}
                                <div className="bg-indigo-50/50 p-3 rounded-xl border-l-4 border-indigo-400">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">
                                        Latest Update
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic font-medium">
                                        {defect.analysisSummaries?.[0] || defect.description || 'Waiting for initial analysis...'}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Meta Grid: Stats & Owner */}
                            <div className="grid grid-cols-2 gap-3 py-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Owner</span>
                                        <span className="text-xs font-bold text-slate-700">{defect.assignee || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Activity</span>
                                        <span className="text-xs font-bold text-slate-700">{getTimeAgo(defect.updatedAt || defect.identificationDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Footer Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    defect.isClosed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                )}>
                                    {defect.status.replace('_', ' ')}
                                </div>

                                <div className="flex items-center gap-2">
                                    {allowEditing && (
                                        <button
                                            onClick={() => onEdit(defect)}
                                            className="p-3 text-slate-400 bg-slate-50 rounded-xl hover:text-indigo-600 active:bg-indigo-50 transition-colors border border-slate-100"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    <a 
                                        href={`/de/${defect.id}`} 
                                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        View Details
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- PAGINATION CONTROLS COMPONENT ---

interface PaginationProps {
    filteredDefectsLength: number;
    pageSize: number;
    itemOffset: number;
    handlePageClick: (event: { selected: number }) => void;
    handlePageSizeChange: (val: string) => void;
}

export const PaginationControls: React.FC<PaginationProps> = ({
    filteredDefectsLength,
    pageSize,
    itemOffset,
    handlePageClick,
    handlePageSizeChange
}) => {
    const pageCount = Math.ceil(filteredDefectsLength / pageSize);
    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, filteredDefectsLength);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4 border-t border-gray-100 bg-white rounded-b-2xl">
            <div className="text-sm text-gray-500 font-medium order-2 sm:order-1">
                Showing <span className="text-gray-900 font-bold">{startRange}-{endRange}</span> of <span className="text-gray-900 font-bold">{filteredDefectsLength}</span> defects
            </div>

            <div className="flex items-center gap-6 order-1 sm:order-2">
                <div className="hidden lg:flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Show:</span>
                    <select 
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className="bg-gray-50 px-2 py-1 rounded border-none text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                        {[8, 16, 24, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                <ReactPaginate
                    breakLabel="..."
                    nextLabel={<ChevronRight className="w-4 h-4" />}
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={3}
                    pageCount={pageCount}
                    previousLabel={<ChevronLeft className="w-4 h-4" />}
                    containerClassName="flex items-center gap-1"
                    pageClassName="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    activeClassName="!bg-indigo-600 !text-white shadow-lg shadow-indigo-100"
                    previousClassName="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    nextClassName="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    disabledClassName="opacity-20 cursor-not-allowed"
                />
            </div>
        </div>
    );
};

// --- SKELETON LOADER COMPONENT ---

export const DefectListSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-8 lg:p-12 animate-pulse">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-gray-200 rounded-md" />
                            <div className="w-32 h-4 bg-gray-100 rounded-md" />
                        </div>
                    </div>
                    <div className="w-32 h-10 bg-gray-200 rounded-xl" />
                </div>

                <div className="w-full h-14 bg-white rounded-2xl border border-gray-100 shadow-sm" />

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="h-12 bg-gray-50/50 border-b border-gray-100" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex p-6 border-b border-gray-50 gap-4 items-center">
                            <div className="flex-1 space-y-3">
                                <div className="w-3/4 h-4 bg-gray-100 rounded" />
                                <div className="flex gap-2">
                                    <div className="w-20 h-3 bg-gray-50 rounded" />
                                    <div className="w-20 h-3 bg-gray-50 rounded" />
                                </div>
                            </div>
                            <div className="hidden md:block w-24 h-6 bg-gray-100 rounded-full" />
                            <div className="w-12 h-8 bg-gray-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface DefectFormProps {
    initialData?: DefectListModel;
    onSubmit: (data: DefectFormData & { id?: string }) => void;
    onCancel: () => void;
}

/**
 * Interface for the payload sent back to the parent component/API.
 * Converts string types to native objects where required.
 */




export const DefectForm: React.FC<DefectFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const isEditing = !!initialData;
    
   
    // Formats Date object or string into YYYY-MM-DD
    const formatDateForInput = (date?: Date | string) => {
        const d = date ? new Date(date) : new Date();
        return d.toISOString().split('T')[0];
    };
    type DefectType = 'MECHANICAL' | 'ELECTRICAL' | 'SOFTWARE' | 'PROCESS' | 'OTHER';
    type DefectStatus = 'IDENTIFIED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    type Assignee = 'MAINTENANCE' | 'ENGINEERING' | 'OPERATIONS' | 'UNASSIGNED';
    const TYPE_OPTIONS: DefectType[] = ['MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'PROCESS', 'OTHER'];
    const ASSIGNEE_OPTIONS: Assignee[] = ['MAINTENANCE', 'ENGINEERING', 'OPERATIONS', 'UNASSIGNED'];
    const SEVERITY_OPTIONS: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const STATUS_OPTIONS: DatabaseDefectStatus[] = ['IDENTIFIED', 'IN_ANALYSIS', 'ACTION_DEFINED', 'ACTION_IMPLEMENTED', 'CLOSED_VERIFIED'];
    const DEFAULT_PAGE_SIZE = 8;
    const PAGE_SIZE_OPTIONS = [4, 8, 16, 24];

    const initialFormState: DefectFormData = {
        title: initialData?.title || '',
        description: initialData?.description || '',
        area: initialData?.area || '',
        equipmentTag: initialData?.equipmentTag || '',
        reportedby: initialData?.reportedby || '',
        // This is now a string 'YYYY-MM-DD', resolving the ts(2322) error
        identificationDate: formatDateForInput(initialData?.identificationDate),
        assignee: initialData?.assignee || ASSIGNEE_OPTIONS[0],
        type: initialData?.type || TYPE_OPTIONS[0],
        severity: initialData?.priority || 'MEDIUM',
        status: initialData?.status || 'IDENTIFIED',
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert the UI string date back to a native Date object for the Database
        const dataToSubmit = {
            ...formData,
            identificationDate: new Date(formData.identificationDate),
            ...(isEditing && { id: initialData.id }),
            description: formData.description?.trim() || null, 
        };
        
        // Explicitly cast to the expected submission type if needed
        onSubmit(dataToSubmit as any); 
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 z-40 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditing ? `Edit Defect` : 'Report New Defect'}
                        </h2>
                        {isEditing && <p className="text-xs text-gray-500 font-mono mt-1">ID: {initialData.id}</p>}
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    {/* Primary Info: Title & Tag */}
                    {/* Section 1: Identity & Ownership */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border"
                                placeholder="Short descriptive title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-indigo-500" /> Equipment Tag
                            </label>
                            <input
                                name="equipmentTag"
                                value={formData?.equipmentTag || ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border font-mono uppercase"
                                placeholder="E.g. PUMP-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" /> Reported By
                            </label>
                            <input
                                name="reportedby"
                                value={formData?.reportedby || ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border"
                                placeholder="Name"
                            />
                        </div>
                    </div>

                    {/* Meta Info: Area, Date, Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Area / Location
                            </label>
                            <input
                                name="area"
                                value={formData.area||""}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border"
                                placeholder="Section or Room"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Identified Date
                            </label>
                            <input
                                type="date"
                                name="identificationDate"
                                value={formData.identificationDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Defect Type</label>
                            <select
                                name="defectType"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border bg-white"
                            >
                                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
                        <textarea
                            name="description"
                            rows={4}
                            value={formData.description||""}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 p-3 border"
                            placeholder="Detail reproduction steps and observed behavior..."
                        />
                    </div>

                    {/* Criticality: Priority, Status, Assignee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Priority</label>
                            <select name="severity" value={formData.severity} onChange={handleChange} className="w-full rounded-lg border-gray-200 p-2 border">
                                {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Current Status</label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange} 
                                disabled={!isEditing}
                                className={cn("w-full rounded-lg border-gray-200 p-2 border", !isEditing && "bg-gray-100 opacity-60")}
                            >
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Assignee</label>
                            <select name="assignee" value={formData.assignee} onChange={handleChange} className="w-full rounded-lg border-gray-200 p-2 border">
                                {ASSIGNEE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                            {isEditing ? 'Update Defect' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


interface SearchFieldSelectorProps {
    // Ensure searchableFields is passed or available in scope
    searchableFields: Record<SearchableFieldKey, { label: string; type: string }>;
    activeFields: SearchableFieldKey[];
    onFieldsChange: (fields: SearchableFieldKey[]) => void;
}

export const SearchFieldSelector: React.FC<SearchFieldSelectorProps> = ({ 
    searchableFields, // Destructure this from props
    activeFields, 
    onFieldsChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleField = (key: SearchableFieldKey) => {
        if (activeFields.includes(key)) {
            // Prevent removing the last field so search always works
            if (activeFields.length > 1) {
                onFieldsChange(activeFields.filter(f => f !== key));
            }
        } else {
            onFieldsChange([...activeFields, key]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200",
                    "bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm",
                    isOpen && "ring-2 ring-indigo-500/20 border-indigo-500"
                )}
            >
                <Settings2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">
                    Fields ({activeFields.length})
                </span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] p-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Scope</p>
                    </div>
                    <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {(Object.keys(searchableFields) as SearchableFieldKey[]).map((key) => {
                            const isActive = activeFields.includes(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleField(key)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive 
                                            ? "bg-indigo-50 text-indigo-700" 
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {searchableFields[key].label}
                                    {isActive && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
