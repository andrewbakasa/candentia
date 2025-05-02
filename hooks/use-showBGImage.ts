import { create} from 'zustand';



interface OverdueState {
  // readMode: boolean;
  showBGImage: boolean; // Use null as initial state
  setShowBGImageState: (value: boolean) => void;
}

export const useShowBGImageStore = create<OverdueState>((set) => ({
  showBGImage: false, // Initial state for local usage
  setShowBGImageState: (value: boolean) => set((state) => ({ showBGImage: value })),
 
}));
