import React from 'react';
//import { StrategyOutputForm } from '../types/rbm';
import { User, List, Trash2 } from 'lucide-react';
import { StrategyOutputForm } from '../types/strategy';

interface OutputFormProps {
    output: StrategyOutputForm;
    onChange: (updatedOutput: StrategyOutputForm) => void;
    onRemove: () => void;
    // Add an index for visual reference if needed
    index: number; 
}

const OutputForm: React.FC<OutputFormProps> = ({ output, onChange, onRemove, index }) => {
    
    // Helper to update a specific field
    const handleChange = (field: keyof StrategyOutputForm, value: any) => {
        onChange({ ...output, [field]: value });
    };

    return (
        <div className="flex items-start bg-white p-3 border-l-4 border-gray-200 shadow-sm rounded-md transition hover:shadow-md">
            <div className="flex-grow space-y-2">
                
                {/* Title Input */}
                <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder={`Output #${index + 1} Title (e.g., Q3 Report Completed)`}
                        value={output.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full text-sm font-medium border-0 border-b focus:ring-0 focus:border-indigo-500 pb-1"
                        required
                    />
                </div>

                {/* Responsible & Status */}
                <div className="flex gap-4 text-sm mt-1 pl-6">
                    <div className="flex items-center flex-grow">
                        <User className="w-3 h-3 text-gray-400 mr-1" />
                        <input
                            type="text"
                            placeholder="Responsible Person/Team"
                            value={output.responsible}
                            onChange={(e) => handleChange('responsible', e.target.value)}
                            className="w-full border-0 focus:ring-0 focus:border-indigo-300 text-xs py-0.5"
                            required
                        />
                    </div>
                    
                    {/* Completion Checkbox (Optional, often tracked in a different dashboard) */}
                    <div className="flex items-center">
                        <input
                            id={`completed-${output.tempId}`}
                            type="checkbox"
                            checked={output.isCompleted}
                            onChange={(e) => handleChange('isCompleted', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`completed-${output.tempId}`} className="ml-1 text-xs text-gray-600 select-none">
                            Completed
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Remove Button */}
            <button 
                type="button" 
                onClick={onRemove} 
                className="ml-4 p-1 text-red-400 hover:text-red-600 transition"
                title="Remove Output"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default OutputForm;