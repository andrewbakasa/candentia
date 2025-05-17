'use client';
import React from 'react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Reusable Input Component
export const FormInput: React.FC<{
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    error?: string;
    type?: string;
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    textarea?: boolean;
}> = ({ id, name, label, placeholder, value, onChange, error, type = 'text', onKeyUp, textarea }) => {
    const InputComponent = textarea ? Textarea : Input;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <InputComponent
                id={id}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                type={type}
                onKeyUp={onKeyUp}
                className={cn(
                    error && "border-red-500 focus:ring-red-500",
                    "mt-1 w-full"
                )}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

// Reusable Select Component
export const FormSelect: React.FC<{
    id: string;
    name: string;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onValueChange: (value: string) => void;
    error?: string;
}> = ({ id, name, label, options, value, onValueChange, error }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <Select onValueChange={onValueChange} value={value}>
                <SelectTrigger id={id} name={name} className={cn(
                    error && "border-red-500 focus:ring-red-500",
                    "mt-1 w-full"
                )}>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};
