import { create } from "zustand";

type ProModalStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  // id?: string;
  // boardId?: string;
  // isOpen: boolean;
  // onOpen: (id: string, boardId:string) => void;
  // onClose: () => void;
};

export  const useProModal = create<ProModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  // id: undefined,
  // isOpen: false,
  // onOpen: (id: string,boardId:string) => set({ isOpen: true, id ,boardId}),
  // onClose: () => set({ isOpen: false, id: undefined,boardId:undefined }),

}));
