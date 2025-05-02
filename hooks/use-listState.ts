import { create } from 'zustand';

interface BooaleanState {
  listState: boolean;
  setListState: (value: boolean) => void;
}

export const uselistStore = create<BooaleanState>((set) => ({
  listState: false,
  setListState: (value: boolean) => set((state) => ({ listState: value })),
}))