'use client';
import { SafeUser } from "@/app/types";
import Search from "@/app/components/Search";
import { useEffect, useState } from "react";
import { useStringVarStore } from "@/hooks/use-search-value";
import { useSearchOpenStore } from "@/hooks/use-searchOpenState";
import { useSearchResultStore } from "@/hooks/use-searchResultString";
import { useRadiusStore } from "@/hooks/use-radius";
import RangeInput from "./range-withTicks";

interface NavbarProps {
  currentUser?: SafeUser | null;
  totalCards:number;
}

const SearchTextForm: React.FC<NavbarProps> = ({currentUser,totalCards}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const {setStringVar}=useStringVarStore();
  const {openState }= useSearchOpenStore();
  const {resultString}= useSearchResultStore();
  const{radiusVar, setRadiusVar}=useRadiusStore()  
  const [radius,setRadius]=useState(radiusVar);//removed 100%
   
 
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  useEffect(() => {
    setStringVar(searchTerm)
    
  }, [searchTerm]);
 
  //Dont show here----
 if (openState==false){
  return
 }
  return ( 
    <div className=" md:mt-[-50px] sm:mt-[-25px]">
       <div className="flex flex-col gap-0 mb-1">
          <div className="flex flex-row  gap-1">
              <Search
                    //handleSearch ={handleSearch} 
                    setSearchTerm={setSearchTerm}               
                    searchTerm = {searchTerm}
                    placeholderText="Filter cards"
                    option={false}
              />
              <span className="text-white md:mt-[47px] text-sm inline-block whitespace-nowrap" >{resultString}</span>
          </div>
          {/* <RangeSelect onRadiusChange={(value)=>{setRadius(value), setRadiusVar(value)}} radiusInitialValue={radius} totalCards={totalCards}/> */}
          <RangeInput onRadiusChange={(value)=>{setRadius(value), setRadiusVar(value)}} radiusInitialValue={radius} totalCards={totalCards}/>
        
        </div>
    </div>
   );
}
 
export default SearchTextForm;
