// components/VisitMetricsDisplay.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface VisitMetrics {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalLastMonth: number;
}

const VisitMetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState<VisitMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/visitors/metric');
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

  if (loading) return <p>Loading visit metrics...</p>;
  if (error) return <p style={{ color: 'red' }}>Error fetching metrics: {error}</p>;
  if (!metrics) return null;

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd' }}>
      <h3>📊 Visit Metrics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <p>Total Today: **{metrics.totalToday}**</p>
        <p>Total This Week: **{metrics.totalThisWeek}**</p>
        <p>Total This Month: **{metrics.totalThisMonth}**</p>
        <p>Total Last Month: **{metrics.totalLastMonth}**</p>
      </div>
    </div>
  );
};

export default VisitMetricsDisplay;