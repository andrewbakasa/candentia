import React, { useState } from 'react';
//import { StrategyOutcomeForm, StrategyOutputForm } from '../types/rbm';
import { ArrowRight, Zap, Plus, Trash2 } from 'lucide-react';
import OutputForm from './OutputForm';
import { StrategyOutcomeForm, StrategyOutputForm } from '../types/strategy';

interface OutcomeFormProps {
    outcome: StrategyOutcomeForm;
    onChange: (updatedOutcome: StrategyOutcomeForm) => void;
    onRemove: () => void;
    goalIndex: number; // For visual clarity
}

const OutcomeForm: React.FC<OutcomeFormProps> = ({ outcome, onChange, onRemove, goalIndex }) => {
    
    // Helper to update a specific outcome field
    const handleChange = (field: keyof Omit<StrategyOutcomeForm, 'outputs' | 'tempId'>, value: any) => {
        onChange({ ...outcome, [field]: value });
    };

    // --- Output Management Handlers ---

    // Adds a new blank output to the list
    const handleAddOutput = () => {
        const newOutput: StrategyOutputForm = {
            title: '',
            responsible: '',
            isCompleted: false,
            tempId: crypto.randomUUID(), // Use tempId for local state management
        };
        onChange({ ...outcome, outputs: [...outcome.outputs, newOutput] });
    };

    // Updates a specific output by its tempId
    const handleUpdateOutput = (updatedOutput: StrategyOutputForm) => {
        const newOutputs = outcome.outputs.map(p => 
            p.tempId === updatedOutput.tempId ? updatedOutput : p
        );
        onChange({ ...outcome, outputs: newOutputs });
    };

    // Removes an output by its tempId
    const handleRemoveOutput = (tempId: string) => {
        const newOutputs = outcome.outputs.filter(p => p.tempId !== tempId);
        onChange({ ...outcome, outputs: newOutputs });
    };

    return (
        <div className="p-4 border border-indigo-200 rounded-lg space-y-4 bg-indigo-50/50 shadow-inner">
            <div className="flex justify-between items-start border-b border-indigo-200 pb-3">
                <h4 className="text-base font-semibold text-indigo-700 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    Goal {goalIndex} Outcome:
                </h4>
                <button 
                    type="button" 
                    onClick={onRemove} 
                    className="p-1 text-red-500 hover:text-red-700 transition"
                    title="Remove Outcome"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Outcome Title (e.g., Improved supply chain resilience)"
                    value={outcome.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full text-lg font-bold border-0 border-b-2 border-indigo-300 focus:ring-0 focus:border-indigo-600"
                    required
                />

                {/* KPI Input */}
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Key Performance Indicator (KPI) - e.g., '95% on-time delivery rate'"
                        value={outcome.kpi}
                        onChange={(e) => handleChange('kpi', e.target.value)}
                        className="w-full text-sm border-0 border-b focus:ring-0 focus:border-yellow-500"
                        required
                    />
                </div>
            </div>

            {/* Outputs Section */}
            <h5 className="text-sm font-bold text-gray-700 pt-2 flex items-center justify-between">
                Required Outputs (Deliverables):
                <button
                    type="button"
                    onClick={handleAddOutput}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center transition"
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Output
                </button>
            </h5>
            
            <div className="space-y-3 pl-2">
                {outcome.outputs.length === 0 && (
                    <p className="text-xs text-gray-500 italic pl-2">No outputs defined. Add a deliverable to achieve this outcome.</p>
                )}
                {outcome.outputs.map((output, index) => (
                    <OutputForm
                        key={output.tempId}
                        output={output}
                        index={index}
                        onChange={(updated) => handleUpdateOutput(updated)}
                        onRemove={() => handleRemoveOutput(output.tempId)}
                    />
                ))}
            </div>
        </div>
    );
};

export default OutcomeForm;