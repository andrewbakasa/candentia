'use client'

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Settings2, Check, Filter } from "lucide-react";

export interface SearchScope {
  key: string;
  label: string;
}

interface SearchFilterEngineProps {
  onSearchChange: (term: string) => void;
  onScopesChange: (activeKeys: string[]) => void;
  scopes: SearchScope[];
  initialActiveScopes?: string[];
  placeholder?: string;
}

export const SearchFilterEngine = ({
  onSearchChange,
  onScopesChange,
  scopes,
  initialActiveScopes = [],
  placeholder = "Search..."
}: SearchFilterEngineProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeScopes, setActiveScopes] = useState<string[]>(initialActiveScopes);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleScope = (key: string) => {
    const newScopes = activeScopes.includes(key)
      ? activeScopes.filter(s => s !== key)
      : [...activeScopes, key];
    
    setActiveScopes(newScopes);
    onScopesChange(newScopes);
  };

  const handleTextChange = (val: string) => {
    setSearchTerm(val);
    onSearchChange(val);
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full flex gap-2">
        {/* Main Input */}
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
          />
          {searchTerm && (
            <button 
              onClick={() => handleTextChange('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-full px-4 rounded-2xl border transition-all flex items-center gap-2 ${
              isOpen ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}
          >
            <Settings2 size={18} />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Scope</span>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2 flex items-center gap-2">
                <Filter size={12} /> Search Fields
              </p>
              <div className="space-y-1">
                {scopes.map((scope) => {
                  const isActive = activeScopes.includes(scope.key);
                  return (
                    <button
                      key={scope.key}
                      onClick={() => toggleScope(scope.key)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      {scope.label}
                      {isActive && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Tags Preview */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {activeScopes.map(key => {
          const label = scopes.find(s => s.key === key)?.label;
          return (
            <span key={key} className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 uppercase tracking-tighter">
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
};