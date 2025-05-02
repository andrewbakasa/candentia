import { useEffect, useRef } from 'react';

export const useOnClickOutsideDelay = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  delay: number
) => {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to execute the handler after the delay
      timeoutRef.current = window.setTimeout(() => {
        handler(event);
      }, delay);
    };
    

    const cleanup = () => {
      // Clear timeout when component unmounts or ref changes
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
      cleanup();
    };
  }, [ref, handler, delay]);
};

