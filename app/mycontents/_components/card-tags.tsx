"use client";

import { cn, findLabelByValue} from "@/lib/utils";
import { SafeCard, SafeCardWithBoard } from "@/app/types";
import { useEffect } from "react";
import { CardWithList2, SafeCardWithList2 } from "@/types";

interface TagsListProps {
  card:SafeCardWithList2;
  setCategory: (category: string ) => void;
  category:string,
  tagNames:any;
  index2: string;
};

const CardTags : React.FC<TagsListProps> = ({
  card,
  setCategory,
  category,
  tagNames,
  index2
}) => {
  useEffect(()=>{

  },[card])

  let lCat =category.split(',')

  if (card?.tagIDs){  
    return (
      <div className="flex flex-wrap gap-1 mt-1 shadow-lg rounded-sm" 
         key={index2 +'a'}
      > 
          {
              card.tagIDs?.map((tag, index) => {
                return (
                  <span 
                    className={
                      cn(" rounded-sm  text-[13px] cursor-pointer",
                      category.length>0?lCat.includes(tag)? 'text-white bg-blue-400'
                      :
                      'text-white bg-orange-300 md:bg-orange-500'
                      :
                      'text-white bg-orange-300 md:bg-orange-500')
                    }
                     key={index}
                    onClick={()=>{ setCategory(tag); }}
                  > 
                    {findLabelByValue(tagNames, tag)}
                  </span>
                )
              })
            }
      </div> 
            
    );
  }else{
    return 
  }
};

export default CardTags
