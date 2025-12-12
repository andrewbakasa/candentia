import { CustomerFormData } from '@/app/ar/types/finance';
import React, { useState } from 'react';
//import { CustomerFormData } from '../../types/types';

const INITIAL_STATE: CustomerFormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Net 30', // Default value
};

interface CustomerFormProps {
    onSuccess: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState<CustomerFormData>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/ar/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send data as JSON
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                // Attempt to read server error message
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            // Success handling
            console.log('Customer created successfully!');
            setFormData(INITIAL_STATE);
            onSuccess(); // Call success callback
            alert('Customer created successfully!');

        } catch (err) {
            console.error('Customer creation failed:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold">New Customer Creation</h2>

            {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
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

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            
            {/* Phone & Address (Simplified) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input 
                        type="text" 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
            </div>

            {/* Tax ID & Payment Terms */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">Tax ID</label>
                    <input 
                        type="text" 
                        id="taxId" 
                        name="taxId" 
                        value={formData.taxId} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                        id="paymentTerms"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? 'Creating...' : 'Create Customer'}
            </button>
        </form>
    );
};