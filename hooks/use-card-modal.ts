import { create } from "zustand";

type CardModalStore = {
  id?: string;
  boardId?: string;
  isOpen: boolean;
  isAll:boolean;
  onOpen: (id: string, boardId:string, isAll?:boolean) => void;
  onClose: () => void;
};

export  const useCardModal = create<CardModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  isAll:false,
  onOpen: (id: string,boardId:string, isAll:boolean = false) => set({ isOpen: true, id, boardId ,isAll}),
  onClose: () => set({ isOpen: false, id: undefined,boardId:undefined}),
}));
