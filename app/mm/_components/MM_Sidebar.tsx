'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, Briefcase, Activity, Settings, LayoutDashboard } from 'lucide-react';

type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

export default function MM_Sidebar({ activeTab }: { activeTab?: TabType | 'none' }) {
  return (
    <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
          <Target size={22} className="text-white" />
        </div>
        <div className="leading-none">
          <span className="font-black text-xl tracking-tight block text-white">NRZ MM</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
        </div>
      </div>
      
      <nav className="space-y-2 flex-1">
        <SidebarLink href="/mm/?tab=strategies" icon={<Target size={20}/>} label="Strategic Plans" active={activeTab === 'strategies'} />
        <SidebarLink href="/mm/?tab=projects" icon={<Briefcase size={20}/>} label="Projects" active={activeTab === 'projects'} />
        <SidebarLink href="/mm/?tab=activities" icon={<Activity size={20}/>} label="Operational Activities" active={activeTab === 'activities'} />
        <SidebarLink href="/mm/?tab=workshops" icon={<Settings size={20}/>} label="Workshops" active={activeTab === 'workshops'} />
  
        <div className="pt-4 mt-4 border-t border-slate-800">
          <SidebarLink href="/mm/" icon={<LayoutDashboard size={20}/>} label="Main Dashboard" active={false} />
        </div>
      </nav>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
        active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
    </Link>
  );
}