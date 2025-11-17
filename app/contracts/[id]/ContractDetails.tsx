
 'use client'
 import React, { useState, useCallback } from 'react';
 import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare,Clipboard } from 'lucide-react';
 import { ActivityStatus, 
     ActivityType,
      ContractStatus } from '@prisma/client';
 import ContractUpdateForm from './ContractupdateForm';
 import { ContractModel } from '../_components/types/contract';
 import { useRouter } from 'next/navigation';

 interface ContractActivityModel {
     id: string;
     title: string;
     activeType: ActivityType;
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

//   export interface ContractModel {
//     id: string;
//     title: string;
//     contractType: string;
//     description: string | null;
//     projectId: string | null;
//      relatedProject?: BusinessProjectModelMinimal;  Uncomment if you include project relation
//     createdAt: string;
//     updatedAt: string;
//     status: ContractStatus;
//     version: string;
//     effectiveDate: string | null;
//     expirationDate: string | null;
//     autoRenew: boolean;
//     internalOwnerId: string;
//      internalOwner?: UserMinimal;  Uncomment if you include owner relation
//     counterpartyName: string;
//     counterpartyContact: string | null;
//     signedDocumentUrl: string | null;
//     totalValueUsd: number | null;  float becomes number
//     paymentTerms: string | null;
//     annualizedCostUsd: number | null;
//     annualRevenueUsd: number | null;
//     totalContractValueUsd: number | null;
//     profitMarginPercent: number | null;
//     costAllocationDetails: any;  Use 'any' or define a specific JSON type
//     riskRating: number | null;
//     complianceJurisdiction: string | null;
//     breachOfContractClause: string | null;
//     obligationsJson: any;  Use 'any' or define a specific JSON type
//     nextReviewDate: string | null;
//     notes: string | null;
//     activityType:string;
//      Included activities for viewing the detail page
//     contractActivityModels: ContractActivityModel[];
//   }

//   Minimal mock for ContractModel to make the file runnable
//   interface ContractModel {
//       id: string;  CRITICAL: Used as contractId when creating activities
//       title: string;
//       contractType?: string;
//       counterpartyName: string;
//       status: ContractStatus;
//       effectiveDate: string;
//       expirationDate: string;
//       nextReviewDate?: string | null;
//       autoRenew: boolean;
//       annualRevenueUsd?: number | null;
//       annualizedCostUsd?: number | null;
//       riskRating?: number | null;
//       createdAt: string;
//       updatedAt: string;
//       description?: string;
//       contractActivityModels: ContractActivityModel[];
//   }

 interface ContractDetailProps {
     contract: ContractModel;
 }



 const activityTypes: ActivityType[] = [ 'FOLLOW_UP', 'MEETING','DRAWING_APPROVAL', 'RESOURCE_ALLOCATION', 'SUPPLIER_ENGAGEMENT','DOCUMENT_SUBMISSION','OTHER'];
 const activityStatuses: ActivityStatus[] = ['SCHEDULED',  'IN_PROGRESS','PENDING_REVIEW', 'COMPLETED', 'CANCELLED'];



 interface InputFieldProps {
     label: string;
     name: string;
     type?: string;
     value: string;
     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
     icon: React.ElementType;
     required?: boolean;
 }

 const InputField: React.FC<InputFieldProps> = ({ label, name, type = 'text', value, onChange, icon: Icon, required = true }) => (
     <div className="space-y-1">
         <label htmlFor={name} className="block text-sm font-medium text-gray-700 flex items-center">
             {Icon && <Icon className="w-4 h-4 mr-1 text-indigo-500" />}
             {label}
         </label>
         {type === 'textarea' ? (
             <textarea
                 name={name}
                 id={name}
                 value={value}
                 onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                 required={required}
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
             />
         ) : (
             <input
                 type={type}
                 name={name}
                 id={name}
                 value={value}
                 onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                 required={required}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
             />
         )}
     </div>
 );

 interface SelectFieldProps {
     label: string;
     name: string;
     value: string;
     onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
     options: string[];
     icon: React.ElementType;
 }

 const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, icon: Icon }) => (
     <div className="space-y-1">
         <label htmlFor={name} className="block text-sm font-medium text-gray-700 flex items-center">
             {Icon && <Icon className="w-4 h-4 mr-1 text-indigo-500" />}
             {label}
         </label>
         <select
             name={name}
             id={name}
             value={value}
             onChange={onChange}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
         >
             {options.map((option) => (
                 <option key={option} value={option}>{option.replace('_', ' ')}</option>
             ))}
         </select>
     </div>
 );

 type ActivityFormDataType = Omit<ContractActivityModel, 'id' | 'contractId' | 'createdByUserId' | 'createdAt'>;

 interface AddActivityFormProps {
     onAdd: (newActivity: ActivityFormDataType) => void;
     onCancel: () => void;
     isLoading: boolean;
     error: string | null;
 }

 function AddActivityForm({ onAdd, onCancel, isLoading, error }: AddActivityFormProps) {
     const today = new Date().toISOString().split('T')[0];

     const [formData, setFormData] = useState<ActivityFormDataType>({
         title: '',
         activeType: 'FOLLOW_UP',
         dueDate: today,
         responsiblePersons: '',
         status: 'IN_PROGRESS',
         description: '', // Added description field
         updatedAt :today,
        // completedAt,
     });

     const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
         setFormData(prevData => ({
             ...prevData,
             [e.target.name]: e.target.value,
         }));
     }, []);

     const handleSubmit = (e: React.FormEvent) => {
         e.preventDefault();
         if (!formData.title || !formData.responsiblePersons || !formData.dueDate) {
             console.error("Title, Responsible Persons, and Due Date are required.");
             return;
         }
         onAdd(formData);
     };

     return (
         <form onSubmit={handleSubmit} className="p-6 bg-white border border-indigo-200 rounded-xl shadow-lg mb-6">
             <h3 className="text-xl font-bold text-indigo-700 mb-5 border-b pb-3">New Contract Activity</h3>

             {error && (
                 <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                     Error: {error}
                 </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                     <InputField
                         label="Activity Title"
                         name="title"
                         value={formData.title}
                         onChange={handleChange}
                         icon={Edit2}
                     />
                 </div>

                 <div className="md:col-span-2">
                     <InputField
                         label="Description (Optional)"
                         name="description"
                         type="textarea"
                         value={formData.description || ''}
                         onChange={handleChange}
                         icon={MessageSquare}
                         required={false}
                     />
                 </div>

                 <InputField
                     label="Responsible Persons (e.g., Jane Doe, Team Alpha)"
                     name="responsiblePersons"
                     value={formData.responsiblePersons}
                     onChange={handleChange}
                     icon={User}
                 />

                 <SelectField
                     label="Activity Type"
                     name="activeType"
                     value={formData.activeType}
                     onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                     options={activityTypes}
                     icon={Zap}
                 />

                 <InputField
                     label="Due Date"
                     name="dueDate"
                     type="date"
                     value={formData.dueDate}
                     onChange={handleChange}
                     icon={Calendar}
                 />

                 <SelectField
                     label="Initial Status"
                     name="status"
                     value={formData.status}
                     onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                     options={activityStatuses}
                     icon={CheckCircle}
                 />
             </div>

             <div className="mt-6 flex justify-end space-x-3">
                 <button
                     type="button"
                     onClick={onCancel}
                     disabled={isLoading}
                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition ring-1 ring-gray-300 disabled:opacity-50"
                 >
                     Cancel
                 </button>
                 <button
                     type="submit"
                     disabled={isLoading}
                     className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 flex items-center disabled:opacity-50"
                 >
                     {isLoading ? (
                         <>
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http:www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Saving...
                         </>
                     ) : (
                         <>
                             <Plus className="w-4 h-4 mr-1" />
                             Save Activity
                         </>
                     )}
                 </button>
             </div>
         </form>
     );
 }

 const getStatusClasses = (status: string) => {
     const base = "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm inline-block";
     switch (status) {
         case 'DOCUMENT_SUBMISSION':
         case 'COMPLETED':
             return `${base} bg-green-100 text-green-700 border border-green-200`;
         case 'FOLLOW_UP':
         case 'PENDING_REVIEW':
             return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
         case 'RESOURCE_ALLOCATION':
         case 'EXPIRED':
         case 'CANCELED':
             return `${base} bg-red-100 text-red-700 border border-red-200`;
         case 'DRAWING_APPROVAL':
         case 'IN_PROGRESS':
             return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
         default:
             return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
     }
 };


 const formatCurrency = (amount: number | null | undefined) =>
     amount !== null && amount !== undefined
         ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
         : '—';


 const formatDate = (dateString: string | Date | null | undefined) => {
     if (!dateString) return 'N/A';
     try {
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
     } catch (e) {
         return 'Invalid Date';
     }
 };
// Add this new interface and component just below the AddActivityForm component.

interface EditActivityFormProps {
    activity: ContractActivityModel;
    onUpdate: (activityId: string, updatedActivity: ActivityFormDataType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}

function EditActivityForm({ activity, onUpdate, onCancel, isLoading, error }: EditActivityFormProps) {
    // Initialize form data with the existing activity data
    const [formData, setFormData] = useState<ActivityFormDataType>({
        title: activity.title,
        activeType: activity.activeType,
        dueDate: activity.dueDate.split('T')[0], // Ensure date is formatted correctly for input type="date"
        responsiblePersons: activity.responsiblePersons,
        status: activity.status,
        description: activity.description,
        updatedAt: new Date().toISOString(), // Update timestamp
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prevData => ({
            ...prevData,
            [e.target.name]: e.target.value,
        }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(activity.id, formData); // Pass ID and updated form data
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-yellow-50 border border-yellow-300 rounded-xl shadow-lg mb-6">
            <h3 className="text-xl font-bold text-yellow-800 mb-5 border-b pb-3">Edit Activity: {activity.title}</h3>

            {error && (
                <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    Error: {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fields similar to AddActivityForm */}
                <div className="md:col-span-2">
                    <InputField label="Activity Title" name="title" value={formData.title} onChange={handleChange} icon={Edit2} />
                </div>
                <div className="md:col-span-2">
                    <InputField label="Description (Optional)" name="description" type="textarea" value={formData.description || ''} onChange={handleChange} icon={MessageSquare} required={false} />
                </div>
                <InputField label="Responsible Persons" name="responsiblePersons" value={formData.responsiblePersons} onChange={handleChange} icon={User} />
                <SelectField label="Activity Type" name="activeType" value={formData.activeType} onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>} options={activityTypes} icon={Zap} />
                <InputField label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} icon={Calendar} />
                <SelectField label="Current Status" name="status" value={formData.status} onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>} options={activityStatuses} icon={CheckCircle} />
                {/* Additional fields (completedAt, resourceDetails, etc.) can be added here */}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition ring-1 ring-gray-300 disabled:opacity-50">
                    Cancel
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-xl shadow-lg hover:bg-yellow-700 transition transform hover:scale-[1.01] active:scale-95 flex items-center disabled:opacity-50">
                    {isLoading ? 
                        (<>Saving...</>) : 
                        (<>Save Changes</>)
                    }
                </button>
            </div>
        </form>
    );
}

 function ContractDetailView({ contract: initialContract }: ContractDetailProps) {
     const [contract, setContract] = useState<ContractModel>(initialContract);
     const [isEditing, setIsEditing] = useState(false);
     const [isAddingActivity, setIsAddingActivity] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const router = useRouter();
     const [copied, setCopied] = useState(false);//  <-- NEW STATE FOR CLIPBOARD MESSAGE


 // NEW STATE: Tracks the ID of the activity currently being edited
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null); 

    // NEW HANDLER: Function to handle updating an activity (uses PUT/PATCH API)
    const handleUpdateActivity = async (activityId: string, updatedData: ActivityFormDataType) => {
        setIsLoading(true);
        setError(null);

        const payload = {
            ...updatedData,
            // Ensure status and type are uppercase for Prisma Enum matching
            activeType: updatedData.activeType.toUpperCase(),
            status: updatedData.status.toUpperCase(),
        };

        try {
            // Use PUT or PATCH method targeting the specific activity ID
            const response = await fetch(`/api/contracts/activity/${activityId}`, {
                method: 'PUT', // Assuming PUT for a full replacement or PATCH if only updating fields
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || 'Failed to update contract activity.');
                return;
            }

            const updatedActivity: ContractActivityModel = result;
            
            // SUCCESS: Update the local state
            setContract(prevContract => ({
                ...prevContract,
                // contractActivityModels: prevContract.contractActivityModels.map(activity =>
                //     activity.id === activityId ? updatedActivity : activity
                // ),
            }));

            setEditingActivityId(null); // Close the edit form

        } catch (e) {
            console.error('Network or Parse Error:', e);
            setError('A network error occurred during update. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
     //NEW FUNCTION: Handle copying the current URL to the clipboard
     const copyToClipboard = () => {
         if (typeof window !== 'undefined') {
             const currentUrl = window.location.href;
             navigator.clipboard.writeText(currentUrl)
                 .then(() => {
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
                 })
                 .catch(err => {
                     console.error('Failed to copy: ', err);
                     setError('Failed to copy link.');
                 });
         }
     };
   //   Function to handle adding a new activity (updates local state after API call)
     const handleAddActivity = async (newActivityData: ActivityFormDataType) => {
         setIsLoading(true);
         setError(null);

       //   Prepare the payload including the required contractId
         const payload = {
             ...newActivityData,
             contractId: contract.id,  //Mandatory ID to link to the parent contract
             // Ensure status and type are uppercase for Prisma Enum matching
             activeType: newActivityData.activeType.toUpperCase(),
             status: newActivityData.status.toUpperCase(),
         };

         try {
             const response = await fetch('/api/contracts/activity', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(payload),
             });

             const result = await response.json();

             if (!response.ok) {
                 // Handle API error messages
                 setError(result.message || 'Failed to create contract activity.');
                 return;
             }

             // SUCCESS: Add the newly created activity (including the ID generated by Prisma)
             const createdActivity: ContractActivityModel = result;
            
              //Update the local state by prepending the new activity
             setContract(prevContract => ({
                 ...prevContract,
                // contractActivityModels: [createdActivity, ...(prevContract.contractActivityModels || [])],
             }));

             setIsAddingActivity(false); // Close the form

         } catch (e) {
             console.error('Network or Parse Error:', e);
             setError('A network error occurred. Please try again.');
         } finally {
             setIsLoading(false);
         }
     };

     // Function to handle the successful update from the form
     const handleUpdate = (updatedData: ContractModel) => {
         setContract(updatedData);
         setIsEditing(false);
     };

     const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
         <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 even:bg-white odd:bg-gray-50 hover:bg-indigo-50 transition duration-150">
             <dt className="text-sm font-medium text-gray-500">{label}</dt>
             <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 font-medium">{value}</dd>
         </div>
     );
         // This revised helper replaces the old DetailRow and the new DetailItem
         const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
             <div className="p-4"> 
                 <dt className="text-sm font-medium text-gray-500 mb-0.5">{label}</dt>
                 <dd className="text-base text-gray-900 font-semibold">{value}</dd>
             </div>
         );

     return (
         <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl font-sans">

             {/* Top Navigation & Title Bar */}
             <div className="mb-6">
                 {/* Return to Contracts Link - Replaced router push with console log */}
                 <button
                     onClick={() => router.push('/contracts')}
                     className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
                 >
                     <ArrowLeft className="w-4 h-4 mr-1" />
                     Return to All Contracts
                 </button>

                 {/* Title and Edit Button */}
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-gray-200">
                     <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                         <span className="text-indigo-600">📄</span> {contract.title}
                     </h1>
                      {/* Title and Edit Button */}
                    <div className="flex flex-row gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto">
                        {/* Share Link Button */}
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl shadow-md hover:bg-indigo-100 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative whitespace-nowrap"
                        >
                            <Clipboard className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
                            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
                        </button>

                        {/* Edit Contract Button */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
                        >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Contract'}</span>
                            <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
                        </button>
                    </div>
                 </div>
             </div>

          

             {isEditing ? (
                 // Using the mock component here
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
                                 // Clear error when opening/closing
                                 setError(null); 
                             }}
                              //Key change: Added ml-auto and removed w-full, but kept justify-center for internal content alignment
                             className="flex items-center justify-center text-sm font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-sm hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto sm:ml-0"
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
                                     setError(null);
                                 }}
                                 isLoading={isLoading}
                                 error={error}
                             />
                         </div>
                     )}


                     <ul className="divide-y divide-gray-200">
                         {contract.contractActivityModels && contract.contractActivityModels.length > 0 ? (
                              contract.contractActivityModels.map((activity, index) => (
                                <li key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                                    
                                    {/* CONDITIONAL RENDERING: Show Edit Form or Activity Details */}
                                    {editingActivityId === activity.id ? (
                                        // SHOW EDIT FORM
                                        <EditActivityForm
                                            activity={activity}
                                            onUpdate={handleUpdateActivity}
                                            onCancel={() => setEditingActivityId(null)}
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
                                                            // Hide Add Form if open
                                                            setIsAddingActivity(false); 
                                                        }}
                                                        className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
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
                                                    <span className="font-semibold text-gray-700">{activity.activeType.replace('_', ' ')}</span>
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
                                                    Description: {activity.description}
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