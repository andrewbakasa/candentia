import {create} from 'zustand';

interface StringVarState {
  resultString: string;
  setResultString: (newString: string) => void;
}

export const useSearchResultStore = create<StringVarState>((set) => ({
  resultString: '',

  setResultString: (newString: string) => set((state) => ({ resultString: newString })),
}));