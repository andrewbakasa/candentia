import { create } from 'zustand';

interface StringState {
  stringValue: string;
  setStringValue: (value: string) => void;
}

export const useStringStore = create<StringState>((set) => ({
  stringValue: '',
  setStringValue: (value: string) => set((state) => ({ stringValue: value })),
}));