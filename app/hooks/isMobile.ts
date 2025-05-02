"use client"
import { useState, useEffect } from 'react';

type Breakpoint = number; // Define a type for the breakpoint

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768//breakpoint;
      setIsMobile(isMobile);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []); // Add breakpoint as a dependency

  return isMobile;
};

export default useIsMobile;
