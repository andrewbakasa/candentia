// app/strategy/_components/StrategyActionHeader.tsx

'use client';

import React, { useState } from 'react';
import StrategyForm from './StrategyForm';
//import StrategyForm from '@/components/StrategyForm'; // Your form component

export default function StrategyActionHeader({ currentUser }: { currentUser: any }) {
  const [showForm, setShowForm] = useState(false);
  
  // Assuming the user object has an 'id' field
  const authorId = currentUser?.id; 

  return (
    <>
      {/* Header and Toggle Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-800">
          Strategy Portfolio 📊
        </h1>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 ${
            showForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          // Disable button if no user ID is available (important for authentication)
          disabled={!authorId} 
        >
          {showForm ? '❌ Cancel Submission' : '➕ Submit New Concept'}
        </button>
      </div>

      {/* Conditional Form Rendering */}
      {showForm && (
        <div className="mb-10 p-6 border border-indigo-200 rounded-xl bg-indigo-50">
          <StrategyForm 
            authorId={authorId} 
            // We need to pass the author ID for submission
          />
        </div>
      )}
    </>
  );
}