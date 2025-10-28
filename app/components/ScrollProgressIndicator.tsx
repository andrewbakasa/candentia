"use client"
import React, { useState, useEffect } from 'react';

const ScrollProgressIndicator: React.FC = () => {
  // State to hold the current scroll progress percentage (0 to 100)
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Function to calculate and update the scroll progress
    const updateScrollProgress = () => {
      // Get the current vertical scroll position
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      
      // Get the total scrollable height of the page
      // scrollHeight is the total height of the content
      // clientHeight is the height of the viewport (the visible area)
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      // Calculate the percentage
      let progress = 0;
      if (scrollHeight > 0) {
        progress = (scrollTop / scrollHeight) * 100;
      }
      
      setScrollProgress(progress);
    };

    // Add event listener for scroll events when the component mounts
    window.addEventListener('scroll', updateScrollProgress);

    // Initial calculation on mount (in case the user loads the page scrolled down)
    updateScrollProgress();

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  return (
    // Fixed container at the top of the viewport (z-10 for layering)
    <div 
      style={{ 
        height: '4px', // The thickness of the bar
        backgroundColor: '#e5e7eb', // Light gray background for the full bar track
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50, // Ensure it stays on top of other content (adjust as needed)
      }}
    >
      {/* The actual progress bar that grows with scrolling */}
      <div 
        style={{ 
          height: '100%',
          backgroundColor: '#3b82f6', // A blue color (e.g., Tailwind 'blue-500')
          width: `${scrollProgress}%`, // Dynamic width based on state
          transition: 'width 0.1s ease-out', // Smooth transition for progress updates
        }}
      />
    </div>
  );
};

export default ScrollProgressIndicator;