'use client';
import { useState, useEffect } from "react";
import { Hint } from "../components/hint";
import { HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SafeTag, SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import { cn, isNumber } from "@/lib/utils";
import useIsMobile from "../hooks/isMobile";
import { TagFormPopover } from "../components/form/tag-form-popover";
import { createColumnHelper } from "@tanstack/react-table";
import ReactPaginate from "react-paginate";
import moment from "moment";
import TanStackTable from "../components/TanstackTable";
import CreatedAtUpdatedAt from "../myprojects/_components/updatedCreated";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";

interface UsersClientProps {
  tags: SafeTag[],
  currentUser?: SafeUser | null,
}


const TagsClient: React.FC<UsersClientProps> = ({
  tags,
  currentUser
}) => {
  const router = useRouter(); 
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile =  useIsMobile();
  const columnHelper = createColumnHelper<SafeTag>()

  const [pageSize, setPageSize] = useState<number>(currentUser? currentUser.pageSize:8); // Adjust as needed
  const [pageCount, setPageCount] = useState(8); // Adjust as needed
  const [itemOffset, setItemOffset] = useState(0);
  const [fList,setFList]=useState(tags);
  const [fListPage,setFListPage]=useState(tags);
  

const columns = [ 
  columnHelper.accessor("name", {
    cell: (info) => {
      //  console.log('id', info?.table.getRow(info.row.id).original)
      const id=info?.table.getRow(info.row.id).original.id 
      const name=info?.table.getRow(info.row.id).original.name;
      const created= info?.table.getRow(info.row.id).original.createdAt
      const updated=info?.table.getRow(info.row.id).original.updatedAt;
      const notSameDate = moment(created).fromNow()!== moment(updated).fromNow()
      // areDatesSimilar(created,updated,1);
     return ( 
      <div className="flex flex-col">
        <Link
          key={id}
          href={`/tag/${id}`}
          className=""
        >
          <div 
              className="  flex flex-col bg-no-repeat bg-cover bg-center rounded-sm"
          >
            <span className="mr-0 text-lg text-white bg-black mix-blend-difference">{name}</span>
              
          </div>
        </Link>
      </div>
    )

  },
    header: "Name",
  }),                           
  
  columnHelper.accessor("description", {
    cell: (info) => {
      //  console.log('id', info?.table.getRow(info.row.id).original)
      const id=info?.table.getRow(info.row.id).original.id 
      const description= info?.table.getRow(info.row.id).original.description         
      const board= info?.table.getRow(info.row.id).original
      // get latest card or the first card
      const created=info?.table.getRow(info.row.id).original.createdAt
      const updated=info?.table.getRow(info.row.id).original.updatedAt;
      const notSameDate = moment(created).fromNow()!== moment(updated).fromNow()
      // areDatesSimilar(created,updated,1);
     return ( 
      
      <div className="flex flex-col">
        <div className="flex justify-between">
            <div className="flex gap-1">
                <span className='flex gap-2 text-sm text-red-200 '></span> 
                <span className='flex gap-2 text-sm text-red-200 '></span> 
            </div>
            <div className="flex gap-1">
              <span className='flex gap-2 text-sm text-red-200 '>{'cre: '} {moment(created).fromNow() }</span>
              {notSameDate && <span className='flex gap-2 text-sm text-red-200 '>{'upd: '} {moment(updated).fromNow() }</span>}
              
            </div>
        </div>
        <span>{description}</span>                
       
    </div>
  
    )

  },
    header: "Description",
  }),                           
  
]
const { execute, fieldErrors } = useAction(updatePagSize, {
  onSuccess: (data) => {
    toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
  },
  onError: (error) => {
    toast.error(error);
  },
});
  //Cookies.set('originString', 'projects')
  useEffect(() => {
    if (searchTerm !== "") {
      const results = tags.filter((tag) =>
          (//Outer bracket           
              //Select current user title
              tag?.name?.toLowerCase().includes(searchTerm.toLowerCase())
              ||
              tag?.description?.toLowerCase().includes(searchTerm.toLowerCase())
           
          )// Out bracker
      );
      // setfilterTags(results);
      setFList(results)
    } else {
      // setfilterTags(tags);
      setFList(tags)
    }
  }, [searchTerm, tags]);
 
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

     
 /* ----------------Pagination------------ */
 type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options
 
const handlePageSizeChange = (newPageSize: PageSizeOption) => {
   // Type assertion (optional, but can improve type safety):
   const numericPageSize = parseInt(newPageSize, 10);
   setPageSize(numericPageSize);
   if (currentUser){
        execute({
          id: currentUser?.id,
          pageSize:numericPageSize
        })
  }  
   setItemOffset(Math.min(numericPageSize, Math.ceil(fList?.length / pageSize)));
};
 

 const handlePageClick = (event: { selected: number }) => {
   const newOffset = (event.selected * pageSize) % fList.length;
   setItemOffset(newOffset);
 };
 
 const calculatePageSlice = (fList?: SafeTag[], itemOffset?: number, pageSize?: number): SafeTag[] | undefined => {
   if (!fList|| !pageSize) {
     return undefined;
   }
   const endpoint = Math.min(itemOffset! + pageSize!, fList.length);
   return fList.slice(itemOffset!, endpoint);
 };
 
 useEffect(() => {
   const pageSlice = calculatePageSlice(fList, itemOffset, pageSize);
   if (pageSlice) {
     setFListPage(pageSlice);
   }
 }, [itemOffset, fList, pageSize]);
 
 useEffect(() => {
   if (fList && pageSize) {
     const newPageCount = Math.ceil(fList.length / pageSize);
     if (pageCount !== newPageCount) {
       setPageCount(newPageCount);
     } else {
       // Search filter catalog logic
       if (itemOffset > pageSize) {
         setItemOffset(0);
       }
     }
   } else {
     if (itemOffset > pageSize) {
       setItemOffset(0);
     }
   }
 }, [fList, pageSize]);
 
 useEffect(() => {
   setItemOffset(0);
 }, [pageCount]); 
 
  const renderPaginationButtons = () => {
   const buttons = [];    
   buttons.push(
       <ReactPaginate
               breakLabel="..."
               // nextLabel="next >"
               containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2" // Tailwind CSS classes
               activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
               previousLabel="«"
               nextLabel="»"
   
               onPageChange={handlePageClick}
               pageRangeDisplayed={5}
               pageCount={Math.ceil(isNumber(fList?.length/pageSize)?fList?.length/pageSize:0)}
             
               // previousLabel="< previous"
               renderOnZeroPageCount={null}
       />
   );
   buttons.push(
       <select 
           className='border-gray-300 rounded border text-rose-500' 
           value={pageSize} 
           onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
       >
           <option value="1">1 per Page</option>
           <option value="2">2 per Page</option>
           <option value="3">3 per Page</option>
           <option value="4">4 per Page</option>
           <option value="8">8 per Page</option>
           <option value="16">16 per Page</option>
           <option value="24">24 per Page</option>
           <option value="32">32 per Page</option>
           <option value="48">48 per Page</option>
           <option value="60">60 per Page</option>
       </select>
 
   );
   return <div className="flex justify-center gap-3">{buttons}</div>;
 };
 
useEffect(() => {
  if (fList && pageSize) {
    const newPageCount = Math.ceil(fList.length / pageSize);
    if (pageCount !== newPageCount) {
      setPageCount(newPageCount);
    } else {
      // Search filter catalog logic
      if (itemOffset > pageSize) {
        setItemOffset(0);
      }
    }
  } else {
    if (itemOffset > pageSize) {
      setItemOffset(0);
    }
  }
}, [fList, pageSize]);

useEffect(() => {
  setItemOffset(0);
}, [pageCount]);

const { width, height } = useWindowSize();
const mobileWidth =400;
if(!currentUser)return redirect('/denied')
let allowedRoles:String[];
allowedRoles=['admin', 'manager'];
const isAllowedAccess = currentUser?.roles.filter((role: string) =>
                                          (//Outer bracket ::forEach user role  
                                              //Search Card  within the List
                                              allowedRoles?.some((y)=>(// Allowed Roles
                                                  //Search Card Title
                                                  y.toLowerCase().includes(role.toLowerCase())
                                                  
                                                )// Return clossing bracket
                                              )
                                        )// Out bracker
                                    ) || []




const popover_content_pos =width?width<mobileWidth?'bottom':'right':'right'
//Mobile push bottom

let title_ =  `Tags ${fList.length} of ${tags.length}`
 if (isAllowedAccess?.length==0) return redirect('/denied') 

  return (
    <Container>
      
     <div className="pt-0 flex flex-col  sm:flex-row  justify-between">
        <Heading
          title={title_}
          subtitle="Manage your tags"
        />
        <div className="flex flex-row ">
            <Search 
                //handleSearch ={handleSearch} 
                setSearchTerm={setSearchTerm}               
                placeholderText={"Filter Tags..."}
                searchTerm = {searchTerm} />  
         
        </div>
     </div>
    <div className="space-y-4 pb-10">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
        {/* <User2 className="h-6 w-6 mr-2" /> */}
      Available Tags
      </div>
      
       <div className="mt-1 pb-5">{/* space-y-4 pb-10*/}
        <div>
          {
            isMobile?
            ( 
              <div 
                  className={cn(
                    "grid grid-cols-2 lg:grid-cols-4 gap-4",
                    isMobile?'grid grid-cols-1':''
                  )}
                >
                  {fListPage.map((tag, index) => (
                            <>
                              {
                                (
                                  <div
                                      key={index}
                                      className={cn(
                                          " hover:border hover:border-primary rounded-lg cursor-pointer",
                                          isMobile?'grid grid-cols-[5%_95%] ':'',
                                     )}
                                  >
                                      <Link 
                                        key={tag.id}
                                        href={`/tag/${tag.id}`}
                                          className='cursor-pointer' 
                                        >
                                        </Link>
                                    
                                      <div className='flex mt-0 flex-col gap-1  rounded-sm shadow-md'>
                                            <CreatedAtUpdatedAt 
                                                createdAt={tag.createdAt} 
                                                updatedAt={tag.updatedAt}
                                            />
                                          
                                            <div 
                                              className="flex flex-col justify-between w-full bg-no-repeat bg-cover bg-center rounded-sm mb-1" 
                                            >
                                              <Link 
                                                  key={tag.id}
                                                  href={`/tag/${tag.id}`}
                                                  className='cursor-pointer' 
                                                  >
                                                  <h2 className={cn("font-bold text-sm text-white bg-black mix-blend-difference px-2", isMobile?'':'')}>{tag?.name}</h2>
                                              </Link>
                                              {
                                                tag?.description &&<span className="px-2 font-mono text-[11px]">{tag.description}</span>
                                              } 
                                            </div>
                                              
                                                   
                                      </div>
                                  </div>           
                                )
                                }
                            </>
                    ))}
                  <TagFormPopover sideOffset={isMobile?-125:10} side={popover_content_pos }>
                    <div
                      role="button"
                      className="aspect-video relative h-[75px] w-[200px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                      <p className="text-sm">Create new tag</p>
                      <span className="text-xs"></span>
                      <Hint
                        sideOffset={40}
                        description={`
                          Create Workspaces here. Its unlimited boards for this workspace.
                        `}
                      >
                        <HelpCircle
                          className="absolute bottom-2 right-2 h-[14px] w-[14px]"
                        />
                      </Hint>
                    </div>
                  </TagFormPopover>
                  <div>
                      {fList && fList.length > 0 && ( 
                          <div className="mt-4  max-w-9 flex flex-wrap  gap-1">{renderPaginationButtons()}
                                
                          </div> 
                        )} 
                      {!fList && <p>Loading data...</p>} 
                        
                  </div>
              </div>
            )
            :
            (
              <>
                <TanStackTable  
                    data={fList} columns={columns} 
                    userPageSize={Number(pageSize)} 
                    currentUser={currentUser}
                    setPageSize= {setPageSize}
                /> 
                <TagFormPopover sideOffset={10} side={popover_content_pos }>
                    <div
                      role="button"
                      className="aspect-video relative h-[75px] w-[200px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                      <p className="text-sm">Create new tag</p>
                      <span className="text-xs"></span>
                      <Hint
                        sideOffset={40}
                        description={`
                          Create Tags here.
                        `}
                      >
                        <HelpCircle
                          className="absolute bottom-2 right-2 h-[14px] w-[14px]"
                        />
                      </Hint>
                    </div>
                </TagFormPopover>
              </>    
            ) 

          }      
        </div>
     </div>  
   
    </div>
   
  
     </Container>
   );
}
 
export default TagsClient;


