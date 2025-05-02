import React from 'react';
import Link from 'next/link';

interface InvestmentProps {}

const Investments: React.FC<InvestmentProps> = () => {
  return (
    <div className="my-12 py-8 bg-gray-50 rounded-lg shadow-md" id="investments">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-yellow-900 mb-6">Partner with Us to Build the Future</h2>
        <p className="text-center text-gray-700 mb-8">
Collaborate with us in realizing a future driven by innovation and impactful growth. As a key partner, 
you&apos;ll be instrumental in ventures that offer both transformative potential and substantial returns.
          </p>
{/*         <div className="flex justify-center mb-6">
          <div className="w-20 border-b-4 border-blue-500"></div>
        </div> */}
        <div className="mt-8 text-center">
          <Link
            href="/financing"
            className="inline-flex items-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Invest in the Brilliance of Candentia
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Investments;
