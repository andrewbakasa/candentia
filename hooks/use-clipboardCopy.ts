import { create } from 'zustand';

interface BooaleanState {
  copiedState: boolean;
  setCopyState: (value: boolean) => void;
}

export const useClipBoardCopytore = create<BooaleanState>((set) => ({
  copiedState: false,
  setCopyState: (value: boolean) => set((state) => ({ copiedState: value })),
}))