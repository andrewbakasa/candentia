'use client';

import Link from 'next/link';
import React from 'react';

// Define the structure for each dashboard link/card
interface DashboardLink {
    title: string;
    description: string;
    href: string;
    icon: string; // Using a simple emoji/character for visualization
    color: string; // Tailwind color class for styling
}

const DASHBOARD_LINKS: DashboardLink[] = [
    {
        title: "Customer Management",
        description: "View, add, and manage all client accounts and contact details.",
        href: "/ar/customers",
        icon: "👥",
        color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
        title: "Product Inventory",
        description: "Manage product stock, unit costs, SKUs, and track current inventory levels.",
        href: "/ar/products",
        icon: "📦",
        color: "bg-green-500 hover:bg-green-600",
    },
    {
        title: "Invoices & Billing",
        description: "Create new invoices, track outstanding balances, and manage payments.",
        href: "/ar/invoices",
        icon: "📄",
        color: "bg-red-500 hover:bg-red-600",
    },
    {
        title: "Quotations & Proposals",
        description: "Generate sales proposals and convert accepted quotes into official invoices.",
        href: "/ar/quotations",
        icon: "📋",
        color: "bg-blue-500 hover:bg-blue-600",
    },
];

export default function ARDashboardPage() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900">
                Accounts Receivable Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-10">
                Welcome to your central management panel. Select a module to begin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DASHBOARD_LINKS.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <div 
                            className={`p-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-[1.02] cursor-pointer 
                                ${link.color} text-white`}
                        >
                            <div className="text-4xl mb-3">{link.icon}</div>
                            <h2 className="text-2xl font-semibold mb-2">{link.title}</h2>
                            <p className="text-sm opacity-90">{link.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Visualize application flow with a diagram  */}

            <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                AR Management System - Built on Next.js & Prisma
            </footer>
        </div>
    );
}