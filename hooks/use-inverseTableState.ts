import { create } from 'zustand';

interface BooaleanState {
  inverseTableState: boolean;
  setInverseTableState: (value: boolean) => void;
}

export const useInverseTableStore = create<BooaleanState>((set) => ({
  inverseTableState: false,
  setInverseTableState: (value: boolean) => set((state) => ({ inverseTableState: value })),
}))