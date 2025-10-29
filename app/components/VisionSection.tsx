/* eslint-disable @next/next/no-img-element */
'use client'; 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamicImage01 from '/public/images/media/1.jpg'; 
import dynamicImage02 from '/public/images/media/bg-3.svg'; 
import dynamicImage03 from '/public/images/media/2.jpg'; 
import dynamicImage04 from '/public/images/media/3.jpg'; 
import dynamicImage05 from '/public/images/media/4.jpeg'; 
import dynamicImage06 from '/public/images/media/5.png'; 
import dynamicImage07 from '/public/images/media/6.jpeg'; 
import dynamicImage08 from '/public/images/media/7.jpg'; 
import dynamicImage09 from '/public/images/media/8.jpeg'; 
import dynamicImage10 from '/public/images/media/9.jpg';
import dynamicImage11 from '/public/images/media/10.jpg'; 
import dynamicImage12 from '/public/images/media/11.webp'; 
import dynamicImage13 from '/public/images/media/12.jpg'; 
import dynamicImage14 from '/public/images/media/13.jpg'; 
import dynamicImage15 from '/public/images/media/14.jpg';
import dynamicImage16 from '/public/images/media/16.jpg'; 
import dynamicImage17 from '/public/images/media/17.jpg'; 
import dynamicImage18 from '/public/images/media/18.jpg'; 
import dynamicImage19 from '/public/images/media/19.jpeg';
import dynamicImage20 from '/public/images/media/21.jpg'; 
import dynamicImage21 from '/public/images/media/22.jpg';
import dynamicImage22 from '/public/images/media/23.jpg'; 
import dynamicImage23 from '/public/images/media/24.webp';
import dynamicImage24 from '/public/images/media/25.jpg'; 
import dynamicImage25 from '/public/images/media/26.jpg'; 
import dynamicImage26 from '/public/images/media/27.jpg';
import dynamicImage27 from '/public/images/media/28.jpg'; 

const imagePaths = [
    dynamicImage01, dynamicImage02, dynamicImage03, dynamicImage04, dynamicImage05,
    dynamicImage06, dynamicImage07, dynamicImage08, dynamicImage09, dynamicImage10,
    dynamicImage11, dynamicImage12, dynamicImage13, dynamicImage14, dynamicImage15, 
    dynamicImage16, dynamicImage17, dynamicImage18, dynamicImage19, dynamicImage20, 
    dynamicImage21, dynamicImage22, dynamicImage23, dynamicImage24, dynamicImage25, 
    dynamicImage26, dynamicImage27,
];
// --- VISION SECTION COMPONENT (WITH ENHANCED SLIDESHOW LOGIC) ---
const VisionSection: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalImages = imagePaths.length;

    // Handler for moving to the next image
    const handleNext = () => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % totalImages);
    };

    // Handler for moving to the previous image
    const handlePrev = () => {
        // Ensures correct wrapping when index goes below 0
        setCurrentIndex(prevIndex => (prevIndex - 1 + totalImages) % totalImages);
    };

    // Effect for auto-scroll (Auto-Advance)
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % totalImages);
        }, 5000); // Change image every 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [totalImages]); 

    const currentImage = imagePaths[currentIndex];

    // Define Key Values, Mission, Vision, and About for Horizon21
    const keyValues = 'Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development';
    const mission = 'Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.';
    const vision = 'To be the premier diversified investment and operational vehicle in the SADC, recognized for driving sustainable regional development through technical excellence, rigorous governance, and rapid collective value creation that generates positive lasting impact for all stockholders.';
    const about = 'Horizon21 is a premier firm providing seamless, end to end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry. We empower clients to create value, reduce costs, minimize downtime, and achieve sustainable, standards compliant growth.';

    return (
        <section 
            className="bg-gray-50 rounded-3xl shadow-2xl p-8 lg:p-16 mx-auto max-w-7xl relative overflow-hidden font-sans" 
            id="our-vision"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col justify-between text-left items-center">
                
                {/* --- 1. Image Block: FIXED HEIGHT CAROUSEL CONTAINER --- */}
                <div className="relative mb-12 w-full h-[400px] overflow-hidden rounded-3xl shadow-2xl"> 
                    
                    {/* Image Background Layer (for depth) - Hidden on smaller screens */}
                    <div className="absolute inset-0 bg-blue-200 rounded-3xl opacity-30 transform -rotate-2 translate-x-4 translate-y-4 shadow-inner hidden lg:block"></div>

                   

                    <Image 
                        alt={`Dynamic slide ${currentIndex + 1}`}
                        className="relative z-10 w-full h-full rounded-3xl shadow-2xl transition-all duration-700 
                                hover:scale-[1.005] border-4 border-white object-cover object-center" 
                        src={currentImage} 
                        priority 
                        sizes="100vw" 
                        // ADDED: The 'fill' prop makes the image size itself to the parent container.
                        // REMOVED: width={1600} and height={450} are removed when using 'fill'.
                        fill 
                    />
                    
                    {/* --- MANUAL NAVIGATION HANDLES --- */}
                    <div className="absolute inset-0 flex items-center justify-between z-20 pointer-events-none">
                        
                        {/* Previous Button */}
                        <button 
                            onClick={handlePrev}
                            className="p-3 ml-4 bg-blue-800 bg-opacity-70 hover:bg-opacity-100 transition duration-300 rounded-full text-white pointer-events-auto shadow-xl transform hover:scale-105"
                            aria-label="Previous slide"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        {/* Next Button */}
                        <button 
                            onClick={handleNext}
                            className="p-3 mr-4 bg-blue-800 bg-opacity-70 hover:bg-opacity-100 transition duration-300 rounded-full text-white pointer-events-auto shadow-xl transform hover:scale-105"
                            aria-label="Next slide"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* --- SLIDE COUNTER (Item num of totals) --- */}
                    <div className="absolute bottom-5 right-5 z-20">
                        <span className="bg-yellow-600 text-blue-900 text-sm font-extrabold px-4 py-2 rounded-full shadow-xl">
                            {currentIndex + 1} / {totalImages}
                        </span>
                    </div>

                </div>

                {/* --- 2. Content Block: BELOW THE IMAGE --- */}
                <div
                    className="flex flex-col text-center lg:text-left w-full lg:w-3/4 mx-auto" 
                >
                    {/* Main Heading */}
                    <h2 className="mb-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight">
                        Excellence in <span className="text-yellow-600 shadow-sm">Engineering</span> and Technology
                    </h2>

                    {/* About Horizon21 Section - Styled as a Callout */}
                    <div className="mb-10">
                        <h3 className="text-3xl font-bold text-blue-800 mb-3 border-b border-yellow-500 pb-2">About Us</h3>
                        <p className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-yellow-500 bg-white p-4 rounded-lg shadow-inner">
                            {about}
                        </p>
                    </div>

                    {/* Mission, Vision, Values Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        
                        <div className="p-4 bg-white rounded-xl shadow-lg border-t-4 border-blue-600">
                            <h4 className="text-xl font-bold text-blue-800 mb-2">Our Mission</h4>
                            <p className="text-gray-600 text-base">
                                {mission}
                            </p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl shadow-lg border-t-4 border-yellow-600">
                            <h4 className="text-xl font-bold text-blue-800 mb-2">Our Vision</h4>
                            <p className="text-gray-600 text-base">
                                {vision}
                            </p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl shadow-lg border-t-4 border-blue-600">
                            <h4 className="text-xl font-bold text-blue-800 mb-2">Key Values</h4>
                            <p className="text-gray-600 text-base">
                                {keyValues}
                            </p>
                        </div>
                    </div>
                
                    {/* Contact Button */}
                    <div className="mt-10 flex justify-center lg:justify-start">
                        <a
                            href="/contact" 
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