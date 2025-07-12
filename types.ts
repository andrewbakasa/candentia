import { Board, BoardView, Card, CardImage, CardToUser, Comment, InvestmentPortfolio, Investor, InvestorInvestment, List, Prisma } from "@prisma/client";

export type ListWithCards = List & { cards: Card[] };
export type ListWithCards2 = List & { cards: CardWithList2[] };
export type SafeListWithCards3 = List & { cards: SafeCardWithList2[] };

export type CardWithList = Card &
 { list: List }
// {list: List 
//   taggedUsers: CardToUser[];
// };
export type SafeCardWithList = Omit<
  Card, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
} &
{ list: List }


export type CardWithList2 = Card & {
    list: List & {
      board: Board;
    };
    taggedUsers: CardToUser[];
    comments:Comment[];
    cardImages: CardImage[];
  };


  export type SafeCardWithList2 =  Omit<
  Card, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
} & {
    list: List & {
      board: Board;
    };
    taggedUsers: CardToUser[];
    comments:Comment[];
    cardImages: CardImage[];
  
  };

  
export type SafeBoard2 = Omit<
Board, 
"createdAt" | "updatedAt" 
> & {
createdAt: string;
updatedAt: string;
lists: SafeList2 [];
user_image:string;
views:number;
userslist:string[];
};

export type SafeList2 = Omit<
List, 
"createdAt" | "updatedAt"
> & {
createdAt: string;
updatedAt: string;
cards: SafeCardWithList2 []

};





export type SafeInvestorInvestment2 = Omit<
InvestorInvestment, 
"createdAt" | "updatedAt"
> & {
createdAt: string;
updatedAt: string;
investor:Investor ;
portfolio:InvestmentPortfolio

};
export type SafeInvestor = Omit<
Investor, 
"createdAt" | "updatedAt"
> & {
createdAt: string;
updatedAt: string;

};
export type SafeInvestorInvestment3 = Omit<
InvestorInvestment, 
"createdAt" | "updatedAt"
> & {
createdAt: string;
updatedAt: string;
investor:SafeInvestor ;
portfolio:InvestmentPortfolio

};


export type SafeInvestorInvestment = Omit<
InvestorInvestment, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};



export type SafeInvestmentPortfolio2 = Omit<
  InvestmentPortfolio, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
  investments: SafeInvestorInvestment2 [];
 
  investorId:string;
  portfolioId:string;
  amount:Number;
};

export type SafeInvestor2 = Omit<
  Investor, 
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
  investments: SafeInvestorInvestment2 [];
};
export type CardWithDetails = Prisma.CardGetPayload<{
  include: {
    cardImages: true; // Include associated CardImages
    user: true;         // Include the User who created the card
    tags: true;         // Include associated Tags
    comments: {         // Include associated Comments
      include: {
        user: true;     // Include the User who made the comment
      };
    };
    list: {             // Include the List this card belongs to
      include: {
        board: true;    // Include the Board through the List
      };
    };
    taggedUsers: {      // Include users tagged in this card
      include: {
        user: true;     // Include the User details for tagged users
      };
    };
  };
}>;
