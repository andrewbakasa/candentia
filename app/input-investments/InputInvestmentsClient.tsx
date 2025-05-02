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
import { Check, Image as ImageIcon, X } from 'lucide-react';
import { unsplash } from '@/lib/unsplash';
import { FormInput, FormSelect } from './_components/Forms';
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';
import { createPortfolio } from '@/actions/create-portfolio';
import { updatePortfolio } from '@/actions/update-investment';

// Define the type for Unsplash images
interface UnsplashImage {
    id: string;
    urls: {
        thumb: string;
        full: string;
    };
    links: {
        html: string;
    };
    user: {
        name: string;
    };
}

// Define the type for our form data, including raisedAmount
interface InvestmentPortfolioFormValues {
    title: string;
    description: string;
    type: 'Real Estate' | 'StartUp' | 'Stock' | 'Equity' | 'Venture Capital' | 'Debt';
    country: string;
    targetAmount: number;
    raisedAmount: number;
    imageUrl: string;
    expectedReturn?: string;
    active: boolean;
    id?: string; // Add id for edit mode
}

interface InvestmentPortfolioErrors {
    title?: string;
    description?: string;
    type?: string;
    country?: string;
    targetAmount?: string;
    raisedAmount?: string;
    imageUrl?: string;
    expectedReturn?: string;
    active?: boolean;
}

// Define separate types for create and update actions, if necessary
type CreatePortfolioParams = Omit<InvestmentPortfolioFormValues, 'id'>; // id is not required for create
interface UpdatePortfolioParams extends Omit<InvestmentPortfolioFormValues, 'id'> {  //id is required for update.
    id: string;
}
interface InvestmentPortfolioFormProps {
    initialData?: InvestmentPortfolioFormValues | null
}

const ImagePickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    unsplashImages: UnsplashImage[];
    isUnsplashLoading: boolean;
    loadMoreImages: () => void;
    setSelectedUnsplashImageId: (id: string | null) => void;
    selectedImageId: string | null;
    isSubmitting: boolean;
    filters: {
        query: string;
        orientation: 'landscape' | 'portrait' | 'squarish' | null;
        color: string | null;
    };
    setFilters: (filters: {
        query: string;
        orientation: 'landscape' | 'portrait' | 'squarish' | null;
        color: string | null;
    }) => void;
}> = ({ isOpen, onClose, onSelect, unsplashImages, isUnsplashLoading, loadMoreImages, setSelectedUnsplashImageId, selectedImageId, isSubmitting, filters, setFilters }) => {
    const handleImageClick = (image: UnsplashImage) => {
        setSelectedUnsplashImageId(image.id);
        onSelect(`${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`);
        onClose();
    };

    const handleLoadMore = () => {
        if (!isUnsplashLoading) {
            loadMoreImages();
        }
    };

    const clearFilters = () => {
        setFilters({
            query: '',
            orientation: null,
            color: null,
        });
    };

    return (
        <div
            className={cn(
                "fixed inset-0 bg-black/50 z-50 transition-opacity",
                isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            style={{
                display: isOpen ? 'block' : 'none', // Use inline style for compatibility
            }}
        >
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Choose an Image</h2>
                    </div>

                    {/* Filter Section */}
                    <div className="p-4 border-b">
                        <h3 className="text-md font-semibold mb-2">Filters</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Search Query */}
                            <div>
                                <label htmlFor="query" className="block text-sm font-medium text-gray-700">Search</label>
                                <input
                                    id="query"
                                    type="text"
                                    value={filters.query}
                                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                                    placeholder="Search for images..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>

                            {/* Orientation Filter */}
                            <div>
                                <label htmlFor="orientation" className="block text-sm font-medium text-gray-700">Orientation</label>
                                <select
                                    id="orientation"
                                    value={filters.orientation || ''}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            orientation: e.target.value === '' ? null : (e.target.value as 'landscape' | 'portrait' | 'squarish'),
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">Any</option>
                                    <option value="landscape">Landscape</option>
                                    <option value="portrait">Portrait</option>
                                    <option value="squarish">Squarish</option>
                                </select>
                            </div>

                            {/* Color Filter */}
                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
                                <input
                                    id="color"
                                    type="text"
                                    value={filters.color || ''}
                                    onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                                    placeholder="e.g., red, #FF0000"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFilters}
                                className="text-gray-700 hover:bg-gray-100"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {isUnsplashLoading && (
                            <div className="col-span-full text-center">Loading images...</div>
                        )}
                        {!isUnsplashLoading && unsplashImages.length === 0 && (
                            <div className="col-span-full text-center">No images found.</div>
                        )}
                        {unsplashImages.map((image) => (
                            <div
                                key={image.id}
                                className={cn(
                                    "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors duration-200",
                                    selectedImageId === image.id
                                        ? "border-blue-500 ring-2 ring-blue-500"
                                        : "border-transparent hover:border-gray-200"
                                )}
                                onClick={() => handleImageClick(image)}
                            >
                                <img
                                    src={image.urls.thumb}
                                    alt={image.user.name}
                                    className="w-full h-40 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
                                    <Check className={cn(
                                        "w-6 h-6 text-white transition-opacity",
                                        selectedImageId === image.id ? "opacity-100" : "opacity-0"
                                    )} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 flex justify-center">
                        <Button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={isUnsplashLoading || isSubmitting}
                            className={cn(
                                "bg-blue-500 text-white hover:bg-blue-600 transition-colors",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isUnsplashLoading ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                    <div className="p-4 border-t">
                        <Button type="button" onClick={onClose} className="ml-auto">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const InputInvestmentClient: React.FC<InvestmentPortfolioFormProps> = ({ initialData }) => {
    // const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<InvestmentPortfolioErrors | null>(null);

    const [title, setTitle] = useState<string>(initialData?.title || '');
    const [description, setDescription] = useState<string>(initialData?.description || '');
    const [type, setType] = useState<'Real Estate' | 'StartUp' | 'Stock' | 'Equity' | 'Venture Capital' | 'Debt'>(initialData?.type || 'Equity');
    const [country, setCountry] = useState<string>(initialData?.country || '');
    const [targetAmount, setTargetAmount] = useState<number>(initialData?.targetAmount || 0);
    const [raisedAmount, setRaisedAmount] = useState<number>(initialData?.raisedAmount || 0);
    const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
    const [expectedReturn, setExpectedReturn] = useState<string | undefined>(initialData?.expectedReturn);
    const [active, setActive] = useState<boolean>(initialData?.active || true);
    const [id, setId] = useState<string | undefined>(initialData?.id);

    const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
    const [isUnsplashLoading, setIsUnsplashLoading] = useState(false);
    const [selectedUnsplashImageId, setSelectedUnsplashImageId] = useState<string | null>(initialData?.imageUrl ? initialData.imageUrl.split('|')[0] : null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unsplashPage, setUnsplashPage] = useState(1); // Track the page number for Unsplash API

    const [filters, setFilters] = useState<{
        query: string;
        orientation: 'landscape' | 'portrait' | 'squarish' | null;
        color: string | null;
    }>({
        query: '',
        orientation: null,
        color: null,
    });

    const isEditMode = !!initialData?.id;


    const { execute: executeCreatePortfolio, isLoading: isLoadingCreate, fieldErrors: createFieldErrors } = useAction(createPortfolio, {
        onSuccess: (data) => {
            toast.success(`Investment Portfolio created successfully!`);
            console.log(data);
            // router.push('/');
            //clearInput();
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const { execute: executeUpdatePortfolio, isLoading: isLoadingUpdate, fieldErrors: updateFieldErrors } = useAction(updatePortfolio, {
        onSuccess: (data) => {
            toast.success(`Investment Portfolio updated successfully!`);
            console.log(data);
            // router.push('/');
            clearInput();
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Fetch initial images or the selected image on initial load
    useEffect(() => {
        const fetchInitialData = async () => {
            if (isEditMode && initialData?.imageUrl) {
                // If in edit mode and there's an initial image URL, try to fetch that specific image
                const imageId = initialData.imageUrl.split('|')[0];
                try {
                    setIsUnsplashLoading(true);
                    const result = await unsplash.photos.get({ photoId: imageId });
                    if (result && result.response) {
                        setUnsplashImages([result.response]);
                        setSelectedUnsplashImageId(imageId);
                    }
                } catch (error) {
                    console.error("Error fetching initial image:", error);
                    // Fallback:  If the specific image can't be fetched, fetch a set of default images.
                    await fetchUnsplashImages(1);
                } finally {
                    setIsUnsplashLoading(false);
                }
            } else {
                // Otherwise, fetch a set of initial images
                await fetchUnsplashImages(1);
            }
        };
        fetchInitialData();
    }, [initialData, isEditMode]);

    // Fetch images from Unsplash
    const fetchUnsplashImages = useCallback(async (page: number) => {
        if (isUnsplashLoading) return; // Prevent concurrent loading
        setIsUnsplashLoading(true);
        try {
            const result = await unsplash.photos.getRandom({
                collectionIds: ["317099"], // Replace with your desired collection ID
                count: 8, // Load 8 images
               // page: page,
                query: filters.query,
                //orientation: filters.orientation,
                //color: filters.color
            });


            if (result && result.response) {
                const newImages = (result.response as UnsplashImage[]);
                console.log("Images from Unsplash:", newImages);
                setUnsplashImages(prevImages => [...prevImages, ...newImages]);
                setUnsplashPage(page + 1);
            } else {
                console.error("Failed to get images from Unsplash.  Result:", result);
                toast.error("Failed to load images. Please try again.");
            }
        } catch (error: any) {
            console.error("Error fetching Unsplash images:", error);
            toast.error(`Error fetching images: ${error.message || 'Unknown error'}`);

        } finally {
            setIsUnsplashLoading(false);
        }
    }, [isUnsplashLoading, setUnsplashPage, filters]);

    // Update imageUrl when a new image is selected
    useEffect(() => {
        if (selectedUnsplashImageId) {
            const selectedImage = unsplashImages.find(img => img.id === selectedUnsplashImageId);
            if (selectedImage) {
                setImageUrl(`${selectedImage.id}|${selectedImage.urls.thumb}|${selectedImage.urls.full}|${selectedImage.links.html}|${selectedImage.user.name}`);
            }
        }
    }, [selectedUnsplashImageId, unsplashImages]);

    const clearInput = () => {
        setTitle('');
        setDescription('');
        setType('Equity');
        setCountry('');
        setTargetAmount(0);
        setRaisedAmount(0);
        setImageUrl('');
        setExpectedReturn('');
        setActive(true);
        setErrors(null);
        setSelectedUnsplashImageId(null);
        setUnsplashImages([]);
        setUnsplashPage(1);
        setIsModalOpen(false);
        setFilters({ query: '', orientation: null, color: null });
    };

    const clearErrors = () => {
        setErrors(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitError(null);
        setErrors(null);

        const data: InvestmentPortfolioFormValues = {
            title: title,
            description: description,
            type: type,
            country: country,
            targetAmount: targetAmount,
            raisedAmount: raisedAmount,
            imageUrl: imageUrl,
            expectedReturn: expectedReturn,
            active: active,
            id: id, // Include the ID for updates
        };

        let formErrors: InvestmentPortfolioErrors = {};

        if (!data.type) {
            formErrors.type = "You need to select a portfolio type.";
        }
        if (!data.title.trim()) {
            formErrors.title = "Title is required";
        } else if (data.title.length < 2) {
            formErrors.title = "Title must be at least 2 characters.";
        }
        if (!data.description.trim()) {
            formErrors.description = "Description is required";
        } else if (data.description.length < 10) {
            formErrors.description = "Description must be at least 10 characters.";
        }
        if (!data.country.trim()) {
            formErrors.country = "Country is required";
        } else if (data.country.length < 2) {
            formErrors.country = "Country must be at least 2 characters";
        }
        if (!data.targetAmount) {
            formErrors.targetAmount = "Target amount is required";
        } else if (data.targetAmount <= 0) {
            formErrors.targetAmount = 'Target amount must be greater than 0';
        }
        if (!data.raisedAmount) {
            formErrors.raisedAmount = "Raised amount is required";
        }
        if (!data.imageUrl) {
            formErrors.imageUrl = "Please select an image.";
        }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            setIsSubmitting(false);
            return;
        }
        try {
            if (isEditMode && id) {
                // For updates, we need to make sure id is not undefined.
                const updateData: UpdatePortfolioParams = {
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    country: data.country,
                    targetAmount: data.targetAmount,
                    raisedAmount: data.raisedAmount,
                    imageUrl: data.imageUrl,
                    expectedReturn: data.expectedReturn,
                    active: data.active,
                    id: id,
                };
                await executeUpdatePortfolio(updateData);
            } else {
                // For creations, we omit the id
                const createData: CreatePortfolioParams = {
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    country: data.country,
                    targetAmount: data.targetAmount,
                    raisedAmount: data.raisedAmount,
                    imageUrl: data.imageUrl,
                    expectedReturn: expectedReturn,
                    active: data.active
                };
                await executeCreatePortfolio(createData);
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An error occurred while saving the portfolio.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (url: string) => {
        setImageUrl(url);
    };

    const openModal = () => {
        setIsModalOpen(true);
        // Clear existing images and reset to the first page when the modal is opened.
        setUnsplashImages([]);
        setUnsplashPage(1);
        setSelectedUnsplashImageId(null); // Clear selected image
        fetchUnsplashImages(1); // Load the first page of images
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const loadMoreImages = () => {
        fetchUnsplashImages(unsplashPage);
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-yellow-700">
                        {isEditMode ? 'Edit Portfolio' : 'Create New Portfolio'}
                    </CardTitle>
                    <CardDescription className="text-yellow-900">
                        {isEditMode
                            ? 'Modify the portfolio details below.'
                            : 'Fill out the form to create a new investment portfolio.'}
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
                            placeholder="Portfolio Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            error={errors?.title}
                            onKeyUp={clearErrors}
                        />

                        {/* Description */}
                        <FormInput
                            id="description"
                            name="description"
                            label="Description"
                            placeholder="Portfolio Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            error={errors?.description}
                            onKeyUp={clearErrors}
                            textarea={true}
                        />

                        {/* Type */}
                        <FormSelect
                            id="type"
                            name="type"
                            label="Type"
                            options={[
                                { label: 'Real Estate', value: 'Real Estate' },
                                { label: 'StartUp', value: 'StartUp' },
                                { label: 'Debt', value: 'Debt' },
                                { label: 'Stock', value: 'Stock' },
                                { label: 'Venture Capital', value: 'Venture Capital' },
                                { label: 'Debt', value: 'Debt' },

                            ]}
                            value={type}
                            onValueChange={(value) => setType(value as 'Real Estate' | 'StartUp' | 'Stock' | 'Equity' | 'Venture Capital' | 'Debt')}
                            error={errors?.type}
                        />

                        {/* Country */}
                        <FormInput
                            id="country"
                            name="country"
                            label="Country"
                            placeholder="Country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            error={errors?.country}
                            onKeyUp={clearErrors}
                        />

                        {/* Target Amount */}
                        <FormInput
                            id="targetAmount"
                            name="targetAmount"
                            label="Target Amount"
                            type="number"
                            placeholder="Target Amount"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(Number(e.target.value))}
                            error={errors?.targetAmount}
                            onKeyUp={clearErrors}
                        />

                        {/* Raised Amount */}
                        <FormInput
                            id="raisedAmount"
                            name="raisedAmount"
                            label="Raised Amount"
                            type="number"
                            placeholder="Raised Amount"
                            value={raisedAmount}
                            onChange={(e) => setRaisedAmount(Number(e.target.value))}
                            error={errors?.raisedAmount}
                            onKeyUp={clearErrors}
                        />

                        {/* Image Picker */}
                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image</label>
                            <div className="mt-1">
                                <Button
                                    type="button"
                                    onClick={openModal}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 transition-colors duration-200 border",
                                        imageUrl
                                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border-green-500/50"
                                            : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 hover:text-sky-300 border-sky-500/50"
                                    )}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    {imageUrl ? 'Change Image' : 'Choose Image'}
                                    {imageUrl && <Check className="w-4 h-4 ml-2" />}
                                </Button>
                                {imageUrl && <img 
                                                    src={imageUrl.split('|')[1]} // Access the first image URL // Access the first image URL} 
                                                    alt="Selected Image" 
                                                    className="mt-1 w-14 h-14 rounded-sm object-contain" 
                                />}
                                {errors?.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>}
                            </div>
                        </div>

                        {/* Expected Return */}
                        <FormInput
                            id="expectedReturn"
                            name="expectedReturn"
                            label="Expected Return"
                            placeholder="Expected Return (e.g., 10% annually)"
                            value={expectedReturn}
                            onChange={(e) => setExpectedReturn(e.target.value)}
                        />

                        {/* Active */}
                        <div className="flex items-center">
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
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full  bg-yellow-300 hover:bg-yellow-600 text-blue-700" disabled={isSubmitting || isLoadingCreate || isLoadingUpdate}>
                            {isSubmitting || isLoadingCreate || isLoadingUpdate ? 'Saving...' : isEditMode ? 'Update Portfolio' : 'Create Portfolio'}
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

            {/* Unsplash Image Picker Modal */}
            <ImagePickerModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSelect={handleImageSelect}
                unsplashImages={unsplashImages}
                isUnsplashLoading={isUnsplashLoading}
                loadMoreImages={loadMoreImages}
                setSelectedUnsplashImageId={setSelectedUnsplashImageId}
                selectedImageId={selectedUnsplashImageId}
                isSubmitting={isSubmitting}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    );
};

export default InputInvestmentClient;
