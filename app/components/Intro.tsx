import React from 'react';
import Image from 'next/image';
import img from '/public/images/Web-developer.svg';
import Link from 'next/link';

interface IntroProps {} // Define props if needed, otherwise use an empty interface

const Intro: React.FC<IntroProps> = () => {
  return (
    <>
      <div className="m-auto max-w-6xl p-2 md:p-12 h-5/6" id="about">
        <div className="flex flex-col-reverse lg:flex-row py-4 justify-between lg:text-left" data-aos="fade-up">
          <div className="lg:w-1/2 flex flex-col lg:mx-4 justify-center">
            <Image alt="card img" className="rounded-t float-right" src={img} />
          </div>
          <div
            className="flex-col my-2 text-center lg:text-left lg:my-0 lg:justify-end w-full lg:w-1/2 px-8"
            data-aos="zoom-in"
            data-aos-delay="500"
          >
            <h3 className="text-3xl text-yellow-900 font-bold">
            Your Partner in High-Quality, Integrated Engineering
            </h3>
            <div>
              <p className="my-3 text-xl text-gray-600 font-semibold">
              Candentia&apos;s expert team leverages cutting-edge 3D modeling and deep industry knowledge in manufacturing, maintenance, and logistics to develop tailored applications that meet your unique needs.  </p>
            </div>
            <div>
              <p className="my-3 text-xl text-gray-600 font-semibold">
              At Candentia, we take ownership in building custom solutions that automate processes, enhance efficiency, and drive tangible results for organizations, institutions, and SMEs. 
              </p>
            </div>
            <Link
              href="/contact"
              //className="text-white bg-blue-900 hover:bg-blue-800 inline-flex items-center justify-center w-full px-6 py-2 my-4 text-lg shadow-xl rounded-2xl sm:w-auto sm:mb-0 group"
              className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 inline-flex items-center justify-center w-full px-6 py-3 my-4 font-medium shadow-sm rounded-md sm:w-auto sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
         
            >
              Contact us
              <svg
                className="w-4 h-4 ml-1 group-hover: translate-x-2"
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
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Intro;