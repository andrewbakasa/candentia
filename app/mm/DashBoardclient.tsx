'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Loader2, Target, Briefcase, ShoppingCart, Box, ArrowUpRight, Receipt, AlertCircle, Layers,  Search, Calendar, DollarSign, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Components
import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_Sidebar from './_components/MM_Sidebar';
import MM_MaterialForm from './_components/MM_MaterialForm';
import MM_PurchaseOrderForm from './_components/MM_PurchaseOrder';
import MM_MasterMaterialForm from './_components/MM_MasterMaterial';

// 1. Updated TabType to include mastermaterials
export type TabType = 'strategies' | 'projects' | 'activities' | 'workshops' | 'purchaseorders' | 'materials' | 'mastermaterials';

function DashboardContent({ currentUser }: { currentUser: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
  const [data, setData] = useState<Record<TabType, any[]>>({ 
    strategies: [], 
    projects: [], 
    activities: [], 
    workshops: [], 
    purchaseorders: [], 
    materials: [],
    mastermaterials: [] // Initialized
  });
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const handleTabChange = (tab: TabType) => router.push(`/mm/?tab=${tab}`, { scroll: false });

  // 2. Data Sync Engine
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Logic for endpoint mapping
      const endpointOverride: Partial<Record<TabType, string>> = {
        materials: 'materialrequirements', // Requirement: fetch from requirements endpoint
        mastermaterials: 'mastermaterials' // Requirement: fetch from master catalog
      };

      const dependencyMap: Record<TabType, string[]> = {
        strategies: [],
        workshops: [],
        mastermaterials: [], // Global catalog is independent
        projects: ['strategies'],
        activities: ['projects'],
        purchaseorders: ['strategies', 'projects'],
        materials: ['strategies', 'projects']
      };

      const deps = dependencyMap[activeTab] || [];
      const endpoints = Array.from(new Set([activeTab, ...deps]));
      
      const results = await Promise.all(
        endpoints.map(async (slug) => {
          // Use override if exists, otherwise use slug
          const apiPath = endpointOverride[slug as TabType] || slug;
          const res = await fetch(`/mm/api/${apiPath}`);
          const json = await res.json();
          return { slug, data: Array.isArray(json) ? json : [] };
        })
      );

      setData((prev) => {
        const newData = { ...prev };
        results.forEach(({ slug, data }) => {
          newData[slug as TabType] = data;
        });
        return newData;
      });

    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Ledger Sync Failure: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    fetchData(); 
  };

  const isAllowed = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      <MM_Sidebar activeTab={activeTab} />
      
      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">NRZ ERP Gateway</p>
              <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab === 'purchaseorders' ? 'Procurement' : 
                 activeTab === 'materials' ? 'Project BoQ' : 
                 activeTab === 'mastermaterials' ? 'Master Catalog' : activeTab} 
                <span className="text-slate-400"> Hub</span>
              </h1>
            </div>

            {isAllowed && (
              //export exceljs of filtered data----> AI should create function thasend excel data  when clicked button// all active purchase orders, or catelog material or boq active
              <button 
                onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest"
              >
                <Plus size={18} strokeWidth={3} /> 
                Create {activeTab === 'mastermaterials' ? 'Catalog Item' : activeTab.slice(0, -1)}
              </button>
            )}
          </header>

          {loading && data[activeTab]?.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'activities' && <ActivityTableView activities={data.activities} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              
              {(activeTab === 'purchaseorders' || activeTab === 'materials' || activeTab === 'mastermaterials') && (
                <ProcurementListView 
                  activeTab={activeTab}
                  items={data[activeTab]} 
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Engine */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh]">
            {activeTab === 'purchaseorders' ? (
              <MM_PurchaseOrderForm initialData={editingRecord} strategies={data.strategies} projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
             
           
            ):activeTab === 'materials' ? (
            <MM_MaterialForm 
              initialData={editingRecord} 
              projects={data.projects} 
              strategies={data.strategies} // Pass the full list so the form can look it up
              onClose={() => setIsModalOpen(false)} 
              onSuccess={handleSaveSuccess} 
            />
         

            ) : activeTab === 'mastermaterials' ? (
              <MM_MasterMaterialForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
            ) : activeTab === 'projects' ? (
               <MM_ProjectForm initialData={editingRecord} workshops={data.workshops} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// Updated Helper Component to handle different Item Structures

function ProcurementListView1({ items, activeTab, onEdit }: { items: any[], activeTab: TabType, onEdit: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const vendor = (item.vendorname || '').toLowerCase();
    const code = (item.itemCode || item.poNumber || '').toLowerCase();
    const desc = (item.description || item.material?.description || '').toLowerCase();
    const project = (item.project?.name || '').toLowerCase();
    return vendor.includes(searchStr) || code.includes(searchStr) || desc.includes(searchStr) || project.includes(searchStr);
  });

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
        <div className="bg-slate-50 p-6 rounded-full">
          <ShoppingCart size={40} className="text-slate-200" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Ledger Entries Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6"> 
      {/* IMPROVED CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Search Container */}
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search ledger by vendor, code, or description..."
            className="w-full h-16 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-16 pr-6 shadow-sm text-sm font-bold transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Export Button Container */}
        <button 
          onClick={() => exportToExcel(filteredItems, activeTab)}
          className="h-16 flex items-center gap-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-indigo-200 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Layers size={18} className="text-emerald-600 group-hover:text-white" />
          </div>
          <div className="flex flex-col items-start pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Spreadsheet</span>
            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">Export {filteredItems.length} Rows</span>
          </div>
        </button>
      </div>

      {/* 2. Responsive Table Wrapper */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Core Identification</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell text-center">Logistics Timeline</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Valuation</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  {/* Identification Column */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         <span className="font-mono text-[10px] font-black text-indigo-600 px-2 py-1 bg-indigo-50 rounded uppercase border border-indigo-100">
                            {item.material?.itemCode || item.itemCode || item.poNumber || "NEW"}
                         </span>
                         {item.category && (
                            <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-2 py-0.5 rounded-lg">
                              {item.category}
                            </span>
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 line-clamp-1">
                          {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
                        </span>
                        {item.project?.name && (
                          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <Box size={12} className="text-slate-300" />
                            {item.project.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Logistics Timeline */}
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                        <Calendar size={12} className="text-slate-300" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                      </div>
                      {item.fundedAt && (
                        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase flex items-center gap-1">
                          <DollarSign size={10} /> Funded
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Financial Valuation */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-base font-black text-slate-900 tabular-nums tracking-tighter">
                        ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * (item.estimatedUnitCost || 0)) || 0).toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider
                        ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {item.status || 'Active'}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onEdit(item)} 
                      className="inline-flex items-center justify-center h-12 w-12 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-95 group-hover:shadow-indigo-200"
                    >
                      <ArrowUpRight size={20} strokeWidth={2.5}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function ProcurementListView({ items, activeTab, onEdit }: { items: any[], activeTab: TabType, onEdit: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const vendor = (item.vendorname || '').toLowerCase();
    const code = (item.itemCode || item.poNumber || '').toLowerCase();
    const desc = (item.description || item.material?.description || '').toLowerCase();
    const project = (item.project?.name || '').toLowerCase();
    return vendor.includes(searchStr) || code.includes(searchStr) || desc.includes(searchStr) || project.includes(searchStr);
  });

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
        <div className="bg-slate-50 p-6 rounded-full">
          <ShoppingCart size={40} className="text-slate-200" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Ledger Entries Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6"> 
     
 <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Search Container */}
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search ledger by vendor, code, or description..."
            className="w-full h-16 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-16 pr-6 shadow-sm text-sm font-bold transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Export Button Container */}
        <button 
          onClick={() => exportToExcel(filteredItems, activeTab)}
          className="h-16 flex items-center gap-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-indigo-200 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Layers size={18} className="text-emerald-600 group-hover:text-white" />
          </div>
          <div className="flex flex-col items-start pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Spreadsheet</span>
            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">Export {filteredItems.length} Rows</span>
          </div>
        </button>
      </div>
      {/* 2. Responsive Table/Card Wrapper */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Identification</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] hidden md:table-cell">Logistics Timeline</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valuation</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  {/* Identification Column */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                         <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded shadow-sm uppercase">
                            {item.material?.itemCode ? `IC: ${item.material.itemCode}` : 
                             item.itemCode ? `IC: ${item.itemCode}` : 
                             item.poNumber ? `PO: ${item.poNumber}` : "NEW"}
                         </span>
                         {item.category && (
                            <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                         )}
                      </div>
                      
                      {item.project?.name && (
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Box size={12} className="text-indigo-400" />
                          {item.project.name}
                        </p>
                      )}
                      
                     
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-xs">
                        {/* Check if vendorname exists to decide the label */}
                        <span className="text-slate-300 font-medium uppercase mr-1">
                          {item.vendorname ? "FROM:" : "DESC:"}
                        </span>
                        
                        {/* The dynamic value */}
                        <span className="text-slate-900 font-black">
                          {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
                        </span>
                      </p>
                    </div>
                  </td>

                  {/* Logistics Timeline (Hidden on small mobile) */}
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        REQ: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                      </div>
                      {item.fundedAt && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                          <DollarSign size={10} />
                          FUNDED: {new Date(item.fundedAt).toLocaleDateString()}
                        </div>
                      )}
                      {item.lastOrderedDate && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                          <Clock size={10} />
                          HISTORY: {item.lastOrderedDate}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Financial Valuation */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm
                        ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {item.poLineItem?.purchaseOrder?.status || item.status || 'Active'}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onEdit(item)} 
                      className="inline-flex items-center justify-center p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
                    >
                      <ArrowUpRight size={18} strokeWidth={3}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">
              No matching ledger entries for {searchTerm}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default function MM_CommandDashboard({ currentUser }: { currentUser: any }) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <DashboardContent currentUser={currentUser} />
    </Suspense>
  );
}
const exportToExcel = async (filteredData: any[], tabName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(tabName.toUpperCase());

  const isPO = tabName === 'purchaseorders';
  
  // 1. Define Columns
  worksheet.columns = [
    { header: 'PO / Ref ID', key: 'idnt', width: 20 },
    { header: 'Project', key: 'project', width: 25 },
    { header: 'Vendor', key: 'vendor', width: 30 },
    ...(isPO ? [
      { header: 'Material Code', key: 'li_code', width: 15 },
      { header: 'Line Description', key: 'li_desc', width: 35 },
      { header: 'Qty Ordered', key: 'li_qty', width: 12 },
      { header: 'Unit Price ($)', key: 'li_unit', width: 15 },
    ] : []),
    { header: 'Total Line Value ($)', key: 'value', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Date Created', key: 'created', width: 15 },
  ];

  // 2. Map Data
  filteredData.forEach(item => {
    const baseData = {
      idnt: item.poNumber || item.itemCode || 'N/A',
      project: item.project?.name || 'N/A',
      vendor: item.vendorname || 'N/A',
      status: item.status || 'Active',
      created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
    };

    // PO Logic: Drill into lineItems -> materialRequirement
    if (isPO && item.lineItems?.length > 0) {
      item.lineItems.forEach((li: any) => {
        // Accessing the specific requirement object you mentioned
        const req = li.materialRequirement || {};
        
        worksheet.addRow({
          ...baseData,
          li_code: li.itemCode || 'N/A',
          li_desc: li.description || 'N/A',
          li_qty: req.quantityOrdered || 0,
          li_unit: req.unitPrice || 0,
          value: req.totalPrice || ((req.quantityOrdered || 0) * (req.unitPrice || 0))
        });
      });
    } else {
      // Logic for Material Catalog or BoQ Tabs
      worksheet.addRow({
        ...baseData,
        vendor: item.vendorname || item.description || item.material?.description || 'N/A',
        value: (item.totalValue || item.lastKnownCost || 0),
      });
    }
  });

  // 3. Header Styling
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center' };
  });

  // 4. Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `NRZ_Procurement_${tabName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  toast.success(`Exported ${filteredData.length} records including material requirements.`);
};