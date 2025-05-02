import { create } from "zustand";

type MaintenanceModalStore = {
  id?: string;
  assetId?: string;
  //boardId?:string;
  isOpen: boolean;
  onOpen: (id: string, assetId:string) => void;
  onClose: () => void;
};

export  const useMaintenanceModal = create<MaintenanceModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string, assetId:string) => set({ isOpen: true, id ,assetId}),
  onClose: () => set({ isOpen: false, id: undefined,assetId:undefined}),
}));

