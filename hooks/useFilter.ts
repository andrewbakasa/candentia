import { string } from 'zod';
import {create} from 'zustand';

interface BooaleanState {
  tagItems:string [];
  setTagItems: (value: string[]) => void;
}


const useTagItems = create<BooaleanState>((set) => ({
  tagItems: [],
  setTagItems: (value:string[]) =>  set((state) => ({ tagItems:value})),
  }));

export default useTagItems;