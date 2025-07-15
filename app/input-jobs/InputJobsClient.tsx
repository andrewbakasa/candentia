'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
// Assuming these are correctly implemented using Shadcn UI's Input and Select components
import { FormInput, FormSelect } from './_components/Forms'; // Adjust path if necessary
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea'; // Keep Textarea for fullDescription
import { createCareer } from '@/actions/create-career';
import { updateCareer } from '@/actions/update-career';
import Link from 'next/link'; // Import Link for declarative navigation
import { Loader2 } from 'lucide-react'; // Icon for loading state

// --- Define Options for Select Inputs ---
const LOCATION_OPTIONS = [
    { value: 'Harare', label: 'Harare' },
    { value: 'Bulawayo', label: 'Bulawayo' },
    { value: 'Victoria Falls', label: 'Victoria Falls' },
    { value: 'Mutare', label: 'Mutare' },
    { value: 'Gweru', label: 'Gweru' },
    { value: 'Remote', label: 'Remote' },
    // Add more locations relevant to your context (e.g., Zimbabwe cities)
];

const TYPE_OPTIONS = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Volunteer', label: 'Volunteer' },
];

const DEPARTMENT_OPTIONS = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'Product Management', label: 'Product Management' },
    { value: 'Design', label: 'Design' },
    // Add more departments specific to your organization
];
// --- End Options Definition ---


// Define the type for our form data
interface CareerFormValues {
    id?: string;
    title: string;
    listingTitle?: string | null;
    shortDescription?: string | null;
    fullDescription: string;
    slug: string;
    location: string;
    type: string;
    department: string;
}

interface CareerFormErrors {
    title?: string;
    listingTitle?: string;
    shortDescription?: string;
    fullDescription?: string;
    slug?: string;
    location?: string;
    type?: string;
    department?: string;
}

type CreateCareerParams = Omit<CareerFormValues, 'id'>;
interface UpdateCareerParams extends CareerFormValues {
    id: string;
}

interface CareerFormProps {
    initialData?: CareerFormValues | null;
    onClose?: () => void; // Added onClose prop for modal handling
}

const CareerForm: React.FC<CareerFormProps> = ({ initialData, onClose }) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<CareerFormErrors | null>(null);

    const [id, setId] = useState<string | undefined>(initialData?.id);
    const [title, setTitle] = useState<string>(initialData?.title || '');
    const [listingTitle, setListingTitle] = useState<string>(initialData?.listingTitle || '');
    const [shortDescription, setShortDescription] = useState<string>(initialData?.shortDescription || '');
    const [fullDescription, setFullDescription] = useState<string>(initialData?.fullDescription || '');
    const [slug, setSlug] = useState<string>(initialData?.slug || '');
    const [location, setLocation] = useState<string>(initialData?.location || '');
    const [type, setType] = useState<string>(initialData?.type || '');
    const [department, setDepartment] = useState<string>(initialData?.department || '');

    const isEditMode = !!initialData?.id;

    // Use a single state for combined field errors from actions
    const [actionFieldErrors, setActionFieldErrors] = useState<Record<string, string[] | undefined> | undefined>(undefined);

    const { execute: executeCreate, isLoading: isLoadingCreate, fieldErrors: createFieldErrors } = useAction(createCareer, {
        onSuccess: (data) => {
            toast.success(`Career "${data.title}" created successfully!`);
            clearInput();
            if (onClose) {
                onClose();
            } else {
                router.push('/careerjobs'); // Redirect after creation if not in modal
            }
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const { execute: executeUpdate, isLoading: isLoadingUpdate, fieldErrors: updateFieldErrors } = useAction(updateCareer, {
        onSuccess: (data) => {
            toast.success(`Career "${data.title}" updated successfully!`);
            if (onClose) {
                onClose();
            }
            // No clearInput here for updates as the form might be in a modal and needs to close
            // If the form is not in a modal, you might want to redirect: router.push('/careers');
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Effect to merge field errors from actions into a single state
    useEffect(() => {
        if (createFieldErrors) {
            setActionFieldErrors(createFieldErrors);
        } else if (updateFieldErrors) {
            setActionFieldErrors(updateFieldErrors);
        } else {
            setActionFieldErrors(undefined); // Clear if no new errors
        }
    }, [createFieldErrors, updateFieldErrors]);


    const clearInput = () => {
        setId(undefined);
        setTitle('');
        setListingTitle('');
        setShortDescription('');
        setFullDescription('');
        setSlug('');
        setLocation('');
        setType('');
        setDepartment('');
        setErrors(null);
        setSubmitError(null);
        setActionFieldErrors(undefined);
    };

    const clearErrors = () => {
        setErrors(null);
        setSubmitError(null);
        setActionFieldErrors(undefined);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitError(null);
        setErrors(null);
        setActionFieldErrors(undefined); // Clear action errors on new submission attempt

        const data: CareerFormValues = {
            id,
            title,
            listingTitle,
            shortDescription,
            fullDescription,
            slug,
            location,
            type,
            department,
        };

        let formErrors: CareerFormErrors = {};

        // Manual client-side validation
        if (!data.title?.trim()) {
            formErrors.title = "Job Title is required.";
        }
        if (!data.fullDescription?.trim()) {
            formErrors.fullDescription = "Full Description is required.";
        }
        if (!data.slug?.trim()) {
            formErrors.slug = "Slug is required (e.g., software-engineer-july-2025).";
        }
        if (!data.location?.trim()) {
            formErrors.location = "Location is required.";
        }
        if (!data.type?.trim()) {
            formErrors.type = "Job Type is required.";
        }
        if (!data.department?.trim()) {
            formErrors.department = "Department is required.";
        }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            if (isEditMode && id) {
                const updateData: UpdateCareerParams = {
                    id: id,
                    title: data.title,
                    listingTitle: data.listingTitle || null, // Ensure null for optional empty strings
                    shortDescription: data.shortDescription || null, // Ensure null for optional empty strings
                    fullDescription: data.fullDescription,
                    slug: data.slug,
                    location: data.location,
                    type: data.type,
                    department: data.department,
                };
                await executeUpdate(updateData);
            } else {
                const createData: CreateCareerParams = {
                    title: data.title,
                    listingTitle: data.listingTitle || null,
                    shortDescription: data.shortDescription || null,
                    fullDescription: data.fullDescription,
                    slug: data.slug,
                    location: data.location,
                    type: data.type,
                    department: data.department,
                };
                await executeCreate(createData);
            }
        } catch (error: any) {
            // This catch block might not be hit if useAction handles errors via onError callback
            setSubmitError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isLoadingCreate || isLoadingUpdate || isSubmitting;

    return (
        <div className="flex justify-center items-start min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl shadow-xl border border-yellow-200">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-extrabold text-yellow-700">
                        {isEditMode ? 'Edit Career Post' : 'Create New Career Post'}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                        {isEditMode
                            ? 'Update the details for this job opportunity.'
                            : 'Fill in the information to post a new job opening.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Title */}
                        <FormInput
                            id="title"
                            name="title"
                            label="Job Title"
                            placeholder="e.g., Senior Software Engineer"
                            value={title || ''}
                            onChange={(e) => setTitle(e.target.value)}
                            error={errors?.title || actionFieldErrors?.title?.[0]}
                            onKeyUp={clearErrors}
                            // required
                        />

                        {/* Listing Title (Optional) */}
                        <FormInput
                            id="listingTitle"
                            name="listingTitle"
                            label="Listing Title (Optional)"
                            placeholder="Short title for job listings (e.g., Software Dev)"
                            value={listingTitle || ''}
                            onChange={(e) => setListingTitle(e.target.value)}
                            error={errors?.listingTitle || actionFieldErrors?.listingTitle?.[0]}
                            onKeyUp={clearErrors}
                        />

                        {/* Short Description (Optional) */}
                        <FormInput
                            id="shortDescription"
                            name="shortDescription"
                            label="Short Description (Optional)"
                            placeholder="A brief overview of the role (e.g., Develop scalable web applications)."
                            value={shortDescription || ''}
                            onChange={(e) => setShortDescription(e.target.value)}
                            error={errors?.shortDescription || actionFieldErrors?.shortDescription?.[0]}
                            onKeyUp={clearErrors}
                        />

                        {/* Full Description */}
                        <div className="space-y-2">
                            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700">
                                Full Description <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="fullDescription"
                                name="fullDescription"
                                rows={8} // Increased rows for more input area
                                value={fullDescription || ''}
                                onChange={(e) => setFullDescription(e.target.value)}
                                className={cn(
                                    "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-y",
                                    (errors?.fullDescription || actionFieldErrors?.fullDescription) && "border-red-500 focus:ring-red-500"
                                )}
                                placeholder="Provide a detailed description of the job responsibilities, requirements, and benefits."
                            />
                            {(errors?.fullDescription || actionFieldErrors?.fullDescription) && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors?.fullDescription || actionFieldErrors?.fullDescription?.[0]}
                                </p>
                            )}
                        </div>

                        {/* Slug */}
                        <FormInput
                            id="slug"
                            name="slug"
                            label="URL Slug"
                            placeholder="e.g., senior-software-engineer-harare"
                            value={slug || ''}
                            onChange={(e) => setSlug(e.target.value)}
                            error={errors?.slug || actionFieldErrors?.slug?.[0]}
                            onKeyUp={clearErrors}
                            description="This will be part of the job URL. Keep it short and descriptive."
                            required
                        />

                        {/* Location Select */}
                        <FormSelect
                            id="location"
                            name="location"
                            label="Job Location"
                            value={location || ''}
                            onChange={setLocation} // FormSelect should handle string value change directly
                            options={LOCATION_OPTIONS}
                            placeholder="Select a location"
                            error={errors?.location || actionFieldErrors?.location?.[0]}
                            required
                        />

                        {/* Type Select */}
                        <FormSelect
                            id="type"
                            name="type"
                            label="Job Type"
                            value={type || ''}
                            onChange={setType}
                            options={TYPE_OPTIONS}
                            placeholder="Select a job type"
                            error={errors?.type || actionFieldErrors?.type?.[0]}
                            required
                        />

                        {/* Department Select */}
                        <FormSelect
                            id="department"
                            name="department"
                            label="Department"
                            value={department || ''}
                            onChange={setDepartment}
                            options={DEPARTMENT_OPTIONS}
                            placeholder="Select a department"
                            error={errors?.department || actionFieldErrors?.department?.[0]}
                            required
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Saving...' : (isEditMode ? 'Update Career' : 'Create Career')}
                        </Button>

                        {submitError && (
                            <p className="text-red-600 text-sm mt-2 text-center">{submitError}</p>
                        )}
                        {actionFieldErrors && Object.keys(actionFieldErrors).length > 0 && (
                            <div className="mt-4 text-red-600 text-sm text-center">
                                {Object.entries(actionFieldErrors).map(([key, value]) => (
                                    value && value.map((msg, idx) => (
                                        <p key={`${key}-${idx}`}>{msg}</p>
                                    ))
                                ))}
                            </div>
                        )}
                    </form>

                    {/* Navigation Buttons */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!onClose && ( // Only show "Go Back to Careers List" if not in a modal
                            <Link href="/careerjobs" passHref>
                                <Button variant="outline" className="w-full text-blue-600 hover:bg-blue-50 transition-colors">
                                    Go Back to Careers List
                                </Button>
                            </Link>
                        )}
                        {/* Only show "Go Back to Edit Jobs" if it's a distinct path/context */}
                        {!onClose && ( // Assuming /edit-jobs is a distinct page from /careers
                            <Link href="/edit-jobs" passHref> {/* Adjusted path for admin career management */}
                                <Button variant="outline" className="w-full text-blue-600 hover:bg-blue-50 transition-colors">
                                    Go to Manage Careers
                                </Button>
                            </Link>
                        )}
                         {onClose && ( // If in a modal, a single close button
                            <Button variant="outline" onClick={onClose} className="w-full text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CareerForm;
// 'use client';
// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Button } from '@/components/ui/button';
// import { FormInput, FormSelect } from './_components/Forms';
// import { useAction } from '@/hooks/use-action';
// import { toast } from 'sonner';
// import { Textarea } from '@/components/ui/textarea';
// import { createCareer } from '@/actions/create-career';
// import { updateCareer } from '@/actions/update-career';
// import Link from 'next/link'; // Import Link for declarative navigation

// // Define the type for our form data, including raisedAmount
// interface CareerFormValues {
//     id?: string;
//     title: string;
//     listingTitle?: string | null;
//     shortDescription?: string | null;
//     fullDescription: string;
//     slug: string;
//     //active: boolean;
//     location: string;
//     type: string;
//     department: string;
// }

// interface CareerFormErrors {
//     title?: string;
//     listingTitle?: string;
//     shortDescription?: string;
//     fullDescription?: string;
//     slug?: string;
//     active?: string;
//     location?: string;
//     type?: string;
//     department?: string;
// }

// type CreateCareerParams = Omit<CareerFormValues, 'id'>;
// interface UpdateCareerParams extends CareerFormValues {
//     id: string;
// }

// interface CareerFormProps {
//     initialData?: CareerFormValues | null;
//     onClose?: () => void; // Added onClose prop for modal handling
// }

// const CareerForm: React.FC<CareerFormProps> = ({ initialData, onClose }) => {
//     const router = useRouter();
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);
//     const [errors, setErrors] = useState<CareerFormErrors | null>(null);

//     const [id, setId] = useState<string | undefined>(initialData?.id);
//     const [title, setTitle] = useState<string>(initialData?.title || '');
//     const [listingTitle, setListingTitle] = useState<string>(initialData?.listingTitle || '');
//     const [shortDescription, setShortDescription] = useState<string>(initialData?.shortDescription || '');
//     const [fullDescription, setFullDescription] = useState<string>(initialData?.fullDescription || '');
//     const [slug, setSlug] = useState<string>(initialData?.slug || '');
//     //const [active, setActive] = useState<boolean>(initialData?.active || true);
//     const [location, setLocation] = useState<string>(initialData?.location || '');
//     const [type, setType] = useState<string>(initialData?.type || '');
//     const [department, setDepartment] = useState<string>(initialData?.department || '');

//     const isEditMode = !!initialData?.id;

//     const { execute: executeCreate, isLoading: isLoadingCreate, fieldErrors: createFieldErrors } = useAction(createCareer, {
//         onSuccess: (data) => {
//             toast.success(`Career created successfully!`);
//             console.log(data);
//             clearInput();
//             if (onClose) { // Call onClose if provided (for modal context)
//                 onClose();
//             }
//             router.push('/careers'); // Redirect after creation if not in modal
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     const { execute: executeUpdate, isLoading: isLoadingUpdate, fieldErrors: updateFieldErrors } = useAction(updateCareer, {
//         onSuccess: (data) => {
//             toast.success(`Career updated successfully!`);
//             console.log(data);
//             if (onClose) { // Call onClose if provided (for modal context)
//                 onClose();
//             }
//             // No clearInput here for updates as the form might be in a modal and needs to close
//             // router.push('/careers'); // Redirect after update if not in modal, but modal handles this
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     const clearInput = () => {
//         setId(undefined);
//         setTitle('');
//         setListingTitle('');
//         setShortDescription('');
//         setFullDescription('');
//         setSlug('');
//         //setActive(true);
//         setLocation('');
//         setType('');
//         setDepartment('');
//         setErrors(null);
//     };

//     const clearErrors = () => {
//         setErrors(null);
//     };

//     const onSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         setIsSubmitting(true);
//         setSubmitError(null);
//         setErrors(null);

//         const data: CareerFormValues = {
//             id,
//             title,
//             listingTitle,
//             shortDescription,
//             fullDescription,
//             slug,
//             // active,
//             location,
//             type,
//             department,
//         };

//         let formErrors: CareerFormErrors = {};

//         if (!data.title?.trim()) {
//             formErrors.title = "Title is required";
//         }
//         if (!data.fullDescription?.trim()) {
//             formErrors.fullDescription = "Full Description is required";
//         }
//         if (!data.slug?.trim()) {
//             formErrors.slug = "Slug is required";
//         }
//         if (!data.location?.trim()) {
//             formErrors.location = "Location is required";
//         }
//         if (!data.type?.trim()) {
//             formErrors.type = "Type is required";
//         }
//         if (!data.department?.trim()) {
//             formErrors.department = "Department is required";
//         }

//         if (Object.keys(formErrors).length > 0) {
//             setErrors(formErrors);
//             setIsSubmitting(false);
//             return;
//         }

//         try {
//             if (isEditMode && id) {
//                 const updateData: UpdateCareerParams = {
//                     id: id,
//                     title: data.title,
//                     listingTitle: data.listingTitle,
//                     shortDescription: data.shortDescription,
//                     fullDescription: data.fullDescription,
//                     slug: data.slug,
//                     // active: data.active,
//                     location: data.location,
//                     type: data.type,
//                     department: data.department,
//                 };
//                 await executeUpdate(updateData);
//             } else {
//                 const createData: CreateCareerParams = {
//                     title: data.title,
//                     listingTitle: data.listingTitle,
//                     shortDescription: data.shortDescription,
//                     fullDescription: data.fullDescription,
//                     slug: data.slug,
//                     // active: data.active,
//                     location: data.location,
//                     type: data.type,
//                     department: data.department
//                 };
//                 await executeCreate(createData);
//             }
//         } catch (error: any) {
//             setSubmitError(error.message || 'An error occurred while saving.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleGoBack = () => {
//         router.back(); // Navigates to the previous page in history
//     };

//     return (
//         <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
//             <Card className="w-full max-w-2xl shadow-2xl">
//                 <CardHeader>
//                     <CardTitle className="text-2xl font-semibold text-yellow-700">
//                         {isEditMode ? 'Edit Career' : 'Create New Career'}
//                     </CardTitle>
//                     <CardDescription className="text-yellow-900">
//                         {isEditMode
//                             ? 'Modify the career details below.'
//                             : 'Fill out the form to create a new career posting.'}
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <form
//                         onSubmit={onSubmit}
//                         className="space-y-6"
//                     >
//                         {/* Title */}
//                         <FormInput
//                             id="title"
//                             name="title"
//                             label="Title"
//                             placeholder="Job Title"
//                             value={title || ''}
//                             onChange={(e) => setTitle(e.target.value)}
//                             error={errors?.title}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Listing Title */}
//                         <FormInput
//                             id="listingTitle"
//                             name="listingTitle"
//                             label="Listing Title"
//                             placeholder="Short Title for Listings"
//                             value={listingTitle || ''}
//                             onChange={(e) => setListingTitle(e.target.value)}
//                             error={errors?.listingTitle}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Short Description */}
//                         <FormInput
//                             id="shortDescription"
//                             name="shortDescription"
//                             label="Short Description"
//                             placeholder="Short Description"
//                             value={shortDescription || ''}
//                             onChange={(e) => setShortDescription(e.target.value)}
//                             error={errors?.shortDescription}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Full Description */}
//                         <div className="space-y-1">
//                             <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700">
//                                 Full Description
//                             </label>
//                             <Textarea
//                                 id="fullDescription"
//                                 name="fullDescription"
//                                 rows={6}
//                                 value={fullDescription || ''}
//                                 onChange={(e) => setFullDescription(e.target.value)}
//                                 className={cn(
//                                     "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
//                                     errors?.fullDescription && "border-red-500 focus:ring-red-500"
//                                 )}
//                                 placeholder="Enter full job description..."
//                             />
//                             {errors?.fullDescription && <p className="text-red-500 text-sm mt-1">{errors.fullDescription}</p>}
//                         </div>

//                         {/* Slug */}
//                         <FormInput
//                             id="slug"
//                             name="slug"
//                             label="Slug"
//                             placeholder="URL Slug (e.g., job-title)"
//                             value={slug || ''}
//                             onChange={(e) => setSlug(e.target.value)}
//                             error={errors?.slug}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Location */}
//                         <FormInput
//                             id="location"
//                             name="location"
//                             label="Location"
//                             placeholder="Job Location"
//                             value={location || ''}
//                             onChange={(e) => setLocation(e.target.value)}
//                             error={errors?.location}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Type */}
//                         <FormInput
//                             id="type"
//                             name="type"
//                             label="Type"
//                             placeholder="Job Type (e.g., Full-time)"
//                             value={type || ''}
//                             onChange={(e) => setType(e.target.value)}
//                             error={errors?.type}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Department */}
//                         <FormInput
//                             id="department"
//                             name="department"
//                             label="Department"
//                             placeholder="Department"
//                             value={department || ''}
//                             onChange={(e) => setDepartment(e.target.value)}
//                             error={errors?.department}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Submit Button */}
//                         <Button type="submit" className="w-full bg-yellow-300 hover:bg-yellow-600 text-blue-700" disabled={isSubmitting || isLoadingCreate || isLoadingUpdate}>
//                             {isSubmitting || isLoadingCreate || isLoadingUpdate ? 'Saving...' : isEditMode ? 'Update Career' : 'Create Career'}
//                         </Button>
//                         {submitError && (
//                             <p className="text-red-500 text-sm mt-2">{submitError}</p>
//                         )}
//                         {createFieldErrors && Object.keys(createFieldErrors).length > 0 && (
//                             <div className="mt-4 text-red-500">
//                                 {Object.entries(createFieldErrors).map(([key, value]) => (
//                                     <p key={key}>{value}</p>
//                                 ))}
//                             </div>
//                         )}
//                         {updateFieldErrors && Object.keys(updateFieldErrors).length > 0 && (
//                             <div className="mt-4 text-red-500">
//                                 {Object.entries(updateFieldErrors).map(([key, value]) => (
//                                     <p key={key}>{value}</p>
//                                 ))}
//                             </div>
//                         )}
//                     </form>
//                     {/* Go Back Link */}
//                     <div className="mt-6 text-center">
//                         {/* Using Link component for better prefetching and accessibility */}
//                         <Link href="/careerjobs" passHref>
//                             <Button variant="outline" className="text-blue-500 hover:text-blue-700">
//                                 Go Back to Careers List
//                             </Button>
//                         </Link>
//                         <Link href="/edit-jobs" passHref>
//                             <Button variant="outline" className="text-blue-500 hover:text-blue-700">
//                                 Go Back to Edit Jobs
//                             </Button>
//                         </Link>
                       
                      
//                         <Button variant="outline" onClick={handleGoBack} className="text-blue-500 hover:text-blue-700">
//                             Go Back
//                         </Button>
                      
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default CareerForm;
// 'use client';
// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Button } from '@/components/ui/button';
// import { FormInput, FormSelect } from './_components/Forms';
// import { useAction } from '@/hooks/use-action';
// import { toast } from 'sonner';
// import { Textarea } from '@/components/ui/textarea';
// import { createCareer } from '@/actions/create-career';
// import { updateCareer } from '@/actions/update-career';

// // Define the type for our form data, including raisedAmount
// interface CareerFormValues {
//     id?: string;
//     title: string;
//     listingTitle?: string | null;
//     shortDescription?: string | null;
//     fullDescription: string;
//     slug: string;
//     //active: boolean;
//     location: string;
//     type: string;
//     department: string;
// }

// interface CareerFormErrors {
//     title?: string;
//     listingTitle?: string;
//     shortDescription?: string;
//     fullDescription?: string;
//     slug?: string;
//     active?: string;
//     location?: string;
//     type?: string;
//     department?: string;
// }

// type CreateCareerParams = Omit<CareerFormValues, 'id'>;
// interface UpdateCareerParams extends CareerFormValues {
//     id: string;
// }

// interface CareerFormProps {
//     initialData?: CareerFormValues | null
// }



// const CareerForm: React.FC<CareerFormProps> = ({ initialData }) => {
//     const router = useRouter();
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);
//     const [errors, setErrors] = useState<CareerFormErrors | null>(null);

//     const [id, setId] = useState<string | undefined>(initialData?.id);
//     const [title, setTitle] = useState<string>(initialData?.title || '');
//     const [listingTitle, setListingTitle] = useState<string>(initialData?.listingTitle || '');
//     const [shortDescription, setShortDescription] = useState<string>(initialData?.shortDescription || '');
//     const [fullDescription, setFullDescription] = useState<string>(initialData?.fullDescription || '');
//     const [slug, setSlug] = useState<string>(initialData?.slug || '');
//     //const [active, setActive] = useState<boolean>(initialData?.active || true);
//     const [location, setLocation] = useState<string>(initialData?.location || '');
//     const [type, setType] = useState<string>(initialData?.type || '');
//     const [department, setDepartment] = useState<string>(initialData?.department || '');


//     const isEditMode = !!initialData?.id;


//     const { execute: executeCreate, isLoading: isLoadingCreate, fieldErrors: createFieldErrors } = useAction(createCareer, {
//         onSuccess: (data) => {
//             toast.success(`Career created successfully!`);
//             console.log(data);
//             clearInput();
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     const { execute: executeUpdate, isLoading: isLoadingUpdate, fieldErrors: updateFieldErrors } = useAction(updateCareer, {
//         onSuccess: (data) => {
//             toast.success(`Career updated successfully!`);
//             console.log(data);
//             clearInput();
//         },
//         onError: (error) => {
//             toast.error(error);
//         },
//     });

//     const clearInput = () => {
//         setId(undefined);
//         setTitle('');
//         setListingTitle('');
//         setShortDescription('');
//         setFullDescription('');
//         setSlug('');
//         //setActive(true);
//         setLocation('');
//         setType('');
//         setDepartment('');
//         setErrors(null);
//     };

//     const clearErrors = () => {
//         setErrors(null);
//     };

//     const onSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         setIsSubmitting(true);
//         setSubmitError(null);
//         setErrors(null);

//         const data: CareerFormValues = {
//             id,
//             title,
//             listingTitle,
//             shortDescription,
//             fullDescription,
//             slug,
//             // active,
//             location,
//             type,
//             department,
//         };

//         let formErrors: CareerFormErrors = {};

//         if (!data.title?.trim()) {
//             formErrors.title = "Title is required";
//         }
//         if (!data.fullDescription?.trim()) {
//             formErrors.fullDescription = "Full Description is required";
//         }
//         if (!data.slug?.trim()) {
//             formErrors.slug = "Slug is required";
//         }
//         if (!data.location?.trim()) {
//             formErrors.location = "Location is required";
//         }
//         if (!data.type?.trim()) {
//             formErrors.type = "Type is required";
//         }
//         if (!data.department?.trim()) {
//             formErrors.department = "Department is required";
//         }

//         if (Object.keys(formErrors).length > 0) {
//             setErrors(formErrors);
//             setIsSubmitting(false);
//             return;
//         }

//         try {
//             if (isEditMode && id) {
//                 const updateData: UpdateCareerParams = {
//                     id: id,
//                     title: data.title,
//                     listingTitle: data.listingTitle,
//                     shortDescription: data.shortDescription,
//                     fullDescription: data.fullDescription,
//                     slug: data.slug,
//                     // active: data.active,
//                     location: data.location,
//                     type: data.type,
//                     department: data.department,
//                 };
//                 await executeUpdate(updateData);
//             } else {
//                 const createData: CreateCareerParams = {
//                     title: data.title,
//                     listingTitle: data.listingTitle,
//                     shortDescription: data.shortDescription,
//                     fullDescription: data.fullDescription,
//                     slug: data.slug,
//                     // active: data.active,
//                     location: data.location,
//                     type: data.type,
//                     department: data.department
//                 };
//                 await executeCreate(createData);
//             }
//         } catch (error: any) {
//             setSubmitError(error.message || 'An error occurred while saving.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };


//     return (
//         <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
//             <Card className="w-full max-w-2xl shadow-2xl">
//                 <CardHeader>
//                     <CardTitle className="text-2xl font-semibold text-yellow-700">
//                         {isEditMode ? 'Edit Career' : 'Create New Career'}
//                     </CardTitle>
//                     <CardDescription className="text-yellow-900">
//                         {isEditMode
//                             ? 'Modify the career details below.'
//                             : 'Fill out the form to create a new career posting.'}
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <form
//                         onSubmit={onSubmit}
//                         className="space-y-6"
//                     >
//                         {/* Title */}
//                         <FormInput
//                             id="title"
//                             name="title"
//                             label="Title"
//                             placeholder="Job Title"
//                             value={title || ''}
//                             onChange={(e) => setTitle(e.target.value)}
//                             error={errors?.title}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Listing Title */}
//                         <FormInput
//                             id="listingTitle"
//                             name="listingTitle"
//                             label="Listing Title"
//                             placeholder="Short Title for Listings"
//                             value={listingTitle || ''}
//                             onChange={(e) => setListingTitle(e.target.value)}
//                             error={errors?.listingTitle}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Short Description */}
//                         <FormInput
//                             id="shortDescription"
//                             name="shortDescription"
//                             label="Short Description"
//                             placeholder="Short Description"
//                             value={shortDescription || ''}
//                             onChange={(e) => setShortDescription(e.target.value)}
//                             error={errors?.shortDescription}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Full Description */}
//                         <div className="space-y-1">
//                             <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700">
//                                 Full Description
//                             </label>
//                             <Textarea
//                                 id="fullDescription"
//                                 name="fullDescription"
//                                 rows={6}
//                                 value={fullDescription || ''}
//                                 onChange={(e) => setFullDescription(e.target.value)}
//                                 className={cn(
//                                     "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
//                                     errors?.fullDescription && "border-red-500 focus:ring-red-500"
//                                 )}
//                                 placeholder="Enter full job description..."
//                             />
//                             {errors?.fullDescription && <p className="text-red-500 text-sm mt-1">{errors.fullDescription}</p>}
//                         </div>

//                         {/* Slug */}
//                         <FormInput
//                             id="slug"
//                             name="slug"
//                             label="Slug"
//                             placeholder="URL Slug (e.g., job-title)"
//                             value={slug || ''}
//                             onChange={(e) => setSlug(e.target.value)}
//                             error={errors?.slug}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Location */}
//                         <FormInput
//                             id="location"
//                             name="location"
//                             label="Location"
//                             placeholder="Job Location"
//                             value={location || ''}
//                             onChange={(e) => setLocation(e.target.value)}
//                             error={errors?.location}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Type */}
//                         <FormInput
//                             id="type"
//                             name="type"
//                             label="Type"
//                             placeholder="Job Type (e.g., Full-time)"
//                             value={type || ''}
//                             onChange={(e) => setType(e.target.value)}
//                             error={errors?.type}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Department */}
//                         <FormInput
//                             id="department"
//                             name="department"
//                             label="Department"
//                             placeholder="Department"
//                             value={department || ''}
//                             onChange={(e) => setDepartment(e.target.value)}
//                             error={errors?.department}
//                             onKeyUp={clearErrors}
//                         />

//                         {/* Active */}
//                         {/* <div className="flex items-center">
//                             <input
//                                 id="active"
//                                 name="active"
//                                 type="checkbox"
//                                 checked={active}
//                                 onChange={(e) => setActive(e.target.checked)}
//                                 className={cn(
//                                     "h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
//                                     errors?.active && "border-red-500 focus:ring-red-500"
//                                 )}
//                             />
//                             <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
//                                 Active
//                             </label>
//                             {errors?.active && <p className="text-red-500 text-sm mt-1">{errors.active}</p>}
//                         </div> */}

//                         {/* Submit Button */}
//                         <Button type="submit" className="w-full bg-yellow-300 hover:bg-yellow-600 text-blue-700" disabled={isSubmitting || isLoadingCreate || isLoadingUpdate}>
//                             {isSubmitting || isLoadingCreate || isLoadingUpdate ? 'Saving...' : isEditMode ? 'Update Career' : 'Create Career'}
//                         </Button>
//                         {submitError && (
//                             <p className="text-red-500 text-sm mt-2">{submitError}</p>
//                         )}
//                         {createFieldErrors && Object.keys(createFieldErrors).length > 0 && (
//                             <div className="mt-4 text-red-500">
//                                 {Object.entries(createFieldErrors).map(([key, value]) => (
//                                     <p key={key}>{value}</p>
//                                 ))}
//                             </div>
//                         )}
//                         {updateFieldErrors && Object.keys(updateFieldErrors).length > 0 && (
//                             <div className="mt-4 text-red-500">
//                                 {Object.entries(updateFieldErrors).map(([key, value]) => (
//                                     <p key={key}>{value}</p>
//                                 ))}
//                             </div>
//                         )}
//                     </form>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default CareerForm;