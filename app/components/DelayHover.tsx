import React, { useState, useRef, useEffect } from 'react';

interface DelayedHoverActionProps {
  children: React.ReactNode;
}

const DelayedHoverAction: React.FC<DelayedHoverActionProps> = ({ children }) => {
  const hoverRef = useRef<boolean>(false);
  const [shouldTriggerAction, setShouldTriggerAction] = useState(false);

  const handleMouseEnter = () => {
    hoverRef.current = true;
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
  };

  useEffect(() => {
    if (!hoverRef.current) {
      const timeoutId = setTimeout(() => {
        setShouldTriggerAction(true);
      }, 1000); // Adjust delay as needed

      return () => clearTimeout(timeoutId); // Clear timeout on unmount
    }
  }, [hoverRef.current]);

  return (
    <div
      className="hover-transition"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldTriggerAction && <div>Action Triggered!</div>}
    </div>
  );
};

export default DelayedHoverAction;
