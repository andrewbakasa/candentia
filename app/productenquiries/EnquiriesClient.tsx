
/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import Cookies from 'js-cookie';
import { cn } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import useIsMobile from "../hooks/isMobile";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { createTag } from "@/actions/create-tag";
import { EnquiriesContainer } from "./_components/container";
import { ProductEnquiry } from "@prisma/client";
import Link from "next/link";

interface EnquiriesClientProps {
  records: ProductEnquiry[];
  currentUser?: SafeUser | null;
}

const EnquiresClient: React.FC<EnquiriesClientProps> = ({
  records,
  currentUser,
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredrecords, setfilteredrecords] = useState(records);
  const [pageSize, setPageSize] = useState<number>(currentUser ? currentUser.pageSize : 8); // Adjust as needed
  const [pageCount, setPageCount] = useState(Math.ceil(records?.length / (currentUser ? currentUser.pageSize : 8))); // Initialize based on total records
  const [itemOffset, setItemOffset] = useState(0);
  const isMobile = useIsMobile();
  const [fList, setFList] = useState(records);
  const [fListPage, setFListPage] = useState<ProductEnquiry[]>([]); // Initialize as empty array of Enquiry

  const [uniquerecordId, setUniquerecordId] = useState('');


  const handleToggleSelectUniquerecord = (id: string) => {
    //filter only on
    if (uniquerecordId?.length == 0) {//(filteredrecords.length==1){//change logic
      setSearchTerm('');
      setUniquerecordId(id);
      // setUniqueSelection(false)
    } else {
      setUniquerecordId('');
    }
  };

  const [category, setCategory] = useState<string>('');//x==''?null:x)//tag);

  const { execute, fieldErrors } = useAction(updatePagSize, {
    onSuccess: (data) => {
      toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeTag } = useAction(createTag, {
    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" created`);
      //formRef.current?.reset();
    },
    onError: (error) => {
      toast.error(error);
    },
  });


  Cookies.set('originString', origin);

  useEffect(() => {
    // filter
    let recordsPostTag = records;
    if (uniquerecordId.length > 0) {
      recordsPostTag = records?.filter(x => (x.id == uniquerecordId.trim()));
    }

    if (searchTerm !== "") {
      let arrFirst = searchTerm.split(';');
      const arr = arrFirst.filter(element => element);   // Using arrow function (ES6)

      if (category !== '') {
        let xy = category.split(',');

      }
      const results = recordsPostTag.filter((record) =>
        (
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.first_name?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          //Search Card Title (using shortDescription as title)
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.last_name?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )

          ||
          //Search Card Title (using actual title)
          arr.some(
            (x) =>
              (
                x.split(',').every((s) => (record?.message?.toLowerCase().includes(s.trim().toLowerCase())))
              )
          )
        )
      );
      setfilteredrecords(results);
      setFList(results); // Update fList with filtered results
      setItemOffset(0); // Reset pagination to the first page after filtering
    } else {
      setfilteredrecords(recordsPostTag);
      setFList(recordsPostTag); // Update fList when search term is empty
      setItemOffset(0); // Reset pagination when search term is cleared
    }
  }, [records, category, uniquerecordId, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const { width, height } = useWindowSize();
  const mobileWidth = 400;

  let allowedRoles: String[]
  allowedRoles = [ 'admin', 'manager'];
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
    (//Outer bracket ::forEach user role
      allowedRoles.some((y) => (// Allowed Roles
        //Search Card Title
        y.toLowerCase().includes(role.toLowerCase())
      ))// Return clossing bracket
    )// Out bracker
  );

  /* ----------------Pagination------------ */
  type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options

  const handlePageSizeChange = (newPageSize: PageSizeOption) => {
    // Type assertion (optional, but can improve type safety):
    const numericPageSize = parseInt(newPageSize, 10);
    setPageSize(numericPageSize);
    if (currentUser) {
      execute({
        id: currentUser?.id,
        pageSize: numericPageSize
      })
    }
    setItemOffset(0); // Reset to the first page when page size changes
  };


  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * pageSize) % fList.length;
    setItemOffset(newOffset);
  };

  const calculatePageSlice = (fList?: ProductEnquiry[], itemOffset?: number, pageSize?: number): ProductEnquiry[] | undefined => {
    if (!fList || !pageSize) {
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
        key={'andgwgw!'}
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={Math.ceil(fList?.length / pageSize) || 0}
        forcePage={Math.floor(itemOffset / pageSize)} // Control the current page
        // previousLabel="< previous"
        renderOnZeroPageCount={null}
      />
    );
    buttons.push(
      <select
        className='border-gray-300 rounded border text-rose-500'
        value={pageSize}
        key={'abanansgd'}
        onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
      >
        <option value="1" >1 per Page</option>
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

  let title_ = `records ${fList.length} of ${records.length}`
  let subtitle_ = "Product Enquiries received" //"Manage your projects and teams online"


  if (isAllowedAccess?.length == 0) return redirect('/denied')
  if (!currentUser) return redirect('/denied')

  return (
    <Container >
      <div className="z-51 mt-[-40px] flex flex-col  sm:flex-col  justify-between sm:px-1 xs:px-2">
        <Heading
          title={uniquerecordId.length == 0 ? title_ : ''}
          subtitle={subtitle_}
          isSetBackground={uniquerecordId?.length > 0 }

        />


        <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}>
          {/* Keep other elements here if any */}
          <div className="flex-grow" /> {/* This will push the next element to the far end */}
          <div className="flex flex-row">
            <Search
              setSearchTerm={setSearchTerm}
              searchTerm={searchTerm}
            />
          </div>
        </div>



      </div>
      <div className={cn("mt-1 pb-5", uniquerecordId.length == 0 ? '' : 'shadow-xl rounded-md p-1 border-yellow-400 border-2')}>{/* space-y-4 pb-10*/}
        <div>
          {
            (
              <div
                className={cn(
                  // "grid grid-cols-2 lg:grid-cols-4 gap-4",
                  isMobile ? 'grid grid-cols-1' : 'grid grid-cols-1'
                )}
              >
                {fListPage.map((record, index) => (
                  <div
                    className=""
                    key={record.id}
                  >
                    <EnquiriesContainer
                      record={record}
                      id={record.id}
                    />


                  </div>
                ))}

                <div>
                  {fList && fList.length > 0 && (
                    <div className="mt-4  max-w-9 flex flex-wrap  gap-1">{renderPaginationButtons()}
                    </div>
                  )}
                  {!fList && <p>Loading data...</p>}

                </div>
              </div>
            )
          }
        </div>
      </div>
      <div className="mt-6">
        <Link href="/#" className="inline-flex items-center bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </Link>
      </div>
    </Container>
  );
}

export default EnquiresClient;
