import { create } from 'zustand';

interface BooaleanState {
  inverseState: boolean;
  setInverseState: (value: boolean) => void;
}

export const useInverseStore = create<BooaleanState>((set) => ({
  inverseState: false,
  setInverseState: (value: boolean) => set((state) => ({ inverseState: value })),
}))