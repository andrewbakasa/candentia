'use client'
import React from 'react';
// We assume the icons are available for reuse
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare, Clipboard } from 'lucide-react'; 
// Import enums from client if available (assuming these Enums are still needed for forms)
import { ActivityStatus, ActivityType } from '@prisma/client'; 
import { StrategyActivityModel, StrategyOutputModel } from './output';
// Import the new model interfaces from the file provided by the user
//import { StrategyOutputModel, StrategyActivityModel } from './strategy_types'; 

// =======================================================
// --- Strategy Activity Model (Action Plan Task) ---
// Note: Extending the base StrategyActivityModel from strategy_types.ts 
// to ensure client-side consistency with the data coming from the API.
// =======================================================
export interface StrategyActivityModelClient extends StrategyActivityModel {
    // All fields from StrategyActivityModel are kept, with string types for Dates
    id: string;
    title: string;
    description: string | null;
    outputId: string; 
    
    createdAt: string; 
    updatedAt: string;
    
    startDate: string | null; // New field
    dueDate: string | null;
    completionDate: string | null; // Replaces 'completedAt'
    
   // status: ActivityStatus; // Enum status
    progressPercent: number; // New field
}

// Data type for submitting a new/updated activity, omitting auto-generated and relational fields
// Now based on StrategyActivityModelClient
export type ActivityFormDataType = Omit<StrategyActivityModelClient, 
    'id' 
    | 'outputId' 
    | 'createdAt' 
    | 'updatedAt'
>;

// --- Component Props ---

export interface InputFieldProps {
    label: string;
    name: string;
    type?: string;
    value: string | number; // Value can be string or number (for progressPercent)
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    icon: React.ElementType;
    required?: boolean;
}

export interface SelectFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    icon: React.ElementType;
}

export interface AddActivityFormProps {
    onAdd: (newActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
    // Assuming you might need the list of possible activity types for the form
    availableActivityTypes: ActivityType[]; 
}

export interface StrategyOutputDetailProps {
    // ContractDetailProps -> StrategyOutputDetailProps. ContractModel -> StrategyOutputModel.
    output: StrategyOutputModel; 
}

export interface EditActivityFormProps {
    // ContractActivityModel -> StrategyActivityModelClient
    activity: StrategyActivityModelClient; 
    onUpdate: (activityId: string, updatedActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}