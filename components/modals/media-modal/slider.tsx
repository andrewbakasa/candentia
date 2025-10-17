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
import useIsMobile from '@/app/hooks/isMobile';

interface MediaProps {
    id: string;
    url: string;
    cardId: string;
    type: string;
    fileName: string | null;
    description: string | null;
    viewCount:number| null;
    shareCount: number| null;
}
interface SliderProps {
    mediaList?: MediaProps[];
    fullView: boolean;
    onCardIdChange: (cardId: string | null, index: number) => void;
    onDescriptionChange: (mediaId: string, newDescription: string | null) => void;
    onFileNameChange: (mediaId: string, newFileName: string | null) => void;
    onViewCountUpdate: (mediaId: string) => void;
    canEdit: boolean;
    sliderIndex: number;
    filteredMediaCount: number;
    searchTerm?: string;
    mediaUrl?: string;
}

const Slider: React.FC<SliderProps> = ({
    mediaList,
    fullView,
    mediaUrl,
    onCardIdChange,
    onDescriptionChange,
    onViewCountUpdate,
    onFileNameChange,
    canEdit,
    sliderIndex,
    filteredMediaCount,
    searchTerm,
}) => {
    const [currentImage, setCurrentImage] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [emblaApi, setEmblaApi] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
    
    // --- Description Editing State ---
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [tempDescription, setTempDescription] = useState<string>('');
    const descriptionDisplayRef = useRef<HTMLSpanElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Filename Editing State ---
    const [editingFileNameId, setEditingFileNameId] = useState<string | null>(null);
    const [tempFileName, setTempFileName] = useState<string>('');
    const [originalFileExtension, setOriginalFileExtension] = useState<string | null>(null);
    const fileNameContainerRef = useRef<HTMLDivElement>(null);
    
    // --- NEW STATE for View Count Control ---
    // Tracks the ID of the media item for which the view count has already been triggered.
    const [viewUpdatedMediaId, setViewUpdatedMediaId] = useState<string | null>(null);

    // --- New State for Hover Visibility ---
    const [isFileNameVisible, setIsFileNameVisible] = useState(false);
    
    const [copySuccess, setCopySuccess] = useState(false);
    const urlsourceDrawing = `${typeof window !== 'undefined' ? window.location.origin : ''}/d/`;
    const isMobile = useIsMobile();

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
            if (textarea.scrollHeight > 180) { // Example max-height: 180px
                textarea.style.height = '180px';
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.height = `${textarea.scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
            }
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
        setEditingMediaId(null);
        setTempDescription('');
        setEditingFileNameId(null);
        setTempFileName('');
        setOriginalFileExtension(null);
        // Reset visibility when moving slides
        setIsFileNameVisible(false); 
        
        if (mediaList && mediaList.length > 0) {
            const currentItem = mediaList[index];
            onCardIdChange(currentItem?.cardId || null, index);

            // Trigger view count update logic on slide change
            // This sets the ID, which will be picked up by the dedicated view update effect
            if (currentItem?.id) {
                // IMPORTANT: Resetting the viewUpdatedMediaId here allows the dedicated effect 
                // to run for the new slide ID. We set it to null or a temporary value.
                // However, the check in the *new* effect is more robust.
                // For now, let the new effect handle the ID check.
                //const currentMedia = mediaList?.[currentImage];
                //const mediaId = currentMedia?.id;
            }
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

    // 2. NEW useEffect to Handle View Count Update
    useEffect(() => {
        // Check for current media item based on the index set by handleCarouselChange
        const currentMedia = mediaList?.[currentImage];
        const mediaId = currentMedia?.id;

        // Corrected Logic: Only call onViewCountUpdate if:
        // 1. We have a valid media ID.
        // 2. The media ID is different from the one for which the view has already been updated.
        if (mediaId && mediaId !== viewUpdatedMediaId) {
            // get current media id... **CORRECTED HERE**
            onViewCountUpdate(mediaId); 
            setViewUpdatedMediaId(mediaId); // Mark this ID as updated
        }

    }, [currentImage, mediaList, onViewCountUpdate, viewUpdatedMediaId]); // Dependencies: Current index, list, update function, and tracking state

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

    const handleEditClick = (e: React.MouseEvent, mediaId: string, currentDesc: string | null) => {
        e.stopPropagation();
        if (canEdit) {
            setEditingMediaId(mediaId);
            setTempDescription(currentDesc || '');
            setEditingFileNameId(null); // Ensure filename editing is off
            setOriginalFileExtension(null);
            // Filename visibility remains true while editing
            setIsFileNameVisible(true);

            if (descriptionDisplayRef.current && descriptionTextareaRef.current) {
                setTimeout(() => {
                    const textarea = descriptionTextareaRef.current!;
                    textarea.style.minHeight = `${descriptionDisplayRef.current?.offsetHeight || 24}px`;
                    textarea.style.height = 'auto'; // Reset height
                    if (textarea.scrollHeight > 180) { 
                        textarea.style.height = '180px';
                        textarea.style.overflowY = 'auto';
                    } else {
                        textarea.style.height = `${textarea.scrollHeight}px`;
                        textarea.style.overflowY = 'hidden';
                    }
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
            // Filename visibility will be handled by onMouseLeave now
        }
    };

    // const handleUpdateViewCount = (e: React.MouseEvent, mediaId: string) => {
    //     e.stopPropagation();
    //     onViewCountUpdate(mediaId);
        
    // };

    

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingMediaId(null);
        setTempDescription('');
        // Filename visibility will be handled by onMouseLeave now
    };

    const handleDescriptionInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempDescription(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        if (textarea.scrollHeight > 180) { // Set max-height check again on change
            textarea.style.height = '180px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.style.overflowY = 'hidden';
        }
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
            // Filename visibility is automatically true while editing
            setIsFileNameVisible(true); 
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
            // Filename visibility will be handled by onMouseLeave now
        }
    }

    const handleCancelFileNameEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFileNameId(null);
        setTempFileName('');
        setOriginalFileExtension(null);
        // Filename visibility will be handled by onMouseLeave now
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
    
    // --- New Handlers for Hover/Focus Control ---
    const handleMediaAreaMouseEnter = () => {
        if (canEdit && !editingFileNameId) {
            setIsFileNameVisible(true);
        }
    };

    const handleMediaAreaMouseLeave = () => {
        if (!editingFileNameId) {
            setIsFileNameVisible(false);
        }
    };
    // --- End New Handlers ---

    return (
        <div className="w-full flex flex-col items-center justify-center p-4 min-h-[60vh] bg-gray-50 rounded-lg shadow-xl">
            {mediaList && mediaList?.length > 0 ? (
                <div className={cn("relative w-full max-w-[100vw] h-auto flex flex-col items-center justify-center")}>
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
                                        "flex flex-col basis-full h-full"
                                    )}
                                >
                                    {/* * KEY CHANGE: 
                                        * The div below now manages hover state (group) and triggers visibility.
                                        * isFileNameVisible or editingFileNameId forces visibility.
                                    */}
                                    <div 
                                        className="relative w-full rounded-t-xl overflow-hidden bg-gray-100 flex flex-col items-center justify-center flex-grow group"
                                        onMouseEnter={handleMediaAreaMouseEnter}
                                        onMouseLeave={handleMediaAreaMouseLeave}
                                    >
                                        <div className="w-full h-full max-h-full flex items-center justify-center">
                                            {/* Inner container to apply the aspect ratio *only* to the media content */}
                                            <div className="w-full aspect-video sm:aspect-square md:aspect-video lg:aspect-video relative">
                                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                                    {renderMediaContent(item)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Filename editing/display (fixed to the bottom of the media area) */}
                                        {canEdit && (
                                            <div 
                                                ref={fileNameContainerRef} 
                                                className={cn(
                                                    "absolute bottom-0 left-0 right-0 text-white text-sm p-2 overflow-hidden flex items-center justify-between transition-opacity duration-300",
                                                    // Base state: Hidden
                                                    "opacity-0",
                                                    // Hover/Focus state: Visible
                                                    (isFileNameVisible || editingFileNameId === item.id) ? "opacity-100" : "",
                                                    // Styling based on editing state
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
                                                            className="text-left flex-grow block overflow-y-auto pr-2 text-base "
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
                                        <div className="absolute top-2 right-2 px-3 py-1 bg-black bg-opacity-60 text-white text-xs font-semibold rounded-full z-20">
                                            <span className="font-bold">{sliderIndex + 1}</span> / {filteredMediaCount}
                                        </div>
                                    </div>

                                    <div className="relative p-2 text-sm text-gray-700 bg-white rounded-b-xl flex flex-col mix-h-[50px] max-h-[150px] overflow-y-auto">
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
                                                                    toast.success(`${urlsourceDrawing}${item.id} copied to clipboard!`);
                                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                                } catch (error) {
                                                                    console.error("Failed to copy:", error);
                                                                }
                                                            }}
                                                        />
                                                    </Hint>}
                                                    {mediaUrl && <Hint
                                                        sideOffset={10}
                                                        description={copySuccess ? "Link copied!" : "Click to copy link"}
                                                    >
                                                        <Copy
                                                            className={cn(
                                                                "h-5 w-5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-green-300 cursor-pointer transition",
                                                                copySuccess && "text-green-600 dark:text-green-300"
                                                            )}
                                                            onClick={async () => {
                                                                try {
                                                                    if (mediaUrl) {
                                                                        await navigator.clipboard.writeText(`${mediaUrl}`);
                                                                    }
                                                                    setCopySuccess(true);
                                                                    toast.success(`${mediaUrl} copied to clipboard!`);
                                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                                } catch (error) {
                                                                    console.error("Failed to copy:", error);
                                                                }
                                                            }}
                                                        />
                                                    </Hint>}
                                                    <div className="flex items-center space-x-4 text-gray-500 text-sm mt-3">
                                                        {/* CONDITIONS CHECKED:
                                                            1. item.viewCount must exist (not null/undefined)
                                                            2. Number(item.viewCount) must be > 0
                                                        */}
                                                        {(item.viewCount != null && Number(item.viewCount) > 0) && (
                                                            <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                                                {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                                                <span className="absolute top-[-10px] right-[-5px] bg-red-500 text-white text-xs font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                                                    {item.viewCount}
                                                                </span>
                                                                {/* Eye Icon for Views */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </span>
                                                        )}

                                                        {/* CONDITIONS CHECKED:
                                                            1. item.shareCount must exist (not null/undefined)
                                                            2. Number(item.shareCount) must be > 0
                                                        */}
                                                        {(item.shareCount != null && Number(item.shareCount) > 0) && (
                                                            <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                                                {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                                                <span className="absolute top-[-10px] right-[-5px] bg-green-500 text-white text-xs font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                                                    {item.shareCount}
                                                                </span>
                                                                {/* Share Icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.314l4.94 2.47a3 3 0 10.835-1.668L10.825 11h9.175v-2h-9.175l.182-.091z" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                  
                                                </div>
                                                <textarea
                                                    ref={descriptionTextareaRef}
                                                    className="mt-1 w-full flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
                                                    value={tempDescription}
                                                    onChange={handleDescriptionInputChange}
                                                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                                                    autoFocus
                                                    style={{ minHeight: '50px', maxHeight: '180px' }} // Inline styles to enforce limits on textarea
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
                                            <div className="flex flex-col gap-1 h-full"> {/* Added h-full here */}
                                                <div className='flex flex-row gap-2 items-center'>
                                                    {urlsourceDrawing && <Hint
                                                        sideOffset={2}
                                                        description={copySuccess ? "Link copied!" : `Click to copy link to current-item`}
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
                                                                    toast.success(`${urlsourceDrawing}${item.id} copied to clipboard!`);
                                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                                } catch (error) {
                                                                    console.error("Failed to copy:", error);
                                                                }
                                                            }}
                                                        />
                                                    </Hint>}
                                                    <div className="flex items-center space-x-4 text-gray-500 text-sm mt-3">
                                                        {/* CONDITIONS CHECKED:
                                                            1. item.viewCount must exist (not null/undefined)
                                                            2. Number(item.viewCount) must be > 0
                                                        */}
                                                        {(item.viewCount != null && Number(item.viewCount) > 0) && (
                                                            <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                                                {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                                                <span className="absolute top-[-10px] right-[-5px] bg-red-500 text-white text-xs font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                                                    {item.viewCount}
                                                                </span>
                                                                {/* Eye Icon for Views */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </span>
                                                        )}

                                                        {/* CONDITIONS CHECKED:
                                                            1. item.shareCount must exist (not null/undefined)
                                                            2. Number(item.shareCount) must be > 0
                                                        */}
                                                        {(item.shareCount != null && Number(item.shareCount) > 0) && (
                                                            <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                                                {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                                                <span className="absolute top-[-10px] right-[-5px] bg-green-500 text-white text-xs font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                                                    {item.shareCount}
                                                                </span>
                                                                {/* Share Icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.314l4.94 2.47a3 3 0 10.835-1.668L10.825 11h9.175v-2h-9.175l.182-.091z" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                  
                                                </div>
                                                {/* Display area for description */}                                              
                                                 <div className="flex justify-between items-start h-full"> {/* Changed items-center to items-start for better text alignment */}
                                                     <span
                                                       
                                                         className="text-left flex-grow block overflow-y-auto pr-2 text-base text-black"
                                                     >
                                                         {highlightText(item.description, searchTerm)}
                                                         {item.description === null || item.description === "" ? (
                                                             <span className="italic text-gray-500">No description...</span>
                                                         ) : null}
                                                     </span>
                                                     {canEdit && (
                                                         <button
                                                             onClick={(e) => handleEditClick(e, item.id, item.description)}
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
                        {/* Carousel Navigation buttons (optional, based on your full Carousel component setup) */}
                        <CarouselPrevious className="absolute left-4 top-1/3  md:top 1/2 -translate-y-1/2 z-30" />
                        <CarouselNext className="absolute right-4 top-1/3  md:top 1/2 -translate-y-1/2 z-30" />
                    </Carousel>

                    <div className="flex w-full justify-center items-center mt-2 text-xs text-gray-500">
                        Media: <span className="font-semibold mx-1">{currentImage + 1}</span> of <span className="font-semibold mx-1">{mediaList.length}</span> (Filtered: <span className="font-semibold mx-1">{filteredMediaCount}</span>)
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-full min-h-[50vh] text-gray-500">
                    No media found.
                </div>
            )}
            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded w-full">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Slider;