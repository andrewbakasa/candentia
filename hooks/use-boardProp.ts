import { ListWithCards } from '@/types';
import { create } from 'zustand';

interface BoardState {
  boardState: ListWithCards[];
  setBoardState: (value: any[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
boardState: [],
  setBoardState: (value: ListWithCards[]) => set((state) => ({ boardState: value })),
}))