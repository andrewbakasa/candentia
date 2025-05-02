'use client';
import { findClosestFactor } from '@/lib/utils';
import React, { useState } from 'react'

interface ButtonProps {  
  onRadiusChange: (e:number) => void;
  radiusInitialValue:number;
  totalCards:number;
}

const RangeSelect: React.FC<ButtonProps> = ({ 
      onRadiusChange,
      radiusInitialValue,
      totalCards
      }) => {
  const [radius,setRadius]=useState(radiusInitialValue);
  
  return ( 
    <div className='mt-2 flex flew row'>
        <input type='range' 
            className='w-full max-w-lg min-w-[300px] md:w-[800px] h-2 bg-gray-200    rounded-lg appearance-none   cursor-pointer '
            min="0"
            max="100"
            step={findClosestFactor(100/totalCards)}
            onChange={(e)=>{setRadius(Number(e.target.value));onRadiusChange(Number(e.target.value))}}
            defaultValue={radius}
        />
        <label className='text-white text-[12px] px-2 mt-[2px]'>{radius}%</label>
    </div>
   );
}
 
export default RangeSelect;