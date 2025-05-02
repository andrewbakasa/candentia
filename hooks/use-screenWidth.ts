"use client"
import { useState, useEffect } from 'react';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return windowSize;
};

// const App: React.FC = () => {
//   const { width, height } = useWindowSize();

//   return (
//     <div>
//       <p>Window Width: {width}px</p>
//       <p>Window Height: {height}px</p>
//     </div>
//   );
// };

// export default App;

