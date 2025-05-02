import { create } from 'zustand';

interface BooaleanState {
  openState: boolean;
  setOpenState: (value: boolean) => void;
}

export const useSearchOpenStore = create<BooaleanState>((set) => ({
  openState: false,
  setOpenState: (value: boolean) => set((state) => ({ openState: value })),
}))