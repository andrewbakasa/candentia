import { ProductFormData } from '@/app/ar/types/finance';
import React, { useState } from 'react';
//import { ProductFormData } from '../../types/types';

const INITIAL_STATE: ProductFormData = {
    sku: '',
    name: '',
    stockQuantity: 0, 
    unitCost: 0,
};

interface ProductFormProps {
    onSuccess: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState<ProductFormData>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        
        // Handle number inputs by parsing the value, falling back to 0 or original value on invalid input
        let updatedValue: string | number;
        if (type === 'number') {
            updatedValue = parseFloat(value);
            // Optional: If the user deletes the input, revert to a string or 0 for usability
            if (value === '') updatedValue = ''; 
        } else {
            updatedValue = value;
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: updatedValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation for mandatory numeric fields
        const payload = {
            ...formData,
            // Ensure numbers are treated correctly, handling potential empty strings from user input
            stockQuantity: typeof formData.stockQuantity === 'number' 
                           ? formData.stockQuantity 
                           : parseFloat(String(formData.stockQuantity) || '0'),
            unitCost: typeof formData.unitCost === 'number' 
                      ? formData.unitCost 
                      : parseFloat(String(formData.unitCost) || '0'),
        };

        try {
            const response = await fetch('/ar/api/products', { // Assuming you set up the POST route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            console.log('Product created successfully!');
            setFormData(INITIAL_STATE);
            onSuccess();
            alert('Product created successfully!');

        } catch (err) {
            console.error('Product creation failed:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold">New Product Creation</h2>

            {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

            {/* Name and SKU */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Stock Keeping Unit)</label>
                    <input 
                        type="text" 
                        id="sku" 
                        name="sku" 
                        value={formData.sku} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
            </div>

            {/* Stock Quantity and Unit Cost */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
                    <input 
                        type="number" 
                        id="stockQuantity" 
                        name="stockQuantity" 
                        value={formData.stockQuantity} 
                        onChange={handleChange} 
                        min="0"
                        step="1"
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
                    <input 
                        type="number" 
                        id="unitCost" 
                        name="unitCost" 
                        value={formData.unitCost} 
                        onChange={handleChange} 
                        min="0.01"
                        step="0.01"
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Creating...' : 'Create Product'}
            </button>
        </form>
    );
};