'use client'

import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Import Shadcn UI components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SafeUser } from '@/app/types';

// Mock Enums (these should ideally come from a shared utility or Prisma client)
const MembershipCategory = {
  ORDINARY: "ORDINARY",
  SILVER: "SILVER",
  GOLD: "GOLD"
};

const Sex = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  NON_BINARY: "NON_BINARY",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
};

// Define the Zod schema for validation (must be consistent with the main component)
export const formSchema = z.object({
  firstName: z.string().min(1, { message: "First Name is required." }).optional(),
  lastName: z.string().min(1, { message: "Last Name is required." }).optional(),
  userEmail: z.string().email({ message: "Invalid email address." }).optional(),
  membershipCategory: z.nativeEnum(MembershipCategory).optional(),
  sex: z.nativeEnum(Sex).optional(),
  country: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  age: z.coerce.number().int().min(0, { message: "Age must be a positive number." }).optional().nullable(),
  nextOfKin: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
  memberExpectations: z.string().optional().nullable(),
  pledge: z.string().optional().nullable(),
  shares: z.coerce.number().int().min(0, { message: "Shares must be a positive number." }).optional().nullable(),
  experienceOrBackground: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  teamCode: z.string().optional().nullable(),
});

// Define the type for form values
export type MemberFormValues = z.infer<typeof formSchema>;

interface MemberDataFormProps {
  form: UseFormReturn<MemberFormValues>;
  onSubmit: (values: MemberFormValues) => void;
  isEditing: boolean;
  data: any; // Original data for read-only fields and comparison
  currentUser: SafeUser|null; // Added currentUser prop
}

const MemberDataForm: React.FC<MemberDataFormProps> = ({ form, onSubmit, isEditing, data, currentUser }) => {
  const isAdmin = currentUser?.isAdmin;// === 'admin';
  const isOwner = currentUser?.email === data.userEmail; // Assuming userEmail is unique and identifies the owner

  // Helper function to determine if a field should be disabled for owner-editable fields
  const isOwnerEditableDisabled = !isEditing || (!(isOwner || isAdmin));// false if owner or admin

  // Helper function to determine if a field should be disabled for admin-only fields
  const isAdminOnlyEditableDisabled = !isEditing || !isAdmin;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="First Name"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Last Name"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="membershipCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membership Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAdminOnlyEditableDisabled}> {/* Admin only */}
                  <FormControl>
                    <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MembershipCategory).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isOwnerEditableDisabled}> {/* Owner or Admin can edit */}
                  <FormControl>
                    <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Sex).map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Country"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profession"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profession (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Profession"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Your Age"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextOfKin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next of Kin (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Next of Kin Name"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Interests (Optional, comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., farming, technology, finance"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="memberExpectations"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>What do you expect as a member? (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us your expectations..."
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pledge"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Your Pledge (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What do you pledge to contribute?"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Shares (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceOrBackground"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Experience or Background (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your relevant experience or background..."
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role in the Team (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Developer, Designer, Marketing"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isOwnerEditableDisabled} // Owner or Admin can edit
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teamCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Code (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter team code if you have one"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isAdminOnlyEditableDisabled} // Admin only
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display CreatedAt and UpdatedAt fields as read-only */}
          <FormItem>
            <FormLabel>Created At</FormLabel>
            <FormControl>
              <Input
                value={new Date(data.createdAt).toLocaleString()}
                className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                disabled={true}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Last Updated</FormLabel>
            <FormControl>
              <Input
                value={new Date(data.updatedAt).toLocaleString()}
                className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                disabled={true}
              />
            </FormControl>
          </FormItem>
        </div>
      </form>
    </Form>
  );
};

export default MemberDataForm;

// 'use client'

// import React from 'react';
// import { useForm, UseFormReturn } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// // Import Shadcn UI components
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// // Mock Enums (these should ideally come from a shared utility or Prisma client)
// const MembershipCategory = {  
//   ORDINARY: "ORDINARY",
//   SILVER: "SILVER",
//   GOLD: "GOLD"
// };

// const Sex = {
//   MALE: "MALE",
//   FEMALE: "FEMALE",
//   NON_BINARY: "NON_BINARY",
//   PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
// };

// // Define the Zod schema for validation (must be consistent with the main component)
// export const formSchema = z.object({
//   firstName: z.string().min(1, { message: "First Name is required." }).optional(),
//   lastName: z.string().min(1, { message: "Last Name is required." }).optional(),
//   userEmail: z.string().email({ message: "Invalid email address." }).optional(),
//   membershipCategory: z.nativeEnum(MembershipCategory).optional(),
//   sex: z.nativeEnum(Sex).optional(),
//   country: z.string().optional().nullable(),
//   profession: z.string().optional().nullable(),
//   age: z.coerce.number().int().min(0, { message: "Age must be a positive number." }).optional().nullable(),
//   nextOfKin: z.string().optional().nullable(),
//   interests: z.string().optional().nullable(),
//   memberExpectations: z.string().optional().nullable(),
//   pledge: z.string().optional().nullable(),
//   shares: z.coerce.number().int().min(0, { message: "Shares must be a positive number." }).optional().nullable(),
//   experienceOrBackground: z.string().optional().nullable(),
//   role: z.string().optional().nullable(),
//   teamCode: z.string().optional().nullable(),
// });

// // Define the type for form values
// export type MemberFormValues = z.infer<typeof formSchema>;

// interface MemberDataFormProps {
//   form: UseFormReturn<MemberFormValues>;
//   onSubmit: (values: MemberFormValues) => void;
//   isEditing: boolean;
//   data: any; // Original data for read-only fields
// }

// const MemberDataForm: React.FC<MemberDataFormProps> = ({ form, onSubmit, isEditing, data }) => {
//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//           <FormField
//             control={form.control}
//             name="firstName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>First Name</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="First Name"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="lastName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Last Name</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="Last Name"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="userEmail"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="email"
//                     placeholder="Email"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="membershipCategory"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Membership Category</FormLabel>
//                 <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
//                   <FormControl>
//                     <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
//                       <SelectValue placeholder="Select a category" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {Object.values(MembershipCategory).map(cat => (
//                       <SelectItem key={cat} value={cat}>
//                         {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="sex"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Sex</FormLabel>
//                 <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
//                   <FormControl>
//                     <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
//                       <SelectValue placeholder="Select sex" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {Object.values(Sex).map(s => (
//                       <SelectItem key={s} value={s}>
//                         {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, ' ')}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="country"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Country (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="Your Country"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="profession"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Profession (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="Your Profession"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="age"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Age (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     placeholder="Your Age"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="nextOfKin"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Next of Kin (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="Next of Kin Name"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="interests"
//             render={({ field }) => (
//               <FormItem className="md:col-span-2">
//                 <FormLabel>Interests (Optional, comma-separated)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="e.g., farming, technology, finance"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="memberExpectations"
//             render={({ field }) => (
//               <FormItem className="md:col-span-2">
//                 <FormLabel>What do you expect as a member? (Optional)</FormLabel>
//                 <FormControl>
//                   <Textarea
//                     placeholder="Tell us your expectations..."
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="pledge"
//             render={({ field }) => (
//               <FormItem className="md:col-span-2">
//                 <FormLabel>Your Pledge (Optional)</FormLabel>
//                 <FormControl>
//                   <Textarea
//                     placeholder="What do you pledge to contribute?"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="shares"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Number of Shares (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     placeholder="e.g., 100"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="experienceOrBackground"
//             render={({ field }) => (
//               <FormItem className="md:col-span-2">
//                 <FormLabel>Experience or Background (Optional)</FormLabel>
//                 <FormControl>
//                   <Textarea
//                     placeholder="Tell us about your relevant experience or background..."
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="role"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Your Role in the Team (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="e.g., Developer, Designer, Marketing"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="teamCode"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Team Code (Optional)</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="Enter team code if you have one"
//                     className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                     {...field}
//                     value={field.value ?? ''}
//                     disabled={!isEditing}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Display CreatedAt and UpdatedAt fields as read-only */}
//           <FormItem>
//             <FormLabel>Created At</FormLabel>
//             <FormControl>
//               <Input
//                 value={new Date(data.createdAt).toLocaleString()}
//                 className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                 disabled={true}
//               />
//             </FormControl>
//           </FormItem>
//           <FormItem>
//             <FormLabel>Last Updated</FormLabel>
//             <FormControl>
//               <Input
//                 value={new Date(data.updatedAt).toLocaleString()}
//                 className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
//                 disabled={true}
//               />
//             </FormControl>
//           </FormItem>
//         </div>
//       </form>
//     </Form>
//   );
// };

// export default MemberDataForm;
