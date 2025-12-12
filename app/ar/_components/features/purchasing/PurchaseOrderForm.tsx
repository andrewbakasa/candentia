// src/components/features/purchasing/PurchaseOrderForm.tsx
'use client';

import React, { useState } from 'react';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/app/ar/types/finance';

interface PurchaseOrderFormData {
    supplierId: string;
    orderDate: string;
    expectedReceipt: string;
    items: { productId: string; quantity: number; unitPrice: number; }[];
}
//Pu//rchaseOrder
const PurchaseOrderForm: React.FC = () => {
    const [formData, setFormData] = useState<PurchaseOrderFormData>({
        supplierId: '',
        orderDate: new Date().toISOString().substring(0, 10),
        expectedReceipt: '',
        items: [{ productId: 'P001', quantity: 10, unitPrice: 50.00 }] // Example item
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 1. API Call: POST /api/purchase-orders
        // 2. Handle response (e.g., redirect to PO detail page)
        console.log('Submitting PO:', formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold border-b pb-2">📦 New Purchase Order</h2>

            {/* Supplier & Dates */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    {/* In a real app, this would be a dropdown populated from a /api/suppliers endpoint */}
                    <input type="text" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Supplier ID" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date</label>
                    <input type="date" value={formData.orderDate} onChange={(e) => setFormData({...formData, orderDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Receipt</label>
                    <input type="date" value={formData.expectedReceipt} onChange={(e) => setFormData({...formData, expectedReceipt: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
            
            {/* Items Section (Simplified) */}
            <h3 className="text-lg font-medium pt-4">Order Items</h3>
            <div className="border border-gray-200 rounded-lg">
                {/* Dynamically rendered item rows would go here */}
                <div className="p-4 bg-gray-50 border-b">
                    Item: **Product Name (SKU)** | Quantity: **10** | Unit Price: **$50.00**
                </div>
                {/* ... Add button for new item ... */}
            </div>

            <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Create Purchase Order (DRAFT)
            </button>
        </form>
    );
};

export default PurchaseOrderForm;