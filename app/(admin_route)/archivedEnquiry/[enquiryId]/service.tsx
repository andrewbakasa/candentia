// src/services/boqService.ts
import * as z from 'zod';
import { toast } from 'sonner';
import Router from 'next/router';

// Re-define or import necessary types to ensure this file is self-contained or explicitly dependent
interface Project {
    id: string;
    name: string;
    projectCode: string;
    description: string;
    client: string;
}

interface ClientSideBOQ {
    id: string;
    projectId: string;
    name: string;
    boqNumber: string;
    cost_update_status: boolean;
    level_update_status: boolean;
    description: string;
    version: string;
    project: Project;
    boqToBoqItems: {
        boqitem: {
            id: string;
            itemCode: string;
            name: string;
            description: string;
            unitOfMeasure: string;
            quantity: number;
            unitprice: number;
            amount: number;
            category: string;
            subCategory: string | null;
            level: number;
            parentId: string | null;
        };
    }[];
    cost?: number | null;
}

const boqFormSchema = z.object({
    projectId: z.string().min(1, { message: 'Project ID is required' }),
    name: z.string().min(2, { message: 'BOQ name must be at least 2 characters' }),
    boqNumber: z.string().min(2, { message: 'BOQ number must be at least 2 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
    version: z.string().min(1, { message: 'Version is required' }),
});

type BOQFormData = z.infer<typeof boqFormSchema>;

export const fetchAllBOQs = async (): Promise<{ projects: Project[], boqs: ClientSideBOQ[] }> => {
    try {
        const [projectsResponse, boqsResponse] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/boqs'),
        ]);

        if (!projectsResponse.ok) {
            throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
        }
        const projectsData: Project[] = await projectsResponse.json();

        if (!boqsResponse.ok) {
            throw new Error(`Failed to fetch BOQs: ${boqsResponse.statusText}`);
        }
        const boqsData: ClientSideBOQ[] = await boqsResponse.json();
        return { projects: projectsData, boqs: boqsData };
    } catch (err: any) {
        console.error('Error fetching BOQs data:', err);
        toast.error(`Failed to fetch data: ${err.message}`);
        throw err; // Re-throw to allow component to handle loading/error states
    }
};

export const addOrEditBOQ = async (data: BOQFormData, id: string | null = null): Promise<void> => {
    try {
        const method = id ? 'POST' : 'POST'; // Assuming POST for both create and update for now
        const url = id ? `/api/boq-update/${id}` : '/api/boqs';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${id ? 'update' : 'add'} BOQ`);
        }
        toast.success(`BOQ ${id ? 'updated' : 'added'} successfully`);
    } catch (err: any) {
        console.error(`Error ${id ? 'updating' : 'adding'} BOQ:`, err);
        toast.error(err.message || `Failed to ${id ? 'update' : 'add'} BOQ`);
        throw err;
    }
};

export const deleteMail = async (mailId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/enquiries/${mailId}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mailId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete Mail');
        }
        toast.success(`Deleted Mail: ${mailId}`);
        
    } catch (err: any) {
        console.error('Error deleting Mail:', err);
        toast.error(err.message || 'Failed to delete Mail');
        throw err;
    }
};

export const restoreMail = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`/api/enquiries/${id}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to restore mail');
        }
        toast.success('Mail restored successfully');
    } catch (err: any) {
        console.error('Error restoring mail:', err);
        toast.error(err.message || 'Failed to restore mail');
        throw err;
    }
};

export const readMail = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`/api/enquiries/${id}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to read mail');
        }
        toast.success('Mail read successfully');
    } catch (err: any) {
        console.error('Error reading mail:', err);
        toast.error(err.message || 'Failed to read mail');
        throw err;
    }
};

export const updateBOQCost = async (boqId: string, formatCurrency: (value: number | null | undefined) => string): Promise<number> => {
    try {
        const calculateCostResponse = await fetch(`/api/boqs/${boqId}/calculate-cost`);
        if (!calculateCostResponse.ok) {
            const errorData = await calculateCostResponse.json();
            throw new Error(errorData.message || 'Failed to fetch BOQ cost from API');
        }
        const { totalCost: calculatedCost } = await calculateCostResponse.json();

        if (calculatedCost === null) {
            toast.info(`Could not calculate cost for BOQ ${boqId}. It might not exist or has no items.`);
            return 0; // Or throw a specific error, depending on desired behavior
        }

        const updateCostResponse = await fetch(`/api/boq-update/${boqId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cost: calculatedCost, cost_update_status: true }), // Ensure status is sent
        });

        if (!updateCostResponse.ok) {
            const errorData = await updateCostResponse.json();
            throw new Error(errorData.message || 'Failed to save updated BOQ cost to database');
        }

        toast.success(`Total cost for BOQ updated successfully to ${formatCurrency(calculatedCost)}`);
        return calculatedCost;
    } catch (err: any) {
        console.error('Error updating BOQ cost:', err);
        toast.error(err.message || 'Failed to update BOQ cost.');
        throw err;
    }
};

export const updateBOQLevels = async (boqId: string, boqName: string): Promise<ClientSideBOQ['boqToBoqItems']> => {
    try {
        toast.loading(`Updating levels for BOQ: ${boqName}...`);
        const response = await fetch(`/api/boqs/${boqId}/update-levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update levels for BOQ: ${boqName}`);
        }

        const result = await response.json();
        toast.dismiss();
        toast.success(result.message);

        if (result.updatedBoq && result.updatedBoq.boqToBoqItems) {
            return result.updatedBoq.boqToBoqItems;
        } else {
            console.warn("Backend did not return updated BOQ data after level update.");
            return []; // Return empty array or original items if not returned by backend
        }
    } catch (err: any) {
        toast.dismiss();
        console.error('Error updating BOQ item levels:', err);
        toast.error(err.message || 'Failed to update BOQ item levels.');
        throw err;
    }
};