import {create} from 'zustand';

export interface LabelValueType {
    label: string;
    value: string|number;
  }
  
interface ListVarState {
  tagList: LabelValueType[];
  setTagList: (newString: LabelValueType[]) => void;
}

export const useTagLabelValueStore = create<ListVarState>((set) => ({
  tagList: [],
  setTagList: (newObject: LabelValueType[]) => set((state) => ({ tagList: newObject })),
}));