import prisma from "@/app/libs/prismadb";
import {getProgressStatus, getTotal } from "./utils";

interface Props {
  boardId: string;
};

export const updateProgressStatus = async (props: Props) => {
    try {
        const { boardId } = props;
        // const lists = await prisma.list.findMany({
        //     where: {
        //     boardId: boardId,
        //     },
        //     include: {
        //     cards: {
        //         orderBy: {
        //         order: "asc",
        //         },
        //     },
        //     },
        //     orderBy: {
        //     order: "asc",
        //     },
        // });
        let lists:any
        lists = await prisma.list.findMany({
            where: {
            boardId: boardId,
            },
            // include: {
            //   cards: {
            //       orderBy: {
            //       order: "asc",
            //       },
            //   },
            // },
            include: {
              cards: {
                orderBy: {
                  order: "asc",
                },
                include: { 
                  tags: true,
                  cardImages:true,
                  taggedUsers: {
                      include: {
                          user: {
                              select: {
                              // Include fields you want from the User model
                              id: true,
                              name: true,
                              email: true,
                              // ... other fields
                              },
                          },
                       },
                   },
                },      
              },
              
            },
  
            orderBy: {
            order: "asc",
            },
        });
  

    const b = getTotal(lists);
    const newProgressStatus=getProgressStatus(b);
   
    const boardUpdated =  await prisma.board.update({
        where: { id: boardId },
        data: {  progressStatus:newProgressStatus },
    });
  
    //console.log('updated....', newProgressStatus)
    } catch (error) {
        console.log("[UPDATETRIGGER_ERROR]", error);
    }
}


  
