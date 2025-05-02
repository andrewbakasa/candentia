import { create } from 'zustand';

interface BooaleanState {
  collapseState: boolean;
  setCollapseState: (value: boolean) => void;
}

export const useCollapseStore = create<BooaleanState>((set) => ({
  collapseState: false,
  setCollapseState: (value: boolean) => set((state) => ({ collapseState: value })),
}))