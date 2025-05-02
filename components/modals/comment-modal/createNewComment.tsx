"use client";

import { toast } from "sonner";
import { AlignLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useRef, ElementRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener, useOnClickOutside } from "usehooks-ts";

import { useAction } from "@/hooks/use-action";
import { CardWithList, CardWithList2, SafeCardWithList2 } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { cn, isJsonStringEditorCompatible } from "@/lib/utils";
import 'react-calendar/dist/Calendar.css';
import { Separator } from "@radix-ui/react-separator";
import { differenceInDays, format, isValid } from "date-fns";

import { Editor as Editor2, EditorState, convertToRaw,
  convertFromRaw ,
  ContentState,
  convertFromHTML,
} from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';


import dynamic from "next/dynamic";
import { ACTION, Card, Comment, ENTITY_TYPE, Tag } from "@prisma/client";
import { SafeCard } from "@/app/types";
import { createAudit } from "@/actions/create-audit-log";
import { useCardIDToRefreshStore } from "@/hooks/use-refreshedCard";
import { updateComment } from "@/actions/update-comment";
import { createComment } from "@/actions/create-comment";

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });



interface CommentProps {
  
  cardId:string;
  boardId:string;
  setActivityViewMode:(value:boolean) => void;
};

export const NewComment = ({
  
  cardId,
  boardId,
  setActivityViewMode
}: CommentProps) => {
  // const params = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(true);
  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<ElementRef<"textarea">>(null);
  const checkboxRef = useRef<ElementRef<"input">>(null);
  
  let [note, setNote] = useState("")
  const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());
   const {setCardIDToRefreshState}=useCardIDToRefreshStore();
  const enableEditing = () => {
    setIsEditing(true);
    setActivityViewMode(false)
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  }

  const disableEditing = () => {
    setIsEditing(false);
    setActivityViewMode(true)
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
     // disableEditing();
    }
  };

  useEventListener("keydown", onKeyDown);
  let getNote = () => {
        const placeholder= ''
        const { contentBlocks, entityMap } = convertFromHTML(placeholder);
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        setEditorState(EditorState.createWithContent(contentState)); 
        setNote(JSON.stringify(contentState)) 
  }
  useEffect(()=>{
    getNote()
  },[])
  
  const { execute:executeAudit, isLoading } = useAction(createAudit, {
    onSuccess: (data) => {
      toast.success(`Update AuditLog`);
      //console.log(data)
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  

  const { execute:executeCreate} = useAction(createComment, {
    onSuccess: (data) => {
      toast.success(`Comment created for ${data.id}`);
      formRef.current?.reset();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit =  (formData: FormData) => {
        const content = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
        if (!isValidJSON(content)){
          toast.error('Note is no Valid Json')
          return
        }
        const visible = Boolean(formData.get("visible"));
        const progress = formData.get("progress") as string;
        try {
          executeCreate({
            comment:content,
             cardId,
             boardId
          })
        }catch(e){
              toast.message(`${e}`)
        }
  };

  
  type ValuePiece = Date | null;
  type Value = ValuePiece | [ValuePiece, ValuePiece];
  
  const onEditorStateChange = (editorState: EditorState): void => {
    setEditorState(editorState);
    const content = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
    setNote(content)
  };

 
  
 
  return (
    <div className="flex items-start gap-x-3 w-full">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">
          Comment
        </p>
          <form
            id="id1"
            name= "name1"
            action={onSubmit}
            ref={formRef}
            className="flex flex-col space-y-1 min-h-[50vh]"
          >
           <div  className="flex flex-col gap-y-0">
              <div className="min-h-[40vh]   overflow-x-hidden     overflow-y-auto ">
                <Editor
                  editorStyle={{ minHeight: '60vh', 
                                 maxWidth:"99vw", 
                                 //maxHeight: '50vh', 
                                 border: "1px solid #ccc",  
                                 borderRadius: '7px',
                                 padding:'11px',
                                }}
                  editorState={editorState}
                  onEditorStateChange={onEditorStateChange}
                  wrapperClassName="wrapper-class"
                  editorClassName="editor-class"
                  toolbarClassName="toolbar-class"
                  toolbarStyle={{border: '1px solid #ccc', borderRadius: '7px'}}
                  wrapperStyle={{ padding: '.2rem', border: '1px solid #ccc',  borderRadius: '7px' } }
                />
              </div>
            </div>
           
            <Separator/>
          
            <div className="flex items-center gap-x-2">
              <FormSubmit>
                Save
              </FormSubmit>
              <Button
                type="button"
                onClick={disableEditing}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
};

// NewComment.Skeleton = function commentSkeleton() {
//   return (
//     <div className="flex items-start gap-x-3 w-full">
//       <Skeleton className="h-6 w-6 bg-neutral-200" />
//       <div className="w-full">
//         <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
//         <Skeleton className="w-full h-[98px] bg-neutral-200" />
//       </div>
//     </div>
//   );
// };


export function getTextFromEditor( data: Comment ) {
  //console.log('data', data)
  if (data.comment !==undefined && data.comment !==null && data.comment!=="") {
       //console.log('data', data)
      if (isJsonStringEditorCompatible(data?.comment||"")){
          //console.log('NotePage:::', data.comment)
          try{
             const DBEditorState = convertFromRaw(JSON.parse(data?.comment||""));
             return(JSON.stringify(DBEditorState.getPlainText()))
          }catch(e){
            // console.log("ERROR A:", e)
            const { contentBlocks, entityMap } = convertFromHTML('');
            const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
            return(JSON.stringify(contentState.getPlainText())) 
        
          }
         
          
      }else{
            //const processedHTML = DraftPasteProcessor.processHTML(data.comment);
            const { contentBlocks, entityMap } = convertFromHTML(data.comment);
            const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
            //const contentState = ContentState.createFromBlockArray(processedHTML);  
            return(JSON.stringify(contentState.getPlainText())) 
      }

  }else {
      const placeholder= ''
      //const processedHTML = DraftPasteProcessor.processHTML(data.comment);
      const { contentBlocks, entityMap } = convertFromHTML(placeholder);
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      //const contentState = ContentState.createFromBlockArray(processedHTML);     
      return(JSON.stringify(contentState.getPlainText()))
  }

}

export function getAllTextEntries(editorState: { getCurrentContent: () => any; }) {
  const content = editorState.getCurrentContent();
  const blockMap = content.getBlockMap();

  const textEntries: any[] = [];

  blockMap.forEach((block: { getText: () => any; }) => {
    const text = block.getText();
    textEntries.push(text);
  });

  return textEntries;
}

interface Data {
  text: string;
  // Add other properties as needed
}
interface UserData {
  blocks: Data[];
  // Add other properties as needed
}
export function getAllTextEntriesA(json_string: string) {

  let c : string []=[]// string array initialised empty
 
  //const data = json.loads(json_string)
  const userData = JSON.parse(json_string);
  //toast.error(`"----->${ userData}`)
  userData.forEach((el: { text: string; }, index: any)=> {
    // Code to be executed for each element
    console.log("pushing", el.text)
    c.push(el.text)
   
  });
  const joinedString = c.join("\n");
  return joinedString
}
export function isValidJSON(str:string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}