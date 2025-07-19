
import { SafeUser } from "@/app/types";
import { create } from "zustand";

type MediaModalStore = {
  id?: string;
  jobId?: string;
  isOpen: boolean;
  isAll: boolean;
  currentUser:SafeUser | null | undefined;
  onOpen: (id: string, jobId: string, currentUser: SafeUser | null | undefined, isAll?: boolean) => void;
  onClose: () => void;
};

export const useJobMediaModal = create<MediaModalStore>((set) => ({
  id: undefined,
  jobId: undefined, // Initialize boardId as undefined
  isOpen: false,
  isAll: false,
  currentUser: null,

  onOpen: (id: string, jobId: string, currentUser: SafeUser | null | undefined, isAll: boolean = false) =>
    set({ isOpen: true, id, jobId, currentUser, isAll }),
  onClose: () => set({ isOpen: false, id: undefined, jobId: undefined, isAll: false }), // Reset isAll as well
}));
