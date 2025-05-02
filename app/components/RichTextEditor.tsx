'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
//import { EditorState } from 'draft-js';
import { EditorState, convertToRaw,
    convertFromRaw ,
    ContentState,
    convertFromHTML,
    //RichUtils
  } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });

interface RichTextOptions {
    setNote:(value:string) => void;
    initialNote:string
  };

function getOutput (c:string):any{
  if (c.length>0){ 
    // const processedHTML =  DraftPasteProcessor.processHTML(c);
    const { contentBlocks, entityMap } = convertFromHTML(c);
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);  
    //const contentState = ContentState.createFromBlockArray(processedHTML);
    return (EditorState.createWithContent(contentState)); 
  
}  
return EditorState.createEmpty()
}

const RichTextExample: React.FC<RichTextOptions> = ({setNote, initialNote}) => {
    
    const [editorState, setEditorState] = useState<EditorState>(getOutput(initialNote));

    if (initialNote){ 
          // Access the processHTML function:
        //const processedHTML2 = Draft.DraftPasteProcessor.processHTML(html);
        //const processedHTML = convertFromHTML(initialNote) //
        //const processedHTML =  DraftPasteProcessor.processHTML(initialNote);
        //const contentState = ContentState.createFromBlockArray(processedHTML);
        const { contentBlocks, entityMap } = convertFromHTML(initialNote);
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);  
        setEditorState(EditorState.createWithContent(contentState)); 
        const content = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
        //setNote(content)
        //setUnsavedChanges(true)
    }  
 
  const onEditorStateChange2 = (newEditorState: EditorState): void => {
    setEditorState(newEditorState);
  };

  const onEditorStateChange = (editorState: EditorState): void => {
    setEditorState(editorState);
    const content = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
    setNote(content)
    //setUnsavedChanges(true)
  };

  return (
    <div>
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        wrapperClassName="wrapper-class"
        editorClassName="editor-class"
        toolbarClassName="toolbar-class"
      />
      <button onClick={() => console.log(editorState)}>Log Editor State</button>
    </div>
  );
};

export default RichTextExample;