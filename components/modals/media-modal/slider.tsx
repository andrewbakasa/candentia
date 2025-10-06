'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { BsFilePdfFill, BsFileWordFill, BsFileExcelFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';
import { AlertCircle, Copy } from 'lucide-react';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { Hint } from '@/components/hint';
import { toast } from 'sonner';

interface MediaProps {
    id: string;    url: string;    cardId: string;    type: string;    fileName: string | null;    description: string | null;
}

interface SliderProps {
    mediaList?: MediaProps[];
    fullView: boolean;
    onCardIdChange: (cardId: string | null, index: number) => void;
    onDescriptionChange: (mediaId: string, newDescription: string | null) => void;
    onFileNameChange: (mediaId: string, newFileName: string | null) => void;
    canEdit: boolean;
    sliderIndex: number;
    filteredMediaCount: number;
    searchTerm?: string; // **NEW:** Add searchTerm prop
}

const Slider: React.FC<SliderProps> = ({
    mediaList,    fullView,
    onCardIdChange,    onDescriptionChange,    onFileNameChange,    canEdit,    sliderIndex,    filteredMediaCount,    searchTerm, // **NEW:** Destructure searchTerm
}) => {
    const [currentImage, setCurrentImage] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [emblaApi, setEmblaApi] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Store refs for video elements to control playback
    const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [tempDescription, setTempDescription] = useState<string>('');
    const descriptionDisplayRef = useRef<HTMLSpanElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [editingFileNameId, setEditingFileNameId] = useState<string | null>(null);
    const [tempFileName, setTempFileName] = useState<string>('');
    const [originalFileExtension, setOriginalFileExtension] = useState<string | null>(null);
    const fileNameContainerRef = useRef<HTMLDivElement>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const urlsourceDrawing=`${window.location.origin}/d/`

    // **NEW:** Utility function to highlight text
    const highlightText = (text: string | null, highlightTerms: string | undefined) => {
        if (!text || !highlightTerms) {
            return text;
        }
        const terms = highlightTerms.split(';').flatMap(term => term.split(',')).filter(Boolean).map(term => term.trim().toLowerCase());
        if (terms.length === 0) {
            return text;
        }
        let lastIndex = 0;
        const result: (string | JSX.Element)[] = [];
        // Create a regex from all terms for efficient searching, escaping special characters
        const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
        text.replace(regex, (match, p1, offset) => {
            if (offset > lastIndex) {
                result.push(text.substring(lastIndex, offset));
            }
            result.push(
                <span key={offset} className="bg-yellow-400">
                    {match}
                </span>
            );
            lastIndex = offset + match.length;
            return match; // Return match to `replace` for correct string replacement
        });

        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex));
        }
        return <>{result}</>;
    };
    // Preload images to catch errors early
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
    // Auto-resize description textarea
    useEffect(() => {
        if (editingMediaId && descriptionTextareaRef.current) {
            const textarea = descriptionTextareaRef.current;
            textarea.style.height = 'auto';
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
                            fill
                            sizes="100vw"
                            style={{ objectFit: 'contain' }}
                            priority={currentImage === 0}
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
                case 'emptyMedia': // Fallback for explicitly empty media
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
        // Reset editing states on slide change
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
    // Initialize carousel on component mount or mediaList change
    useEffect(() => {
        if (mediaList && mediaList.length > 0) {
            // Set initial slide to the one indicated by sliderIndex if provided, otherwise 0
            if (emblaApi && sliderIndex !== undefined) {
                emblaApi.scrollTo(sliderIndex, false); // Don't animate
                handleCarouselChange(sliderIndex);
            } else {
                handleCarouselChange(0);
            }
        }
    }, [mediaList, emblaApi, sliderIndex]); // Added emblaApi and sliderIndex to dependencies

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
    };
    // --- Description Editing Handlers ---
    const handleEditClick = (e: React.MouseEvent, mediaId: string, currentDesc: string | null) => {
        e.stopPropagation();
        if (canEdit) {
            setEditingMediaId(mediaId);
            setTempDescription(currentDesc || '');
            setEditingFileNameId(null); // Ensure filename editing is off
            setOriginalFileExtension(null);

            if (descriptionDisplayRef.current && descriptionTextareaRef.current) {
                setTimeout(() => {
                    const textarea = descriptionTextareaRef.current!;
                    textarea.style.minHeight = `${descriptionDisplayRef.current?.offsetHeight || 24}px`;
                    textarea.style.height = 'auto';
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
            const lastDotIndex = newFileName.lastIndexOf('.');
            if (originalFileExtension && originalFileExtension.length > 0) {
                const currentExtension = newFileName.lastIndexOf('.') > -1 ? newFileName.substring(newFileName.lastIndexOf('.')) : '';
                if (currentExtension.toLowerCase() !== originalFileExtension.toLowerCase()) {
                    newFileName = newFileName.replace(/\.[^/.]+$/, "") + originalFileExtension;
                } else if (lastDotIndex === -1 && originalFileExtension.startsWith('.')) {
                    newFileName = newFileName + originalFileExtension;
                }
            }
            if (newFileName === originalFileExtension && newFileName.startsWith('.')) {
                newFileName = '';
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
                inputValue = inputValue.substring(0, lastDotIndex) + originalFileExtension;
            } else if (lastDotIndex === -1 && inputValue.length > 0 && originalFileExtension.startsWith('.')) {
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
   // The component return structure:
    return (
        <div className="w-full flex flex-col items-center justify-center p-4 min-h-[50vh] bg-gray-50 rounded-lg shadow-xl">
            {mediaList && mediaList?.length > 0 ? (
                <div className={cn(
                    "relative", // Make this div the positioning context for the arrows
                    fullView ? "w-full max-w-4xl h-[calc(100vh-10px)] md:h-[calc(100vh-20px)]" : "w-full max-w-2xl h-[calc(100vh-20px)] md:h-[calc(100vh-50px)]",
                    "flex flex-col items-center justify-center" // Center the Carousel component
                )}>
                    <Carousel
                        className="w-full h-full border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg"
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
                                        // Set a predictable max height for the carousel item itself
                                        fullView ? "basis-full max-h-[calc(100vh-20px)]" : "basis-full max-h-[calc(100vh-70px)]" 
                                    )}
                                >
                                    {/* Container for Media + Filename/Count.
                                        flex-grow ensures it takes all vertical space not used by the description.
                                    */}
                                    <div className="relative w-full rounded-t-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-grow">
                                        
                                        {/* *** THE FIX ***
                                            This div enforces a fixed 16:9 aspect ratio (aspect-video) 
                                            regardless of the media inside, stopping height jumps.
                                        */}
                                        <div className="w-full aspect-video"> 
                                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                                {/* CRITICAL: The element returned by renderMediaContent MUST 
                                                    be styled with w-full h-full object-contain or object-cover. 
                                                */}
                                                {renderMediaContent(item)}
                                            </div>
                                        </div>

                                        {/* Filename editing/display (fixed to the bottom of the media area) */}
                                        {canEdit && (
                                            <div ref={fileNameContainerRef} className={cn("absolute bottom-0 left-0 right-0 text-white text-sm p-2 overflow-hidden flex items-center justify-between", editingFileNameId === item.id ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50")}>
                                                {editingFileNameId === item.id ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={tempFileName}
                                                            onChange={handleFileNameInputChange}
                                                            onKeyDown={(e) => handleFileNameKeyDown(e, item.id)}
                                                            className="w-full bg-gray-700 text-white p-1 rounded outline-none"
                                                            autoFocus
                                                        />
                                                        <div className="ml-2 flex space-x-1 z-10">
                                                            <button
                                                                onClick={(e) => handleSaveFileName(e, item.id)}
                                                                className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
                                                                title="Save Filename"
                                                            >
                                                                <CheckIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelFileNameEdit}
                                                                className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 flex-shrink-0"
                                                                title="Cancel Filename Edit"
                                                            >
                                                                <XIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span 
                                                        // className="flex-grow text-left truncate"
                                                            className="text-left flex-grow **block** overflow-y-auto pr-2 text-base " // <--- Added 'block' here

                                                        >
                                                            {highlightText(item.fileName, searchTerm)}
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
                                        
                                        {/* Improved Media Count Display */}
                                        <div className="absolute top-2 right-2 px-3 py-1 bg-black bg-opacity-60 text-white text-xs font-semibold rounded-full z-20">
                                            <span className="font-bold">{sliderIndex + 1}</span> / {filteredMediaCount}
                                        </div>
                                    </div>

                                    {/* Description editing/display */}
                                    {/* *** IMPROVEMENT ***
                                        Added **min-h** and **max-h** with **overflow-y-auto** to constrain the height of the description area,
                                        preventing it from expanding the CarouselItem and causing layout shift.
                                    */}
                                    <div className="relative p-2 text-sm text-gray-700 bg-white rounded-b-xl flex flex-col min-h-[250px] max-h-[400px]  overflow-y-auto">
                                        {canEdit && editingMediaId === item.id ? (
                                            <div className="flex flex-col gap-1">
                                                <div className='flex flex-row'>
                                                    {urlsourceDrawing && <Hint
                                                        sideOffset={10}
                                                        description={copySuccess ? "Link copied!" : "Click to copy link"}
                                                    >
                                                        <Copy
                                                            className={cn(
                                                                "h-5 w-5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-300 cursor-pointer transition",
                                                                copySuccess && "text-green-600 dark:text-green-300"
                                                            )}
                                                            onClick={async () => {
                                                                try {
                                                                    if (urlsourceDrawing) {
                                                                        await navigator.clipboard.writeText(`${urlsourceDrawing}${item.id}`);
                                                                    }

                                                                    setCopySuccess(true);
                                                                    // Use actual toast implementation if available
                                                                    toast.success(`${urlsourceDrawing}${item.id} copied to clipboard!`); 
                                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                                } catch (error) {
                                                                    // toast.error("Failed to copy link.");
                                                                    console.error("Failed to copy:", error);
                                                                }
                                                            }}
                                                        />
                                                    </Hint>}
                                                </div>
                                                <textarea
                                                    ref={descriptionTextareaRef}
                                                    className="mt-3 w-full flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto"
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
                                            <div className="flex flex-col gap-1">
                                                <div className='flex flex-row'>
                                                    {urlsourceDrawing && <Hint
                                                        sideOffset={2}
                                                        description={copySuccess ? "Link copied!" : "Click to copy link"}
                                                    >
                                                        <Copy
                                                            className={cn(
                                                                "h-5 w-5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-300 cursor-pointer transition",
                                                                copySuccess && "text-green-600 dark:text-green-300"
                                                            )}
                                                            onClick={async () => {
                                                                try {
                                                                    if (urlsourceDrawing) {
                                                                        await navigator.clipboard.writeText(`${urlsourceDrawing}${item.id}`);
                                                                    }

                                                                    setCopySuccess(true);
                                                                    // Use actual toast implementation if available
                                                                    toast.success(`${urlsourceDrawing}${item.id} copied to clipboard!`); 
                                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                                } catch (error) {
                                                                    // toast.error("Failed to copy link.");
                                                                    console.error("Failed to copy:", error);
                                                                }
                                                            }}
                                                        />
                                                    </Hint>}
                                                </div>
                                                <div className="mt-3 flex justify-between items-start h-full"> {/* Changed items-center to items-start for better text alignment */}
                                                    <span
                                                       // ref={descriptionDisplayRef}
                                                        // className="text-left flex-grow overflow-y-auto pr-2 text-base"
                                                            className="text-left flex-grow **block** overflow-y-auto pr-2 text-base text-blgrayue-800" // <--- Added 'block' here

                                                    >
                                                        {highlightText(item.description, searchTerm) || 'No description provided.'}
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
                                            </div>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute top-1/3 left-4 -translate-y-1/2 p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10" />
                        <CarouselNext className="absolute top-1/3 right-4 -translate-y-1/2 p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100 z-10" />
                    </Carousel>
                </div>
            ) : mediaList && mediaList?.length === 0 ? (
                <div className={cn("flex items-center justify-center w-[50vw] rounded-lg bg-gray-400", fullView ? "h-[50vh]" : "h-[200px]")}>
                    <p className="text-white">No media available.</p>
                </div>
            ) : (
                <div className={cn("w-[50vw] animate-pulse rounded-lg bg-zinc-700", fullView ? "h-[70vh]" : "h-[200px]")} />
            )}
            {error && (
                <div className="absolute bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-[80%] z-10" role="alert">
                    <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                        <XIcon className="h-6 w-6 text-red-500" />
                    </span>
                </div>
            )}
        </div>
    );   
};
export default Slider;