'use client'

import React from 'react';
import { PencilIcon, Trash2Icon, SaveIcon, XIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SafeUser } from '@/app/types';

interface MemberDataActionsProps {
    isEditing: boolean;
    isLoading: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void; // This will trigger the form submission from the parent
    onDelete: () => void;
    currentUser: SafeUser | null; // Add currentUser to props
}

const MemberDataActions: React.FC<MemberDataActionsProps> = ({
    isEditing,
    isLoading,
    onEdit,
    onCancel,
    onSave, // This prop is now expected to be the form.handleSubmit(onSubmit) from the parent
    onDelete,
    currentUser, // Destructure currentUser
}) => {
    // Check if the current user is an admin
    const isAdmin = currentUser?.isAdmin;

    return (
        <div className="flex justify-end space-x-3 mt-6">
            {isEditing ? (
                <>
                    <Button
                        type="button" // Important: set to "button" if it's outside the <form> element
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
                    >
                        <XIcon className="w-5 h-5 mr-2" /> Cancel
                    </Button>
                    <Button
                        type="button" // Important: set to "button" if it's outside the <form> element
                        onClick={onSave} // This will now call the form.handleSubmit(onSubmit) provided by the parent
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <SaveIcon className="w-5 h-5 mr-2" /> Save Changes
                            </>
                        )}
                    </Button>
                </>
            ) : (
                // Buttons for View Mode
                <>
                    <Button
                        onClick={onEdit}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                    >
                        <PencilIcon className="w-5 h-5 mr-2" /> Edit
                    </Button>
                    {isAdmin && ( // Conditionally render Delete button if user is admin
                        <Button
                            onClick={onDelete}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2Icon className="w-5 h-5 mr-2" /> Delete
                                </>
                            )}
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default MemberDataActions;

// 'use client'

// import React from 'react';
// import { PencilIcon, Trash2Icon, SaveIcon, XIcon } from 'lucide-react';
// import { Button } from "@/components/ui/button";
// import { SafeUser } from '@/app/types';

// interface MemberDataActionsProps {
//   isEditing: boolean;
//   isLoading: boolean;
//   onEdit: () => void;
//   onCancel: () => void;
//   onSave: () => void; // This will trigger the form submission
//   onDelete: () => void;
//   currentUser: SafeUser|null; // Add currentUser to props
// }

// const MemberDataActions: React.FC<MemberDataActionsProps> = ({
//   isEditing,
//   isLoading,
//   onEdit,
//   onCancel,
//   onSave,
//   onDelete,
//   currentUser, // Destructure currentUser
// }) => {
//   // Check if the current user is an admin
//   const isAdmin = currentUser?.isAdmin;// === 'admin';

//   return (
//     <div className="flex justify-end space-x-3 mt-6">
//       {isEditing ? (
//         <>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onCancel}
//             disabled={isLoading}
//             className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
//           >
//             <XIcon className="w-5 h-5 mr-2" /> Cancel
//           </Button>
//           <Button
//             type="submit" // This button needs to be type="submit" to trigger the form submission
//             onClick={onSave} // Call onSave which will trigger form.handleSubmit
//             disabled={isLoading}
//             className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
//           >
//             {isLoading ? (
//               <>
//                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <SaveIcon className="w-5 h-5 mr-2" /> Save Changes
//               </>
//             )}
//           </Button>
//         </>
//       ) : (
//         // Buttons for View Mode
//         <>
//           <Button
//             onClick={onEdit}
//             className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
//           >
//             <PencilIcon className="w-5 h-5 mr-2" /> Edit
//           </Button>
//           {isAdmin && ( // Conditionally render Delete button if user is admin
//             <Button
//               onClick={onDelete}
//               className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Deleting...
//                 </>
//               ) : (
//                 <>
//                   <Trash2Icon className="w-5 h-5 mr-2" /> Delete
//                 </>
//               )}
//             </Button>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default MemberDataActions;

// 'use client'

// import React from 'react';
// import { PencilIcon, Trash2Icon, SaveIcon, XIcon } from 'lucide-react';
// import { Button } from "@/components/ui/button";

// interface MemberDataActionsProps {
//   isEditing: boolean;
//   isLoading: boolean;
//   onEdit: () => void;
//   onCancel: () => void;
//   onSave: () => void; // This will trigger the form submission
//   onDelete: () => void;
// }

// const MemberDataActions: React.FC<MemberDataActionsProps> = ({
//   isEditing,
//   isLoading,
//   onEdit,
//   onCancel,
//   onSave,
//   onDelete,
// }) => {
//   return (
//     <div className="flex justify-end space-x-3 mt-6">
//       {isEditing ? (
//         <>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onCancel}
//             disabled={isLoading}
//             className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
//           >
//             <XIcon className="w-5 h-5 mr-2" /> Cancel
//           </Button>
//           <Button
//             type="submit" // This button needs to be type="submit" to trigger the form submission
//             onClick={onSave} // Call onSave which will trigger form.handleSubmit
//             disabled={isLoading}
//             className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
//           >
//             {isLoading ? (
//               <>
//                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <SaveIcon className="w-5 h-5 mr-2" /> Save Changes
//               </>
//             )}
//           </Button>
//         </>
//       ) : (
//         // Buttons for View Mode
//         <>
//           <Button
//             onClick={onEdit}
//             className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
//           >
//             <PencilIcon className="w-5 h-5 mr-2" /> Edit
//           </Button>
//           <Button
//             onClick={onDelete}
//             className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <>
//                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Deleting...
//               </>
//             ) : (
//               <>
//                 <Trash2Icon className="w-5 h-5 mr-2" /> Delete
//               </>
//             )}
//           </Button>
//         </>
//       )}
//     </div>
//   );
// };

// export default MemberDataActions;
