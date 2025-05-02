import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

// //import getCurrentUser from getCurrentUser
import prisma from "../../libs/prismadb"//"..app/libs/prismadb";


export async function DELETE(
  request: Request, 
) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.error();
  }

const lista=['continuous improvement', 'AI', 'quality','management',
              'engineering','procurement','safety','production',
              'finance','planning', 'communication','health', 'HCM',
              'RCA', "MRP",
              'short-comings', 'skills', 'competences', 'security','budgeting',
              'cash flow', 'motivation','upcoming event','meeting','hazard',
              'incentives','risk','training','best practises','bench-marking',
              'critical','bureaucracy','take-aways','resolutions','coding',
              'complacency','obsolete','project','JIT','BPR', "problematic", 'cyclic', 'resurfacing',
              'business idea',
              'business logic', 'strategy', 'organisational culture',
              'maintenance engineering','process streamlining', 'survey'
            ]
{/**
  Find records then delete all keeping only the first record......
 */}
  let xx : any ;
 async function fetchData(searchItem:string) {
    const recordsToDelete = await prisma.tag.findMany({where: {
        name: searchItem,
    },}).then((x)=>(x.slice(1)));

    // Extract the IDs of records to delete
    const idsToDelete = recordsToDelete.map(record => record.id);

    // Delete the records
    const tags =await prisma.tag.deleteMany({where:{ id: { in: idsToDelete } }});
    //  })
    xx=(tags);

  }
  
  const promises = lista.map(async (item) => {
    return fetchData(item);
  });
  
  const results = await Promise.all(promises);
  console.log(results);

  return NextResponse.json('');
}


/* 
const alllist =[   'process streamlining', 'survey'
]
// alllist.map(x=>{
//   executeTag({
//     name:x
//   })
// })
//
const deletMultipleTags =async()=>{
  let request;
    try {
      
        request = () => axios.delete(`/api/general`);
     
     const data= await request();
     toast('deleting multiple')
    } catch (error) {
      toast.error('Something went wrong.');
    }finally{
      
    }
}
 */   // deletMultipleTags();

