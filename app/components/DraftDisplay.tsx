import React from 'react';
import { Editor, EditorState, ContentState } from 'draft-js';

interface DraftDisplayProps {
  content: ContentState; // Pre-defined content to display
}

const DraftDisplay: React.FC<DraftDisplayProps> = ({ content }) => {
  const editorState = EditorState.create({ content });

  return (
    <div className="draft-display">
      <Editor
        editorState={editorState}
        readOnly // Set to readOnly to prevent editing
        onChange={() => {}} // Empty dummy function
      />
    </div>
  );
};

export default DraftDisplay;
