import {create} from 'zustand';

export interface LabelValueType {
    label: string;
    value: string|number;
  }
  
interface ListVarState {
  failureCatList: LabelValueType[];
  setFailureCatList: (newString: LabelValueType[]) => void;
}

export const useFailureCatLabelValueStore = create<ListVarState>((set) => ({
  failureCatList: [],
  setFailureCatList: (newObject: LabelValueType[]) => set((state) => ({ failureCatList: newObject })),
}));