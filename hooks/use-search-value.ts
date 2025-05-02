import {create} from 'zustand';

interface StringVarState {
  stringVar: string;
  setStringVar: (newString: string) => void;
}

export const useStringVarStore = create<StringVarState>((set) => ({
  stringVar: '',

  setStringVar: (newString: string) => set((state) => ({ stringVar: newString })),
}));