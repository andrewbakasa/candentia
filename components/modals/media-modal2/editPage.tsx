"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Formik } from 'formik';
import { Loader } from 'lucide-react';
import { FUploaderFile } from './fLoaderFile';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { SafeUser } from '@/app/types';

interface Image {
  id: string;
  url: string;
  cardId: string;
  type: string;
  userId: string | null;
  fileName: string| null
}

interface FileUploadProps {
  newImageList: File[];
  dbImages: Image[];
  cardId: string;
  createCardImageMutation: (data: any) => void;
  refreshCardImages: () => void;
  boardId: string; 
  currentUser:SafeUser | null | undefined;
}

const EditCardMedia: React.FC<FileUploadProps> = ({
  newImageList,
  dbImages,
  cardId,
  createCardImageMutation,
  refreshCardImages,
  boardId,
  currentUser

}) => {
  const [loading, setLoading] = useState(false);
  const [userImageList, setUserImageList] = useState<File[]>(newImageList); // Initialize with newImageList
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    setInitialValues({}); // No need to set initial values if they are empty objects
  }, []);

  useEffect(() => {
   // console.log('dbImages', dbImages);
    setUserImageList(newImageList); // Update userImageList when newImageList prop changes
  }, [newImageList]); // Add newImageList to the dependency array


  const onSubmitHandler = async (formValue: {}) => {
    setLoading(true);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_PRESET_NAME!;

    try {
      const uploadPromises = userImageList.map(async (curr_img) => {
        const formData = new FormData();
        formData.append("file", curr_img);
        formData.append("upload_preset", uploadPreset);

        let resourceType ;//= curr_img.type.startsWith("video/") ? "video" : "image";
        // Determine resource type based on file type (you'll need to implement this logic)
        if (curr_img.type.startsWith('image/')) {  // Check if it's an image
          resourceType = 'image';
        } else if (curr_img.type.startsWith('video/')) { // Check if it's a video
          resourceType = 'video';
        } else { // Otherwise, assume it's a "raw" file (Word, Excel, etc.)
          resourceType = 'raw';
        }
        let uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload/`;
        

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          try {
            const errorData = JSON.parse(errorMessage);
            throw new Error(errorData.error.message);
          } catch (jsonError) {
            throw new Error(errorMessage || response.statusText);
          }
        }

        const data = await response.json();
        const url = data.secure_url;
        const fileName= curr_img.name
        return createCardImageMutation({ url, cardId, type: resourceType, boardId, fileName});
      });

      await Promise.all(uploadPromises);
      refreshCardImages();
      toast.success("Media uploaded successfully!");
      setUserImageList([]); // Clear the userImageList after successful upload
    } catch (error) {
      console.error("Media upload failed:", error);
      toast.error("Media upload failed. Please try again."); // Show a user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center my-2 w-[75vw]'>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmitHandler} // Directly use onSubmitHandler
      >
        {({ handleSubmit }) => ( // No need for handleChange if not using form fields
          <form onSubmit={handleSubmit}>
            <div className='border rounded-lg shadow-md grid gap-3 mt-3'>
              <div className='p-2'>
                <h2 className='font-lg text-gray-500 my-2'>Upload Media</h2>
                <FUploaderFile
                  refreshCardImages={refreshCardImages}
                  dbImageList={dbImages}
                  setUserImageList={setUserImageList}
                  currentUser={currentUser}
                />
              </div>
              <div className='p-2 flex gap-3 justify-end'>
                <Button
                  disabled={loading || userImageList.length === 0} // Corrected condition
                  variant="outline"
                  className={cn("", userImageList.length > 0 ? 'border-blue-500 text-blue-800' : 'border-primary text-primary ')}
                >
                  {loading ? <Loader className='animate-spin' /> : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default EditCardMedia;
