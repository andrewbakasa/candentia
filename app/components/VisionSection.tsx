import img from '/public/images/media/bg-3.svg'// '/public/images/Web-developer.svg'; // Using your existing image path

import Image from 'next/image';

// --- 2. VISION SECTION COMPONENT (NEWLY CREATED) ---
const VisionSection: React.FC = () => {
    // Define Key Values, Mission, Vision, and About for Horizon21
    const keyValues = 'Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development';
    const mission = 'Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.';
    const vision = 'To be the premier diversified investment and operational vehicle in the SADC, recognized for driving sustainable regional development through technical excellence, rigorous governance, and rapid collective value creation that generates positive lasting impact for all stockholders.';
    const about = 'Horizon21 is a premier firm providing seamless, end to end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry. We empower clients to create value, reduce costs, minimize downtime, and achieve sustainable, standards compliant growth.';
    
    return (
        <div className="flex flex-col lg:flex-row py-4 lg:py-8 justify-between lg:text-left" data-aos="fade-up" id="our-vision">
            
            {/* Content Column (Left Side) */}
            <div
                className="flex flex-col text-center lg:text-left w-full lg:w-1/2 lg:pr-12"
                data-aos="zoom-in"
                data-aos-delay="500"
            >
                {/* Main Heading (Blue corporate color) */}
                <h2 className="mb-4 text-4xl sm:text-5xl font-extrabold text-blue-800 leading-tight">
                    Excellence in <span className="text-yellow-600">Engineering</span> and Technology
                </h2>

                {/* About Horizon21 Section - Sub-header */}
                <div className="mb-3">
                    <h3 className="text-2xl font-bold text-blue-800 mb-3">About Us</h3>
                    <p className="text-base text-gray-700 leading-relaxed border-l-4 border-yellow-600 pl-4">
                        {about}
                    </p>
                </div>

                {/* Key Values Section - Gold header */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-yellow-600 mb-2 uppercase tracking-wider">Key Values</h3>
                    <p className="text-base font-medium text-gray-800 leading-relaxed">
                        {keyValues}
                    </p>
                </div>

                {/* Mission Section - Gold header */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-yellow-600 mb-2 uppercase tracking-wider">Our Mission</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        {mission}
                    </p>
                </div>

                {/* Vision Section - Gold header */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-yellow-600 mb-2 uppercase tracking-wider">Our Vision</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        {vision}
                    </p>
                </div>
                
                {/* Contact Button (Blue corporate color with gold hover) */}
                <div className="mt-6 mb-12 lg:mb-0">
                    <a
                        href="/contact" // Standard <a> tag used to replace Link
                        className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-3 my-2 font-semibold text-lg rounded-full shadow-xl transition-all duration-300 
                                  bg-blue-800 text-white hover:bg-yellow-600 hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                        Connect with Horizon21
                        <svg
                            className="w-5 h-5 ml-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </a>
                </div>
            </div>
            
            {/* Image Column (Right Side) */}
            {/* <div className="lg:w-1/2 flex flex-col justify-center lg:pl-12">
                <img 
                    alt="Horizon21 Industrial and Technological Solutions" 
                    className="rounded-xl shadow-2xl transition-all duration-500 hover:scale-[1.02]" 
                    src={img} 
                    loading="eager"
                />
            </div> */}
             {/* Image Column (Right Side) */}
                      <div className="lg:w-1/2 flex flex-col justify-center lg:pl-12">
                        <Image 
                          alt="Horizon21 Industrial and Technological Solutions" 
                          className="rounded-xl shadow-2xl transition-all duration-500 hover:scale-[1.02]" 
                          src={img} 
                          priority 
                          sizes="(max-width: 1024px) 100vw, 50vw" // Responsive image optimization
                        />
                      </div>
        </div>
    );
}


export default VisionSection;