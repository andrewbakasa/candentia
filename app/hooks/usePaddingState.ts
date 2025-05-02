import { create } from 'zustand';

interface pStateProps {
  paddingState: string | null; // Explicit type for idList
  setPaddingState: (v:string)=>void;
}

// const initialState: pStateProps = {
//   paddingState: 'pb-28',
// };

const usePaddingState = create<pStateProps>((set) => ({
//   ...initialState,
  paddingState: 'pb-28',
  setPaddingState: (v) => set({ paddingState:v }),
  
  }));

export default usePaddingState;
