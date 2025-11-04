
"use client";

import React, { useEffect, useState } from 'react';

// Using the correct API endpoint from the previous conversation
const API_ENDPOINT = '/api/visitors/metric'; 

interface VisitMetrics {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalLastMonth: number;
}

// --- Reusable Metric Card Component ---
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode; // For dynamic icons
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-blue-500 transition duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-4">
    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-3xl font-extrabold text-gray-900">
        {value.toLocaleString()}
      </h4>
    </div>
  </div>
);

// --- Main Metrics Display Component ---
const VisitMetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState<VisitMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setMetrics(data.metrics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // --- Loading, Error, and Empty States ---

  if (loading) return (
    <div className="p-6 text-center text-blue-600 bg-blue-50 rounded-xl shadow-inner">
      <svg className="animate-spin h-5 w-5 mr-3 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      Loading visitor data...
    </div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-700 bg-red-100 rounded-xl shadow-inner border border-red-300">
      Error fetching metrics: **{error}**
    </div>
  );

  if (!metrics) return (
    <div className="p-6 text-center text-gray-500 bg-gray-100 rounded-xl shadow-inner">
      No metrics data available.
    </div>
  );

  // --- Main Display ---

  // Simple icon component for visual appeal
  const Icon = ({ path }: { path: string }) => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path></svg>
  );

  const metricsData = [
    { 
      title: "Total Today", 
      value: metrics.totalToday, 
      icon: <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> 
    },
    { 
      title: "This Week", 
      value: metrics.totalThisWeek, 
      icon: <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> 
    },
    { 
      title: "This Month", 
      value: metrics.totalThisMonth, 
      icon: <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h14z" /> 
    },
    { 
      title: "Last Month", 
      value: metrics.totalLastMonth, 
      icon: <Icon path="M7 16V9m4 7V9m4 7V9m-7 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /> 
    },
  ];


  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow-2xl max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-3">
        📈 Website Traffic Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric) => (
          <MetricCard 
            key={metric.title}
            title={metric.title} 
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default VisitMetricsDisplay;





