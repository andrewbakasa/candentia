import {create} from 'zustand';

interface NumberVarState {
  unreadMessages: number;
  setUnreadMessages: (newNum: number) => void;
}

export const useInboxCountVarStore = create<NumberVarState>((set) => ({
  unreadMessages: 0,
  setUnreadMessages: (newUreadMessages: number) => set((state) => ({ unreadMessages: newUreadMessages })),
}));