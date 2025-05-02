

import moment from "moment";
import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";


export default async function getBoardViewCreatedAt(boardId:string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    const owner_id = currentUser.id
    let boardviews

    
      //view all board view pertaining to board given by boardId
      boardviews = await prisma.boardView.findMany({
        where:{
          boardId
        },
        orderBy: { updatedAt: "desc" },//latest get first
      });
   
     if (boardviews) {
      //console.log('boardviews',boardviews)
       //------ map
        const result = boardviews?.map(x=>
          {
            //checking length--
            // if (x.userID.length>1) {
            //   console.log('positive Test: ',x)
            // }else {
            //   console.log('workking........',x)
            // }
          return  (
            // 0n 21 January 2025 Test the code if there are multiple user per boardView but none
             {label: moment(x.updatedAt).fromNow(),value: x.userID && x.userID[0]}
          )

         }
        )        
        return result;
     }else{
        return []
     }
  } catch (error: any) {
    throw new Error(error);
  }
}