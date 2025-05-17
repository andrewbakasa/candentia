'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Check, Image as ImageIcon, Link as LinkIcon, MapPin } from 'lucide-react';

import CareerForm from '../input-jobs/InputJobsClient';
import { Career } from '@prisma/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Search from '../components/Search';

// Define the type for our form data, including raisedAmount
interface CareerFormValues {
    id?: string;
    title: string;
    listingTitle?: string | null;
    shortDescription?: string | null;
    fullDescription: string;
    slug: string;
    location: string;
    type: string;
    department: string;
}

interface CareerFormProps {
    mockCareers: Career[]; // Renamed prop to mockCareers
}

const CareerClient: React.FC<CareerFormProps> = ({ mockCareers }) => { // Renamed component
    const [selectedCareer, setSelectedCareer] = useState<CareerFormValues | null>(null); // Changed type
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredRecords, setFilteredRecords] = useState(mockCareers); // Changed initial state
    const router = useRouter();

    useEffect(() => {
        let careerList = mockCareers; // Changed variable name
        if (searchTerm !== "") {
            let arrFirst = searchTerm.split(';');
            const arr = arrFirst.filter(element => element);
            const results = careerList.filter((record) =>
                arr.some(
                    (x) => {
                        const searchTerms = x.split(',').map(s => s.trim().toLowerCase());
                        return searchTerms.every(term =>
                            record.title?.toLowerCase().includes(term) ||
                            (record.listingTitle || '').toLowerCase().includes(term) ||
                            (record.shortDescription || '').toLowerCase().includes(term) ||
                            record.fullDescription.toLowerCase().includes(term) ||
                            record.slug.toLowerCase().includes(term) ||
                            record.location.toLowerCase().includes(term) ||
                            record.type.toLowerCase().includes(term) ||
                            record.department.toLowerCase().includes(term)
                        );
                    }
                )
            );
            setFilteredRecords(results);
        } else {
            setFilteredRecords(careerList);
        }
    }, [mockCareers, searchTerm]);


    const handleCareerSelect = useCallback((career: Career) => { // Changed parameter type
        // Map the career data to match CareerFormValues
        const initialData: CareerFormValues = {
            id: career.id,
            title: career?.title ||"",
            listingTitle: career.listingTitle || null,
            shortDescription: career.shortDescription || null,
            fullDescription: career.fullDescription,
            slug: career.slug,
            location: career.location,
            type: career.type,
            department: career.department,
        };
        setSelectedCareer(initialData);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCareer(null);
    }

    return (
        <>
            <div className="flex-col justify-between sm:px-1 xs:px-2 mb-2.5 ">
                <div className='flex flex-col justify-between py-1 sm:flex-row  gap-1 md:gap-5 lg:max-w-[90%] sm:max-w-[95%] mx-auto'>
                    <div
                        role="button"
                        onClick={() => { router.push('/input-jobs') }} // Adjusted route
                        className="sm:w-[200px] w-full mt-1 md:mt-10 aspect-video relative h-[38px]  bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                        <p className="text-sm">Create new Career</p> {/* Changed text */}
                    </div>
                    <div className="">
                        <Search
                            setSearchTerm={setSearchTerm}
                            searchTerm={searchTerm}
                            debounce={1500}
                            placeholderText="filter records..." // Changed placeholder
                        />
                    </div>
                </div>



                <div className=" my-2 mb-2 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-green-100 lg:max-w-[90%] sm:max-w-[95%] mx-auto">

                    {filteredRecords?.length > 0 ? filteredRecords?.map((career) => ( // Changed variable
                        <Card
                            key={career.id}
                            className={cn(
                                "transition-all duration-300",
                                "border-0 shadow-md",
                                "hover:shadow-lg hover:border-blue-500/30",
                                "cursor-pointer",
                                "group",
                                "bg-white/90 backdrop-blur-md",
                                "border border-white/10"
                            )}
                            onClick={() => handleCareerSelect(career)} // Changed handler
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    {career.title}
                                </CardTitle>
                                <CardDescription className="flex items-center text-gray-500">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {career.location}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 mb-2">
                                    {career.shortDescription}
                                </p>
                                <div className="mb-2">
                                    <span className="font-semibold">Type:</span> {career.type}
                                </div>
                                <div className="mb-2">
                                    <span className="font-semibold">Department:</span> {career.department}
                                </div>

                            </CardContent>
                        </Card>
                    )) : (
                        <div className="col-span-full text-center py-4 min-h-screen flex items-center justify-center">
                            <p className='text-red-400 text-3xl'>No career postings found matching your criteria.</p> {/* Changed message */}
                        </div>

                    )}
                </div>

            </div>
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[90vw] overflow-y-auto max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className='text-yellow-300 hover:text-yellow-700'>Edit Career Posting</DialogTitle> {/* Changed title */}
                        <DialogDescription className='text-yellow-700'>
                            Make changes to the career posting below. Click save when you&apos;re done. {/* Changed description */}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[100vh] overflow-x-hidden overflow-y-auto">

                        {selectedCareer && (
                            <CareerForm initialData={selectedCareer} /> // Use CareerForm here
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CareerClient;

// 'use client';
// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Button } from '@/components/ui/button';
// import { Check, Image as ImageIcon, Link as LinkIcon, MapPin, PercentCircle } from 'lucide-react';

// import InputInvestmentClient from '../input-investments/InputInvestmentsClient';
// import { Career } from '@prisma/client';
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import Search from '../components/Search';

// // Define the type for our form data, including raisedAmount
// interface JobsFormValues {
//     title: string;
//     description: string;
//     type: 'Real Estate' | 'StartUp' | 'Stock' |'Equity' | 'Venture Capital' | 'Debt';
//     country: string;
//     targetAmount: number;
//     raisedAmount: number;
//     imageUrl: string;
//     expectedReturn?: string;
//     active: boolean;
//     id?: string; // Add id for edit mode
// }

// interface JobsFormProps {
//     mockPortfolios: Career[];
// }

// const JobsClient: React.FC<JobsFormProps> = ({ mockPortfolios }) => {
//     const [selectedPortfolio, setSelectedPortfolio] = useState<JobsFormValues | null>(null);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filteredRecords, setFilteredRecords] = useState(mockPortfolios);
//     const router = useRouter();

//     useEffect(() => {
//         let portfoliaList = mockPortfolios;
//         if (searchTerm !== "") {
//           let arrFirst = searchTerm.split(';');
//           const arr = arrFirst.filter(element => element); // Using arrow function (ES6)
//           const results = portfoliaList.filter((record) =>
//             arr.some(
//               (x) => {
//                 const searchTerms = x.split(',').map(s => s.trim().toLowerCase());
//                 return searchTerms.every(term =>
//                   record.title.toLowerCase().includes(term) ||
//                   record.description.toLowerCase().includes(term) ||
//                   record.country.toLowerCase().includes(term) ||
//                   record.type.toLowerCase().includes(term)// infuture to make a array: ["StartUP","Stock", etc]             
//                 );
//               }
//             )
//           );
//           setFilteredRecords(results);
//         } else {
//           setFilteredRecords(portfoliaList);
//         }
//     }, [mockPortfolios, searchTerm]);


//     const handlePortfolioSelect = useCallback((portfolio: Career) => {
//         // Map the portfolio data to match InputInvestmentClient's expected initialData type
//         const initialData: JobsFormValues = {
//             id: portfolio.id,
//             title: portfolio.title,
//             description: portfolio.description,
//             type: portfolio.type as 'Real Estate' | 'StartUp' | 'Stock' |'Equity' | 'Venture Capital' | 'Debt', // Type assertion here
//             country: portfolio.country,
//             targetAmount: portfolio.targetAmount,
//             raisedAmount: portfolio.raisedAmount,
//             imageUrl: portfolio.imageUrl,
//             expectedReturn: portfolio.expectedReturn ?? undefined, // Handle null to undefined
//             active: portfolio.active,
//         };
//         setSelectedPortfolio(initialData); //store the selected portfolio
//         setIsModalOpen(true); //open the modal
//     }, []);

//     const handleCloseModal = () => {
//         setIsModalOpen(false);
//         setSelectedPortfolio(null); //reset
//     }

//     return (
//         <>
//             <div className="flex-col justify-between sm:px-1 xs:px-2 mb-2.5 ">
//                    <div className='flex flex-col justify-between py-1 sm:flex-row  gap-1 md:gap-5 lg:max-w-[90%] sm:max-w-[95%] mx-auto'>
//                         <div
//                             role="button"
//                             onClick={()=>{ router.push('/input-investments') }}
//                             className="sm:w-[200px] w-full mt-1 md:mt-10 aspect-video relative h-[38px]  bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
//                             >
//                             <p className="text-sm">Create new Portfolio</p>
//                         </div> {/* i need this butto to be w-full in sm*/}
//                         <div className=""> {/* Adjust width and use flex-grow */}
//                             <Search
//                                 setSearchTerm={setSearchTerm}
//                                 searchTerm={searchTerm}
//                                 debounce={1500}
//                                 placeholderText="filter records..."
//                             />
//                         </div>
//                     </div>
                

            
        
//                 <div className=" my-2 mb-2 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-green-100 lg:max-w-[90%] sm:max-w-[95%] mx-auto">
                
//                     {filteredRecords.length > 0 ?filteredRecords?.map((portfolio) => (
//                         <Card
//                             key={portfolio.id}
//                             // className="hover:shadow-lg transition-shadow cursor-pointer border-0"
//                             className={cn(
//                                 "transition-all duration-300",
//                                 "border-0 shadow-md", // Use shadow-md as base
//                                 "hover:shadow-lg hover:border-blue-500/30", // Lighter border on hover
//                                 "cursor-pointer",
//                                 "group", // Add group for child hover effects
//                                 "bg-white/90 backdrop-blur-md", // Add some transparency
//                                 "border border-white/10" // Add a light border
//                             )}
//                             onClick={() => handlePortfolioSelect(portfolio)}
//                         >
//                             <CardHeader>
//                                 <CardTitle className="flex items-center text-lg font-semibold">
//                                     {portfolio.title}
//                                 </CardTitle>
//                                 <CardDescription className="flex items-center text-gray-500">
//                                     <MapPin className="w-4 h-4 mr-1" />
//                                     {portfolio.country}
//                                 </CardDescription>
//                             </CardHeader>
//                             <CardContent>
//                                 <img
//                                     src={portfolio.imageUrl.split('|')[1]}
//                                     alt={portfolio.title}
//                                     className="w-full h-48 object-cover rounded-md mb-4"
//                                 />
//                                 <p className="text-gray-700 mb-2">
//                                     {portfolio.description}
//                                 </p>
//                                 <div className="mb-2">
//                                     <span className="font-semibold">Type:</span>{' '}
//                                     {portfolio.type}
//                                 </div>
//                                 <div className="mb-2">
//                                     <span className="font-semibold">Target:</span> $
//                                     {portfolio.targetAmount.toLocaleString()}
//                                 </div>
//                                 <div className="mb-4 flex items-center">
//                                     <span className="font-semibold mr-1">Raised:</span> $
//                                     {portfolio.raisedAmount.toLocaleString()}
//                                     <span className="text-sm text-green-500 ml-2">
//                                         ({((portfolio.raisedAmount / portfolio.targetAmount) * 100).toFixed(1)}%)
//                                     </span>
//                                 </div>
//                                 {portfolio.expectedReturn && (
//                                     <div className="mb-2 flex items-center">
//                                         <PercentCircle className="w-4 h-4 mr-1 text-blue-500" />
//                                         <span className="font-semibold">Expected Return:</span>{' '}
//                                         {portfolio.expectedReturn}
//                                     </div>
//                                 )}

//                             </CardContent>
//                         </Card>
//                     )) : (
//                     <div className="col-span-full text-center py-4 min-h-screen flex items-center justify-center">
//                         <p className='text-red-400 text-3xl'>No investment portfolios found matching your criteria.</p>
//                     </div>
                    
//                     )}
//                 </div>

//             </div>
//             <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
//                 <DialogContent className="sm:max-w-[90vw] overflow-y-auto max-h-[80vh]">
//                     <DialogHeader>
//                         <DialogTitle className='text-yellow-300 hover:text-yellow-700'>Edit Investment Portfolio</DialogTitle>
//                         <DialogDescription className='text-yellow-700'>
//                             Make changes to the investment portfolio below. Click save when you&apos;re done.
//                         </DialogDescription>
//                     </DialogHeader>
//                     <div className="max-h-[100vh] overflow-x-hidden overflow-y-auto">
      
//                         {selectedPortfolio && (
//                             <InputInvestmentClient initialData={selectedPortfolio} />
//                         )}
//                     </div>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// };
// export default JobsClient;

