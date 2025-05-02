import React from 'react';
import Image from 'next/image';
// import kws from '/images/clients/ideaL.jpg';
// import geps from '/images/clients/3m.jpg';
// import protergia from '/images/clients/idea3m.jpg';

interface ClientsProps {} // Define props if needed, otherwise use an empty interface

const clientImage: React.CSSProperties = {
  height: '15rem',
  width: 'auto',
  mixBlendMode: 'color-burn', // Corrected value with a hyphen
};

const Clients: React.FC<ClientsProps> = () => {
  return (
    <div className="mt-8 bg-gray-100">
      <section data-aos="fade-up">
        <div className="my-4 py-4">
          <h2 className="my-2 text-center text-3xl text-yellow-900 uppercase font-bold">Trusted by Leading Organizations</h2>
          <div className="flex justify-center">
            <div className="w-24 border-b-4 border-yellow-400"></div>
          </div>
          <h2 className="mt-4 mx-12 text-center text-xl lg:text-2xl font-semibold text-yellow-900">
            Some of our clients.
          </h2>
        </div>

        <div className="py-16" data-aos="fade-in" data-aos-delay="600">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
            <div className="flex justify-center items-center overflow-hidden transition-opacity duration-300 ease-in-out opacity-50 hover:opacity-100">
              <Image
                src="/images/3M.svg"
                alt="client logo 1"
                height={160}
                width={250}
                className="rounded-md object-contain"
                style={{ maxHeight: '120px', maxWidth: '200px' }} // More flexible sizing
              />
            </div>

            <div className="flex justify-center items-center overflow-hidden transition-opacity duration-300 ease-in-out opacity-50 hover:opacity-100">
              <Image
                src="/images/ideal3M.svg"
                alt="client logo 2"
                height={160}
                width={250}
                className="rounded-md object-contain"
                style={{ maxHeight: '120px', maxWidth: '200px' }}
              />
            </div>

            <div className="flex justify-center items-center overflow-hidden transition-opacity duration-300 ease-in-out opacity-50 hover:opacity-100">
              <Image
                src="/images/idea.svg"
                alt="client logo 3"
                height={160}
                width={250}
                className="rounded-md object-contain"
                style={{ maxHeight: '120px', maxWidth: '200px' }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Clients;