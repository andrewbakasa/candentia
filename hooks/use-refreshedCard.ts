import { create } from 'zustand';

interface StringState {
  cardIdToRefresh: string;
  setCardIDToRefreshState: (value: string) => void;
}

export const useCardIDToRefreshStore = create<StringState>((set) => ({
  cardIdToRefresh: '',
  setCardIDToRefreshState: (value: string) => set((state) => ({ cardIdToRefresh: value })),
}))