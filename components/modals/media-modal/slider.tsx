'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn, truncateString } from '@/lib/utils';
import { BsFilePdfFill, BsFileWordFill, BsFileExcelFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';

interface MediaProps {
  id: string;
  url: string;
  cardId: string;
  type: string;
  fileName: string | null;
}

interface SliderProps {
  mediaList?: MediaProps[];
  fullView: boolean;
  onCardIdChange: (cardId: string | null, index: number) => void;
}

const Slider: React.FC<SliderProps> = ({ mediaList, fullView, onCardIdChange }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [emblaApi, setEmblaApi] = useState<any | null>(null);

  useEffect(() => {
    if (mediaList) {
      mediaList.forEach((item) => {
        if (item.type === 'image') {
          const img = new window.Image();
          img.src = item.url;
        }
      });
    }
  }, [mediaList]);

  const renderMedia = (item: MediaProps) => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative w-full h-full">
            <Image
              src={item.url}
              alt={item.fileName || "media"}
              fill
              sizes="100vw"
              style={{ objectFit: 'contain', borderRadius: '0.5rem' }}
              priority={currentImage === 0}
              quality={75}
            />
          </div>
        );
      case 'video':
        return (
          <video
            src={item.url}
            controls
            className="rounded-xl object-contain w-full h-full"
          />
        );
      case 'raw':
        const fileExtension = item.url.substring(item.url.lastIndexOf('.') + 1);
        return (
          <div className="flex items-center justify-center w-full h-full">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
              <span className="text-4xl">{getFileIcon(fileExtension)}</span>
              <span className="text-gray-600 mt-2">{fileExtension.toUpperCase()} File</span>
              {item?.fileName && <span className="text-gray-600 mt-2 truncate text-sm">{truncateString(item?.fileName, 30)}</span>}
            </a>
          </div>
        );
      case 'emptyMedia':
        return (
          <div className="flex items-center justify-center w-full h-full">
            <p className='items-center justify-center'>No media</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <p className='items-center justify-center'>Unsupported media type</p>
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
      default: return ' File';
    }
  };

  const handleCarouselChange = (index: number) => {
    setCurrentImage(index);
    if (mediaList && mediaList.length > 0) {
      const currentItem = mediaList[index];
      onCardIdChange(currentItem?.cardId || null, index); // Pass index here
    } else {
      onCardIdChange(null, index); // Pass index even if mediaList is empty
    }
  };

  useEffect(() => {
    if (mediaList && mediaList.length > 0) {
      handleCarouselChange(0); // Call with initial index (0)
    }
    //console.log('why reseting')
  }, [mediaList ]);

  const onEmblaInit2 = (api: any) => {
    setEmblaApi(api);

    api.on("select", () => {
      const index = api.selectedSnap();
      if (typeof index === 'number') {
        handleCarouselChange(index);
      } else if (api.index !== undefined) {
        handleCarouselChange(api.index);
        console.warn("Embla's selectedSnap() is not available. Using api.index as fallback.");
      } else if (api.currentIndex !== undefined) {
        handleCarouselChange(api.currentIndex);
        console.warn("Embla's selectedSnap() and api.index are not available. Using api.currentIndex as fallback.");
      } else {
        console.error("Could not determine Embla index. Check Embla version and configuration.");
      }
    });
  };
  const onEmblaInit = (api: any) => {
    setEmblaApi(api);
  
      api.on("select", () => {
        //console.log("Embla 'select' event fired");
  
        const slides = api.slideNodes(); // Get all slide DOM elements
       // console.log("Embla slides:", slides); // Check the slides array
  
        if (slides && slides.length > 0) { // Make sure slides exist
          const activeSlide = slides[api.selectedScrollSnap()]; // Get the active slide element
          if (activeSlide) { // Check if activeSlide exists
              const index = slides.indexOf(activeSlide); // Find its index
              if (index !== -1) { // Check if index is valid
                  handleCarouselChange(index);
              } else {
                  console.error("Could not find active slide index.");
              }
          } else {
              console.error("Could not find active slide.");
          }
        } else {
          console.error("Embla slides are not available.");
        }
      });
   
  };
  return (
    <div className={cn('flex justify-center relative h-full')}>
      {mediaList && mediaList?.length > 0 ? (
        <div className="relative">
          <Carousel
            className={cn(fullView ? "h-[65vh] w-[65vw]" : "h-[50vh] w-[50vw]")}
            ref={carouselRef}
            setApi={onEmblaInit}
          >
            <CarouselContent>
              {mediaList.map((item, index) => (
                <CarouselItem
                  key={index}
                  className={cn(fullView ? "h-[65vh] w-[65vw]" : "h-[50vh] w-[50vw]")}
                >
                  {renderMedia(item)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100" />
            <CarouselNext className="p-1 bg-gray-800 rounded-full opacity-70 hover:opacity-100" />
          </Carousel>
        </div>
      ) : mediaList && mediaList?.length === 0 ? ( // Correct comparison here
        <div className={cn("flex items-center justify-center w-[50vw] rounded-lg bg-gray-400", fullView ? "h-[50vh]" : "h-[200px]")}>
          <p className="text-white">No media available.</p>
        </div>
      ) : (
        <div className={cn("w-[50vw] animate-pulse rounded-lg bg-zinc-700", fullView ? "h-[70vh]" : "h-[200px]")} />
      )}
    </div>
  );
};

export default Slider;
