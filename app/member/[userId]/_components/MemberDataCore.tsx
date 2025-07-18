'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Import the separated components and schema
import MemberDataForm, { formSchema, MemberFormValues } from './MemberDataForm'; // Adjust path as needed
import MemberDataActions from './MemberDataActions'; // Adjust path as needed
import { SafeUser } from '@/app/types';

// Define available subcommittees (MUST be the same as in MemberDataForm)
const subcommittees = ["Innovation", "Finance", "Marketing", "Technical", "Business"] as const;

// Define the type for the Membership data, matching your Prisma model
// Corrected: Use typeof subcommittees[number] for strict typing of array elements
interface MembershipData {
    id: string;
    userEmail: string;
    lastName: string;
    firstName: string;
    membershipCategory: 'ORDINARY' | 'SILVER' | 'GOLD' | null; // Use actual enum types if possible
    sex: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | null; // Use actual enum types if possible
    country?: string | null;
    profession?: string | null;
    age?: number | null;
    nextOfKin?: string | null;
    interests?: string | null;
    memberExpectations?: string | null;
    pledge?: string | null;
    shares?: number | null;
    experienceOrBackground?: string | null;
    role?: string | null;
    teamCode?: string | null;
    subcommittees: (typeof subcommittees[number])[] | null; // Corrected type for subcommittees
    createdAt: string;
    updatedAt: string;
}

// Define props for the MemberData component
interface MemberDataProps {
    data: any;//MembershipData; // Use the specific MembershipData type
    currentUser: SafeUser | null;
}

const MemberData: React.FC<MemberDataProps> = ({ data, currentUser }) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Initialize react-hook-form
    const form = useForm<MemberFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            userEmail: data.userEmail || '',
            // Correctly handle enum types and default to undefined for Select components
            membershipCategory: data.membershipCategory ?? undefined,
            sex: data.sex ?? undefined,
            country: data.country || '',
            profession: data.profession || '',
            age: data.age === null ? undefined : data.age,
            nextOfKin: data.nextOfKin || '',
            interests: data.interests || '',
            memberExpectations: data.memberExpectations || '',
            pledge: data.pledge || '',
            shares: data.shares === null ? undefined : data.shares,
            experienceOrBackground: data.experienceOrBackground || '',
            role: data.role || '',
            teamCode: data.teamCode || '',
            // Ensure subcommittees are an array of the correct literal types
            subcommittees: data.subcommittees?.filter((s: any) => subcommittees.includes(s as any)) ?? [],
        },
    });

    // Effect to reset form data when 'data' prop changes (e.g., after successful update)
    useEffect(() => {
        form.reset({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            userEmail: data.userEmail || '',
            membershipCategory: data.membershipCategory ?? undefined,
            sex: data.sex ?? undefined,
            country: data.country || '',
            profession: data.profession || '',
            age: data.age === null ? undefined : data.age,
            nextOfKin: data.nextOfKin || '',
            interests: data.interests || '',
            memberExpectations: data.memberExpectations || '',
            pledge: data.pledge || '',
            shares: data.shares === null ? undefined : data.shares,
            experienceOrBackground: data.experienceOrBackground || '',
            role: data.role || '',
            teamCode: data.teamCode || '',
            // Ensure subcommittees are an array of the correct literal types
            subcommittees: data.subcommittees?.filter((s: any) => subcommittees.includes(s as any)) ?? [],
        });
    }, [data, form]);

    // Handle form submission (update)
    const onSubmit = async (values: MemberFormValues) => {
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/membership/${data.id}`, {
                method: 'POST', // Or 'PUT' if your API uses PUT for updates
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update membership');
            }

            setMessage({ type: 'success', text: 'Membership updated successfully!' });
            setIsEditing(false);
            router.refresh(); // Revalidate data on the page
        } catch (error: any) {
            console.error('Update error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to update membership.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle deleting membership data
    const handleDelete = async () => {
        // Using a custom modal/dialog is recommended instead of window.confirm for better UX
        // For now, keeping window.confirm as per original code, but note this best practice.
        if (!window.confirm('Are you sure you want to delete this membership? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/membership/${data.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete membership');
            }

            setMessage({ type: 'success', text: 'Membership deleted successfully!' });
            router.refresh();
            // Optionally, redirect after a short delay for the message to be seen
            // setTimeout(() => router.push('/some-other-page'), 1500);
        } catch (error: any) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to delete membership.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-8 my-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                Membership Details for {data.firstName} {data.lastName}
            </h2>

            {/* Message display */}
            {message && (
                <div
                    className={`p-3 mb-4 rounded-md text-sm ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Render the form component */}
            <MemberDataForm
                form={form}
                onSubmit={onSubmit} // This onSubmit is passed but the form.handleSubmit is called by MemberDataActions
                isEditing={isEditing}
                onSetEditing={setIsEditing} // Pass the state setter for isEditing
                data={data} // Pass original data for read-only fields like createdAt/updatedAt
                currentUser={currentUser}
            />

            {/* Render the actions component */}
            <MemberDataActions
                isEditing={isEditing}
                isLoading={isLoading}
                onEdit={() => setIsEditing(true)}
                onCancel={() => {
                    setIsEditing(false);
                    // Reset form to original data when cancelling to discard unsaved changes
                    form.reset({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        userEmail: data.userEmail || '',
                        membershipCategory: data.membershipCategory ?? undefined,
                        sex: data.sex ?? undefined,
                        country: data.country || '',
                        profession: data.profession || '',
                        age: data.age === null ? undefined : data.age,
                        nextOfKin: data.nextOfKin || '',
                        interests: data.interests || '',
                        memberExpectations: data.memberExpectations || '',
                        pledge: data.pledge || '',
                        shares: data.shares === null ? undefined : data.shares,
                        experienceOrBackground: data.experienceOrBackground || '',
                        role: data.role || '',
                        teamCode: data.teamCode || '',
                        subcommittees: data.subcommittees?.filter((s: any) => subcommittees.includes(s as any)) ?? [], // Corrected: use ?? []
                    });
                    setMessage(null);
                }}
                onSave={() => form.handleSubmit(onSubmit)()} // Trigger form submission when Save is clicked
                onDelete={handleDelete}
                currentUser={currentUser}
            />
        </div>
    );
};

export default MemberData;