import React, { useState } from 'react';
import { Settings, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for combining class names
import { SearchableFieldKey, searchableFields } from '../DefectClientsPage';

interface SearchFieldSelectorProps {
    searchableFields: typeof searchableFields;
    activeFields: SearchableFieldKey[];
    onFieldsChange: (newFields: SearchableFieldKey[]) => void;
}

const SearchFieldSelector: React.FC<SearchFieldSelectorProps> = ({ 
    searchableFields, 
    activeFields, 
    onFieldsChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const availableKeys = Object.keys(searchableFields) as SearchableFieldKey[];

    const handleToggle = (key: SearchableFieldKey) => {
        const isCurrentlyActive = activeFields.includes(key);
        let newFields = [];

        if (isCurrentlyActive) {
            newFields = activeFields.filter(f => f !== key);
        } else {
            newFields = [...activeFields, key];
        }

        // Must always have at least one field active to prevent empty search state
        if (newFields.length > 0) {
            onFieldsChange(newFields);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                className="inline-flex justify-center items-center w-full rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <Settings className="w-4 h-4 mr-2" />
                Search Fields ({activeFields.length})
                <ChevronDown className="-mr-1 ml-2 h-4 w-4" />
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    onBlur={() => setIsOpen(false)}
                >
                    <div className="py-1">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-400 border-b">Select fields to include in search</p>
                        {availableKeys.map((key) => (
                            <div
                                key={key}
                                className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer"
                                onClick={() => handleToggle(key)}
                            >
                                <span>{searchableFields[key].label}</span>
                                {activeFields.includes(key) && <Check className="w-4 h-4 text-indigo-600" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default SearchFieldSelector;