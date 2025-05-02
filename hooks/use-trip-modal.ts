import { create } from "zustand";

type TripModalStore = {
  id?: string;
  assetId?: string;
  truckId?:string;
  isOpen: boolean;
  onOpen: (id: string, assetId:string,truckId:string) => void;
  onClose: () => void;
};

export  const useTripModal = create<TripModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string, assetId:string , truckId:string) => set({ isOpen: true, id ,assetId, truckId}),
  onClose: () => set({ isOpen: false, id: undefined,assetId:undefined, truckId:undefined }),
}));

