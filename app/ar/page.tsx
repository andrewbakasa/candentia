'use client';

import Link from 'next/link';
import React from 'react';
import { BarChart2, DollarSign, FileText, Users, ShoppingCart } from 'lucide-react'; // Import Lucide Icons

// --- 1. Define the structure for each dashboard link/card ---
interface DashboardLink {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode; // Using ReactNode for better icon integration
    color: string; // Tailwind color class for base color
    develop_stage: number; // Development stage as a number (0-100)
}

// --- 2. Corrected and Enhanced Dashboard Data ---
const DASHBOARD_LINKS: DashboardLink[] = [
    {
        title: "Customer Management",
        description: "View, add, and manage all client accounts and contact details.",
        href: "/ar/customers",
        icon: <Users className="w-8 h-8" />,
        color: "indigo", // Base color (e.g., used for bg-indigo-500)
        develop_stage: 60
    },
    {
        title: "Product Inventory",
        description: "Manage product stock, unit costs, SKUs, and track current inventory levels.",
        href: "/ar/products",
        icon: <ShoppingCart className="w-8 h-8" />,
        color: "green",
        develop_stage: 60
    },
    
    {
        title: "Quotations & Proposals",
        description: "Generate sales proposals and convert accepted quotes into official invoices.",
        href: "/ar/quotations",
        icon: <FileText className="w-8 h-8" />,
        color: "blue",
        develop_stage: 1
    },
    {
        title: "Invoices & Billing",
        description: "Create new invoices, track outstanding balances, and manage payments.",
        href: "/ar/invoices",
        icon: <DollarSign className="w-8 h-8" />,
        color: "red",
        develop_stage: 90
    },
];

// Helper to determine text color for the progress bar based on background
const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-yellow-400';
    if (percentage >= 50) return 'bg-orange-400';
    return 'bg-red-400';
};

export default function ARDashboardPage() {
    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900">
                Accounts Receivable Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-10">
                Welcome to your central management panel. Select a module to begin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DASHBOARD_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="group block">
                        <div 
                            className={`relative p-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform group-hover:scale-[1.02] cursor-pointer 
                                bg-${link.color}-600 group-hover:bg-${link.color}-700 text-white flex flex-col h-full`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h2 className="text-2xl font-semibold">{link.title}</h2>
                                <div className="text-4xl">{link.icon}</div>
                            </div>
                            
                            <p className="text-sm opacity-90 mb-4 flex-grow">{link.description}</p>
                            
                            {/* --- DEVELOPMENT STAGE PROGRESS BAR --- */}
                            <div className="mt-auto">
                                <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-90">
                                    Development Stage: 
                                    <span className={`ml-2 font-bold ${link.develop_stage < 100 ? 'text-white' : 'text-green-300'}`}>
                                        {link.develop_stage}%
                                    </span>
                                </p>
                                <div className="w-full bg-white/30 rounded-full h-2">
                                    <div 
                                        className={`${getProgressBarColor(link.develop_stage)} h-2 rounded-full`}
                                        style={{ width: `${link.develop_stage}%` }}
                                    ></div>
                                </div>
                                {link.develop_stage < 100 && (
                                    <p className="text-xs mt-1 italic opacity-70">
                                        *Some features may be incomplete.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                AR Management System - Built on Next.js & Prisma
            </footer>
        </div>
    );
}