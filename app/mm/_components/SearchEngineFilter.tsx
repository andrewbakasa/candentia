'use client';

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Settings2, Check, Filter, Sparkles } from "lucide-react";

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
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full space-y-3">
      <div className="relative w-full flex gap-3 items-stretch min-h-[64px]">
        {/* Main Input Container */}
        <div 
          className={`relative flex-1 flex items-center transition-all duration-300 rounded-[1.25rem] border ${
            isFocused 
            ? 'bg-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
            : 'bg-slate-50 border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="pl-5 pr-3 text-slate-400">
            <Search size={20} className={isFocused ? 'text-indigo-500 animate-pulse' : ''} />
          </div>
          
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium"
          />

          {searchTerm && (
            <button 
              onClick={() => handleTextChange('')} 
              className="mr-3 p-1.5 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Trigger */}
        <div className="relative flex" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-6 rounded-[1.25rem] border transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.15em] ${
              isOpen 
              ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
            }`}
          >
            <Settings2 size={18} className={isOpen ? 'text-indigo-400' : ''} />
            <span className="hidden md:inline">Scope</span>
            {activeScopes.length > 0 && !isOpen && (
              <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 rounded-lg text-[9px]">
                {activeScopes.length}
              </span>
            )}
          </button>

          {/* Premium Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-2 mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Filter size={14} className="text-indigo-500" /> Filter Scopes
                </p>
                <Sparkles size={14} className="text-amber-400" />
              </div>

              <div className="grid gap-1.5">
                {scopes.map((scope) => {
                  const isActive = activeScopes.includes(scope.key);
                  return (
                    <button
                      key={scope.key}
                      onClick={() => toggleScope(scope.key)}
                      className={`group w-full flex items-center justify-between px-4 py-3 rounded-[1.1rem] text-[11px] font-bold transition-all ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="uppercase tracking-wide">{scope.label}</span>
                      {isActive ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-300 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Active Tags */}
      <div className="flex flex-wrap gap-2 px-2">
        {activeScopes.length > 0 ? (
          activeScopes.map(key => {
            const label = scopes.find(s => s.key === key)?.label;
            return (
              <button
                key={key}
                onClick={() => toggleScope(key)}
                className="group flex items-center gap-2 text-[9px] font-black px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-xl border border-indigo-100/50 uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
              >
                {label}
                <X size={10} className="opacity-50 group-hover:opacity-100" />
              </button>
            );
          })
        ) : (
          <p className="text-[9px] font-medium text-slate-400 italic px-1">
            No scopes selected. Searching across all fields...
          </p>
        )}
      </div>
    </div>
  );
};
// 'use client'

// import React, { useState, useRef, useEffect } from "react";
// import { Search, X, Settings2, Check, Filter } from "lucide-react";

// export interface SearchScope {
//   key: string;
//   label: string;
// }

// interface SearchFilterEngineProps {
//   onSearchChange: (term: string) => void;
//   onScopesChange: (activeKeys: string[]) => void;
//   scopes: SearchScope[];
//   initialActiveScopes?: string[];
//   placeholder?: string;
// }

// export const SearchFilterEngine = ({
//   onSearchChange,
//   onScopesChange,
//   scopes,
//   initialActiveScopes = [],
//   placeholder = "Search..."
// }: SearchFilterEngineProps) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeScopes, setActiveScopes] = useState<string[]>(initialActiveScopes);
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Handle outside clicks to close dropdown
//   useEffect(() => {
//     const handleClick = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClick);
//     return () => document.removeEventListener("mousedown", handleClick);
//   }, []);

//   const toggleScope = (key: string) => {
//     const newScopes = activeScopes.includes(key)
//       ? activeScopes.filter(s => s !== key)
//       : [...activeScopes, key];
    
//     setActiveScopes(newScopes);
//     onScopesChange(newScopes);
//   };

//   const handleTextChange = (val: string) => {
//     setSearchTerm(val);
//     onSearchChange(val);
//   };

//   return (
//     <div className="w-full space-y-2">
//       <div className="relative w-full flex gap-2">
//         {/* Main Input */}
//         <div className="relative flex-1 group">
//           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => handleTextChange(e.target.value)}
//             placeholder={placeholder}
//             className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//           />
//           {searchTerm && (
//             <button 
//               onClick={() => handleTextChange('')} 
//               className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
//             >
//               <X size={14} />
//             </button>
//           )}
//         </div>

//         {/* Dropdown Trigger */}
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => setIsOpen(!isOpen)}
//             className={`h-full px-4 rounded-2xl border transition-all flex items-center gap-2 ${
//               isOpen ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'
//             }`}
//           >
//             <Settings2 size={18} />
//             <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Scope</span>
//           </button>

//           {/* Dropdown Menu */}
//           {isOpen && (
//             <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
//               <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2 flex items-center gap-2">
//                 <Filter size={12} /> Search Fields
//               </p>
//               <div className="space-y-1">
//                 {scopes.map((scope) => {
//                   const isActive = activeScopes.includes(scope.key);
//                   return (
//                     <button
//                       key={scope.key}
//                       onClick={() => toggleScope(scope.key)}
//                       className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
//                         isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'
//                       }`}
//                     >
//                       {scope.label}
//                       {isActive && <Check size={14} />}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Active Tags Preview */}
//       <div className="flex flex-wrap gap-1.5 px-1">
//         {activeScopes.map(key => {
//           const label = scopes.find(s => s.key === key)?.label;
//           return (
//             <span key={key} className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 uppercase tracking-tighter">
//               {label}
//             </span>
//           );
//         })}
//       </div>
//     </div>
//   );
// };