import { create } from "zustand";

type CommentModalStore = {
  id?: string;
  cardId?: string;
  boardId?:string;
  isOpen: boolean;
  onOpen: (id: string, cardId:string,boardId:string) => void;
  onClose: () => void;
};

export  const useCommentModal = create<CommentModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string, cardId:string , boardId:string) => set({ isOpen: true, id ,cardId, boardId}),
  onClose: () => set({ isOpen: false, id: undefined,cardId:undefined, boardId:undefined }),
}));
