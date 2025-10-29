/* eslint-disable @next/next/no-img-element */
'use client'; 
import React, { useState, useEffect } from 'react';

// Using public placeholder URLs instead of Next.js local imports
// This resolves the compilation errors related to 'next/image' and local assets.
// const imagePaths = [
//     "https://placehold.co/1600x450/3b82f6/ffffff?text=Engineering+Excellence", 
//     "https://placehold.co/1600x450/10b981/ffffff?text=Sustainable+Solutions", 
//     "https://placehold.co/1600x450/f59e0b/ffffff?text=Technology+Integration", 
//     "https://placehold.co/1600x450/ef4444/ffffff?text=Operational+Impact"
// ];
import Image from 'next/image';
import dynamicImage1 from '/public/images/media/bg-1.svg'; 
import dynamicImage2 from '/public/images/media/engine.png'; 
import dynamicImage3 from '/public/images/media/bg-3.svg'; 
import dynamicImage4 from '/public/images/media/engine_2.jpeg'; 
const imagePaths = [dynamicImage1,dynamicImage2,dynamicImage3,dynamicImage4];

// --- Helper Icons (Standard SVG for no extra dependencies) ---
// FIX: Added explicit typing for SVG props
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h12a1 1 0 001-1v-10M9 21h6"/></svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
);

// FIX: Define the interface for ContentBlock props
interface ContentBlockProps {
    title: string;
    content: string;
    icon?: React.ReactNode; 
}

// --- Helper Component for Modern Content Blocks ---
// FIX: Applied ContentBlockProps interface to explicitly type the destructured props
const ContentBlock = ({ title, content, icon }: ContentBlockProps) => (
    <div className="p-5 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col justify-start items-start text-left 
                transform transition duration-300 hover:shadow-xl hover:translate-y-[-4px]"> 
        <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
            {icon && <span className="mr-3">{icon}</span>}
            {title}
        </h3>
        <p className="text-base text-gray-600 leading-relaxed">
            {content}
        </p>
    </div>
);


// --- 2. VISION SECTION COMPONENT (WITH SLIDESHOW LOGIC) ---
const VisionSection = () => {
    // State to track the index of the current image
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to advance the image index
    const advanceIndex = () => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % imagePaths.length);
    }

    // Effect to handle the cyclic image transition (Automatic)
    useEffect(() => {
        const intervalId = setInterval(advanceIndex, 5000); // Change image every 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [advanceIndex]); // Added advanceIndex to dependency array to satisfy React linting

    // Handler for manual click to advance the image
    const handleImageClick = () => {
        // Stop the current interval to prevent the timer from immediately overriding the manual click
        // For this environment, we just advance the index immediately.
        advanceIndex();
    };

    const currentImage = imagePaths[currentIndex];

    // Define Key Values, Mission, Vision, and About for Horizon21
    const keyValues = 'Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development';
    const mission = 'Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.';
    const vision = 'To be the premier diversified investment and operational vehicle in the SADC, recognized for driving sustainable regional development through technical excellence, rigorous governance, and rapid collective value creation that generates positive lasting impact for all stockholders.';
    const about = 'Horizon21 is a premier firm providing seamless, end to end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry. We empower clients to create value, reduce costs, minimize downtime, and achieve sustainable, standards compliant growth.';

    return (
        <section 
            className="bg-gray-50 rounded-3xl shadow-2xl p-8 lg:p-16 mx-auto max-w-7xl relative overflow-hidden" 
            id="our-vision"
        >
            {/* Background Blob/Gradient Decor (Pure CSS) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col justify-between text-left items-center">
                
                {/* --- 1. Image Block: FIXED HEIGHT CONTAINER --- */}
                {/* The addition of h-[400px] ensures the container always reserves this space. */}
                <div className="relative mb-12 w-full h-[400px] overflow-hidden"> 
                    
                    {/* Image Background Layer (for depth) */}
                    <div className="absolute inset-0 bg-blue-200 rounded-3xl opacity-30 transform -rotate-2 translate-x-4 translate-y-4 shadow-inner hidden lg:block"></div>

                    {/* CLICKABLE CONTAINER TO ADVANCE SLIDESHOW */}
                    <div 
                        className="block w-full h-full relative z-10 cursor-pointer group"
                        onClick={handleImageClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleImageClick();
                            }
                        }}
                    >
                     
                    <Image 
                        alt={`Dynamic slide ${currentIndex + 1}`}
                        // **CHANGE MADE HERE: max-h-[600px] reduced to max-h-[400px]**
                        className="relative z-10 w-full h-auto max-h-[400px] rounded-3xl shadow-2xl transition-all duration-700 
                                 hover:scale-[1.005] border-4 border-white object-cover object-center" 
                        src={currentImage} 
                        priority 
                        sizes="100vw" 
                        width={1600} 
                        // **CHANGE MADE HERE: height reduced from 900 to 450**
                        height={450} 
                    />
                    </div>
                </div>

                {/* --- 2. Content Block: BELOW THE IMAGE --- */}
                <div
                    className="flex flex-col text-center lg:text-left w-full lg:w-3/4 mx-auto" 
                >
                    {/* Main Heading (Blue corporate color) */}
                    <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight">
                        Excellence in <span className="text-yellow-600">Engineering</span> and Technology
                    </h2>


 

                    {/* About Horizon21 Section - Styled as a Callout */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-blue-800 mb-3">About Us</h3>
                        <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500">
                            {about}
                        </p>
                    </div>

 <div className="mb-8">
                        <h3 className="text-2xl font-bold text-blue-800 mb-3">Our Mission</h3>
                        <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500">
                            {mission}
                        </p>
                    </div>
 <div className="mb-8">
                        <h3 className="text-2xl font-bold text-blue-800 mb-3">Our Vision</h3>
                        <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500">
                            {vision}
                        </p>
                    </div>
 <div className="mb-8">
                        <h3 className="text-2xl font-bold text-blue-800 mb-3">Key Values</h3>
                        <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500">
                            {keyValues}
                        </p>
                    </div>

                
                    {/* Contact Button */}
                    <div className="mt-10 flex justify-center lg:justify-start">
                        <a
                            href="/contact" 
                            // MODIFIED: Reduced padding and font size for mobile, then set back to original large size for 'sm' and up.
                            className="inline-flex items-center justify-center sm:w-auto px-8 py-3 text-base sm:px-12 sm:py-4 sm:text-lg font-semibold rounded-full 
                                        shadow-xl transition-all duration-300 transform 
                                        bg-blue-800 text-white 
                                        hover:bg-yellow-600 hover:text-blue-900 hover:scale-[1.03] 
                                        focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            Connect with Horizon21
                            <svg className="w-5 h-5 ml-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                        </a>
                    </div>
                </div> 
            </div>
        </section>
    );
}

export default VisionSection;

// /* eslint-disable @next/next/no-img-element */
// 'use client'; 
// import React, { useState, useEffect } from 'react';



// import Image from 'next/image';
// import dynamicImage1 from '/public/images/media/bg-1.svg'; 
// import dynamicImage2 from '/public/images/media/engine.png'; 
// import dynamicImage3 from '/public/images/media/bg-3.svg'; 
// import dynamicImage4 from '/public/images/media/engine_2.jpeg'; 
// const imagePaths = [dynamicImage1,dynamicImage2,dynamicImage3,dynamicImage4];

// // --- Helper Icons (Standard SVG for no extra dependencies) ---
// // FIX: Added explicit typing for SVG props
// const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h12a1 1 0 001-1v-10M9 21h6"/></svg>
// );
// const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
// );
// const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
// );

// // FIX: Define the interface for ContentBlock props
// interface ContentBlockProps {
//     title: string;
//     content: string;
//     icon?: React.ReactNode; 
// }

// // --- Helper Component for Modern Content Blocks ---
// // FIX: Applied ContentBlockProps interface to explicitly type the destructured props
// const ContentBlock = ({ title, content, icon }: ContentBlockProps) => (
//     <div className="p-5 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col justify-start items-start text-left 
//                 transform transition duration-300 hover:shadow-xl hover:translate-y-[-4px]"> 
//         <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
//             {icon && <span className="mr-3">{icon}</span>}
//             {title}
//         </h3>
//         <p className="text-base text-gray-600 leading-relaxed">
//             {content}
//         </p>
//     </div>
// );


// // --- 2. VISION SECTION COMPONENT (WITH SLIDESHOW LOGIC) ---
// const VisionSection = () => {
//     // State to track the index of the current image
//     const [currentIndex, setCurrentIndex] = useState(0);

//     // Effect to handle the cyclic image transition
//     useEffect(() => {
//         const intervalId = setInterval(() => {
//             // Increment the index, using modulo to cycle back to 0 when the end is reached
//             setCurrentIndex(prevIndex => (prevIndex + 1) % imagePaths.length);
//         }, 5000); // Change image every 5 seconds (adjust as needed)

//         // Cleanup function to clear the interval when the component unmounts
//         return () => clearInterval(intervalId);
//     }, []); // Empty dependency array ensures this runs only once on mount

//     const currentImage = imagePaths[currentIndex];

//     // Define Key Values, Mission, Vision, and About for Horizon21
//     const keyValues = 'Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development';
//     const mission = 'Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.';
//     const vision = 'To be the premier diversified investment and operational vehicle in the SADC, recognized for driving sustainable regional development through technical excellence, rigorous governance, and rapid collective value creation that generates positive lasting impact for all stockholders.';
//     const about = 'Horizon21 is a premier firm providing seamless, end to end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry. We empower clients to create value, reduce costs, minimize downtime, and achieve sustainable, standards compliant growth.';

//     return (
//         <section 
//             className="bg-gray-50 rounded-3xl shadow-2xl p-8 lg:p-16 mx-auto max-w-7xl relative overflow-hidden" 
//             id="our-vision"
//         >
//             {/* Background Blob/Gradient Decor (Pure CSS) */}
//             <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
//             
//             <div className="relative z-10 flex flex-col justify-between text-left items-center">
//                 
//                 {/* --- 1. Image Block: FIXED HEIGHT CONTAINER --- */}
//                 {/* The addition of h-[400px] ensures the container always reserves this space. */}
//                 {/* IMPORTANT: We must use object-cover and w-full/h-full on the image 
//                       to ensure it fills the container without shifting content. */}
//                 <div className="relative mb-12 w-full h-[400px] overflow-hidden"> 
//                     
//                     {/* Image Background Layer (for depth) */}
//                     <div className="absolute inset-0 bg-blue-200 rounded-3xl opacity-30 transform -rotate-2 translate-x-4 translate-y-4 shadow-inner hidden lg:block"></div>

//                     {/* Standard <img> tag is used here */}
//                   

//                    <Image 
//                         alt={`Dynamic slide ${currentIndex + 1}`}
//                         // **CHANGE MADE HERE: max-h-[600px] reduced to max-h-[400px]**
//                         className="relative z-10 w-full h-auto max-h-[400px] rounded-3xl shadow-2xl transition-all duration-700 
//                                  hover:scale-[1.005] border-4 border-white object-cover object-center" 
//                         src={currentImage} 
//                         priority 
//                         sizes="100vw" 
//                         width={1600} 
//                         // **CHANGE MADE HERE: height reduced from 900 to 450**
//                         height={450} 
//                     />
//                 </div>

//                 {/* --- 2. Content Block: BELOW THE IMAGE --- */}
//                 <div
//                     className="flex flex-col text-center lg:text-left w-full lg:w-3/4 mx-auto" 
//                 >
//                     {/* Main Heading (Blue corporate color) */}
//                     <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight">
//                         Excellence in <span className="text-yellow-600">Engineering</span> and Technology
//                     </h2>


 

//                     {/* About Horizon21 Section - Styled as a Callout */}
//                     <div className="mb-8">
//                         <h3 className="text-2xl font-bold text-blue-800 mb-3">About Us</h3>
//                         <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500">
//                             {about}
//                         </p>
//                     </div>

//                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4"> {/* Changed to 3 columns for better use of space */}
//                          <ContentBlock 
//                             title="Our Mission" 
//                             content={mission} 
//                             icon={<HomeIcon className="w-5 h-5 text-blue-600"/>}
//                         />
//                         <ContentBlock 
//                             title="Our Vision" 
//                             content={vision} 
//                             icon={<EyeIcon className="w-5 h-5 text-yellow-600"/>}
//                         />
//                         <ContentBlock 
//                              title="Key Values" 
//                              content={keyValues} 
//                              icon={<CheckCircleIcon className="w-5 h-5 text-blue-600"/>}
//                         />
//                     </div>

//                     {/* Contact Button */}
//                     <div className="mt-10 flex justify-center lg:justify-start">
//                         <a
//                             href="/contact" 
//                             className="inline-flex items-center justify-center sm:w-auto px-12 py-4 font-semibold text-lg rounded-full 
//                                         shadow-xl transition-all duration-300 transform 
//                                         bg-blue-800 text-white 
//                                         hover:bg-yellow-600 hover:text-blue-900 hover:scale-[1.03] 
//                                         focus:outline-none focus:ring-4 focus:ring-blue-300"
//                         >
//                             Connect with Horizon21
//                             <svg className="w-5 h-5 ml-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                 <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
//                             </svg>
//                         </a>
//                     </div>
//                 </div> 
//             </div>
//         </section>
//     );
// }

// export default VisionSection;