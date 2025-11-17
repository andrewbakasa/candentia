'use client'
import React, { useState, useCallback } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare, Clipboard } from 'lucide-react';
import ContractUpdateForm from './ContractupdateForm';
import { ContractModel } from '../_components/types/contract';
import { useRouter } from 'next/navigation';
import { ActivityFormDataType, ContractActivityModel, ContractDetailProps } from '../_components/types/general';
import { AddActivityForm, EditActivityForm, formatCurrency, formatDate, getStatusClasses, InputField, SelectField } from '../_components/utils';

// --- UI COMPONENTS ---
// Global Loading Overlay for API operations
const GlobalLoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center cursor-wait">
        <div className="flex items-center space-x-2 p-4 bg-white rounded-xl shadow-2xl">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent border-solid rounded-full animate-spin"></div>
            <p className="text-base font-semibold text-gray-800">Processing update...</p>
        </div>
    </div>
);

// Message Banner for success/error
const MessageBanner: React.FC<{ type: 'success' | 'error', message: string }> = ({ type, message }) => {
    const baseClasses = "fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl text-white font-semibold flex items-center space-x-2 transition-all duration-300 transform";
    const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';
    const Icon = type === 'success' ? CheckCircle : Zap;

    return (
        <div className={`${baseClasses} ${colorClasses} translate-x-0`}>
            <Icon className="w-5 h-5" />
            <span>{message}</span>
        </div>
    );
};

function ContractDetailView({ contract: initialContract }: ContractDetailProps) {
    const [contract, setContract] = useState<any>(initialContract);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // NEW STATE for Success Messages
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    // const handleUpdateActivity = async (activityId: string, updatedData: ActivityFormDataType) => {
    //     setIsLoading(true);
    //     clearMessages();

   

    //     const payload = {
    //         ...updatedData,
    //         activityType: updatedData.activityType.toUpperCase(),
    //         status: updatedData.status.toUpperCase(),
    //     };

    //     try {
    //         const response = await fetch(`/api/contracts/activity/${activityId}`, {
    //             method: 'PUT',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(payload),
    //         });

    //         const result = await response.json();

    //         if (!response.ok) {
    //             setError(result.message || 'Failed to update contract activity.');
    //             return;
    //         }

    //         const updatedActivity: ContractActivityModel = result;
            
    //         // SUCCESS: Update the local state
    //         setContract((prevContract: { contractActivityModels: any[]; }) => ({
    //             ...prevContract,
    //             contractActivityModels: prevContract.contractActivityModels.map(activity =>
    //                 activity.id === activityId ? updatedActivity : activity
    //             ),
    //         }));

    //         setEditingActivityId(null); // Close the edit form
    //         setSuccessMessage('Activity updated successfully!'); // Show success message
    //         setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds

    //     } catch (e) {
    //         console.error('Network or Parse Error:', e);
    //         setError('A network error occurred during update. Please try again.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };
    const handleUpdateActivity = async (activityId: string, updatedData: ActivityFormDataType) => {
    setIsLoading(true);
    clearMessages();

    // Use Partial<ActivityFormDataType> or ActivityFormDataType based on what your API accepts.
    // We use a clean object to build the sanitized payload.
    const payload: Partial<ActivityFormDataType> = {};

    for (const key in updatedData) {
        if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
            const k = key as keyof ActivityFormDataType;
            let value = updatedData[k];

            // 1. Identify Date Fields for ISO-8601 Fix
            // Note: I am using 'dueData' as typed in your snippet.
            const isDateField = k === 'completedAt' || k === 'dueDate' || k === 'updatedAt';

            if (isDateField && typeof value === 'string' && value.trim() !== '') {
                // FIX: Convert "YYYY-MM-DD" to full ISO-8601 format (T00:00:00.000Z)
                (payload as any)[k] = value.trim() + 'T00:00:00.000Z';
            }
            // 2. Handle Case Conversion for Enums (activityType, status)
            else if ((k === 'activityType' || k === 'status') && typeof value === 'string' && value.trim() !== '') {
                 // Apply uppercase conversion directly
                (payload as any)[k] = value.toUpperCase();
            }
            // 3. Convert Empty Strings to Null for all other nullable string fields
            else if (typeof value === 'string' && value.trim() === '') {
                (payload as any)[k] = null;
            }
            // 4. Pass all other valid values (numbers, booleans, already formatted data)
            else if (value !== undefined) {
                (payload as any)[k] = value;
            }
        }
    }
    
    // --- The second redundant/overwriting payload definition is now REMOVED ---
    
    try {
        const response = await fetch(`/api/contracts/activity/${activityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), // Send the fully corrected payload
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.message || 'Failed to update contract activity.');
            return;
        }

        const updatedActivity: ContractActivityModel = result;
        
        // SUCCESS: Update the local state
        setContract((prevContract: { contractActivityModels: any[]; }) => ({
            ...prevContract,
            contractActivityModels: prevContract.contractActivityModels.map(activity =>
                activity.id === activityId ? updatedActivity : activity
            ),
        }));

        setEditingActivityId(null); // Close the edit form
        setSuccessMessage('Activity updated successfully!'); // Show success message
        setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds

    } catch (e) {
        console.error('Network or Parse Error:', e);
        setError('A network error occurred during update. Please try again.');
    } finally {
        setIsLoading(false);
    }
};
    const copyToClipboard = () => {
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl)
                .then(() => {
                    setCopied(true);
                    setSuccessMessage('Link copied to clipboard!'); // Show success message for copy
                    setTimeout(() => {setCopied(false); setSuccessMessage(null);}, 2000); 
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    setError('Failed to copy link.');
                });
        }
    };
    
    // const handleAddActivity = async (newActivityData: ActivityFormDataType) => {
    //     setIsLoading(true);
    //     clearMessages();

    //     const payload = {
    //         ...newActivityData,
    //         contractId: contract.id,
    //         activityType: newActivityData.activityType.toUpperCase(),
    //         status: newActivityData.status.toUpperCase(),
    //     };
     
    //     try {
    //         const response = await fetch('/api/contracts/activity', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(payload),
    //         });

    //         const result = await response.json();

    //         if (!response.ok) {
    //             setError(result.message || 'Failed to create contract activity.');
    //             return;
    //         }

    //         const createdActivity: ContractActivityModel = result;
            
    //         setContract((prevContract: { contractActivityModels: any; }) => ({
    //             ...prevContract,
    //             contractActivityModels: [createdActivity, ...(prevContract.contractActivityModels || [])],
    //         }));

    //         setIsAddingActivity(false); // Close the form
    //         setSuccessMessage('Activity created successfully!'); // Show success message
    //         setTimeout(() => setSuccessMessage(null), 3000);

    //     } catch (e) {
    //         console.error('Network or Parse Error:', e);
    //         setError('A network error occurred. Please try again.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleAddActivity = async (newActivityData: ActivityFormDataType) => {
        setIsLoading(true);
        clearMessages();

        // 1. Initialize payload, including the contractId foreign key.
        const payload: Partial<ActivityFormDataType> & { contractId: string } = {
            contractId: contract.id, // Ensure this field is added
        };

        for (const key in newActivityData) {
            if (Object.prototype.hasOwnProperty.call(newActivityData, key)) {
                const k = key as keyof ActivityFormDataType;
                let value = newActivityData[k];

                // Identify Date Fields for ISO-8601 Fix (removed 'updatedAt' as it's for the DB to handle on creation)
                const isDateField = k === 'completedAt' || k === 'dueDate'|| k === 'updatedAt';

                if (isDateField && typeof value === 'string' && value.trim() !== '') {
                    // FIX: Convert "YYYY-MM-DD" to full ISO-8601 format (T00:00:00.000Z)
                    (payload as any)[k] = value.trim() + 'T00:00:00.000Z';
                }
                // Handle Case Conversion for Enums (activityType, status)
                else if ((k === 'activityType' || k === 'status') && typeof value === 'string' && value.trim() !== '') {
                    // Apply uppercase conversion directly
                    (payload as any)[k] = value.toUpperCase();
                }
                // Convert Empty Strings to Null for all other nullable string fields
                else if (typeof value === 'string' && value.trim() === '') {
                    (payload as any)[k] = null;
                }
                // Pass all other valid values (numbers, booleans, already null data)
                else if (value !== undefined) {
                    (payload as any)[k] = value;
                }
            }
        }
        
        // --- The second redundant/overwriting payload definition is now REMOVED ---

        try {
            const response = await fetch('/api/contracts/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), // Send the fully corrected payload
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || 'Failed to create contract activity.');
                return;
            }

            const createdActivity: ContractActivityModel = result;
            
            setContract((prevContract: { contractActivityModels: any; }) => ({
                ...prevContract,
                contractActivityModels: [createdActivity, ...(prevContract.contractActivityModels || [])],
            }));

            setIsAddingActivity(false); // Close the form
            setSuccessMessage('Activity created successfully!'); // Show success message
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (e) {
            console.error('Network or Parse Error:', e);
            setError('A network error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = (updatedData: ContractModel) => {
        setContract(updatedData);
        setIsEditing(false);
        setSuccessMessage('Contract details updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <div className="p-4"> 
            <dt className="text-sm font-medium text-gray-500 mb-0.5">{label}</dt>
            <dd className="text-base text-gray-900 font-semibold">{value}</dd>
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl font-sans relative">
            
            {/* --- GLOBAL LOADING OVERLAY & MESSAGE BANNERS (New) --- */}
            {isLoading && <GlobalLoadingOverlay />}
            {successMessage && <MessageBanner type="success" message={successMessage} />}
            {error && <MessageBanner type="error" message={error} />}
            
            {/* Top Navigation & Title Bar */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/contracts')}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
                    disabled={isLoading}
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Return to All Contracts
                </button>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-gray-200">
                    <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <span className="text-indigo-600">📄</span> {contract.title}
                    </h1>
                    <div className="flex flex-row gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap"
                            disabled={isLoading}
                        >
                            <Clipboard className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
                            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(!isEditing);
                                clearMessages();
                            }}
                            className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
                            disabled={isLoading}
                        >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Contract'}</span>
                            <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isEditing ? (
                <ContractUpdateForm contract={contract} onUpdateSuccess={handleUpdate} />
            ) : (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 divide-y divide-gray-200 overflow-hidden">

                    {/* --- Contract Metadata Section --- */}
                    <div className="px-6 py-4 bg-indigo-50/50">
                        <h3 className="text-lg font-semibold text-indigo-800">Contract Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-600">Key details and term dates for the agreement.</p>
                    </div>

                    {/* --- Contract Information Grid (1 Column Mobile, 2 Columns Desktop) --- */}
                    <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-200">
                        
                        {/* Row 1 */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem label="Contract Type" value={contract.contractType || 'N/A'} />
                        </div>
                        <DetailItem label="Counterparty" value={contract.counterpartyName} />
                        
                        {/* Row 2 */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem
                                label="Status"
                                value={<span className={getStatusClasses(contract.status)}>{contract.status.replace('_', ' ')}</span>}
                            />
                        </div>
                        <DetailItem label="Auto Renew" value={contract.autoRenew ? 'Yes' : 'No'} />

                        {/* Row 3 (Dates) */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem label="Effective Date" value={formatDate(contract.effectiveDate)} />
                        </div>
                        <DetailItem label="Expiration Date" value={formatDate(contract.expirationDate)} />

                        {/* Row 4 - Next Review spans both columns on desktop */}
                        <div className="md:col-span-2 border-t md:border-t-0 border-gray-200">
                            <DetailItem label="Next Review Date" value={formatDate(contract.nextReviewDate)} />
                        </div>
                    </dl>

                    {/* --- Financial Metrics Section --- */}
                    <div className="px-6 py-4 bg-indigo-50/50">
                        <h3 className="text-lg font-semibold text-indigo-800">Financial Metrics & Risk</h3>
                    </div>

                    {/* --- Financial Metrics Grid (1 Column Mobile, 2 Columns Desktop) --- */}
                    <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-200">
                        
                        {/* Row 1 */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem label="Annual Revenue (USD)" value={formatCurrency(contract.annualRevenueUsd)} />
                        </div>
                        <DetailItem label="Annual Cost (USD)" value={formatCurrency(contract.annualizedCostUsd)} />
                        
                        {/* Row 2 (Risk Rating Spans Two Columns) */}
                        <div className="md:col-span-2 border-t md:border-t-0 border-gray-200">
                            <DetailItem
                                label="Risk Rating"
                                value={contract.riskRating ? <span className="font-mono text-lg font-bold text-red-600">{contract.riskRating.toFixed(1)}</span> : 'N/A'}
                            />
                        </div>
                        
                        {/* Row 3 (Audit/Date Stamps) */}
                        <div className="md:border-r border-gray-200">
                            <DetailItem label="Created On" value={formatDate(contract.createdAt)} />
                        </div>
                        <DetailItem label="Last Updated" value={formatDate(contract.updatedAt)} />
                    </dl>

                    {/* --- Description / Summary --- */}
                    <div className="px-6 py-4 bg-indigo-50/50">
                        <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Contract Summary
                        </h3>
                    </div>
                    <div className="px-6 py-6 text-gray-700">
                        <p className="whitespace-pre-wrap leading-relaxed">{contract.description || 'No detailed summary provided.'}</p>
                    </div>

                    
                    {/* --- Contract Activities (Plans) Section --- */}
                    <div className="px-6 py-4 bg-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-indigo-800 mb-2 sm:mb-0">
                            Related Activities/Plans ({contract.contractActivityModels.length})
                        </h3>
                        <button
                            onClick={() => {
                                setIsAddingActivity(!isAddingActivity);
                                clearMessages(); // Clear messages when opening/closing Add form
                                setEditingActivityId(null); // Close any open edit form
                            }}
                            className="flex items-center justify-center text-sm font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-sm hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto sm:ml-0"
                            disabled={isLoading} // Disable while processing
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            {isAddingActivity ? 'Close Form' : 'Add Activity'}
                        </button>
                    </div>

                    {/* --- New Activity Form --- */}
                    {isAddingActivity && (
                        <div className="p-4">
                            <AddActivityForm
                                onAdd={handleAddActivity}
                                onCancel={() => {
                                    setIsAddingActivity(false);
                                    clearMessages();
                                }}
                                isLoading={isLoading}
                                error={error}
                            />
                        </div>
                    )}


                    <ul className="divide-y divide-gray-200">
                        {contract.contractActivityModels && contract.contractActivityModels.length > 0 ? (
                            contract.contractActivityModels.map((activity: ContractActivityModel, index: number) => (
                                <li key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                                    
                                    {/* CONDITIONAL RENDERING: Show Edit Form or Activity Details */}
                                    {editingActivityId === activity.id ? (
                                        // SHOW EDIT FORM
                                        <EditActivityForm
                                            activity={activity}
                                            onUpdate={handleUpdateActivity}
                                            onCancel={() => {
                                                setEditingActivityId(null);
                                                clearMessages();
                                            }}
                                            isLoading={isLoading}
                                            error={error}
                                        />
                                    ) : (
                                        // SHOW ACTIVITY DETAILS
                                        <>
                                            <div className="flex flex-col sm:flex-row justify-between items-start">
                                                <p className="font-bold text-lg text-gray-900 leading-snug">
                                                    {index + 1}. {activity.title}
                                                </p>
                                                <div className="flex items-center space-x-3 mt-2 sm:mt-0 ml-auto sm:ml-0">
                                                    {/* NEW EDIT BUTTON */}
                                                    <button
                                                        onClick={() => {
                                                            setEditingActivityId(activity.id);
                                                            setIsAddingActivity(false); // Hide Add Form if open
                                                            clearMessages();
                                                        }}
                                                        className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
                                                        disabled={isLoading}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {/* Status badge */}
                                                    <span className={`${getStatusClasses(activity.status)} text-xs sm:text-sm`}>
                                                        {activity.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2 flex flex-col sm:flex-row sm:space-x-4">
                                                <span className="flex items-center">
                                                    <Zap className="w-3 h-3 mr-1 text-indigo-500" />
                                                    <span className="font-semibold text-gray-700">{activity.activityType.replace('_', ' ')}</span>
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1 text-indigo-500" />
                                                    Due: {formatDate(activity.dueDate)}
                                                </span>
                                                <span className="flex items-center">
                                                    <User className="w-3 h-3 mr-1 text-indigo-500" />
                                                    Responsible: {activity.responsiblePersons || 'N/A'}
                                                </span>
                                            </div>
                                            {activity.description && (
                                                <p className="mt-2 text-xs italic text-gray-500 max-w-lg">
                                                    <span className='text-red-500'>Description</span>: {activity.description}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className="p-6 text-gray-500 text-center bg-gray-50">
                                No compliance or management activities recorded for this contract. Click Add Activity to create one.
                            </li>
                        )}
                    </ul>



                </div>
            )}
        </div>
    );
}

export default ContractDetailView;