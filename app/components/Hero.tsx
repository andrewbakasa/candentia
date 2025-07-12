import React from 'react';
import Image from 'next/image'; // Import the Image component
import heroImg from '/public/images/web-dev.svg';
import Link from 'next/link';

const Hero = () => {
  return (
    <>
      <div className="hero" id='hero'>
        <div className="m-auto overflow-hidden mx-4 mt-8 lg:mt-4 p-2 md:p-12 h-5/6" data-aos="zoom-in">
          <div id='hero' className="flex flex-col lg:flex-row py-8 justify-between text-center lg:text-left">
            <div className="lg:w-1/2 flex flex-col justify-center" data-aos="zoom-in" data-aos-delay="200">
              <h1 className="mb-3 md:text-5xl text-3xl font-bold text-yellow-900">
              Collective Action Power
              </h1>
  <section className="mt-8">
                <h2 className="mb-6 text-2xl font-bold text-slate-700">Our Foundation: Collaboration and Foresight</h2>
                <ul className="list-none p-0">
                  <li className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Synergy of Ideas</h3>
                    <p className="text-lg text-slate-600">By bringing together diverse perspectives and specialized knowledge, we innovate more effectively, solve complex challenges, and identify opportunities that individuals might miss.</p>
                  </li>
                  <li className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Efficiency Through Teamwork</h3>
                    <p className="text-lg text-slate-600">A unified team works more efficiently and achieves greater outcomes. Our collective strength and shared purpose are our ultimate competitive advantage.</p>
                  </li>
                  <li className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Engineers&apos; Pivotal Role</h3>
                    <p className="text-lg text-slate-600">We leverage our critical skills, technical insights, and practical experience to address the nation&apos;s most pressing needs and help build its future.</p>
                  </li>
                  <li className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Accelerated Growth & Impact</h3>
                    <p className="text-lg text-slate-600">Collective effort and shared resources enable us to raise funds and start operations quickly, delivering tangible results and making a significant economic impact without unnecessary delay.</p>
                  </li>
                </ul>
              </section>

               <div className="mb-4 space-x-0 md:space-x-2 md:mb-8">
                <Link href="/contact"
                 className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 inline-flex items-center justify-center w-full px-6 py-3 my-4 font-medium shadow-sm rounded-md sm:w-auto sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Learn more
                  <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </Link>
              </div>
            </div>
            <div className="flex lg:justify-end w-full lg:w-1/2" data-aos="fade-up" data-aos-delay="700">
              <Image
                src={heroImg}
                alt="hero image"
                className="rounded-t float-right duration-1000 w-full"
                priority // Optional: Use priority for important above-the-fold images
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
