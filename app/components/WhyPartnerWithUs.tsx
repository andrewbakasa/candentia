import React from 'react';

// --- Provided Information ---
const shareholder_heading = `Shareholder-Led Technical Expertise`;
const shareholder_body = `Horizon21 's strength lies in its unique ownership structure, 
comprised of highly qualified engineers and industrial experts whose hands-on knowledge 
spans the full industrial lifecycle. Our leadership provides administrative, technical, 
and strategic depth, ensuring deep alignment with client challenges and the complexity of 
cross-border SADC operations.`;

const partner_heading = `Why Partner with Horizon21`;

const partner_body_points = [
    {
        title: "Unified End-to-End Strategy",
        description: "Eliminating operational silos by managing sourcing, installation, maintenance, optimization, and logistics for your critical assets under one seamless approach."
    },
    {
        title: "Deep Field-Level Expertise",
        description: "Solutions are designed by a diverse team of engineers with direct, deep field-level experience, guaranteeing practical, standards-compliant, and commercially viable outcomes across SADC markets."
    },
    {
        title: "Technology-Driven Edge",
        description: "Embedding smart technology (AI, IoT, RFID) and data analytics into every service to offer predictive insights, reducing unexpected failures and driving competitive advantage."
    },
    {
        title: "Guaranteed Commercial Viability",
        description: "Every solution is rigorously designed for commercial viability, centered on delivering a tangible, measurable Return on Investment (ROI)."
    }
];
// Note: I restructured the long partner_body into an array of objects for easier, cleaner rendering (like a feature list).

// --- Main Component ---
const WhyPartnerWithUs = () => {
    return (
        <section className="py-16 sm:py-24 bg-gray-50" id="partnership">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* --- Main Partnership Section (Why Partner) --- */}
                <div className="lg:text-center">
                    <h2 className="text-base text-yellow-600 font-semibold tracking-wide uppercase">Partnership Advantage</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        {partner_heading}
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                        Partnering with Horizon21 provides a clear competitive advantage driven by a unified strategy and deep expertise.
                    </p>
                </div>

                <div className="mt-10">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                        {partner_body_points.map((point, index) => (
                            <div key={index} className="relative">
                                <dt>
                                    {/* Icon Placeholder (e.g., using a Tailwind UI icon) */}
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-yellow-600 text-white">
                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.27a8.13 8.13 0 011.603 3.447L12 21 2.77 10.177A8.13 8.13 0 014.382 5.73l.238-.34A7.98 7.98 0 0112 4c.321 0 .639.026.953.078l.343.056z" />
                                        </svg>
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{point.title}</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">{point.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* --- Shareholder Section (Technical Depth) --- */}
                <div className="mt-20 pt-10 border-t border-gray-200 lg:grid lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-span-1">
                        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                            {shareholder_heading}
                        </h3>
                    </div>
                    <div className="mt-6 lg:mt-0 lg:col-span-2">
                        <p className="text-lg text-gray-500">
                            {shareholder_body}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyPartnerWithUs;