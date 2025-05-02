import { Board,  User, List, Card, Tag, 
   BoardView, CardImage, Investor, InvestmentPortfolio } from "@prisma/client";


export type SafeCard = Omit<
  Card, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeInvestor = Omit<
  Investor, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeInvestmentPortfolio = Omit<
  InvestmentPortfolio, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};


export type SafeList = Omit<
  List, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
  cards: SafeCard []
 
};


export type SafeListWithBoard ={
  id: string;
  user_image: string | null;
  imageThumbUrl: string;
  board_title: string;
  list_title: string;
  owner_email: string ;
  cards: {
      createdAt: string;
      updatedAt: string;
      id: string;
      title: string;
      order: number;
      description: string | null;
      listId: string;
      visible: boolean; 
      active: boolean;
  }[];
  createdAt: string;
  updatedAt: string;    
  //views:number;
}

export type SafeCardWithBoard= {
  title: string;
  description: string | null;
  id: string;
  user_image: string | null;
  imageThumbUrl: string;
  board_title: string;
  list_title: string;
  owner_email: string;
  createdAt: string;
  updatedAt: string;  
  //views:number;
}

export type SafeBoard = Omit<
  Board, 
  "createdAt" | "updatedAt" 
> & {
  createdAt: string;
  updatedAt: string;
  lists: SafeList [];
  user_image:string;  
  views:number;
  userslist:string[];
};



export type SafeCardMedia = Omit<
  CardImage, 
  "createdAt"  
> & {
  createdAt: string;
  card:SafeCard;
  listTitle:string,
  bordTitle: string,
  boardCreatedAt: string, // Handle null
  boardUpdatedAt: string, // Handle null
}

export type cardWithImageList ={card: Card, imageList: CardImage[]}


export type SafeUser = Omit<
  User,
  "createdAt" | "updatedAt" | "emailVerified"
> & {
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
};

export type SafeTag = Omit<
  Tag,
  "createdAt" | "updatedAt" 
> & {
  createdAt: string;
  updatedAt: string;
};
