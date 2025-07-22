"use client";

import { Plus, X, Expand, ListCollapse, ListCollapseIcon} from "lucide-react";
import { 
  forwardRef, 
  useState,
} from "react";
import { Button } from "@/components/ui/button";

import { Editor as Editor2, EditorState, convertToRaw,
  convertFromRaw ,
  ContentState,
  convertFromHTML,
} from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';


import dynamic from "next/dynamic";
import { Comment } from "@prisma/client";
import { cn, findLabelByValue, isJsonStringEditorCompatible } from "@/lib/utils";

import moment from "moment";
import CreatedAtUpdatedAt from "./updatedCreated";
import { BiCollapse } from "react-icons/bi";

// import { Avatar, AvatarImage } from "@/components/ui/avatar";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });



interface CardFormProps {
  data: Comment[];
  userNames:any
};

export const CommentList = forwardRef<HTMLTextAreaElement, CardFormProps>(({
  data,
  userNames
}, ref) => {
  
const [isEditing, setIsEditing] = useState(false);


const disableEditing = () => {
  setIsEditing(false);
};

const cancelDisableEditing= () => {
  setIsEditing(true);
};

const enableEditing = () => {
  setIsEditing(true);
  
};
const [isEditable, setIsEditable] = useState(false);

  const handledbEditClick = () => {
    setIsEditable(!isEditable);
  };
  if (isEditing) {
    return (
        <div 
          className="flex flex-col gap-1 mb-2 shadow-sm w-full border rounded-lg"    
        >  
               <div className="flex flex-row  bg-gray-50 shadow-sm rounded-sm">  
                  <BiCollapse className="h-4 w-4 mr-2 text-black" onClick={disableEditing} />
                  <h4 className='flex gap-2 text-sm text-gray-700'>Comments by Tagged Users:</h4> 
               </div>
                {
                    data?.map((commentx, index) => {
                        return (
                            <div 
                                key={index}
                                className={
                                  cn("static-editor min-h-[10vh] w-full overflow-x-hidden overflow-y-auto   font-serif  px-2 rounded-sm shadow text-[12px]",
                                  isEditable?"bg-white text-black": "bg-gray-50 text-gray-400"
                                )}
                                //onClick={handledbEditClick}
                                onDoubleClick={handledbEditClick}    
                            >
                              <div  className="w-full flex flex-col md:justify-between italic md:flex-row">
                                <span className="text-gray-400">
                                  
                                    <div className="flex flex-row gap-1">
                                        {/* <span>  {'created by:  '}</span> */}
                                        <Avatar  className="h-10 w-10 z-50">
                                            <AvatarImage src={commentx.imageThumbUrl && commentx?.imageThumbUrl.length>0 ?  commentx.imageThumbUrl: '/images/placeholder.jpg'}/>
                                        </Avatar>

                                        {/* This wont work for large model with million of user....
                                        .... new strategy is to keep record within the coment itself
                                        */}
                                        <span className="text-blue-300"> {commentx?.ownerEmail? commentx.ownerEmail: findLabelByValue(userNames, commentx.userId)}
                                        </span>
                                    </div> 
                                </span>
                                <div className="flex gap-1 text-[11px] ">
                                    <CreatedAtUpdatedAt 
                                      createdAt={commentx.createdAt.toString()} 
                                      updatedAt={commentx.updatedAt.toString()} 
                                    />
                                </div> 
                                      
                              </div>
                            
                                <Editor2 
                                    customStyleMap ={{
                                        editor: {
                                        border: '1px solid #ccc',
                                        padding: '11px', // Concatenate with unit
                                        borderRadius:'5px',
                                        minHeight: '10vh',
                                        backgroundColor:isEditable ? '#ddd' :"red",
                                        margin:"5px"
                                        },
                                        toolbar:{
                                        border: '1px solid #ccc', 
                                        borderRadius: '7px'
                                        },
                                        wrapper: { 
                                        //padding: '1rem', 
                                        border: '1px solid #ccc',  
                                        borderRadius: '7px' 
                                        }
                                        
                                    }}
                                    
                                    editorState={EditorState.createWithContent(getTextFromEditor2(commentx))} 
                                    
                                    readOnly={isEditable ? false : true} 
                                    onChange={isEditable ? (newEditorState) => { 
                                      () => {}
                                      // Handle editor state changes 
                                     // const newContent = JSON.stringify(convertToRaw(newEditorState.getCurrentContent()));
                                      // You can update the component state here or send the new content to the server
                                    } : () => {}} 
                                 
                                   
                                />
                            </div>
                
                        )
                    })
                }
        </div>
      )
  }

  return (
    <div className="pt-2 px-2 text-[7px] ">
      <Button
        onClick={enableEditing}
        className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[11px] hover:text-sm bg-red-200"
        size="sm"
        variant="ghost"
      >
        <Expand className="h-4 w-4 mr-2" />
        {`[${data.length}] `} Show comments...
      </Button>
    </div>
  );
});

CommentList.displayName = "CommentForm";

export function getTextFromEditor2( data: Comment ) {
  if (data.comment !==undefined && data.comment !==null) {
      if (isJsonStringEditorCompatible(data?.comment||"")){
          try{
             const DBEditorState = convertFromRaw(JSON.parse(data?.comment||""));   
            // JSON.stringify(DBEditorState.getPlainText())       
             return (DBEditorState)
          }catch(e){
            //toast.error(`Last resort failure.${e}`)
            const placeholder= ''
            // console.log('Data with errors:', data?.comment)
            const { contentBlocks, entityMap } = convertFromHTML(placeholder);
            const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);   
            return (contentState) 
          
           
          }
         

      }else{
          const { contentBlocks, entityMap } = convertFromHTML(data?.comment);
          const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
            return(contentState) 
      }

  }else {
      const placeholder= ''
       const { contentBlocks, entityMap } = convertFromHTML(placeholder);
       const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      return (contentState) 
  }

}