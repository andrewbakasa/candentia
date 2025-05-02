import {create} from 'zustand';

export interface LabelValueType {
    label: string;
    value: string|number;
  }
  
interface ListVarState {
  assetCatList: LabelValueType[];
  setAssetCatList: (newString: LabelValueType[]) => void;
}

export const useAssetCatLabelValueStore = create<ListVarState>((set) => ({
  assetCatList: [],
  setAssetCatList: (newObject: LabelValueType[]) => set((state) => ({ assetCatList: newObject })),
}));