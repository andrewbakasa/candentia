'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils'; // Assuming cn helps with conditional class names
import { BsFilePdfFill, BsFileWordFill, BsFileExcelFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';
import { AlertCircle } from 'lucide-react';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';

interface MediaProps {
    id: string;
    url: string;
    cardId: string;
    type: string;
    fileName: string | null;
    description: string | null;
}

interface SliderProps {
    mediaList?: MediaProps[];
    fullView: boolean;
    onCardIdChange: (cardId: string | null, index: number) => void;
    onDescriptionChange: (mediaId: string, newDescription: string | null) => void;
    onFileNameChange: (mediaId: string, newFileName: string | null) => void;
    canEdit: boolean;
}

const Slider: React.FC<SliderProps> = ({ mediaList, fullView, onCardIdChange, onDescriptionChange, onFileNameChange, canEdit }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [emblaApi, setEmblaApi] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New: Store refs for video elements
    const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [tempDescription, setTempDescription] = useState<string>('');
    const descriptionDisplayRef = useRef<HTMLSpanElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [editingFileNameId, setEditingFileNameId] = useState<string | null>(null);
    const [tempFileName, setTempFileName] = useState<string>('');
    const [originalFileExtension, setOriginalFileExtension] = useState<string | null>(null);
    // const fileNameContainerRef = useRef<HTMLDivElement>(null); // This ref isn't directly used for measurements, so it can be omitted if not needed elsewhere

    useEffect(() => {
        if (mediaList) {
            mediaList.forEach((item) => {
                if (item.type === 'image') {
                    const img = new window.Image();
                    img.src = item.url;
                    img.onerror = () => {
                        setError(`Failed to load image: ${item.url}`);
                    };
                }
            });
        }
    }, [mediaList]);

    useEffect(() => {
        if (editingMediaId && descriptionTextareaRef.current) {
            const textarea = descriptionTextareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height to content
        }
    }, [editingMediaId, tempDescription]);

    const renderMediaContent = (item: MediaProps) => {
        try {
            switch (item.type) {
                case 'image':
                    return (
                        <Image
                            src={item.url}
                            alt={item.fileName || "media"}
                            // Removed `fill` and `sizes` if the parent handles exact dimensions
                            // For responsive images within a constrained container, `object-contain` is key.
                            // `fill` can be tricky with parent sizing, especially with dynamic height.
                            // Let's rely on `w-full h-full` on the parent and `object-contain` on the image.
                            width={1200} // Provide a generous width/height for Next/Image optimization
                            height={800} // These are for aspect ratio and optimization, not fixed display size
                            className="w-full h-full object-contain" // crucial for fitting within parent
                            priority={currentImage === 0} // Only for the first image
                            quality={75}
                            onError={() => setError(`Failed to load image: ${item.url}`)}
                        />
                    );
                case 'video':
                    return (
                        <video
                            ref={el => {
                                if (el) {
                                    videoRefs.current.set(item.id, el);
                                } else {
                                    videoRefs.current.delete(item.id);
                                }
                            }}
                            src={item.url}
                            controls
                            className="rounded-md object-contain w-full h-full"
                            onError={() => setError(`Failed to load video: ${item.url}`)}
                            preload="metadata" // Optimize video loading
                        />
                    );
                case 'raw':
                    const fileExtension = item.url.substring(item.url.lastIndexOf('.') + 1);
                    return (
                        <div className="flex flex-col items-center justify-center w-full h-full rounded-md bg-gray-100 p-4 text-center">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center max-w-full">
                                <span className="text-6xl text-gray-500">{getFileIcon(fileExtension)}</span>
                                <span className="text-gray-600 mt-2 text-sm break-all">{fileExtension.toUpperCase()} File</span>
                            </a>
                        </div>
                    );
                case 'emptyMedia':
                    return (
                        <div className="flex items-center justify-center w-full h-full rounded-md bg-gray-100 text-gray-500">
                            No media
                        </div>
                    );
                default:
                    return (
                        <div className="flex items-center justify-center w-full h-full rounded-md bg-gray-100 text-gray-500">
                            Unsupported media type
                        </div>
                    );
            }
        } catch (e: any) {
            setError(`Error rendering media: ${e.message}`);
            return (
                <div className="flex flex-col items-center justify-center w-full h-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">Failed to display media.</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                        <XIcon className="h-6 w-6 text-red-500" />
                    </span>
                </div>
            );
        }
    };

    const getFileIcon = (extension: string) => {
        switch (extension.toLowerCase()) {
            case 'pdf': return <BsFilePdfFill />;
            case 'docx': case 'doc': return <BsFileWordFill />;
            case 'xlsx': case 'xls': return <BsFileExcelFill />;
            case 'zip': case 'rar': return <FaArchive />;
            default: return null;
        }
    };

    const handleCarouselChange = (index: number) => {
        setCurrentImage(index);
        setEditingMediaId(null);
        setTempDescription('');
        setEditingFileNameId(null);
        setTempFileName('');
        setOriginalFileExtension(null);

        if (mediaList && mediaList.length > 0) {
            const currentItem = mediaList[index];
            onCardIdChange(currentItem?.cardId || null, index);

            // Pause all videos except the current one
            videoRefs.current.forEach((videoElement, mediaId) => {
                if (videoElement && mediaId !== currentItem.id && !videoElement.paused) {
                    videoElement.pause();
                }
            });
        } else {
            onCardIdChange(null, index);
        }
    };

    useEffect(() => {
        if (mediaList && mediaList.length > 0) {
            handleCarouselChange(0);
        }
        // Only re-run if mediaList changes in a way that implies a new initial state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaList]); // Dependency on first item's ID or if list becomes empty/full

    const onEmblaInit = (api: any) => {
        setEmblaApi(api);
        api.on("select", () => {
            const index = api.selectedScrollSnap();
            if (typeof index === 'number') {
                handleCarouselChange(index);
            } else {
                console.error("Could not determine Embla index. Check Embla version and configuration.");
            }
        });
        // Initial call to set the first item's details if list exists
        if (mediaList && mediaList.length > 0) {
            handleCarouselChange(api.selectedScrollSnap());
        }
    };

    // --- Description Editing Handlers ---
    const handleEditClick = (e: React.MouseEvent, mediaId: string, currentDesc: string | null) => {
        e.stopPropagation();
        if (canEdit) {
            setEditingMediaId(mediaId);
            setTempDescription(currentDesc || '');
            setEditingFileNameId(null);
            setOriginalFileExtension(null);

            if (descriptionDisplayRef.current && descriptionTextareaRef.current) {
                setTimeout(() => {
                    const textarea = descriptionTextareaRef.current!;
                    // Set height based on scrollHeight to fit content
                    textarea.style.height = 'auto';
                    textarea.style.height = `${textarea.scrollHeight}px`;
                    textarea.focus();
                }, 0);
            }
        }
    };

    const handleSaveDescription = (e: React.MouseEvent, mediaId: string) => {
        e.stopPropagation();
        if (canEdit) {
            onDescriptionChange(mediaId, tempDescription);
            setEditingMediaId(null);
            setTempDescription('');
        }
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingMediaId(null);
        setTempDescription('');
    };

    const handleDescriptionInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempDescription(e.target.value);
        // Auto-adjust textarea height as user types
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, mediaId: string) => {
        if (canEdit) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveDescription(e as any, mediaId);
            } else if (e.key === 'Escape') {
                handleCancelEdit(e as any);
            }
        }
    };

    // --- Filename Editing Handlers ---
    const handleEditFileNameClick = (e: React.MouseEvent, mediaId: string, currentFileName: string | null) => {
        e.stopPropagation();
        if (canEdit) {
            setEditingFileNameId(mediaId);
            setTempFileName(currentFileName || '');

            if (currentFileName) {
                const lastDotIndex = currentFileName.lastIndexOf('.');
                if (lastDotIndex > -1) {
                    setOriginalFileExtension(currentFileName.substring(lastDotIndex));
                } else {
                    setOriginalFileExtension('');
                }
            } else {
                setOriginalFileExtension('');
            }
            setEditingMediaId(null); // Ensure description editing is off
            setTempDescription('');
        }
    };

    const handleSaveFileName = (e: React.MouseEvent, mediaId: string) => {
        e.stopPropagation();
        if (canEdit) {
            let newFileName = tempFileName.trim();

            if (originalFileExtension && originalFileExtension.length > 0) {
                const currentExtension = newFileName.lastIndexOf('.') > -1 ? newFileName.substring(newFileName.lastIndexOf('.')) : '';
                if (currentExtension.toLowerCase() !== originalFileExtension.toLowerCase()) {
                    newFileName = newFileName.replace(/\.[^/.]+$/, "") + originalFileExtension;
                }
            }

            onFileNameChange(mediaId, newFileName);
            setEditingFileNameId(null);
            setTempFileName('');
            setOriginalFileExtension(null);
        }
    }

    const handleCancelFileNameEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFileNameId(null);
        setTempFileName('');
        setOriginalFileExtension(null);
    };

    const handleFileNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        if (originalFileExtension !== null && originalFileExtension.length > 0) {
            const lastDotIndex = inputValue.lastIndexOf('.');
            const currentExtension = lastDotIndex > -1 ? inputValue.substring(lastDotIndex) : '';

            if (lastDotIndex > -1 && currentExtension.toLowerCase() !== originalFileExtension.toLowerCase()) {
                // If user changed extension, revert to original
                inputValue = inputValue.substring(0, lastDotIndex) + originalFileExtension;
            } else if (lastDotIndex === -1 && inputValue.length > 0 && originalFileExtension.startsWith('.')) {
                // If no extension typed, but original had one, add it back
                inputValue = inputValue + originalFileExtension;
            }
        }
        setTempFileName(inputValue);
    };

    const handleFileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, mediaId: string) => {
        if (canEdit) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveFileName(e as any, mediaId);
            } else if (e.key === 'Escape') {
                handleCancelFileNameEdit(e as any);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-2 sm:p-4 w-full min-h-[50vh] bg-gray-50 rounded-lg shadow-xl">
            {mediaList && mediaList?.length > 0 ? (
                <div className={cn(
                    "relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg flex flex-col w-full",
                    // For fullView: occupy most of the available height but be responsive
                    // Use max-h to prevent overflow and h-full to fill parent when space is available
                    fullView ? "max-h-[70vh] h-full" : "max-h-[50vh] h-full"
                )}>
                    <Carousel
                        className="w-full h-full" // Carousel and CarouselContent should take full size of parent
                        ref={carouselRef}
                        setApi={onEmblaInit}
                        opts={{ loop: true }}
                    >
                        <CarouselContent>
                            {mediaList.map((item, index) => (
                                <CarouselItem
                                    key={item.id}
                                    className={cn(
                                        "flex flex-col",
                                        // Ensure CarouselItem takes full width and adapts height
                                        fullView ? "basis-full max-h-[60vh]" : "basis-full max-h-[40vh]" // Adjust max-h for responsiveness
                                    )}
                                >
                                    <div className="relative w-full h-full rounded-t-md overflow-hidden bg-gray-100 flex items-center justify-center flex-grow">
                                        {renderMediaContent(item)}

                                        {canEdit && (
                                            <div
                                                // Removed fileNameContainerRef as it wasn't strictly necessary for direct styling/measurement
                                                className={cn(
                                                    "absolute bottom-0 left-0 right-0 text-white text-sm p-2 rounded-b-lg overflow-hidden flex items-center justify-between z-10",
                                                    editingFileNameId === item.id ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
                                                )}
                                            >
                                                {editingFileNameId === item.id ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={tempFileName}
                                                            onChange={handleFileNameInputChange}
                                                            onKeyDown={(e) => handleFileNameKeyDown(e, item.id)}
                                                            className="flex-grow bg-gray-700 text-white p-1 rounded outline-none min-w-0" // Added min-w-0 for flex item to shrink
                                                            autoFocus
                                                        />
                                                        <div className="ml-2 flex space-x-1 flex-shrink-0"> {/* Ensure buttons don't shrink */}
                                                            <button
                                                                onClick={(e) => handleSaveFileName(e, item.id)}
                                                                className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600"
                                                                title="Save Filename"
                                                            >
                                                                <CheckIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelFileNameEdit}
                                                                className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                                                title="Cancel Filename Edit"
                                                            >
                                                                <XIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-grow text-left truncate min-w-0"> {/* Added min-w-0 for text truncation */}
                                                            {item.fileName || 'No filename'}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleEditFileNameClick(e, item.id, item.fileName)}
                                                            className="ml-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex-shrink-0"
                                                            title="Edit Filename"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative p-2 text-sm text-gray-700 bg-white rounded-b-md flex flex-col flex-grow overflow-auto">
                                        {canEdit && editingMediaId === item.id ? (
                                            <div className="flex flex-col h-full">
                                                <textarea
                                                    ref={descriptionTextareaRef}
                                                    className="w-full flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto"
                                                    value={tempDescription}
                                                    onChange={handleDescriptionInputChange}
                                                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end space-x-2 mt-2">
                                                    <button
                                                        onClick={(e) => handleSaveDescription(e, item.id)}
                                                        className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600"
                                                        title="Save"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                                        title="Cancel"
                                                    >
                                                        <XIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center h-full">
                                                <span
                                                    ref={descriptionDisplayRef}
                                                    className="text-left flex-grow overflow-y-auto max-h-[100px] pr-2 text-base"
                                                >
                                                    {item.description || 'No description provided.'}
                                                </span>
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => handleEditClick(e, item.id, item?.description)}
                                                        className="ml-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex-shrink-0"
                                                        title="Edit Description"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {/* Carousel navigation buttons */}
                        <CarouselPrevious className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <CarouselNext className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </Carousel>
                </div>
            ) : mediaList && mediaList?.length === 0 ? (
                <div className={cn("flex items-center justify-center w-full rounded-lg bg-gray-400", fullView ? "h-[50vh]" : "h-[200px]")}>
                    <p className="text-white">No media available.</p>
                </div>
            ) : (
                <div className={cn("w-full animate-pulse rounded-lg bg-zinc-700", fullView ? "h-[70vh]" : "h-[200px]")} />
            )}
            {error && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-full z-10 text-center sm:text-left">
                    <AlertCircle className="h-6 w-6 text-red-500 mb-2 mx-auto sm:mx-0" />
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <span className="absolute top-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                        <XIcon className="h-6 w-6 text-red-500" />
                    </span>
                </div>
            )}
        </div>
    );
};

export default Slider;
// 'use client';

// import React, { useEffect, useState, useRef } from 'react';
// import Image from 'next/image';
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
// import { cn, truncateString } from '@/lib/utils';
// import { BsFilePdfFill, BsFileWordFill, BsFileExcelFill } from 'react-icons/bs';
// import { FaArchive } from 'react-icons/fa';
// import { AlertCircle } from 'lucide-react';
// import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';

// interface MediaProps {
//   id: string;
//   url: string;
//   cardId: string;
//   type: string;
//   fileName: string | null;
//   description: string | null;
// }

// interface SliderProps {
//   mediaList?: MediaProps[];
//   fullView: boolean;
//   onCardIdChange: (cardId: string | null, index: number) => void;
//   onDescriptionChange: (mediaId: string, newDescription: string | null) => void;
//   onFileNameChange: (mediaId: string, newFileName: string | null) => void;
//   canEdit: boolean;
// }

// const Slider: React.FC<SliderProps> = ({ mediaList, fullView, onCardIdChange, onDescriptionChange, onFileNameChange, canEdit }) => {
//   const [currentImage, setCurrentImage] = useState(0);
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const [emblaApi, setEmblaApi] = useState<any | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // New: Store refs for video elements
//   const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

//   const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
//   const [tempDescription, setTempDescription] = useState<string>('');
//   const descriptionDisplayRef = useRef<HTMLSpanElement>(null);
//   const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

//   const [editingFileNameId, setEditingFileNameId] = useState<string | null>(null);
//   const [tempFileName, setTempFileName] = useState<string>('');
//   const [originalFileExtension, setOriginalFileExtension] = useState<string | null>(null);
//   const fileNameContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (mediaList) {
//       mediaList.forEach((item) => {
//         if (item.type === 'image') {
//           const img = new window.Image();
//           img.src = item.url;
//           img.onerror = () => {
//             setError(`Failed to load image: ${item.url}`);
//           };
//         }
//       });
//     }
//   }, [mediaList]);

//   useEffect(() => {
//     if (editingMediaId && descriptionTextareaRef.current) {
//       const textarea = descriptionTextareaRef.current;
//       textarea.style.height = 'auto';
//     }
//   }, [editingMediaId, tempDescription]);

//   const renderMediaContent = (item: MediaProps) => {
//     try {
//       switch (item.type) {
//         case 'image':
//           return (
//             <Image
//               src={item.url}
//               alt={item.fileName || "media"}
//               fill
//               sizes="100vw"
//               style={{ objectFit: 'contain' }}
//               priority={currentImage === 0}
//               quality={75}
//               onError={() => setError(`Failed to load image: ${item.url}`)}
//             />
//           );
//         case 'video':
//           return (
//             <video
//               // Attach ref to the video element using a callback ref
//               ref={el => {
//                 if (el) {
//                   videoRefs.current.set(item.id, el);
//                 } else {
//                   videoRefs.current.delete(item.id);
//                 }
//               }}
//               src={item.url}
//               controls
//               className="rounded-md object-contain w-full h-full"
//               onError={() => setError(`Failed to load video: ${item.url}`)}
//             />
//           );
//         case 'raw':
//           const fileExtension = item.url.substring(item.url.lastIndexOf('.') + 1);
//           return (
//             <div className="flex flex-col items-center justify-center w-full h-full rounded-md bg-gray-100 p-4 text-center">
//               <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center max-w-full">
//                 <span className="text-6xl text-gray-500">{getFileIcon(fileExtension)}</span>
//                 <span className="text-gray-600 mt-2 text-sm break-all">{fileExtension.toUpperCase()} File</span>
//               </a>
//             </div>
//           );
//         case 'emptyMedia':
//           return (
//             <div className="flex items-center justify-center w-full h-full rounded-md bg-gray-100 text-gray-500">
//               No media
//             </div>
//           );
//         default:
//           return (
//             <div className="flex items-center justify-center w-full h-full rounded-md bg-gray-100 text-gray-500">
//               Unsupported media type
//             </div>
//           );
//       }
//     } catch (e: any) {
//       setError(`Error rendering media: ${e.message}`);
//       return (
//         <div className="flex flex-col items-center justify-center w-full h-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
//           <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">Failed to display media.</span>
//           <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
//             <XIcon className="h-6 w-6 text-red-500" />
//           </span>
//         </div>
//       );
//     }
//   };

//   const getFileIcon = (extension: string) => {
//     switch (extension.toLowerCase()) {
//       case 'pdf': return <BsFilePdfFill />;
//       case 'docx': case 'doc': return <BsFileWordFill />;
//       case 'xlsx': case 'xls': return <BsFileExcelFill />;
//       case 'zip': case 'rar': return <FaArchive />;
//       default: return null;
//     }
//   };

//   const handleCarouselChange = (index: number) => {
//     setCurrentImage(index);
//     setEditingMediaId(null);
//     setTempDescription('');
//     setEditingFileNameId(null);
//     setTempFileName('');
//     setOriginalFileExtension(null);

//     if (mediaList && mediaList.length > 0) {
//       const currentItem = mediaList[index];
//       onCardIdChange(currentItem?.cardId || null, index);

//       // --- New: Pause all videos except the current one ---
//       videoRefs.current.forEach((videoElement, mediaId) => {
//         if (videoElement && mediaId !== currentItem.id && !videoElement.paused) {
//           videoElement.pause();
//         }
//       });
//       // Optionally, if you want the newly selected video to play automatically (be careful with browser autoplay policies)
//       // const currentVideo = videoRefs.current.get(currentItem.id);
//       // if (currentVideo && currentVideo.paused) {
//       //   currentVideo.play().catch(error => {
//       //     console.warn("Autoplay was prevented:", error);
//       //   });
//       // }
//     } else {
//       onCardIdChange(null, index);
//     }
//   };

//   useEffect(() => {
//     if (mediaList && mediaList.length > 0) {
//       handleCarouselChange(0);
//     }
//   }, [mediaList]);

//   const onEmblaInit = (api: any) => {
//     setEmblaApi(api);
//     api.on("select", () => {
//       const index = api.selectedScrollSnap();
//       if (typeof index === 'number') {
//         handleCarouselChange(index);
//       } else {
//         console.error("Could not determine Embla index. Check Embla version and configuration.");
//       }
//     });
//   };

//   // --- Description Editing Handlers ---
//   const handleEditClick = (e: React.MouseEvent, mediaId: string, currentDesc: string | null) => {
//     e.stopPropagation();
//     if (canEdit) {
//       setEditingMediaId(mediaId);
//       setTempDescription(currentDesc || '');
//       setEditingFileNameId(null);
//       setOriginalFileExtension(null);

//       if (descriptionDisplayRef.current && descriptionTextareaRef.current) {
//         setTimeout(() => {
//           const displayHeight = descriptionDisplayRef.current!.offsetHeight;
//           const textarea = descriptionTextareaRef.current!;
//           textarea.style.minHeight = `${displayHeight}px`;
//           textarea.style.height = '100%';
//           textarea.focus();
//         }, 0);
//       }
//     }
//   };

//   const handleSaveDescription = (e: React.MouseEvent, mediaId: string) => {
//     e.stopPropagation();
//     if (canEdit) {
//       onDescriptionChange(mediaId, tempDescription);
//       setEditingMediaId(null);
//       setTempDescription('');
//     }
//   };

//   const handleCancelEdit = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setEditingMediaId(null);
//     setTempDescription('');
//   };

//   const handleDescriptionInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setTempDescription(e.target.value);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, mediaId: string) => {
//     if (canEdit) {
//       if (e.key === 'Enter' && !e.shiftKey) {
//         e.preventDefault();
//         handleSaveDescription(e as any, mediaId);
//       } else if (e.key === 'Escape') {
//         handleCancelEdit(e as any);
//       }
//     }
//   };

//   // --- Filename Editing Handlers ---
//   const handleEditFileNameClick = (e: React.MouseEvent, mediaId: string, currentFileName: string | null) => {
//     e.stopPropagation();
//     if (canEdit) {
//       setEditingFileNameId(mediaId);
//       setTempFileName(currentFileName || '');

//       if (currentFileName) {
//         const lastDotIndex = currentFileName.lastIndexOf('.');
//         if (lastDotIndex > -1) {
//           setOriginalFileExtension(currentFileName.substring(lastDotIndex));
//         } else {
//           setOriginalFileExtension('');
//         }
//       } else {
//         setOriginalFileExtension('');
//       }
//       setEditingMediaId(null);
//       setTempDescription('');
//     }
//   };

//   const handleSaveFileName = (e: React.MouseEvent, mediaId: string) => {
//     e.stopPropagation();
//     if (canEdit) {
//       let newFileName = tempFileName.trim();

//       if (originalFileExtension && originalFileExtension.length > 0) {
//         const currentExtension = newFileName.lastIndexOf('.') > -1 ? newFileName.substring(newFileName.lastIndexOf('.')) : '';
//         if (currentExtension.toLowerCase() !== originalFileExtension.toLowerCase()) {
//           newFileName = newFileName.replace(/\.[^/.]+$/, "") + originalFileExtension;
//         }
//       }

//       onFileNameChange(mediaId, newFileName);
//       setEditingFileNameId(null);
//       setTempFileName('');
//       setOriginalFileExtension(null);
//     }
//   }

//   const handleCancelFileNameEdit = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setEditingFileNameId(null);
//     setTempFileName('');
//     setOriginalFileExtension(null);
//   };

//   const handleFileNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let inputValue = e.target.value;

//     if (originalFileExtension !== null && originalFileExtension.length > 0) {
//       const lastDotIndex = inputValue.lastIndexOf('.');
//       const currentExtension = lastDotIndex > -1 ? inputValue.substring(lastDotIndex) : '';

//       if (lastDotIndex > -1 && currentExtension.toLowerCase() !== originalFileExtension.toLowerCase()) {
//         inputValue = inputValue.substring(0, lastDotIndex) + originalFileExtension;
//       } else if (lastDotIndex === -1 && inputValue.length > 0 && originalFileExtension.startsWith('.')) {
//         inputValue = inputValue + originalFileExtension;
//       }
//     }
//     setTempFileName(inputValue);
//   };

//   const handleFileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, mediaId: string) => {
//     if (canEdit) {
//       if (e.key === 'Enter') {
//         e.preventDefault();
//         handleSaveFileName(e as any, mediaId);
//       } else if (e.key === 'Escape') {
//         handleCancelFileNameEdit(e as any);
//       }
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center p-4 min-h-[50vh] bg-gray-50 rounded-lg shadow-xl">
//       {mediaList && mediaList?.length > 0 ? (
//         <div className={cn(
//           "relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg flex flex-col",
//           fullView ? "w-full max-w-4xl h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]" : "w-full max-w-2xl h-[calc(100vh-200px)] md:h-[calc(100vh-250px)]"
//         )}>
//           <Carousel
//             className="w-full h-full"
//             ref={carouselRef}
//             setApi={onEmblaInit}
//             opts={{ loop: true }}
//           >
//             <CarouselContent>
//               {mediaList.map((item, index) => (
//                 <CarouselItem
//                   key={item.id}
//                   className={cn(fullView ? "h-[65vh] w-[65vw]" : "h-[50vh] w-[50vw]", "flex flex-col")}
//                 >
//                   <div className="relative w-full h-full rounded-t-md overflow-hidden bg-gray-100 flex items-center justify-center flex-grow">
//                     {renderMediaContent(item)}

//                     {canEdit && (
//                       <div ref={fileNameContainerRef} className={cn("absolute bottom-0 left-0 right-0 text-white text-sm p-2 rounded-b-lg overflow-hidden flex items-center justify-between", editingFileNameId === item.id ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50")}>
//                         {editingFileNameId === item.id ? (
//                           <>
//                             <input
//                               type="text"
//                               value={tempFileName}
//                               onChange={handleFileNameInputChange}
//                               onKeyDown={(e) => handleFileNameKeyDown(e, item.id)}
//                               className="w-full bg-gray-700 text-white p-1 rounded outline-none"
//                               autoFocus
//                             />
//                             <div className="ml-2 flex space-x-1 z-10">
//                               <button
//                                 onClick={(e) => handleSaveFileName(e, item.id)}
//                                 className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
//                                 title="Save Filename"
//                               >
//                                 <CheckIcon className="h-4 w-4" />
//                               </button>
//                               <button
//                                 onClick={handleCancelFileNameEdit}
//                                 className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 flex-shrink-0"
//                                 title="Cancel Filename Edit"
//                               >
//                                 <XIcon className="h-4 w-4" />
//                               </button>
//                             </div>
//                           </>
//                         ) : (
//                           <>
//                             <span className="flex-grow text-left truncate">
//                               {item.fileName || 'No filename'}
//                             </span>
//                             <button
//                               onClick={(e) => handleEditFileNameClick(e, item.id, item.fileName)}
//                               className="ml-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex-shrink-0"
//                               title="Edit Filename"
//                             >
//                               <PencilIcon className="h-4 w-4" />
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <div className="relative p-2 text-sm text-gray-700 bg-white rounded-b-md flex flex-col flex-grow overflow-auto">
//                     {canEdit && editingMediaId === item.id ? (
//                       <div className="flex flex-col h-full">
//                         <textarea
//                           ref={descriptionTextareaRef}
//                           className="w-full flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto"
//                           value={tempDescription}
//                           onChange={handleDescriptionInputChange}
//                           onKeyDown={(e) => handleKeyDown(e, item.id)}
//                           autoFocus
//                         />
//                         <div className="flex justify-end space-x-2 mt-2">
//                           <button
//                             onClick={(e) => handleSaveDescription(e, item.id)}
//                             className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600"
//                             title="Save"
//                           >
//                             <CheckIcon className="h-4 w-4" />
//                           </button>
//                           <button
//                             onClick={handleCancelEdit}
//                             className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
//                             title="Cancel"
//                           >
//                             <XIcon className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="flex justify-between items-center h-full">
//                         <span
//                           ref={descriptionDisplayRef}
//                           className="text-left flex-grow overflow-y-auto max-h-[100px] pr-2 text-base"
//                         >
//                           {item.description || 'No description provided.'}
//                         </span>
//                         {canEdit && (
//                           <button
//                             onClick={(e) => handleEditClick(e, item.id, item?.description)}
//                             className="ml-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex-shrink-0"
//                             title="Edit Description"
//                           >
//                             <PencilIcon className="h-4 w-4" />
//                           </button>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </CarouselItem>
//               ))}
//             </CarouselContent>
//             <CarouselPrevious className="absolute top-1/2 left-4 -translate-y-1/2 p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10" />
//             <CarouselNext className="absolute top-1/2 right-4 -translate-y-1/2 p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10" />
//           </Carousel>
//         </div>
//       ) : mediaList && mediaList?.length === 0 ? (
//         <div className={cn("flex items-center justify-center w-[50vw] rounded-lg bg-gray-400", fullView ? "h-[50vh]" : "h-[200px]")}>
//           <p className="text-white">No media available.</p>
//         </div>
//       ) : (
//         <div className={cn("w-[50vw] animate-pulse rounded-lg bg-zinc-700", fullView ? "h-[70vh]" : "h-[200px]")} />
//       )}
//       {error && (
//         <div className="absolute bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-[80%] z-10" role="alert">
//           <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">{error}</span>
//           <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
//             <XIcon className="h-6 w-6 text-red-500" />
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Slider;