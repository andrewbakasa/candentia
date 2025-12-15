'use client';

import React from 'react';
import Link from 'next/link';
// Import necessary icons
import { 
    PlusCircleIcon, 
    FileTextIcon, 
    ClockIcon, 
    ArrowUpRightIcon, 
    SettingsIcon,
    DollarSignIcon,
    TrendingUpIcon,
    ArchiveIcon
} from 'lucide-react'; 

// --- 1. Stat Card Component (Reusable UI element) ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
        <div className={`flex items-center justify-between text-${color}-600 mb-3`}>
            {icon}
            <p className="text-sm font-medium uppercase text-gray-500">{title}</p>
        </div>
        <p className="text-4xl font-extrabold text-gray-900 mb-2">{value}</p>
        <p className={`text-xs text-gray-500 font-medium`}>{description}</p>
    </div>
);

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
    // --- Placeholder Data ---
    const placeholderStats = [
        { 
            title: 'Active Quotes', 
            value: '45', 
            icon: <FileTextIcon className="w-8 h-8" />, 
            color: 'indigo', 
            description: 'Currently open and pending client response.' 
        },
        { 
            title: 'Quotes Value', 
            value: '$125,500', 
            icon: <DollarSignIcon className="w-8 h-8" />, 
            color: 'green', 
            description: 'Total estimated value of all active quotes.' 
        },
        { 
            title: 'Conversion Rate', 
            value: '22.5%', 
            icon: <TrendingUpIcon className="w-8 h-8" />, 
            color: 'blue', 
            description: 'Quotes converted to Invoices over the last 30 days.' 
        },
        { 
            title: 'Expiring Soon', 
            value: '7', 
            icon: <ClockIcon className="w-8 h-8" />, 
            color: 'red', 
            description: 'Quotes expiring within the next 7 days.' 
        },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Quotations Dashboard
                </h1>
                
                {/* Primary Action Button */}
                <Link href="/ar/quotations/create">
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Create New Quotation
                    </button>
                </Link>
            </header>
            

            {/* Section 1: Key Metrics Overview */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Key Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {placeholderStats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>
            </section>
            
            {/* Section 2: Data Visualization */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Conversion Trends</h2>
                <div className="bg-white p-6 rounded-xl shadow-lg h-80 flex items-center justify-center text-gray-500">
                    {/* Placeholder for a Chart/Graph component */}
                    Bar/Line Chart: Quote Status Over Time (e.g., Draft vs. Sent vs. Accepted)
                    
                </div>
            </section>

            {/* Section 3: Quick Access Modules */}
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