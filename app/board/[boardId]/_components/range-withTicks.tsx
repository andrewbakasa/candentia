import { useRadiusStore } from '@/hooks/use-radius';
import { findClosestFactor } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RangeInputProps {
//   min: number;
//   max: number;
//   step: number;
//   defaultValue?: number;
//   onChange?: (value: number) => void;
  onRadiusChange: (e:number) => void;
  radiusInitialValue:number;
  totalCards:number;

}

const RangeInput: React.FC<RangeInputProps> = ({
  onRadiusChange,
  radiusInitialValue,
  totalCards

//   defaultValue,
//   onChange,
}) => {
 const step=findClosestFactor(100/totalCards);

  // Calculate tick positions and values
  const min=0;
  const max=100;
//   step,
 const internalStep=Math.max(step,10)
  const tickCount = Math.floor((max - min) / internalStep) + 1;
  const tickValues = Array.from({ length: tickCount }, (_, i) => min + i * internalStep);

  const [radius,setRadius]=useState(radiusInitialValue);

  const{radiusVar, setRadiusVar}=useRadiusStore()

  useEffect(()=>{
    //effect change display
    setRadius(radiusVar);
    //added this to update display 
    onRadiusChange(radiusVar)
   
  },[radiusVar])

  useEffect(()=>{
    if (radius!==radiusInitialValue){
        onRadiusChange(radiusInitialValue);
        toast.message(`on initial change initial: ${radiusInitialValue}, radius: ${radius}`)
  
    }
  },[radiusInitialValue])

  return (
    <div className='mt-[-3px] flex flew row'>
  
        <div className="relative mt-0">
          <input
              type="range"
              min={min}
              max={max}
              step={step}
              onChange={(e)=>{setRadius(Number(e.target.value));onRadiusChange(Number(e.target.value))}}
              defaultValue={radius}
              className='z-10 w-full max-w-lg min-w-[300px] md:w-[800px] h-2 bg-gray-200    rounded-lg appearance-none   cursor-pointer '
          />

          <div className="absolute top-[15px] left-0 w-full flex justify-between">
              {tickValues.map((tickValue, index) => (
                <div
                    key={index}
                    className="flex flex-col items-center text-white"
                    style={{ left: `${(tickValue - min) / (max - min) * 100}%` }}
                >
                    <div className="w-1 h-1 bg-gray-400"></div>
                    <span className="text-[9px]">{tickValue}</span>
                </div>
              ))}
          </div>
        </div>
        <label className='text-white text-[12px] px-2 mt-[1px]'>{radius}%</label>
    </div>
  );
};

export default RangeInput;
