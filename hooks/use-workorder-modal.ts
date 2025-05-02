import { create } from "zustand";

type WorkOrderModalStore = {
  id?: string;
  assetId?: string;
  isOpen: boolean;
  onOpen: (id: string, assetId:string) => void;
  onClose: () => void;
};

export  const useWorkOrderModal = create<WorkOrderModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string, assetId:string) => set({ isOpen: true, id ,assetId}),
  onClose: () => set({ isOpen: false, id: undefined,assetId:undefined }),
}));

