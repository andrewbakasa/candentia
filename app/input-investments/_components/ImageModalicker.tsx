import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Mock the unsplash client for demonstration purposes.  Replace with your actual import.
const unsplash = {
    search: {
        getPhotos: async (params: any) => {
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Mock API response - Replace with actual API call
            const { query, page, perPage } = params;
            if (!query) return { response: [], total: 0, total_pages: 0 }; // Return empty if no query

            const start = (page - 1) * perPage;
            const end = start + perPage;
            const allMockImages = Array.from({ length: 50 }, (_, i) => ({ // Create 50 mock images
                id: `${query}-${i + 1}`,
                urls: {
                    thumb: `https://placehold.co/100x100/${i % 10}00/FFF?text=${query}+${i + 1}&font=Roboto`, // Placeholder image
                    full: `https://placehold.co/800x600/${i % 10}00/FFF?text=${query}+${i + 1}&font=Roboto`,
                },
                links: { html: '#' },
                user: { name: 'Mock User' },
            }));

            const relevantImages = allMockImages.filter(img => img.id.includes(query));
            const pagedImages = relevantImages.slice(start, end);
            return {
                response: pagedImages,
                total: relevantImages.length,
                total_pages: Math.ceil(relevantImages.length / perPage),
            };
        },
    },
    photos: {
        getRandom: async (params: any) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const { count } = params;
            const mockImages = Array.from({ length: count }, (_, i) => ({
                id: `random-${Date.now()}-${i}`,
                urls: {
                    thumb: `https://placehold.co/100x100/${Math.floor(Math.random() * 1000)}/FFF?text=Random+${i + 1}&font=Roboto`,
                    full: `https://placehold.co/800x600/${Math.floor(Math.random() * 1000)}/FFF?text=Random+${i + 1}&font=Roboto`,
                },
                links: { html: '#' },
                user: { name: 'Random User' },
            }));
            return { response: mockImages };
        },
    },
};

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

interface ImagePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    setSelectedUnsplashImageId: (id: string | null) => void;
    unsplashImages: UnsplashImage[];
    isUnsplashLoading: boolean;
    loadMoreImages: (page: number, category: string) => void; // Corrected prop type
    selectedImageId: string | null;
    isSubmitting: boolean;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    setSelectedUnsplashImageId,
    unsplashImages,
    isUnsplashLoading,
    loadMoreImages: _loadMoreImages, // Renamed to avoid shadowing
    selectedImageId,
    isSubmitting,
}) => {
    const [searchCategory, setSearchCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true); // Track if there are more images to load
    const [localImages, setLocalImages] = useState<UnsplashImage[]>(unsplashImages);
    const [isLocallyLoading, setIsLocallyLoading] = useState(false);

    // Update localImages when unsplashImages changes
    useEffect(() => {
        setLocalImages(unsplashImages);
    }, [unsplashImages]);

    // Fetch images from Unsplash
    const fetchUnsplashImages = useCallback(
        async (page: number, category: string) => {
            if (isLocallyLoading) return;
            setIsLocallyLoading(true);

            try {
                let result: any; // Changed to 'any' to handle different response types
                if (category) {
                    result = await unsplash.search.getPhotos({
                        query: category,
                        page: page,
                        perPage: 12,
                    });
                } else {
                    result = await unsplash.photos.getRandom({
                        count: 12,
                    });
                }

                if (result && result.response) {
                    const newImages = Array.isArray(result.response) ? result.response : [result.response]; // Ensure result.response is an array
                    setLocalImages((prevImages) => [...prevImages, ...newImages]);
                    setCurrentPage((prevPage) => prevPage + 1);

                    // Determine if there are more pages.  Crucially important.
                    if (category) {
                        setHasMore(result.total_pages > page); // Use total_pages from mock
                    } else {
                        setHasMore(true); // Keep loading for random images
                    }
                } else {
                    console.error('Failed to get images from Unsplash. Result:', result);
                    toast.error('Failed to load images. Please try again.');
                }
            } catch (error: any) {
                console.error('Error fetching Unsplash images:', error);
                toast.error(`Error fetching images: ${error.message || 'Unknown error'}`);
            } finally {
                setIsLocallyLoading(false);
            }
        },
        [isLocallyLoading, unsplash.photos.getRandom, unsplash.search.getPhotos]
    );

    const handleCategoryChange = (value: string) => {
        setSearchCategory(value);
        setCurrentPage(1); // Reset to the first page when the category changes
        setLocalImages([]); // Clear existing images
        setHasMore(true);
        fetchUnsplashImages(1, value); // Load images for the new category
    };

    const handleImageSelect = (image: UnsplashImage) => {
        setSelectedUnsplashImageId(image.id);
        const imageUrl = `${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`;
        onSelect(imageUrl);
        onClose();
    };

    const loadMore = () => {
        if (hasMore) {
            fetchUnsplashImages(currentPage, searchCategory);
        }
    };

    // Initial load, fetch images on open
    useEffect(() => {
        if (isOpen) {
            setLocalImages([]); // Clear images
            setCurrentPage(1);
            setHasMore(true);
            fetchUnsplashImages(1, searchCategory);
        }
    }, [isOpen, searchCategory, fetchUnsplashImages]);

    // Animation Variants
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
    };

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: (i: number) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: i * 0.05, // Staggered delay for each image
                duration: 0.2,
            },
        }),
        exit: { opacity: 0, scale: 0.95 },
        hover: { scale: 1.03 },
        tap: { scale: 0.98 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Choose Image</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Search and Category Select */}
                        <div className="p-4 flex flex-col sm:flex-row gap-4">
                            <Input
                                type="text"
                                placeholder="Search images..."
                                className="w-full sm:w-auto"
                                onChange={(e) => {
                                    // You could implement a search keyword feature here
                                }}
                            />
                            <Select onValueChange={handleCategoryChange} value={searchCategory}>
                                <SelectTrigger className="w-full sm:w-auto">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All</SelectItem>
                                    <SelectItem value="abstract">Abstract</SelectItem>
                                    <SelectItem value="animals">Animals</SelectItem>
                                    <SelectItem value="city">City</SelectItem>
                                    <SelectItem value="nature">Nature</SelectItem>
                                    <SelectItem value="people">People</SelectItem>
                                    <SelectItem value="technology">Technology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Image Grid */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[calc(80vh-16rem)] overflow-y-auto">
                            <AnimatePresence>
                                {localImages.map((image, index) => (
                                    <motion.div
                                        key={image.id}
                                        variants={imageVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        custom={index}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className={cn(
                                            'relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-200',
                                            'aspect-square border-2',
                                            selectedImageId === image.id
                                                ? 'border-blue-500 shadow-lg shadow-blue-500/30'
                                                : 'border-transparent hover:border-gray-200'
                                        )}
                                        onClick={() => handleImageSelect(image)}
                                    >
                                        <img
                                            src={image.urls.thumb}
                                            alt={image.user.name}
                                            className="object-cover w-full h-full"
                                        />
                                        {selectedImageId === image.id && (
                                            <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                                <Check className="w-8 h-8 text-blue-400" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLocallyLoading && (
                                <div className="col-span-full flex items-center justify-center">
                                    <p>Loading...</p>
                                </div>
                            )}
                        </div>
                        {/* "Load More" Button */}
                        {hasMore && (
                            <div className="col-span-full flex justify-center mt-4">
                                <Button
                                    onClick={loadMore}
                                    disabled={isLocallyLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {isLocallyLoading ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImagePickerModal;




// 'use client';
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { Loader2, Check, X, Link as LinkIcon, Search } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { Input } from "@/components/ui/input"

// interface ImagePickerModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onSelect: (imageUrl: string) => void;
//     unsplashImages: Array<Record<string, any>>;
//     isUnsplashLoading: boolean;
//     setSelectedUnsplashImageId: (x: string) => void;
//     selectedImageId: string | null;
//     isSubmitting: boolean;
//     fetchInitialUnsplashImages: () => void; // New prop to fetch images
// }

// // Image Picker Modal Component
// export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
//     isOpen, onClose, onSelect, unsplashImages,
//     isUnsplashLoading, setSelectedUnsplashImageId,
//     selectedImageId, isSubmitting,
//     fetchInitialUnsplashImages // Destructure the new prop
// }) => {
//     const [localUnsplashImages, setLocalUnsplashImages] = useState<Array<Record<string, any>>>([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//     const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

//        // Debounce function
//        const debounce = (func: (...args: any[]) => void, delay: number) => {
//         let timeoutId: NodeJS.Timeout | null;
//         return (...args: any[]) => {
//             if (timeoutId) {
//                 clearTimeout(timeoutId);
//             }
//             timeoutId = setTimeout(() => {
//                 func(...args);
//             }, delay);
//         };
//     };


//     // Update local images when new images are fetched
//     useEffect(() => {
//         setLocalUnsplashImages(unsplashImages.slice(0, 20)); // Limit initial load
//     }, [unsplashImages]);

//     // Load initial images when the modal opens
//     useEffect(() => {
//         if (isOpen && !hasLoadedInitial) {
//             setLocalUnsplashImages([]);
//             fetchInitialUnsplashImages();
//             setHasLoadedInitial(true);
//         } else if (!isOpen) {
//             setHasLoadedInitial(false); // Reset when modal closes
//             setSearchQuery(''); // Clear search query on close
//         }
//     }, [isOpen, fetchInitialUnsplashImages, hasLoadedInitial]);

//     const handleImageSelect = (image: any) => {
//         const imageUrl = `${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`;
//         onSelect(imageUrl);
//         onClose();
//     };

//     const handleSearch = useCallback(() => {
//         fetchInitialUnsplashImages(); // Re-fetch with the search query
//     }, [fetchInitialUnsplashImages]);

//     const debouncedSearch = useRef(debounce(handleSearch, 500)).current; // 500ms debounce

//     const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSearchQuery(e.target.value);
//         if (searchTimeoutRef.current) {
//             clearTimeout(searchTimeoutRef.current);
//         }
//         searchTimeoutRef.current = setTimeout(() => {
//             handleSearch();
//         }, 500);
//     };

//     useEffect(() => {
//         return () => {
//             if (searchTimeoutRef.current) {
//                 clearTimeout(searchTimeoutRef.current);
//             }
//         };
//     }, []);

 
//     if (!isOpen) return null;

//     return (
//         <>
//             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
//                 <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
//                     {/* Modal Header */}
//                     <div className="p-4 border-b flex items-center justify-between">
//                         <h2 className="text-lg font-semibold">Choose an Image from Unsplash</h2>
//                         <Button
//                             variant="ghost"
//                             onClick={onClose}
//                             className="absolute top-2 right-2"
//                         >
//                             <X className="h-5 w-5" />
//                         </Button>
//                     </div>

//                     {/* Search Input */}
//                     <div className="p-4">
//                         <div className="flex items-center gap-2">
//                             <Input
//                                 type="text"
//                                 placeholder="Search images..."
//                                 value={searchQuery}
//                                 onChange={handleSearchInputChange}
//                                 className="flex-1"
//                             />
//                             <Button
//                                 variant="outline"
//                                 onClick={debouncedSearch}
//                                 disabled={isSubmitting}
//                             >
//                                 <Search className="h-4 w-4" />
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Modal Content */}
//                     <div className="p-4 grid grid-cols-3 gap-4">
//                         {localUnsplashImages.map((image) => (
//                             <div
//                                 key={image.id}
//                                 className={cn(
//                                     "cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted rounded-md",
//                                     isSubmitting && "opacity-50 hover:opacity-50 cursor-auto",
//                                     selectedImageId === image.id && "ring-2 ring-sky-500 border-2 border-sky-500",
//                                     "overflow-hidden"
//                                 )}
//                                 onClick={() => {
//                                     if (!isSubmitting) {
//                                         setSelectedUnsplashImageId(image.id);
//                                     }
//                                 }}
//                             >
//                                 <input
//                                     type="radio"
//                                     id={`image-${image.id}`}
//                                     name="image"
//                                     className="hidden"
//                                     checked={selectedImageId === image.id}
//                                     disabled={isSubmitting}
//                                     value={`${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`}
//                                     onChange={() => {
//                                         if (!isSubmitting) {
//                                             setSelectedUnsplashImageId(image.id);
//                                         }
//                                     }}
//                                 />
//                                 <Image
//                                     src={`${image.urls.thumb}?${Date.now()}`} // Add cache-busting
//                                     alt={image.alt_description || "Unsplash image"}
//                                     className="object-cover rounded-md"
//                                     fill
//                                     key={`${image.id}-${Date.now()}`}
//                                 />
//                                 {selectedImageId === image.id && (
//                                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
//                                         <Check className="h-6 w-6 text-white" />
//                                     </div>
//                                 )}
//                                 <Link
//                                     href={image.links.html}
//                                     target="_blank"
//                                     className="opacity-0 group-hover:opacity-100 absolute bottom-0 w-full text-[10px] truncate text-white hover:underline p-1 bg-black/50 rounded-b-sm flex items-center gap-1"
//                                 >
//                                     <LinkIcon className='w-3 h-3' />
//                                     <span>{image.user.name}</span>
//                                 </Link>
//                             </div>
//                         ))}
//                         {isUnsplashLoading && (
//                             <div className="col-span-3 flex justify-center items-center p-4">
//                                 <Loader2 className="h-6 w-6 text-sky-700 animate-spin" />
//                             </div>
//                         )}
//                         {localUnsplashImages.length === 0 && !isUnsplashLoading && (
//                             <div className="col-span-3 text-center p-4 text-gray-500">
//                                 {searchQuery ? "No images found for your search." : "Loading images..."}
//                             </div>
//                         )}
//                     </div>

//                     {/* Modal Footer */}
//                     <div className="p-4 border-t flex justify-end">
//                         <Button
//                             variant="outline"
//                             onClick={onClose}
//                             className="mr-2"
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={() => {
//                                 if (selectedImageId) {
//                                     const selectedImage = localUnsplashImages.find(img => img.id === selectedImageId);
//                                     if (selectedImage) {
//                                         handleImageSelect(selectedImage);
//                                     }
//                                 }
//                             }}
//                             disabled={!selectedImageId || isSubmitting}
//                         >
//                             Select Image
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };