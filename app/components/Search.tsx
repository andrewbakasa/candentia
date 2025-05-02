'use client';

import { cn } from "@/lib/utils";
import DebouncedInput from "./DebouncedInput";
// import router from "next/router";
import { usePathname, useRouter } from "next/navigation";

interface SearchProps {
  searchTerm?: string;
  placeholderText?:string,
  option?:boolean
  setSearchTerm: (value: string) => void;
  debounce?: number; // Add debounce prop here
}

const Search: React.FC<SearchProps> = ({ 
 // handleSearch,
  setSearchTerm, 
  searchTerm,
  option=true,
  placeholderText,
  debounce = 500, // Default debounce value
}) => {

  
  const router = useRouter();
  const pathname = usePathname();
  const handleSearch = (searchTerm: string) => {
  
    const newSearchParams = new URLSearchParams();
    const encodedSearchTerm = encodeURIComponent(searchTerm); // Decode on the server
   
    if (searchTerm !== "") {
        newSearchParams.set('search', encodedSearchTerm);
    }

    const queryString = newSearchParams.toString();
    const basePath = "/media";
    const correctUrl = pathname?.endsWith('/media')||false;
    // Only push to router if there is a change or the search term is empty
    if (searchTerm !== "" && newSearchParams?.get("search") && correctUrl)  {
      //console.log('In search input:::::', queryString,encodedSearchTerm)
      router.push(queryString ? `${basePath}?${queryString}` : basePath);
    }
  };
  return ( 
    <div className="w-full max-w-lg min-w-[300px] md:w-[800px]">
        <div className={cn("flex  sm:mt-10 rounded-lg",
         option==true?'mt-1':'mt-0'
        )}>

          <DebouncedInput
                value={searchTerm}
                debounce={debounce} // Pass the debounce prop to DebouncedInput
              // onChange={(value:string|number ) => {setSearchTerm(String(value));handleSearch(String(value));}}
              onChange={(value: string | number) => {
                const strValue = String(value); // Convert to string
                setSearchTerm(strValue);
                handleSearch(strValue); // Pass the string value
              }}
              className={cn("w-full px-4 text-sm  py-2 focus:outline-none border-[1px] rounded-l-lg", 
                // option==true?'py-2':'py-0'
                )}
                placeholder={placeholderText?placeholderText:"Filter records..."}
          />
          <button 
              onClick={()=>{setSearchTerm('')}}
              className="flex items-center justify-center px-4 bg-blue-500 rounded-r-lg"
          >
            <svg
                className="w-4 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <svg
              className="w-4 h-6 text-white"
              fill="currentColor"  viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 8v5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8L12 5zM6 19h12a2 2 0 0 1 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 1-2 2zM10 11h4a1 1 0 0 1 0 2h-4a1 1 0 0 1-1-2z"
              />
            </svg>

          </button>
        </div>
    </div>
     
    // </div>
   );
}
 
export default Search;