

 'use client'
 import React, { useState, useCallback } from 'react';
 import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare,Clipboard } from 'lucide-react';
 import { ActivityStatus, 
     ActivityType,
      ContractStatus } from '@prisma/client';
import { ContractModel } from './contract';


export interface ContractActivityModel {
     id: string;
     title: string;
     activityType: ActivityType;
     dueDate: string;  //ISO date string
     responsiblePersons: string;
     status: ActivityStatus;
     description: string | null;
     contractId: string;
     createdByUserId: string;
     createdAt: string;

     updatedAt: string;      
     completedAt?: string | null;     //  <--- Change 1: Added ? and | null
     resourceDetails?: string | null; //  <--- Change 2
     documentReferenceUrl?: string | null; // <--- Change 3
     outcomeNotes?: string | null;   //   <--- Change 4
 }
export type ActivityFormDataType = Omit<ContractActivityModel, 'id' | 'contractId' | 'createdByUserId' | 'createdAt'>;

export interface InputFieldProps {
     label: string;
     name: string;
     type?: string;
     value: string;
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
 }

export interface ContractDetailProps {
     contract: ContractModel;
 }
 
export interface EditActivityFormProps {
    activity: ContractActivityModel;
    onUpdate: (activityId: string, updatedActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}


