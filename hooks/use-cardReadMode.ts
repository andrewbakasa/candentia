
import { create} from 'zustand';



interface OverdueState {
  // readMode: boolean;
  readMode: boolean; // Use null as initial state
  setReadModeState: (value: boolean) => void;
}

export const useCardReadModeStore = create<OverdueState>((set) => ({
  readMode: false, // Initial state for local usage
  setReadModeState: (value: boolean) => set((state) => ({ readMode: value })),
 
}));
