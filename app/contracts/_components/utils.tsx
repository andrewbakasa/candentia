'use client'
import { useCallback, useState } from "react";
import { ActivityFormDataType, AddActivityFormProps, EditActivityFormProps, InputFieldProps, SelectFieldProps } from "./types/general";
import { ArrowLeft, Calendar, CheckCircle, Edit2, Plus, User, Zap, MessageSquare,Clipboard } from 'lucide-react';
import { ActivityStatus, ActivityType } from '@prisma/client';

export const activityTypes: ActivityType[] = [ 'FOLLOW_UP', 'MEETING','DRAWING_APPROVAL', 'RESOURCE_ALLOCATION', 'SUPPLIER_ENGAGEMENT','DOCUMENT_SUBMISSION','OTHER'];
export const activityStatuses: ActivityStatus[] = ['SCHEDULED',  'IN_PROGRESS','PENDING_REVIEW', 'COMPLETED', 'CANCELLED'];

export const InputField: React.FC<InputFieldProps> = ({ label, name, type = 'text', value, onChange, icon: Icon, required = true }) => (
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

 export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, icon: Icon }) => (
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
  
 export function AddActivityForm({ onAdd, onCancel, isLoading, error }: AddActivityFormProps) {
     const today = new Date().toISOString().split('T')[0];

     const [formData, setFormData] = useState<ActivityFormDataType>({
         title: '',
         activityType: 'FOLLOW_UP',
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
                     name="activityType"
                     value={formData.activityType}
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

 export const getStatusClasses = (status: string) => {
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


 export const formatCurrency = (amount: number | null | undefined) =>
     amount !== null && amount !== undefined
         ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
         : '—';


export const formatDate = (dateString: string | Date | null | undefined) => {
     if (!dateString) return 'N/A';
     try {
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
     } catch (e) {
         return 'Invalid Date';
     }
 };

export const getISODate = (date: string | Date | null | undefined): string => {
    if (!date) return '';

    // Convert to a Date object if it's a string, or use the object directly
    const d = date instanceof Date ? date : new Date(date);

    // If d is an 'Invalid Date' object, return empty string
    if (isNaN(d.getTime())) {
        return '';
    }

    // Get YYYY, MM, DD components from the LOCAL time of the Date object
    const year = d.getFullYear();
    // Month is 0-indexed, so add 1, then pad to 2 digits
    const month = String(d.getMonth() + 1).padStart(2, '0'); 
    // Pad day to 2 digits
    const day = String(d.getDate()).padStart(2, '0');

    // Return YYYY-MM-DD format
    const formattedDate = `${year}-${month}-${day}`;
    console.log("Formatted dueDate for input type='date':", formattedDate); // Check this log value!
    
    return formattedDate;
};
export function EditActivityForm({ activity, onUpdate, onCancel, isLoading, error }: EditActivityFormProps) {
    // Initialize form data with the existing activity data
    const [formData, setFormData] = useState<ActivityFormDataType>({
        title: activity.title,
        activityType: activity.activityType,
       // dueDate: activity.dueDate.split('T')[0], // Ensure date is formatted correctly for input type="date"
        // *** FIX IS HERE ***
        dueDate: getISODate(activity.dueDate),
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
                <SelectField label="Activity Type" name="activityType" value={formData.activityType} onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>} options={activityTypes} icon={Zap} />
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
// Add this new interface and component just below the AddActivityForm component.
