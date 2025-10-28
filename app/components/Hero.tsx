
import React from 'react';
import Image from 'next/image'; // Import the Image component
const heroImg = '/welcome-to-constructions.webp'

const Hero = () => {
  // Utility classes for full-width, full-height image cover:
  // w-full h-full object-cover ensures the image covers the entire div.
  // The outer div should manage the desired height of the banner.
  return (
    <>
      <div className="relative w-full h-[60vh] lg:h-[80vh] overflow-hidden" id="hero">
        <Image
          src={'/welcome-to-constructions.webp'} // Use your imported image path
          alt="Full-width hero banner representing collaboration and synergy"
          layout="fill" // Ensures the image fills the parent container
          objectFit="cover" // Crops the image to cover the container while maintaining aspect ratio
          quality={100} // Optional: Adjust image quality
          priority // Optional: Use priority for important above-the-fold images
        />
        {/* You can add an overlay or text here if needed, 
            e.g., <div className="absolute inset-0 bg-black opacity-30"></div> */}
      </div>
    </>
  );
};

export default Hero;