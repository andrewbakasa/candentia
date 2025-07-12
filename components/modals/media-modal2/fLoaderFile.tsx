'use client'
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAction } from '@/hooks/use-action';
import { deleteCardImage } from '@/actions/delete-cardImage';
import { SafeUser } from '@/app/types';
import { truncateString } from '@/lib/utils';
import { AiFillFilePdf } from 'react-icons/ai';
import { BsFileExcelFill, BsFilePdfFill, BsFileWordFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';

interface Image {
  id: string;
  url: string;
  cardId: string; // Add cardId property here
  type :string;
  userId: string | null;
  fileName: string| null
}
interface FileUploadProps{
  dbImageList : Image[];
  setUserImageList:(images:File[])=>void;
  currentUser:SafeUser | null | undefined;
  refreshCardImages: () => void;
}
export const  FUploaderFile=({
                         // setImages, 
                          dbImageList,  
                          setUserImageList,
                          currentUser,
                          refreshCardImages,
                    }: FileUploadProps)=>{

  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [selectedFileToDelete, setSelectedImageToDelete] = useState<Image | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredImageList, setFilteredImageList] = useState<Image[]>(dbImageList);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Store the File objects

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);;
  const [filesToDeleteFromPreview, setFilesToDeleteFromPreview] = useState<string[]>([]);

  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (adjust as needed)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (adjust as needed)
  const  MAX_RAW_FILE_SIZE= 10 * 1024 * 1024; // 10MB (adjust as needed)
  const { 
    execute: executeDeleteCardImage,
    isLoading: isLoadingDelete,
  } = useAction(deleteCardImage, {
    onSuccess: (data: { url: any; }) => {
      toast.success(`Database Record Image URl "${data?.url}" deleted`);
      
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const handleDeleteClick = (image: Image) => {


    if (currentUser && (currentUser.isAdmin || currentUser.id==image.userId)){
      setSelectedImageToDelete(image);
      setIsOpen(true);
    }else {
      toast.message(`user ${currentUser?.email} not allowed this operation`)
    }
   
  };

   const removeFilebyFilter = (urlFile: string) => {
    setImagePreview(prevPreviews => prevPreviews.filter(item => item !== urlFile));
    setFilesToDeleteFromPreview(prev => [...prev, urlFile]);
   //image preiv a b c    e 
   // uploaded   a b c d  e
   // pass test  T T T F  T
   //             
    
   //  setUserImageList((prevFiles: File[]) => {  // Type prevFiles as File[]
      const updatedItems:File[] = uploadedFiles.filter(
        (file: File) => !imagePreview.includes(URL.createObjectURL(file)) // Explicitly type file as File
      );
    
    setUserImageList(updatedItems)
   // console.log("setUserImageList:updatedItems",updatedItems)
     if (imagePreview.length === 1) {
      setUserImageList([]);
      setFilesToDeleteFromPreview([]);
    }
  };  
   
  useEffect(() => {
    setFilteredImageList(dbImageList);
  }, [dbImageList]);

  const handleClose = () => {
    setIsOpen(false);
  };


  const handleDeleteConfirmation = async () => {
      setIsOpen(false);
  
      if (!selectedFileToDelete) {
          toast.error(`No Selection found..`);
          return;
      };
  
      if (!currentUser) {
          toast.error("You must be logged in to delete images.");
          return;
      }
  
      if (!currentUser.isAdmin && currentUser.id !== selectedFileToDelete.userId) {
          toast.error(`User ${currentUser.email} does not have permission to delete this image.`);
          return;
      }
  
      try {
          const publicId = extractPublicIdFromUrl(selectedFileToDelete.url);
          if (publicId) {
  
              const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
              const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
              // **DO NOT expose your API secret on the client-side**
  
              const timestamp = Math.round(new Date().getTime() / 1000);
  
              let resourceType;
              if (selectedFileToDelete.type.startsWith('image/')) {
                  resourceType = 'image';
              } else if (selectedFileToDelete.type.startsWith('video/')) {
                  resourceType = 'video';
              } else {
                  resourceType = 'raw';
              }
            // console.log("Stage 1111 passed?:")
            //   console.log("Cloudinary destroy parameters:", {
            //     public_id: publicId,
            //     api_key: apiKey,
            //     timestamp: timestamp,
            //    // signature: signature,
            //     resourceType: resourceType,
            // });
              // **Crucially, generate the signature on the server-side (API route):**
              const signatureResponse = await fetch('/api/cloudinary-signature', {  // Call your API route
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ public_id: publicId, timestamp, resourceType }),
              });

              //console.log("signature is ok:", signatureResponse)

              if (!signatureResponse.ok) {
                  const errorData = await signatureResponse.json();
                  throw new Error(errorData.error || 'Failed to generate signature');
              }
       
              const { signature } = await signatureResponse.json();
  
             
              const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
  
              const destroyResponse = await fetch(destroyUrl, {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      public_id: publicId,
                      api_key: apiKey,
                      timestamp: timestamp,
                      signature: signature, // Include the signature!
                  }),
              });
  
             // console.log('destroyResponse: ', destroyResponse);
  
              if (destroyResponse.ok) {
                  executeDeleteCardImage({ id: selectedFileToDelete.id });
                  const filteredImageListNew = filteredImageList.filter(
                      (item) => item.id !== selectedFileToDelete.id
                  );
                  setFilteredImageList(filteredImageListNew);
                  setSelectedImageToDelete(null);
                  setIsOpen(false);
                  toast.success('Image Delete Successful!'); // Use toast.success
                  refreshCardImages();
                  return;
              }else {
                try {
                    const errorData = await destroyResponse.json();
                    console.error("Cloudinary Error Details:", errorData);
                    toast.error(`Image not deleted: Cloudinary Error (${destroyResponse.status})`);
                } catch (jsonError) {
                    // If JSON parsing fails, log the text response
                    const responseText = await destroyResponse.text();
                    console.error("Cloudinary Response (Text):", responseText);
                    toast.error(`Image not deleted: Cloudinary Error (${destroyResponse.status}) - Invalid JSON response`);
                }
            }

          } else {
              console.warn("Could not extract public ID from URL. Skipping Cloudinary deletion.");
              toast.error("Could not extract public ID from URL."); // Inform the user
          }
  
      } catch (error) {
          console.error('Unexpected error deleting image:', error);
          toast.error('Unexpected error deleting image.'); // Inform the user
      }
  };
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
   
    if (event.target && event.target.files) {
      const files: FileList = event.target.files;
      const fileArray = Array.from(files);

      const validFiles: File[] = [];
      const invalidFiles: File[] = [];

      for (const file of fileArray) {
       // console.log("file details:", file)
        // to get fileName here and add description TEXT as well: addionally persist to database
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isRaw = !isImage && !isVideo; // Check if it's neither image nor video

        

        //const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        let maxSize;

        if (isImage) {
          maxSize = MAX_IMAGE_SIZE;
        } else if (isVideo) {
          maxSize = MAX_VIDEO_SIZE;
        } else if (isRaw) {
          maxSize = MAX_RAW_FILE_SIZE; // Define a maximum size for raw files
        } else {
          // Handle unexpected file types (optional)
          console.warn("Unsupported file type:", file.type);
          maxSize = 0; // Or some default, or throw an error
        }




        if (file.size <= maxSize) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
          console.warn(`${file.name} exceeds the maximum size limit (${isVideo ? '100MB' : isImage?'10MB':'10MB'}).`); // Customize message
        }
      }

      if (invalidFiles.length > 0) {
        // Handle the case where some files are invalid. You can choose to do nothing,
        // clear the input, or take other actions.  Here, I'm just logging and showing a toast.
        console.warn("Some files were too large:", invalidFiles);
        toast.error('Some files were too large and were rejected')
        // If you want to clear the input:
        // event.target.value = ''; // Clear the file input
      }


      if (validFiles.length > 0) {
        setUploadedFiles(prevFiles => [...prevFiles, ...validFiles]);
        const previews = validFiles.map((file) => URL.createObjectURL(file));
        setImagePreview(prevPreviews => [...prevPreviews, ...previews]);
        setUserImageList(validFiles); // Or update with a combined array if needed

       
      }

    } else {
      // ... (handle no files selected)
      // setImages([]);
      setUploadedFiles([]);
      setImagePreview([]);
      setUserImageList([]);
      setFilesToDeleteFromPreview([]);
    }
  
  };

  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/');
  
      // Attempt to find the public ID (more robust approach)
      for (let i = pathParts.length - 1; i >= 0; i--) {
        const part = pathParts[i];
        if (part && !part.includes('.')) { // Check for non-empty part without extension
          return part;
        }
      }
  
      // If no suitable part is found, return null (or "")
      return null; // Or: return "";
  
    } catch (error) {
      console.error("Error extracting public ID:", error);
      return null;
    }
  };
  
  
  
const getFileIcon = (url: string) => {
  const extension = getFileExtension(url);
 
  switch (extension.toLowerCase()) {
    case 'pdf': return <BsFilePdfFill></BsFilePdfFill>;
    case 'docx': case 'doc': return <BsFileWordFill></BsFileWordFill>; // Word icon (e.g., a memo or document icon)
    case 'xlsx': case 'xls': return <BsFileExcelFill></BsFileExcelFill>; // Excel icon (e.g., a chart or spreadsheet icon)
    case 'zip': case 'rar': return <FaArchive></FaArchive>;
    default: return ' File';
  }
};

const getFileExtension = (url: string) => {
    return url.substring(url.lastIndexOf('.') + 1);
}

// Function to provide file icons (you'll need to implement this)
const getFileIcon2 = (file: File | null) => { // Accept File object or null
  if (!file) return ' File'; // Handle null case

  const extension = getFileExtension2(file);
  // switch (extension.toLowerCase()) {
  //   case 'pdf': return '📄';
  //   case 'docx': case 'doc': return ' Word';
  //   case 'xlsx': case 'xls': return ' Excel';
  //   case 'zip': case 'rar': return ' Archive';
  //   // ... add more icons for other file types
  //   default: return ' File';
  // }
  switch (extension.toLowerCase()) {
    case 'pdf': return <BsFilePdfFill></BsFilePdfFill>;
    case 'docx': case 'doc': return <BsFileWordFill></BsFileWordFill>; // Word icon (e.g., a memo or document icon)
    case 'xlsx': case 'xls': return <BsFileExcelFill></BsFileExcelFill>; // Excel icon (e.g., a chart or spreadsheet icon)
    case 'zip': case 'rar': return <FaArchive></FaArchive>;
    default: return ' File';
  }
};

const getFileExtension2 = (file: File | null) => { // Accept File object or null
    if (!file) return ''; // Handle null case
    const name = file.name;
    return name.substring(name.lastIndexOf('.') + 1);
}
  return (
        <>
          {/* 1... row */}
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        {/* <p className="text-xs text-gray-500 dark:text-gray-400">{`.xls, xlsx, .doc, .docx (Max.${MAX_RAW_FILE_SIZE/(1024 * 1024)}MB) SVG, PNG, JPG or GIF (MAX. 800x400px or ${MAX_IMAGE_SIZE/(1024 * 1024)}MB) mp4, webm or quicktime (Max.${MAX_VIDEO_SIZE/(1024 * 1024)}MB) `}</p>
                     */}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                          {`.xls, .xlsx, .doc, .docx, .pdf, .ppt, .pptx, .txt, .csv, .zip (Max. ${MAX_RAW_FILE_SIZE / (1024 * 1024)} MB) 
                          SVG, PNG, JPG, GIF (Max. 800x400px or ${MAX_IMAGE_SIZE / (1024 * 1024)} MB) 
                          MP4, WebM, QuickTime, MP3, WAV, OGG (Max. ${MAX_VIDEO_SIZE / (1024 * 1024)} MB)`}
                      </p>
                    </div>
                    <input
                        id="dropzone-file"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, image/png, image/jpeg, image/gif, video/mp4, video/webm, video/quicktime, audio/mpeg, audio/wav, audio/ogg, text/plain, text/csv, application/zip, application/x-zip-compressed"
                    />
                </label>
            </div>
            {/* 2... row preview before saving */}
      
            {/* Preview Section (Handles images, videos, and raw files) */}
            {imagePreview && imagePreview.length > 0 && (
              <div className='p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-3 border-dotted border-yellow-300 bg-slate-200 rounded-sm'>
                {imagePreview.map((preview, index) => {
                  const file = uploadedFiles[index]; // Access the File object from state
                  const isImage = file && file.type.startsWith('image/');
                  const isVideo = file && file.type.startsWith('video/');
                  const isRaw = file && !isImage && !isVideo;
                  const moreThanOne = imagePreview.length>1
                     
                  return (
                    <div 
                      key={index} onClick={(event) => {
                        event.preventDefault(); // This is the key line
                        removeFilebyFilter(preview)
                      }}
                    >
                      {isImage ? (
                        <Image src={preview} width={100} height={100} className='rounded-lg object-cover h-[100px] w-[100px]' alt={`Media ${index}`} />
                      ) : isVideo ? (
                        <video src={preview} width={100} height={100} className='rounded-lg object-cover h-[100px] w-[100px]' controls />
                      ) : isRaw ? (
                        <div className="rounded-lg object-cover h-[100px] w-[100px] flex items-center justify-center">
                          <a href={preview} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                              <span className="text-2xl">{getFileIcon2(file)}</span> {/* Pass the File object */}
                              <span className="text-gray-600 mt-2 text-sm">{getFileExtension2(file).toUpperCase()} File</span>
                              <span className="text-gray-600 mt-2 text-xs truncate">{moreThanOne? truncateString(file.name,13): file.name} </span>
                          </a>
                        </div>
                      ) : (
                        <p>Unsupported media type</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/*3 Row fro db  */}
             {
                filteredImageList?  //DB Results
                (
                    <div 
                        className='p-1 grid grid-cols-2 sm:grid-cols-3 
                                   md:grid-cols-5
                                   lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-3 shadow-md mb-2'
                    >   
                           
                          
                          {filteredImageList.map((item, index) => {  // Renamed 'image' to 'item' for clarity
                            const isImage = item.type.includes('image');
                            const isVideo = item.type.includes('video');
                            const isRaw = !isImage && !isVideo;
                            const moreThanOne = filteredImageList.length>1
                            return (
                                <div 
                                  key={index} onClick={(event) => {
                                  event.preventDefault(); // This is the key line
                                  handleDeleteClick(item)
                                }}
                              > {/* Use 'item' here */}
                                {
                                  isImage ? (
                                    <Image src={item.url} width={100} height={100} className='rounded-lg object-cover h-[100px] w-[100px]' alt={`Media ${index}`} />
                                  ) : isVideo ? (
                                    <video src={item.url} width={100} height={100} className='rounded-lg object-cover h-[100px] w-[100px]' controls />
                                  ) : isRaw ? (
                                    <div className="rounded-lg object-cover h-[100px] w-[100px] flex items-center justify-center">
                                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center"> {/*Make it a link */}
                                          <span className="text-2xl">{getFileIcon(item.url)}</span> {/* Display icon */}
                                          <span className="text-gray-600 mt-2 text-sm">{getFileExtension(item.url).toUpperCase()} File</span> {/* Show file type */}
                                          {item.fileName && <span className="text-gray-600 mt-2 text-xs truncate">{moreThanOne?truncateString(item?.fileName,13): item?.fileName} </span>}
                                      </a>
                                    </div>
                                  ) : (
                                    <p>Unsupported media type</p> // Handle unexpected types if needed
                                  )
                                }
                              </div>
                            );
                          })}
                         {
                            isOpen && <AlertDialog
                                 //isOpen={isOpen} 
                                // onClose={handleClose}
                            >
                                <AlertDialogTrigger >
                                <Button
                                    variant="ghost"
                                    // disabled={isLoadingToggleBoard || loadingDeleteBoard || processingMode || processingModeDraggable}
                                    className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
                                >
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ready to Delete Image?</AlertDialogTitle>
                                    <AlertDialogDescription>Do you really want to delete this image?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className={undefined}>
                                    <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-gray-200 outline-1 hover:bg-gray-400" onClick={handleDeleteConfirmation}>
                                    <Trash className="h-4 w-4 mr-2 bg-red-600" />
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            }
                            <Dialog 
                                open={isOpen}
                                onOpenChange={handleClose}
                                // onClose={handleClose}
                            >
                             
                                <DialogContent>
                                <div className="flex flex-col items-center justify-center w-full"> {/* Key changes here */}
                                  <div className="text-center"> {/* Centers text within the container */}
                                    <h2 className="font-semibold text-xl">
                                      Delete Image!
                                    </h2>
                                    <p className="text-xs font-semibold text-neutral-600">
                                      Continue to delete selected image
                                    </p>
                                  </div>
                                  <Button
                                    disabled={false}
                                    onClick={handleDeleteConfirmation}
                                    className="w-max-[70px] mt-4" // Added margin-top for spacing
                                    variant="primary"
                                  >
                                    Confirm delete
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog> 


                            
                    </div>
                )
            :  (
                <div className='grid grid-cols-2 sm:grid-cols-3 
                                md:grid-cols-5
                                lg:grid-cols-7 xl:grid-cols-10 gap-3 mt-3 mb-2'>
                { 
                        [1,2].map((item,index)=>(

                        <div 
                            key={index} 
                            className='h-[100px] w-[100px]  bg-slate-200 animate-pulse rounded-lg'
                        > 

                        </div>
                        ))
                    }
                </div>
                    
               )   
            
             }
        </>
    )
}
