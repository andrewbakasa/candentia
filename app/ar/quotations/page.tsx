'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
// Import necessary icons
import { 
    PlusCircleIcon, 
    FileTextIcon, 
    ClockIcon, 
    TrendingUpIcon, 
    SettingsIcon,
    DollarSignIcon,
    ArchiveIcon,
    ChevronLeft,
    Loader2 // Loading icon
} from 'lucide-react'; 

// --- Hypothetical Types for Metrics ---
interface QuotationMetrics {
    activeCount: number;
    activeValue: number;
    conversionRate: number; // Stored as a decimal (e.g., 0.225)
    expiringSoonCount: number;
}

// --- 0. Corrected Hook for Data Fetching ---
const useQuotationMetrics = (): { metrics: QuotationMetrics | null, loading: boolean, error: string | null } => {
    const [metrics, setMetrics] = useState<QuotationMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- CORRECTED REAL API CALL ---
                const response = await fetch('/ar/api/quotations/metrics');
                
                if (!response.ok) {
                    // Check for HTTP errors (4xx, 5xx)
                    const errorData = await response.json().catch(() => ({ error: 'Unknown API Error' }));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                
                // Parse the JSON response into the QuotationMetrics type
                const realData: QuotationMetrics = await response.json();
                console.log('realData',realData)
                
                setMetrics(realData);

            } catch (err) {
                console.error("Failed to fetch metrics:", err);
                // Cast error to Error to safely access message
                setError((err instanceof Error) ? err.message : "Failed to load quotation metrics.");
                setMetrics(null);
            } finally {
                // Remove the simulated delay
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []); // Empty dependency array ensures it runs only once

    return { metrics, loading, error };
};
// -------------------------------------------------------------------


// --- 1. Stat Card Component (Reusable UI element) ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    isLoading?: boolean; // Added to handle the loading state rendering
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description, isLoading }) => {
    // RENDER A LOADING SKELETON IF isLoading IS TRUE
    if (isLoading) {
        return (
            <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
            <div className={`flex items-center justify-between text-${color}-600 mb-3`}>
                {icon}
                <p className="text-sm font-medium uppercase text-gray-500">{title}</p>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mb-2">{value}</p>
            <p className={`text-xs text-gray-500 font-medium`}>{description}</p>
        </div>
    );
};

// --- 2. Module Card Component (Reusable UI element) ---
interface ModuleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, href, color }) => (
    <Link 
        href={href} 
        className={`flex flex-col items-start p-6 bg-white rounded-xl shadow-md border-l-4 border-${color}-500 transition duration-300 hover:shadow-lg hover:border-${color}-700`}
    >
        <div className={`text-${color}-600 mb-3`}>
            {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
    </Link>
);


export default function ARQuotationsDashboardPage() {
    // --- Hook to fetch real data ---
    const { metrics, loading, error } = useQuotationMetrics();

    // --- Dynamic Data Mapping Function (returns a consistent array of StatCardProps) ---
    const getStatCards = useCallback((metricsData: QuotationMetrics | null, isLoading: boolean, fetchError: string | null): StatCardProps[] => {
        // --- 1. Loading State ---
        if (isLoading) {
            return [
                { title: 'Active Quotes', value: '...', icon: <FileTextIcon className="w-8 h-8" />, color: 'gray', description: 'Fetching data...', isLoading: true },
                { title: 'Quotes Value', value: '...', icon: <DollarSignIcon className="w-8 h-8" />, color: 'gray', description: 'Fetching data...', isLoading: true },
                { title: 'Conversion Rate', value: '...', icon: <TrendingUpIcon className="w-8 h-8" />, color: 'gray', description: 'Fetching data...', isLoading: true },
                { title: 'Expiring Soon', value: '...', icon: <ClockIcon className="w-8 h-8" />, color: 'gray', description: 'Fetching data...', isLoading: true },
            ];
        }

        // --- 2. Error/Fallback State ---
        if (fetchError || !metricsData) {
            const fallbackValue = fetchError ? 'ERROR' : 'N/A';
            const description = fetchError || 'Data not available.';
            return [
                { title: 'Active Quotes', value: fallbackValue, icon: <FileTextIcon className="w-8 h-8" />, color: 'red', description: description },
                { title: 'Quotes Value', value: fallbackValue, icon: <DollarSignIcon className="w-8 h-8" />, color: 'red', description: description },
                { title: 'Conversion Rate', value: fallbackValue, icon: <TrendingUpIcon className="w-8 h-8" />, color: 'red', description: description },
                { title: 'Expiring Soon', value: fallbackValue, icon: <ClockIcon className="w-8 h-8" />, color: 'red', description: description },
            ];
        }

        // --- 3. Success State (Use real fetched data) ---
        return [
            { 
                title: 'Active Quotes', 
                value: metricsData.activeCount.toLocaleString(), 
                icon: <FileTextIcon className="w-8 h-8" />, 
                color: 'indigo', 
                description: 'Currently open and pending client response.' 
            },
            { 
                title: 'Quotes Value', 
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(metricsData.activeValue), 
                icon: <DollarSignIcon className="w-8 h-8" />, 
                color: 'green', 
                description: 'Total estimated value of all active quotes.' 
            },
            { 
                title: 'Conversion Rate', 
                value: (metricsData.conversionRate * 100).toFixed(1) + '%', 
                icon: <TrendingUpIcon className="w-8 h-8" />, 
                color: 'blue', 
                description: 'Quotes converted to Invoices over the last 30 days.' 
            },
            { 
                title: 'Expiring Soon', 
                value: metricsData.expiringSoonCount.toLocaleString(), 
                icon: <ClockIcon className="w-8 h-8" />, 
                color: 'red', 
                description: 'Quotes expiring within the next 7 days.' 
            },
        ];
    }, []);

    const statsToRender = getStatCards(metrics, loading, error);

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
            
            {/* --- IMPROVED RESPONSIVE HEADER --- */}
            <div className="flex flex-col mb-6 sm:mb-8">
                
                {/* 1. TOP ROW: Back to Dashboard Link */}
                <div className="mb-3"> 
                    <Link 
                        href="/ar" 
                        className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 -ml-1 rounded-full flex items-center w-fit"
                        aria-label="Return to AR Dashboard"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                </div>

                {/* 2. BOTTOM ROW: Title and Action Button */}
                <header className="flex justify-between items-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Quotations Dashboard
                    </h1>
                    
                    {/* Primary Action Button */}
                    <Link href="/ar/quotations/create">
                        <button 
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 text-sm sm:text-base whitespace-nowrap"
                            disabled={loading} // Disable while loading
                        >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Create New Quotation
                        </button>
                    </Link>
                </header>
            </div>
            
            {/* Section 1: Key Metrics Overview */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Key Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Map the consistent array of StatCardProps */}
                    {statsToRender.map((stat, index) => (
                        <StatCard key={stat.title + index} {...stat} />
                    ))}
                </div>
            </section>
            
            {/* Section 2: Data Visualization */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Conversion Trends</h2>
                <div className="bg-white p-6 rounded-xl shadow-lg h-80 flex items-center justify-center text-gray-500">
                    {/* Display loading/error status inside the chart placeholder */}
                    {loading ? (
                         <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    ) : error ? (
                        <p className='text-red-500'>Error loading chart data: {error}</p>
                    ) : (
                        <p>Bar/Line Chart: Quote Status Over Time (e.g., Draft vs. Sent vs. Accepted)</p>
                    )}
                </div>
            </section>

            {/* Section 3: Quick Access Modules (Static links) */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <ModuleCard
                        title="View All Quotations"
                        description="Browse, filter, and search through the complete list of all quotes."
                        icon={<ArchiveIcon className="w-6 h-6" />}
                        href="/ar/quotations/list"
                        color="indigo"
                    />

                    <ModuleCard
                        title="Customers & Contacts"
                        description="Manage customer profiles and contact details associated with quotes."
                        icon={<FileTextIcon className="w-6 h-6" />}
                        href="/ar/customers"
                        color="teal"
                    />

                    <ModuleCard
                        title="Quotation Settings"
                        description="Configure default terms, numbering schemes, and tax settings."
                        icon={<SettingsIcon className="w-6 h-6" />}
                        href="/ar/settings/quotations"
                        color="purple"
                    />
                </div>
            </section>


            <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                &copy; 2025 Accounts Receivable Management.
            </footer>
        </div>
    );
}