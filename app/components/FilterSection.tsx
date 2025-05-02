// use client
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { toast } from 'sonner'; // Assuming sonner is a library with a toast function
import useTagItems from '@/hooks/useFilter';
import { cn, getLabelsAndValuesFromValues } from '@/lib/utils';
import { checkIsNonEmptyArray } from 'unsplash-js/dist/helpers/typescript';

export interface LabelValueType {
  label: string;
  value: string;
}

interface FilterSectionProps {
   setCategory: (category: string | null) => void;
  // setCategory: (category: string[] | null) => void;
  productCategories_options: LabelValueType[];
  category?: string|null; // Optional initial category
  originalList?:LabelValueType[]|null;
  isDisabled:boolean
  placeholder? : string
  isFullwidth?:boolean
}

const FilterSection: React.FC<FilterSectionProps> = ({
  setCategory,
  productCategories_options,
  category,
  originalList=null,
  isDisabled=false,
  placeholder='Filter by categories',
  isFullwidth=false
}) => {
  
  const categoryWithLabels= getLabelsAndValuesFromValues(productCategories_options,category?category?.split(','):[])

  const [categoryLocal, setCategoryLocal] = useState<LabelValueType[] | null>(
    originalList? originalList.map(v=>({label:v.label,value:v.value})):categoryWithLabels?.map((v) => ({ label: v.label, value: v.value })) || null
  );
  const { tagItems, setTagItems } = useTagItems();

  // console.log('categoryWithLabeles',categoryWithLabels)

  useEffect(() => {
   // toast.message('Change here...')
    if (originalList){
      //console.log(`inside.., ${originalList}`)
      if (typeof category === 'string') {
        const x = categoryWithLabels.map((v) => ({ label: v.label, value: v.value }));
        setCategoryLocal(x); // Update local state
        if (category !== '') {
          setTagItems([category]); // Set initial tags if category is not empty
        }
        setCategory(category || null); // Set parent category (null if empty string)
      }
    }else if (category) {
      //console.log(`hello,${category}`)
      // toast(`category change from outside select ;;;${categoryLocal}.... ${category} ${typeof(category)} is string?: ${typeof(category) === "string"}`)
      if (typeof category === 'string') {
       // const x = category.split(',').map((v) => ({ label: v, value: v }));
        const x = categoryWithLabels.map((v) => ({ label: v.label, value: v.value }));
        
        setCategoryLocal(x); // Update local state
        if (category !== '') {
          setTagItems([category]); // Set initial tags if category is not empty
        }
        setCategory(category || null); // Set parent category (null if empty string)
      }
    }
  }, [category]);

  return (
    <div className='z-51 flex w-full'>
      <Select
        className={cn("text-gray-500 ",isFullwidth?"w-full":"min-w-[300px]  max-w-lg  md:w-[800px]")}
        id="category"
        name="category"
        value={categoryLocal || null} // Set null for empty local state
        onChange={(e) => {
          if (!e) return; // Handle empty selection
          const selectedValues = e.map((v) => v.value);
          const selectedValues2 = e.map((v) =>({label:v.label, value:v.value}));
         
          const local = selectedValues.join(',');
          setCategory(local); // Update parent category
          // console.log('eee',e, selectedValues2)
          setCategoryLocal(selectedValues2); // Update local state for display
          setTagItems(local.split(',')); // Update tags based on selected values
          // set
        }}
        placeholder={placeholder}
        options={productCategories_options}
        isMulti // Enables multi-selection
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default FilterSection;
