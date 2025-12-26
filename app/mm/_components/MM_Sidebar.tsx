'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Target, 
  Briefcase, 
  Activity, 
  Settings, 
  LayoutDashboard, 
  ShoppingCart, 
  Box,
  Layers, 
  AlertOctagon
} from 'lucide-react';
import { TabType } from '../DashBoardclient';

// 1. Centralized Navigation Configuration
const NAV_ITEMS = [
  { href: "/mm/?tab=strategies", icon: Target, label: "Strategies", tab: "strategies" },          // 0
  { href: "/mm/?tab=workshops", icon: Settings, label: "Workshops", tab: "workshops" },           // 1
  { href: "/mm/?tab=projects", icon: Briefcase, label: "Projects", tab: "projects" },            // 2
  { href: "/mm/?tab=activities", icon: Activity, label: "Activities", tab: "activities" },        // 3
  { href: "/mm/?tab=delays", icon: AlertOctagon, label: "Delays", tab: "delays" },                // 4
  { href: "/mm/?tab=mastermaterials", icon: Layers, label: "Catalogue", tab: "mastermaterials" }, // 5
  { href: "/mm/?tab=purchaseorders", icon: ShoppingCart, label: "Orders", tab: "purchaseorders" },// 6
  { href: "/mm/?tab=materials", icon: Box, label: "BoQ", tab: "materials" },                      // 7
];

export default function MM_Sidebar({ activeTab }: { activeTab?: TabType | 'none' }) {
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800 h-screen sticky top-0">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Target size={22} className="text-white" />
          </div>
          <div className="leading-none">
            <span className="font-black text-xl tracking-tight block text-white uppercase">NRZ MM</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Integrated Hub</span>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3">Strategic Oversight</p>
          <SidebarLink {...NAV_ITEMS[0]} active={activeTab === 'strategies'} />
          <SidebarLink {...NAV_ITEMS[1]} active={activeTab === 'workshops'} />
          
          <div className="h-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3">Operations & Risk</p>
          <SidebarLink {...NAV_ITEMS[2]} active={activeTab === 'projects'} />
          <SidebarLink {...NAV_ITEMS[3]} active={activeTab === 'activities'} />
          <SidebarLink {...NAV_ITEMS[4]} active={activeTab === 'delays'} />
          
          <div className="h-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3">Logistics & Supply</p>
          <SidebarLink {...NAV_ITEMS[5]} active={activeTab === 'mastermaterials'} />
          <SidebarLink {...NAV_ITEMS[6]} active={activeTab === 'purchaseorders'} />
          <SidebarLink {...NAV_ITEMS[7]} active={activeTab === 'materials'} />

          <div className="pt-4 mt-8 border-t border-slate-800">
            <SidebarLink href="/mm/" icon={LayoutDashboard} label="Main Dashboard" active={activeTab === 'none'} />
          </div>
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 z-[100] pb-safe">
        <div className="grid grid-cols-6 items-center justify-items-center px-1 py-2">
          <MobileNavLink {...NAV_ITEMS[0]} label="Plans" active={activeTab === 'strategies'} />
          <MobileNavLink {...NAV_ITEMS[2]} label="Projects" active={activeTab === 'projects'} />
          <MobileNavLink {...NAV_ITEMS[4]} label="Risk" active={activeTab === 'delays'} />
          <MobileNavLink {...NAV_ITEMS[5]} label="Catalog" active={activeTab === 'mastermaterials'} />
          <MobileNavLink {...NAV_ITEMS[6]} label="Orders" active={activeTab === 'purchaseorders'} />
          <MobileNavLink {...NAV_ITEMS[7]} label="BoQ" active={activeTab === 'materials'} />
        </div>
      </nav>
    </>
  );
}

// ... MobileNavLink and SidebarLink components remain the same as your provided code
function MobileNavLink({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${
        active ? 'text-indigo-400' : 'text-slate-500'
      }`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-600/10 text-indigo-400' : ''}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </Link>
  );
}

function SidebarLink({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' 
          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
        <span className="font-bold text-[13px] tracking-tight">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />}
    </Link>
  );
}