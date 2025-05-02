import {create} from 'zustand';

export interface LabelValueType {
    label: string;
    value: string|number;
  }
  
interface ListVarState {
  userList: LabelValueType[];
  setUserList: (newString: LabelValueType[]) => void;
}

export const useUserLabelValueStore = create<ListVarState>((set) => ({
  userList: [],
  setUserList: (newObject: LabelValueType[]) => set((state) => ({ userList: newObject })),
}));