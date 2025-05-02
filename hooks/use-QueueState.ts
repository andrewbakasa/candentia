import { create } from 'zustand';

interface BooaleanState {
  recentQ: boolean;
  setRecentQueueState: (value: boolean) => void;
}

export const useQueueStore = create<BooaleanState>((set) => ({
  recentQ: false,
  setRecentQueueState: (value: boolean) => set((state) => ({ recentQ: value })),
}))