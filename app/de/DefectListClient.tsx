"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Activity, Plus, Search, Clock, ClipboardList, 
    Edit, ArrowUpRight, AlertCircle, Settings2,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from "@/lib/utils"; 

// Import Utilities & Types
import { getDefectStatusCategory, getTimeAgo } from './utils';
import { DefectFormData, DefectListModel, DefectStatusCategory } from './types';

// Import Sub-Components
import { 
    DefectForm,
    DefectListSkeleton, 
    MobileCardView, 
    PaginationControls,
    SearchFieldSelector // Assuming this is where it lives
} from './_components/SubComponents';

// --- SEARCH CONFIGURATION ---
export const searchableFields = {
    title: { label: 'Title', type: 'string' },
    description: { label: 'Description', type: 'string' },
    assignee: { label: 'Assignee', type: 'string' },
    type: { label: 'Defect Type', type: 'string' },
    equipmentTag: { label: 'Equipment Tag', type: 'string' },
    eliminationRootCauseText: { label: 'Root Cause Text', type: 'string' },
    analysisSummaries: { label: 'Analysis Summaries', type: 'array' },
    actionDescriptions: { label: 'Action Descriptions', type: 'array' },
    improvementDescriptions: { label: 'CI Opportunities', type: 'array' },
};

export type SearchableFieldKey = keyof typeof searchableFields;

// --- INTERNAL UI HELPERS ---
export const SeverityDisplay = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
        CRITICAL: "text-red-700 bg-red-50 border-red-100",
        HIGH: "text-orange-700 bg-orange-50 border-orange-100",
        MEDIUM: "text-blue-700 bg-blue-50 border-blue-100",
        LOW: "text-slate-600 bg-slate-50 border-slate-100",
    };
    return (
        <span className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
            colors[priority] || colors.LOW
        )}>
            {priority}
        </span>
    );
};

const DefectStatusBadge = ({ category }: { category: DefectStatusCategory }) => {
    const configs: Record<DefectStatusCategory, { label: string, styles: string }> = {
        ALL: { label: "Standard", styles: "bg-gray-100 text-gray-600" },
        HIGH_PRIORITY: { label: "Urgent", styles: "bg-red-600 text-white shadow-sm shadow-red-100" },
        OPEN: { label: "In Progress", styles: "bg-amber-100 text-amber-700 border border-amber-200" },
        CLOSED: { label: "Resolved", styles: "bg-green-100 text-green-700 border border-green-200" },
    };
    const config = configs[category] || configs.ALL;
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", config.styles)}>
            {config.label}
        </span>
    );
};

const DefectListClient: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    // --- State Management ---
    const [defects, setDefects] = useState<DefectListModel[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<DefectStatusCategory>('ALL');
      const [showToast, setShowToast] = useState<string | null>(null);
    // Search Field State
  //  const [activeSearchFields, setActiveSearchFields] = useState<SearchableFieldKey[]>(['title', 'assignee']);
// Inside DefectListClient
const [activeSearchFields, setActiveSearchFields] = useState<SearchableFieldKey[]>(['title', 'assignee']);
    // Pagination & Modal State
    const [pageSize, setPageSize] = useState(currentUser?.pageSize || 8);
    const [itemOffset, setItemOffset] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingDefect, setEditingDefect] = useState<DefectListModel | undefined>(undefined);

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) return false;
        const allowedRoles = ['admin', 'executive'];
        return currentUser.isAdmin || currentUser.roles?.some((r: string) => 
            allowedRoles.includes(r.toLowerCase())
        );
    }, [currentUser]);

    const fetchDefects = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/defects'); 
            if (!response.ok) throw new Error('Failed to load defect list.');
            const data: DefectListModel[] = await response.json();
            setDefects(data);
            setLastUpdated(new Date());
        } catch (err) {
            toast.error("Failed to sync data from server");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchDefects(); }, [fetchDefects]);

    const handleOpenForm = (defect?: DefectListModel) => {
        setEditingDefect(defect);
        setShowForm(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingDefect(undefined);
        document.body.style.overflow = 'unset';
    };

    // const handleSubmitDefect = async (formData: any) => {
    //     toast.success(editingDefect ? "Entry updated successfully" : "New entry recorded");
    //     fetchDefects();
    //     handleCloseForm();
    // };

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

    // --- Dynamic Filtering Logic ---
    const filteredDefects = useMemo(() => {
        let result = [...defects];
        
        if (filterCategory !== 'ALL') {
            result = result.filter(d => getDefectStatusCategory(d) === filterCategory);
        }

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(d => {
                // Check each active field dynamically
                return activeSearchFields.some(fieldKey => {
                    const value = (d as any)[fieldKey];
                    if (Array.isArray(value)) {
                        return value.some(item => String(item).toLowerCase().includes(lowSearch));
                    }
                    return String(value || '').toLowerCase().includes(lowSearch);
                });
            });
        }
        return result.sort((a, b) => b.id.localeCompare(a.id)); 
    }, [defects, filterCategory, searchTerm, activeSearchFields]);

    const defectsToDisplay = useMemo(() => {
        return filteredDefects.slice(itemOffset, itemOffset + pageSize);
    }, [filteredDefects, itemOffset, pageSize]);

    const counts = {
        ALL: defects.length,
        HIGH_PRIORITY: defects.filter(d => d.priority === 'CRITICAL' || d.priority === 'HIGH').length,
        OPEN: defects.filter(d => !d.isClosed).length,
        CLOSED: defects.filter(d => d.isClosed).length,
    };

    if (isLoading) return <DefectListSkeleton />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 lg:p-12 font-inter relative">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* 1. HEADER SECTION */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-2xl">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Defect Elimination</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                                    {counts.ALL} TOTAL RECORDS
                                </span>
                                {lastUpdated && (
                                    <span className="text-[10px] text-slate-400 flex items-center font-medium italic">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Last sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NEW BUTTON & SELECTOR GROUP */}
                    <div className='flex flex-row items-center gap-2 w-full md:w-auto'> 
                        <button
                            onClick={() => handleOpenForm(undefined)}
                            className="group flex items-center py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition duration-200 transform hover:-translate-y-0.5 flex-1 md:flex-none justify-center"
                        >
                            <Plus className="w-5 h-5 mx-2 sm:mr-2 sm:ml-0 group-hover:rotate-90 transition-transform duration-200" />
                            <span className="hidden sm:inline-block pr-5">Report New Defect</span>
                            <span className="sm:hidden mx-1.5"></span>
                        </button>

                        <SearchFieldSelector 
                            searchableFields={searchableFields}
                            activeFields={activeSearchFields}
                            onFieldsChange={setActiveSearchFields}
                        />
                    </div>
                </header>

                {/* 2. FILTER & SEARCH CONTROLS */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-2">
                    <div className="flex p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
                        {(['ALL', 'HIGH_PRIORITY', 'OPEN', 'CLOSED'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap flex items-center gap-2",
                                    filterCategory === cat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {cat.replace('_', ' ')}
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px]", filterCategory === cat ? "bg-indigo-50" : "bg-slate-200/50")}>
                                    {counts[cat]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeSearchFields.length} fields...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl focus:ring-0 text-sm font-medium placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* 3. DATA VIEW */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Defect & Latest Progress</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Owner</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity & Age</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {defectsToDisplay.map((defect, idx) => (
                                    <tr key={defect.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        {/* 1. DEFECT & LATEST PROGRESS */}
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <a href={`/de/${defect.id}`} className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                        {itemOffset + idx + 1}. {defect.title}
                                                    </a>
                                                    {defect.breakdownRelated && (
                                                        <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">
                                                            BREAKDOWN
                                                        </span>
                                                    )}
                                                </div>
                                                {/* NEW: Desktop Update Preview */}
                                                <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <span className="text-[8px] font-black text-indigo-400 uppercase mt-0.5">LATEST:</span>
                                                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                                                        {defect.analysisSummaries?.[0] || defect.description || 'No updates logged.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. ASSET & OWNER */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    {defect.assignee || 'Unassigned'}
                                                </span>
                                                <span className="text-[10px] font-bold text-indigo-500 uppercase mt-1">
                                                    {defect.equipmentTag || 'N/A'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 3. SEVERITY & AGE */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <SeverityDisplay priority={defect.priority} />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(defect.updatedAt || defect.identificationDate)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 4. STATUS */}
                                        <td className="px-6 py-4">
                                            <DefectStatusBadge category={getDefectStatusCategory(defect)} />
                                        </td>

                                        {/* 5. ACTIONS */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {hasRequiredRole && (
                                                    <button 
                                                        onClick={() => handleOpenForm(defect)} 
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <a 
                                                    href={`/de/${defect.id}`} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View remains integrated below */}
                    <MobileCardView 
                        defectsToDisplay={defectsToDisplay} 
                        itemOffset={itemOffset} 
                        onEdit={handleOpenForm} 
                        allowEditing={hasRequiredRole}
                    />

                    {/* Empty State */}
                    {filteredDefects.length === 0 && (
                        <div className="py-24 text-center">
                            <AlertCircle className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold">No results found.</p>
                        </div>
                    )}
                </div>

                <PaginationControls
                    filteredDefectsLength={filteredDefects.length}
                    pageSize={pageSize}
                    itemOffset={itemOffset}
                    handlePageClick={(e) => setItemOffset(e.selected * pageSize)}
                    handlePageSizeChange={(v) => { setPageSize(parseInt(v)); setItemOffset(0); }}
                />
            </div>

            {/* MODAL FORM LAYER */}
            {showForm && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={(e) => e.target === e.currentTarget && handleCloseForm()}
                >
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingDefect ? 'Update Defect' : 'Log New Defect'}</h2>
                        </div>
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                           <DefectForm 
                                initialData={editingDefect} 
                                onSubmit={handleSubmitDefect} 
                                onCancel={handleCloseForm} 
                            /> 
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefectListClient;