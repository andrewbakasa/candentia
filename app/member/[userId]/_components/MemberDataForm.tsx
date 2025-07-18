'use client'

import React, { useEffect } from 'react'; // Import useEffect
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Import Shadcn UI components
import {
    Form,
    FormControl,
    FormDescription, // Added for helper text
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Button } from "@/components/ui/button"; // Import Button for select/deselect all

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

// Define available subcommittees
const subcommittees = ["Innovation", "Finance", "Marketing", "Technical", "Business"] as const;

// Define the Zod schema for validation
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
    // New field for subcommittees, allowing multiple selections
    subcommittees: z.array(z.enum(subcommittees)).optional(),
});

// Define the type for form values
export type MemberFormValues = z.infer<typeof formSchema>;

interface MemberDataFormProps {
    form: UseFormReturn<MemberFormValues>;
    onSubmit: (values: MemberFormValues) => void;
    isEditing: boolean;
    onSetEditing: (editing: boolean) => void; // New prop to notify parent about editing state change
    data: any; // Original data for read-only fields and comparison
    currentUser: SafeUser | null; // Added currentUser prop
}

const MemberDataForm: React.FC<MemberDataFormProps> = ({ form, onSubmit, isEditing, onSetEditing, data, currentUser }) => {
    const isAdmin = currentUser?.isAdmin;
    const isOwner = currentUser?.email === data.userEmail;

    // Effect to automatically set isEditing to true if the form becomes dirty
    // This ensures that if a user starts typing, the form switches to edit mode.
    useEffect(() => {
        if (form.formState.isDirty && !isEditing) {
            onSetEditing(true);
        }
    }, [form.formState.isDirty, isEditing, onSetEditing]);

    // Handle "Select All" subcommittees
    const handleSelectAllSubcommittees = () => {
        if (isEditing) { // Only allow if editing
            form.setValue('subcommittees', [...subcommittees]);
            form.trigger('subcommittees'); // Trigger validation for the field
        }
    };

    // Handle "Deselect All" subcommittees
    const handleDeselectAllSubcommittees = () => {
        if (isEditing) { // Only allow if editing
            form.setValue('subcommittees', []);
            form.trigger('subcommittees'); // Trigger validation for the field
        }
    };

    return (
        <Form {...form}>
            {/* The form element itself will not have an onSubmit handler here,
                as the submission will be triggered by the onSave in MemberDataActions
                which will call form.handleSubmit(onSubmit) from the parent. */}
            <form className="space-y-6">
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}> {/* Editable when isEditing is true */}
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}> {/* Editable when isEditing is true */}
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
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
                                        disabled={!isEditing} // Editable when isEditing is true
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Field for Subcommittees */}
                    <FormField
                        control={form.control}
                        name="subcommittees"
                        render={() => (
                            <FormItem className="md:col-span-2">
                                <div className="mb-4">
                                    <FormLabel className="text-base">Subcommittees</FormLabel>
                                    <FormDescription>
                                        Select the subcommittees you&apos;d like to join.
                                    </FormDescription>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAllSubcommittees}
                                        disabled={!isEditing} // Enabled only when isEditing is true
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeselectAllSubcommittees}
                                        disabled={!isEditing} // Enabled only when isEditing is true
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                                {subcommittees.map((item) => (
                                    <FormField
                                        key={item}
                                        control={form.control}
                                        name="subcommittees"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={item}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item)}
                                                            onCheckedChange={(checked) => {
                                                                // Logic to add or remove item from the array
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== item
                                                                        )
                                                                    );
                                                            }}
                                                            disabled={!isEditing} // Editable when isEditing is true
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {item}
                                                    </FormLabel>
                                                </FormItem>
                                            );
                                        }}
                                    />
                                ))}
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
                                disabled={true} // Always disabled
                            />
                        </FormControl>
                    </FormItem>
                    <FormItem>
                        <FormLabel>Last Updated</FormLabel>
                        <FormControl>
                            <Input
                                value={new Date(data.updatedAt).toLocaleString()}
                                className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                disabled={true} // Always disabled
                            />
                        </FormControl>
                    </FormItem>
                </div>
                {/* The submit button is now handled by MemberDataActions */}
            </form>
        </Form>
    );
};

export default MemberDataForm;