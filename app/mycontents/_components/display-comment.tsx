"use client";

import { Plus, X, Expand} from "lucide-react";
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
import { cn, isJsonStringEditorCompatible } from "@/lib/utils";

import moment from "moment";
import { BiCollapse } from "react-icons/bi";
import { useCommentModal } from "@/hooks/use-comment-modal";
import { AiFillEdit } from "react-icons/ai";
import CreatedAtUpdatedAt from "./updatedCreated";

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });



interface CardFormProps {
  data: Comment;
  boardId:string;
  cardId:string;
};

export const CommentShow = forwardRef<HTMLTextAreaElement, CardFormProps>(({
  data,boardId,cardId
}, ref) => {
  
const [isEditing, setIsEditing] = useState(false);


  
const commentModal = useCommentModal();
const disableEditing = () => {
  setIsEditing(false);
};

const cancelDisableEditing= () => {
  setIsEditing(true);
};

const enableEditing = () => {
  setIsEditing(true);
  
};

const created=data.createdAt
const updated=data.updatedAt;
const notSameDate = moment(created).fromNow()!== moment(updated).fromNow()

  if (isEditing) {
        return (
        <div 
            className="flex flex-col gap-1 mb-2 bg-blue-100 shadow-sm rounded-sm w-full"   
           
        >
            <div className="flex flex-row justify-between ">
              <div className="flex flex-row ">  
                  <BiCollapse className="h-4 w-4 mr-2 text-red-500 "  onClick={disableEditing} />
                  <h4 className='text-sm text-red-500 text-nowrap'>My comment:</h4> 
              </div>
              <Button 
                   className="h-auto px-2 py-1.5 w-auto justify-end bg-inherit  text-[11px] hover:text-sm"
                   size="sm"
                   variant="secondary"
                  onClick={() => commentModal.onOpen(data.id,cardId, boardId)}
              ><span>
              <AiFillEdit 
                  size={10} 
                  className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
              /> 
            </span></Button>
                            
            </div>
            <div 
                className="static-editor min-h-[25vh] overflow-x-hidden overflow-y-auto
                    bg-gray-50 text-black font-serif border shadow-sm text-small px-2 rounded-sm mb-2"
            >
                
                <Editor2 
                    customStyleMap ={{
                    editor: {
                      border: '1px solid #ccc',
                      padding: '11px', // Concatenate with unit
                      borderRadius:'5px',
                      minHeight: '100vh',
                      backgroundColor:'#ddd',
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
                
                  editorState={EditorState.createWithContent(getTextFromEditor2(data))} 
                  readOnly 
                  onChange={() => {}} // Empty dummy function
                />
            </div>
        </div>
)
  }

  return (
    // <div className="flex flex-row justify-between">
     <div  className="w-full flex flex-col md:justify-between italic md:flex-row">
              
        <div className="text-[7px] ">
          <Button
            onClick={enableEditing}
            className="h-auto  py-1.5 w-full justify-start  text-muted-foreground text-[11px] hover:text-sm"
            size="sm"
            variant="ghost"
          >
          <Expand className="h-4 w-4 mr-2" />
           Show my comment...                          
          </Button>
          
        </div>
        <div className="flex gap-1 text-[11px] ">
            <CreatedAtUpdatedAt
              createdAt={data.createdAt.toString()} 
              updatedAt={data.updatedAt.toString()} 
            />
        </div> 
        
</div>
  );
});

CommentShow.displayName = "CommentForm";

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