'use client';

import { BookOpen, Flag, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

// Simplified types for the form state
interface FormGoal {
  id: string; 
  title: string;
  targetYear: number;
}

interface FormStrategy {
  title: string;
  content: string;
  year: string; // The overall strategy target year field
  goals: FormGoal[]; 
}

// Initial state for a brand new form
const initialFormState: FormStrategy = {
  title: '',
  content: '',
  year: new Date().getFullYear().toString(),
  goals: [
    { id: Date.now().toString(), title: '', targetYear: new Date().getFullYear() + 2 },
  ],
};

interface StrategyFormProps {
  initialStrategy?: any; 
  authorId: string; 
}

export default function StrategyForm({ initialStrategy, authorId }: StrategyFormProps) {
    const router = useRouter(); 
   const [isLoading, setIsLoading] = useState(false);
  // Logic to map existing strategy data into the form state structure
  const initialData: FormStrategy = initialStrategy 
    ? {
        title: initialStrategy.title,
        content: initialStrategy.content,
        year: initialStrategy.year || new Date().getFullYear().toString(),
        // FIX: Use nullish coalescing (?? []) to guarantee goals is an array 
        // when initialStrategy is provided but goals is null/undefined/missing.
        goals: initialStrategy.goals?.map((g: any) => ({
          id: g.id,
          title: g.title,
          targetYear: g.targetYear,
        })) ?? [],
      }
    : initialFormState;

  const [formData, setFormData] = useState<FormStrategy>(initialData);
   
  // --- Handlers ---
  
  // 1. Handle changes in top-level Strategy fields
  const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. Handle changes in nested Goal fields
  const handleGoalChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // prev.goals is guaranteed to be an array now
      goals: prev.goals.map(goal => 
        goal.id === id ? { ...goal, [name]: name === 'targetYear' ? parseInt(value) || 0 : value } : goal
      ),
    }));
  };

  // 3. Add a new Goal block
  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      // prev.goals is guaranteed to be an array now
      goals: [
        ...prev.goals,
        { id: Date.now().toString(), title: '', targetYear: new Date().getFullYear() + 3 },
      ],
    }));
  };
  
  // 4. Submission Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = !!initialStrategy;
    const method = isEditing ? 'PUT' : 'POST';
    const strategyId = isEditing ? initialStrategy.id : '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; 
    
    const url = isEditing 
        ? `${baseUrl}/api/strategies/${strategyId}` 
        : `${baseUrl}/api/strategies`;           

    const payload = {
        ...formData,
        authorId: authorId, 
        // formData.goals is guaranteed to be an array now
        goals: formData.goals.map(({ id: _, ...rest }) => rest), 
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        setIsLoading(false);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} strategy.`);
        }

        const result = await response.json();
        toast.message(`Strategy ID: ${result.id} successfully ${isEditing ? 'updated' : 'created'}! 🎉`)

        router.push('/strategies');
        
    } catch (error) {
        toast.message(`Submission Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)

        console.error("Submission failed:", error);
       setIsLoading(false);
    }
  };

   const removeGoal = (id: string) => {
    // Prevent removing the last goal
    if (formData.goals.length <= 1) {
        toast.warning("You must have at least one goal in your strategy.");
        return;
    }

    setFormData(prev => ({
        ...prev,
        goals: prev.goals.filter(goal => goal.id !== id),
    }));
  };

 return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-2xl my-4 sm:my-10">
      <div className=' flex row sm:flex col'>
            <Link href={"/strategies"}>
              <span>Go back to Strategies</span>
            </Link>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-indigo-700 border-b pb-4 border-gray-100">
                    {initialStrategy ? '✏️ Edit Draft Strategy' : '🚀 New Strategy Proposal (M1.1 DRAFT)'}
                  </h2>
            
      </div>
      {/* 1. Strategy Core Fields */}
      <div className="space-y-6 mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-600"/> 1. Core Proposal Details
        </h3>
        
        {/* Input: Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1">Proposal Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleStrategyChange}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
        </div>

        {/* Input: Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-1">Detailed Content & Analysis</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleStrategyChange}
            required
            rows={6}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
        </div>

        {/* Input: Overall Strategy Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-bold text-gray-700 mb-1">Strategy Target Year</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleStrategyChange}
            required
            className="mt-1 block w-full sm:w-1/3 rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
        </div>
      </div>
      
      {/* 2. Strategy Goals (RBM) */}
      <div className="space-y-6 mb-8 p-4 sm:p-6 border border-indigo-300 rounded-lg bg-indigo-50 shadow-lg">
        <h3 className="text-xl sm:text-2xl font-semibold text-indigo-800 flex items-center gap-2">
            <Flag className="w-5 h-5"/> 2. RBM Goals (Long-Term Impact)
        </h3>
        <p className="text-sm text-indigo-600">Define the measurable, long-term impacts your strategy aims to achieve. You must have at least one goal.</p>

        {formData.goals.map((goal, index) => (
          <div key={goal.id} className="p-4 border border-indigo-200 rounded-xl bg-white shadow-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h4 className="font-bold text-lg text-indigo-700">Goal {index + 1}</h4>
                {/* Remove Button */}
                <button 
                    type="button" 
                    onClick={() => removeGoal(goal.id)} 
                    className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Goal"
                    disabled={formData.goals.length <= 1 || isLoading}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Input: Goal Title */}
                <div className="sm:col-span-2">
                  <label htmlFor={`goal-title-${goal.id}`} className="block text-sm font-medium text-gray-700 mb-1">Goal Title/Description</label>
                  <input
                    type="text"
                    id={`goal-title-${goal.id}`}
                    name="title"
                    value={goal.title}
                    onChange={(e) => handleGoalChange(goal.id, e)}
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                  />
                </div>
            
                {/* Input: Goal Target Year */}
                <div className="sm:col-span-1">
                  <label htmlFor={`goal-year-${goal.id}`} className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                  <input
                    type="number"
                    id={`goal-year-${goal.id}`}
                    name="targetYear"
                    value={goal.targetYear}
                    onChange={(e) => handleGoalChange(goal.id, e)}
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-50"
                  />
                </div>
            </div>
          </div>
        ))}
        
        {/* Add Goal Button */}
        <button 
          type="button" 
          onClick={addGoal} 
          disabled={isLoading}
          className="mt-4 flex items-center gap-1.5 py-2 px-4 text-indigo-700 bg-indigo-200 rounded-full hover:bg-indigo-300 transition duration-150 font-semibold text-sm shadow-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Another Goal
        </button>
      </div>
      
      {/* 3. Submission */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center gap-2 disabled:bg-indigo-400"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin"/> Processing...
                </>
            ) : (
                <>
                    <Save className="w-5 h-5"/> 
                    {initialStrategy ? 'Save Changes to Draft' : 'Submit Concept (M1.1 DRAFT)'}
                </>
            )}
        </button>
      </div>
    </form>
  );
}