'use client';
import React, { useState, useCallback } from 'react';
import { 
    Bug, AlertTriangle, Clock, Target, User, Calendar, LucideIcon, FileText, Zap, Aperture, CheckCircle, Package, PlusCircle, ListTodo, Layers, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast'; // Recommended for better user feedback

// --- Imports (Adjust paths as necessary) ---
import { 
    ActionStatus, 
    BreakdownModel, 
    CorrectiveActionModel, 
    DefectDetailModel, 
    DefectStatus, 
    Priority, 
    AnalysisRecordModel, 
    AnalysisMethod 
} from "../_components/types/types";


// --- UTILITY COMPONENTS ---

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

// --- MAIN COMPONENT INTERFACE & IMPLEMENTATION ---

interface DefectDetailViewProps {
  currentUser: any; // Type your user model correctly
  defect: DefectDetailModel;
  allDefectsHref: string; // NEW PROP for the back link target
}

const DefectDetailView: React.FC<DefectDetailViewProps> = ({ defect, allDefectsHref }) => {

    const [activeTab, setActiveTab] = useState<'details' | 'analysis' | 'actions' | 'improvement'>('details');
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
    // --- END OF UPDATED COMPONENT ---


    const ImprovementOpportunityForm = ({ sourceId, onClose }: { sourceId: string, onClose: () => void }) => (
        <BaseFormCard title="Identify Improvement Opportunity" icon={Target} color="border-green-300" onClose={onClose}>
            <p className="text-sm text-gray-600 mb-3">Source Defect: **{sourceId}**</p>
            <div className="space-y-3">
                <textarea placeholder="Proposed Process/CI Action" rows={3} className="w-full p-2 border rounded"></textarea>
                <input type="text" placeholder="Target Area" className="w-full p-2 border rounded" />
                <button className="w-full py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">Submit Opportunity</button>
            </div>
        </BaseFormCard>
    );
    
    // Icon mapping for tabs
    const tabIcons: Record<typeof activeTab, LucideIcon> = {
        details: ListTodo,
        analysis: Aperture,
        actions: Zap,
        improvement: Target,
    };


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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
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
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex justify-between items-center text-blue-700">
                                Defined Corrective Actions ({defect.actions.length})
                                <button 
                                    onClick={() => setShowActionForm(!showActionForm)}
                                    className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full flex items-center hover:bg-blue-700 transition"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> Define Action
                                </button>
                            </h3>

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
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex justify-between items-center text-green-700">
                                Continuous Improvement Opportunities
                                <button 
                                    onClick={() => setShowImprovementForm(!showImprovementForm)}
                                    className="bg-green-600 text-white text-sm px-3 py-1 rounded-full flex items-center hover:bg-green-700 transition"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1"/> New Opportunity
                                </button>
                            </h3>
                            <p className="text-gray-600 p-3 bg-gray-50 rounded">Use this section to log systematic process or CI opportunities identified during the defect resolution process.</p>
                            {/* Placeholder for listing existing opportunities */}
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-gray-700">
                                *No logged CI Opportunities for this defect.*
                            </div>
                            {showImprovementForm && <ImprovementOpportunityForm sourceId={defect.id} onClose={() => setShowImprovementForm(false)} />}
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