// import { SafeUser } from "@/app/types";
// import { create } from "zustand";

// type MediaModalStore = {
//   id?: string;
//   boardId?: string;
//   isOpen: boolean;
//   isAll:boolean;
//   currentUser:SafeUser|null;
//   onOpen: (id: string, boardId:string, isAll?:boolean) => void;
//   onClose: () => void;
// };

// export  const useMediaModal = create<MediaModalStore>((set) => ({
//   id: undefined,
//   isOpen: false,
//   isAll:false,
//   currentUser:null,

//   onOpen: (id: string,boardId:string, currentUser:SafeUser|null, isAll:boolean = false) => set({ isOpen: true, id, boardId,currentUser ,isAll}),
//   onClose: () => set({ isOpen: false, id: undefined,boardId:undefined}),
// }));

import { SafeUser } from "@/app/types";
import { create } from "zustand";

type MediaModalStore = {
  id?: string;
  boardId?: string;
  isOpen: boolean;
  isAll: boolean;
  currentUser:SafeUser | null | undefined;
  onOpen: (id: string, boardId: string, currentUser: SafeUser | null | undefined, isAll?: boolean) => void;
  onClose: () => void;
};

export const useMediaModal = create<MediaModalStore>((set) => ({
  id: undefined,
  boardId: undefined, // Initialize boardId as undefined
  isOpen: false,
  isAll: false,
  currentUser: null,

  onOpen: (id: string, boardId: string, currentUser: SafeUser | null | undefined, isAll: boolean = false) =>
    set({ isOpen: true, id, boardId, currentUser, isAll }),
  onClose: () => set({ isOpen: false, id: undefined, boardId: undefined, isAll: false }), // Reset isAll as well
}));
