
import React, { useEffect } from 'react';

// Hook for detecting clicks inside a specified element
export const useOnClickInside = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent| KeyboardEvent) => void,
  timeoutId: React.MutableRefObject<number | null>
) => {
  //.log('In useClickInside1')
  useEffect(() => {
    //console.log('Entered useClickInside1: in useEffect')
    const handleClickInside = (event: MouseEvent | TouchEvent| KeyboardEvent) => {
      if (ref.current && ref.current.contains(event.target as Node)) {
        //console.log("I am inside",timeoutId.current)
        if (timeoutId.current !== null) {
          //when inside cancel pending 
          //console.log("i have scheduled handleOutside and have cleared it")
          clearTimeout(timeoutId.current);
        }
        //console.log("why i am not here",timeoutId.current)
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickInside);
    document.addEventListener('touchstart', handleClickInside);
    document.addEventListener('keydown', handleClickInside);

    return () => {
      document.removeEventListener('mousedown', handleClickInside);
      document.removeEventListener('touchstart', handleClickInside);
      document.removeEventListener('keydown', handleClickInside);
    };
  }, [ref, handler, timeoutId]);
};


export const useOnClickOutsideDelayLay = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  delay: number,
  timeoutId: React.MutableRefObject<number | null>
) => {

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      // Clear any existing timeout
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current!);
      }

      // Set new timeout to execute the handler after the delay
      const timeout= window.setTimeout(() => {
        handler(event);
      }, delay);

      timeoutId.current = timeout as unknown as number;
    };
    

    const cleanup = () => {
      // Clear timeout when component unmounts or ref changes
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current!);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
      cleanup();
    };
  }, [ref, handler, delay,timeoutId]);
};



