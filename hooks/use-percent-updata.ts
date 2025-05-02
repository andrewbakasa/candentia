import {create} from 'zustand';

interface NumberVarState {
  numberVar: number;
  setNumberVar: (newNumber: number) => void;
}

export const useNumberVarStore = create<NumberVarState>((set) => ({
  numberVar: 0,
//   setNumberVar: (newNumber: number) => {
//     // Ensure the new value is within the valid range (0 to 100)
//     const clampedNumber = Math.min(Math.max(newNumber, 0), 100);
//     set({ numberVar: clampedNumber });
    
//   },
  setNumberVar: (newNumber: number) => set((state) => ({ numberVar: newNumber })),
}));

