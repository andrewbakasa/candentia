// components/About.tsx (Updated for Next.js 14 & Tailwind)

// We use standard Link since NextLink isn't defined here
import Image from 'next/image';
import Link from 'next/link'; 
import React from 'react';

// Define the shape of the video prop
interface VideoSource {
  src: string;
}

interface AboutProps {
  heading?: string;
  headingH1?: string;
  subHeading?: string;
  para?: string;
  para2?: string;
  para3?: string;
  imgPosition?: 'left' | 'right';
  src: string;
  btnTitle?: string;
  btnUrl?: string;
  video?: VideoSource;
  span?: string;
}

const About: React.FC<AboutProps> = ({
  heading,
  headingH1,
  subHeading,
  para,
  para2,
  para3,
  imgPosition = 'left',
  src,
  btnTitle,
  btnUrl,
  video,
  span,
}) => {
  const isImageRight = imgPosition === 'right';

  // Conditionally render video or image
  const renderMedia = () => {
    if (video) {
      return (
        <video
          className="w-full max-w-full rounded-lg shadow-xl"
          autoPlay
          muted
          loop
          src={video.src}
          style={{ height: 'auto' }} // Added to ensure correct aspect ratio in Tailwind
        />
      );
    } else {
      // Modern Next.js Image component usage
      return (
        <div className="relative w-full overflow-hidden rounded-xl shadow-2xl transition hover:scale-[1.01] duration-500">
          <Image
            // NOTE: Alt text simplified, consider passing a full alt prop
            alt={`${headingH1 || heading || 'Company Image'}`} 
            src={src}
            width={600}
            height={700}
            // Removed unoptimized for better performance
            className="w-full h-auto object-cover" 
            priority={true} // High priority for above-the-fold content
          />
        </div>
      );
    }
  };

  return (
    // Replaced Bootstrap 'row' and 'col' with Tailwind grid
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* Media Section (Image or Video) */}
      <div className={`${isImageRight ? 'lg:order-2' : 'lg:order-1'} order-1`}>
        {/* Figure tag replaced with a simple container */}
        <div className="img-bg">{renderMedia()}</div>
      </div>

      {/* Content Section */}
      <div className={`${isImageRight ? 'lg:order-1' : 'lg:order-2'} order-2`}>
        
        {/* Optional Subheading Badge (Gold/Yellow styling) */}
        {subHeading && (
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider rounded-full bg-yellow-100 text-yellow-800">
            {subHeading}
          </span>
        )}

        {/* Heading H1 with Optional Span */}
        {headingH1 && (
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 font-oswald">
            {headingH1}
            {/* Blue color for span, using custom font/class if available */}
            {span && <span className="text-blue-600 ml-2 font-oswald">{span}</span>}
          </h1>
        )}

        {/* Heading H2 (if H1 not provided) */}
        {!headingH1 && heading && (
          <h2 className="text-3xl font-bold text-gray-800 mb-4 font-oswald">
            {heading}
            {span && <span className="text-blue-600 ml-2 font-oswald">{span}</span>}
          </h2>
        )}

        {/* Main and Additional Paragraphs */}
        {para && <p className="mb-6 text-gray-600 text-justify font-roboto">{para}</p>}
        {para2 && <p className="mb-3 text-gray-600 text-justify font-roboto">{para2}</p>}
        {para3 && <p className="mb-3 text-gray-600 text-justify font-roboto">{para3}</p>}

        {/* Optional Button (Styled with blue corporate color) */}
        {btnTitle && btnUrl && (
          <div className="mt-8">
            <Link
              href={btnUrl}
              // Tailwind version of 'btn btn-md bg-primary text-white rounded'
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-300"
            >
              {btnTitle}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;