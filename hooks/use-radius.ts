import {create} from 'zustand';

interface NumberVarState {
  radiusVar: number;
  setRadiusVar: (newNumber: number) => void;
}

export const useRadiusStore = create<NumberVarState>((set) => ({
  radiusVar: 100,
  setRadiusVar: (newNumber: number) => set((state) => ({ radiusVar: newNumber })),
}));
