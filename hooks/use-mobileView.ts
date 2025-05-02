import { create} from 'zustand';



interface BooalenState {
  // readMode: boolean;
  showMobileView: boolean; // Use null as initial state
  setShowMobileViewState: (value: boolean) => void;
}

export const useShowMobileViewStore = create<BooalenState>((set) => ({
  showMobileView: false, // Initial state for local usage
  setShowMobileViewState: (value: boolean) => set((state) => ({ showMobileView: value })),
 
}));
