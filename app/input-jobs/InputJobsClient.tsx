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
import { FormInput, FormSelect } from './_components/Forms';
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { createCareer } from '@/actions/create-career';
import { updateCareer } from '@/actions/update-career';

// Define the type for our form data, including raisedAmount
interface CareerFormValues {
    id?: string;
    title: string;
    listingTitle?: string | null;
    shortDescription?: string | null;
    fullDescription: string;
    slug: string;
    //active: boolean;
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
    active?: string;
    location?: string;
    type?: string;
    department?: string;
}

type CreateCareerParams = Omit<CareerFormValues, 'id'>;
interface UpdateCareerParams extends CareerFormValues {
    id: string;
}

interface CareerFormProps {
    initialData?: CareerFormValues | null
}



const CareerForm: React.FC<CareerFormProps> = ({ initialData }) => {
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
    //const [active, setActive] = useState<boolean>(initialData?.active || true);
    const [location, setLocation] = useState<string>(initialData?.location || '');
    const [type, setType] = useState<string>(initialData?.type || '');
    const [department, setDepartment] = useState<string>(initialData?.department || '');


    const isEditMode = !!initialData?.id;


    const { execute: executeCreate, isLoading: isLoadingCreate, fieldErrors: createFieldErrors } = useAction(createCareer, {
        onSuccess: (data) => {
            toast.success(`Career created successfully!`);
            console.log(data);
            clearInput();
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const { execute: executeUpdate, isLoading: isLoadingUpdate, fieldErrors: updateFieldErrors } = useAction(updateCareer, {
        onSuccess: (data) => {
            toast.success(`Career updated successfully!`);
            console.log(data);
            clearInput();
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const clearInput = () => {
        setId(undefined);
        setTitle('');
        setListingTitle('');
        setShortDescription('');
        setFullDescription('');
        setSlug('');
        //setActive(true);
        setLocation('');
        setType('');
        setDepartment('');
        setErrors(null);
    };

    const clearErrors = () => {
        setErrors(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitError(null);
        setErrors(null);

        const data: CareerFormValues = {
            id,
            title,
            listingTitle,
            shortDescription,
            fullDescription,
            slug,
            // active,
            location,
            type,
            department,
        };

        let formErrors: CareerFormErrors = {};

        if (!data.title?.trim()) {
            formErrors.title = "Title is required";
        }
        if (!data.fullDescription?.trim()) {
            formErrors.fullDescription = "Full Description is required";
        }
        if (!data.slug?.trim()) {
            formErrors.slug = "Slug is required";
        }
        if (!data.location?.trim()) {
            formErrors.location = "Location is required";
        }
        if (!data.type?.trim()) {
            formErrors.type = "Type is required";
        }
        if (!data.department?.trim()) {
            formErrors.department = "Department is required";
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
                    listingTitle: data.listingTitle,
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
                    slug: data.slug,
                    // active: data.active,
                    location: data.location,
                    type: data.type,
                    department: data.department,
                };
                await executeUpdate(updateData);
            } else {
                const createData: CreateCareerParams = {
                    title: data.title,
                    listingTitle: data.listingTitle,
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
                    slug: data.slug,
                    // active: data.active,
                    location: data.location,
                    type: data.type,
                    department: data.department
                };
                await executeCreate(createData);
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-yellow-700">
                        {isEditMode ? 'Edit Career' : 'Create New Career'}
                    </CardTitle>
                    <CardDescription className="text-yellow-900">
                        {isEditMode
                            ? 'Modify the career details below.'
                            : 'Fill out the form to create a new career posting.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={onSubmit}
                        className="space-y-6"
                    >
                        {/* Title */}
                        <FormInput
                            id="title"
                            name="title"
                            label="Title"
                            placeholder="Job Title"
                            value={title || ''}
                            onChange={(e) => setTitle(e.target.value)}
                            error={errors?.title}
                            onKeyUp={clearErrors}
                        />

                        {/* Listing Title */}
                        <FormInput
                            id="listingTitle"
                            name="listingTitle"
                            label="Listing Title"
                            placeholder="Short Title for Listings"
                            value={listingTitle || ''}
                            onChange={(e) => setListingTitle(e.target.value)}
                            error={errors?.listingTitle}
                            onKeyUp={clearErrors}
                        />

                        {/* Short Description */}
                        <FormInput
                            id="shortDescription"
                            name="shortDescription"
                            label="Short Description"
                            placeholder="Short Description"
                            value={shortDescription || ''}
                            onChange={(e) => setShortDescription(e.target.value)}
                            error={errors?.shortDescription}
                            onKeyUp={clearErrors}
                        />

                        {/* Full Description */}
                        <div className="space-y-1">
                            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700">
                                Full Description
                            </label>
                            <Textarea
                                id="fullDescription"
                                name="fullDescription"
                                rows={6}
                                value={fullDescription || ''}
                                onChange={(e) => setFullDescription(e.target.value)}
                                className={cn(
                                    "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                                    errors?.fullDescription && "border-red-500 focus:ring-red-500"
                                )}
                                placeholder="Enter full job description..."
                            />
                            {errors?.fullDescription && <p className="text-red-500 text-sm mt-1">{errors.fullDescription}</p>}
                        </div>

                        {/* Slug */}
                        <FormInput
                            id="slug"
                            name="slug"
                            label="Slug"
                            placeholder="URL Slug (e.g., job-title)"
                            value={slug || ''}
                            onChange={(e) => setSlug(e.target.value)}
                            error={errors?.slug}
                            onKeyUp={clearErrors}
                        />

                        {/* Location */}
                        <FormInput
                            id="location"
                            name="location"
                            label="Location"
                            placeholder="Job Location"
                            value={location || ''}
                            onChange={(e) => setLocation(e.target.value)}
                            error={errors?.location}
                            onKeyUp={clearErrors}
                        />

                        {/* Type */}
                        <FormInput
                            id="type"
                            name="type"
                            label="Type"
                            placeholder="Job Type (e.g., Full-time)"
                            value={type || ''}
                            onChange={(e) => setType(e.target.value)}
                            error={errors?.type}
                            onKeyUp={clearErrors}
                        />

                        {/* Department */}
                        <FormInput
                            id="department"
                            name="department"
                            label="Department"
                            placeholder="Department"
                            value={department || ''}
                            onChange={(e) => setDepartment(e.target.value)}
                            error={errors?.department}
                            onKeyUp={clearErrors}
                        />

                        {/* Active */}
                        {/* <div className="flex items-center">
                            <input
                                id="active"
                                name="active"
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                                className={cn(
                                    "h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                                    errors?.active && "border-red-500 focus:ring-red-500"
                                )}
                            />
                            <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
                                Active
                            </label>
                            {errors?.active && <p className="text-red-500 text-sm mt-1">{errors.active}</p>}
                        </div> */}

                        {/* Submit Button */}
                        <Button type="submit" className="w-full bg-yellow-300 hover:bg-yellow-600 text-blue-700" disabled={isSubmitting || isLoadingCreate || isLoadingUpdate}>
                            {isSubmitting || isLoadingCreate || isLoadingUpdate ? 'Saving...' : isEditMode ? 'Update Career' : 'Create Career'}
                        </Button>
                        {submitError && (
                            <p className="text-red-500 text-sm mt-2">{submitError}</p>
                        )}
                        {createFieldErrors && Object.keys(createFieldErrors).length > 0 && (
                            <div className="mt-4 text-red-500">
                                {Object.entries(createFieldErrors).map(([key, value]) => (
                                    <p key={key}>{value}</p>
                                ))}
                            </div>
                        )}
                        {updateFieldErrors && Object.keys(updateFieldErrors).length > 0 && (
                            <div className="mt-4 text-red-500">
                                {Object.entries(updateFieldErrors).map(([key, value]) => (
                                    <p key={key}>{value}</p>
                                ))}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CareerForm;