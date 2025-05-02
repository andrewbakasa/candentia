'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSignal } from '@preact/signals-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAction } from '@/hooks/use-action';
import { investInPortfolio } from '@/actions/create-investment';
import { SafeInvestmentPortfolio2, SafeInvestor2, SafeInvestorInvestment, SafeInvestorInvestment2, SafeInvestorInvestment3 } from '@/types';
import { SafeInvestor, SafeUser } from '../types';
import { Gem, Heart, MapPin, PercentCircle, Users } from 'lucide-react';
import InvestmentForm from './_components/InvestmentForm';
import Search from '../components/Search';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface InvestmentDetails {
    amount: number | string;
    paymentMethod: string;
    ecocashNumber?: string;
    bankName?: string;
    accountNumber?: string;
    popImage?: File | null;
    depositorImage?: File | null;
    portfolioId?: string;
    email?: string;
    name?: string;
    country?: string;
}

interface InvestorClientProps {
    mockPortfolios: SafeInvestmentPortfolio2[];
    mockInvestors: SafeInvestor2[];  
   currentUser?: SafeUser | null;
}
const investTitleALL="Our Investors"
const investSubTitleALL="Meet the people who are making a difference."
const investTitleMe="My Investments"
const investSubTitleMe="This is my investments i have done so far"

const InvestorClients: React.FC<InvestorClientProps> = ({
    mockPortfolios,
    mockInvestors,
    currentUser, 
}) => {
    const [selectedPortfolio2, setSelectedPortfolio2] = useState<SafeInvestorInvestment3 | null>(null);
    const [selectedPortfolio, setSelectedPortfolio] = useState<SafeInvestmentPortfolio2 | null>(null);
    const [curr_selectedPortfolio, setCurr_selectedPortfolio] = useState<SafeInvestmentPortfolio2 | null>(null);
    
    const [investorsPageTitle, setInvestorsPageTitle] = useState<string>(investTitleALL);
    const [investorsPageSubTitle, setInvestorsPageSubTitle] = useState<string>(investSubTitleALL);
   
    const [processing_stage, setProcessing_stage] = useState<string>("");
    const [proceedNext, setProceedNext] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTermActiveInvestors, setSearchTermActiveInvestors] = useState("");
    const [filteredRecords, setFilteredRecords] = useState(mockPortfolios);
    const [filteredRecordsActiveInvestors, setFilteredRecordsActiveInvestors] = useState(mockInvestors);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('portfolios');
   

    const handleTabChange = (tabValue: React.SetStateAction<string>) => {
        setActiveTab(tabValue);
    };

    const [filterValue, setFilterValue] = useState('me');


    const [totalReturn, setTotalReturn] = useState(0);
    const [totalInvested, setTotalInvested] = useState(0);

    useEffect(() => {
        let calculatedTotalReturn = 0;
        let calculatedTotalInvested = 0;
        filteredRecordsActiveInvestors.forEach((investor) => {
          investor.investments.forEach((investment) => {
            const investedAmount = parseFloat(String(investment.amount));
            const expectedReturnRate = parseFloat(String(investment.portfolio?.expectedReturn)||'0');

            if (!isNaN(investedAmount)) {
                calculatedTotalInvested += investedAmount;
                if (!isNaN(investedAmount) && !isNaN(expectedReturnRate)) {
                    const returnAmount = investedAmount * (expectedReturnRate / 100);
                    calculatedTotalReturn += returnAmount;
                }
            } else {
              console.warn(
                "Skipping investment due to invalid amount or return rate:",
                investment
              );
            }
          });
        });
        setTotalReturn(calculatedTotalReturn);
        setTotalInvested(calculatedTotalInvested);
      }, [filteredRecordsActiveInvestors]);

    const handleFilterChange = (value: React.SetStateAction<string>) => {
      setFilterValue(value);
      //console.log('Selected filter:', value);
      // Here you would implement your logic to filter the investors
      // based on the selected value ('all' or 'me').
    };


    const handlePortfolioClick = (portfolio: SafeInvestorInvestment2, investor: SafeInvestor) => {
       
        setSelectedPortfolio2({
            ...portfolio,
            investor: investor,
          });
    };



    const handleClosePopup = () => {
        setSelectedPortfolio2(null);
    };

    useEffect(() => {
        let portfoliaList = mockPortfolios;
        if (searchTerm !== "") {
          let arrFirst = searchTerm.split(';');
          const arr = arrFirst.filter(element => element); // Using arrow function (ES6)
          const results = portfoliaList.filter((record) =>
            arr.some(
              (x) => {
                const searchTerms = x.split(',').map(s => s.trim().toLowerCase());
                return searchTerms.every(term =>
                  record.title.toLowerCase().includes(term) ||
                  record.description.toLowerCase().includes(term) ||
                  record.country.toLowerCase().includes(term) ||
                  record.type.toLowerCase().includes(term)// infuture to make a array: ["StartUP","Stock", etc]             
                );
              }
            )
          );
          setFilteredRecords(results);
        } else {
          setFilteredRecords(portfoliaList);
        }
    }, [mockPortfolios, searchTerm]);


    useEffect(() => {
        let tempList = mockInvestors;
        if (searchTermActiveInvestors !== "") {
            //filter only user 
            if (filterValue === 'me') {
                    tempList = tempList.filter((x) => x.email === currentUser?.email);
                    setInvestorsPageTitle(investTitleMe)
                    setInvestorsPageSubTitle(investSubTitleMe)
            }else{
                setInvestorsPageTitle(investTitleALL)
                setInvestorsPageSubTitle(investSubTitleALL)              
            }
            let arrFirst = searchTermActiveInvestors.split(';');
            const arr = arrFirst.filter(element => element); // Using arrow function (ES6)
            const results = tempList.filter((record) =>
                arr.some(
                (x) => {
                    const searchTermActiveInvestors = x.split(',').map(s => s.trim().toLowerCase());
                    return searchTermActiveInvestors.every(term =>
                    record.country.toLowerCase().includes(term) ||
                    record.email.toLowerCase().includes(term) ||
                    record.name.toLowerCase().includes(term)            
                    );
                }
                )
            );
            setFilteredRecordsActiveInvestors(results);
        } else {
            //filter only user 
            if (filterValue === 'me') {
                tempList = tempList.filter((x) => x.email === currentUser?.email);
                setInvestorsPageTitle(investTitleMe)
                setInvestorsPageSubTitle(investSubTitleMe)
            }else{
                setInvestorsPageTitle(investTitleALL)
                setInvestorsPageSubTitle(investSubTitleALL) 
            }
            setFilteredRecordsActiveInvestors(tempList);
        }
    }, [mockInvestors, searchTermActiveInvestors,filterValue]);
    
 
    const [investmentDetails, setInvestmentDetails] = useState<InvestmentDetails>({
        amount: '',
        paymentMethod: '',
        ecocashNumber: '',
        bankName: '',
        accountNumber: '',
        popImage: null,
        depositorImage: null,
        portfolioId: '',
        email:currentUser?.email||"",
        name: '',
        country: '',
    });

    useEffect(()=>{
       if (selectedPortfolio !==null){
        setCurr_selectedPortfolio (selectedPortfolio)
      } 
    },[selectedPortfolio])
   
   
     // --- Add Portfolio to Investor Action ---
     const {
        execute: executeInvestInPortfolio, isLoading: isAddPortfolioLoading,   fieldErrors: addPortfolioFieldErrors,
    } = useAction(investInPortfolio, {
        onSuccess: (data) => {
            toast.success(`Portfolio added to investor successfully!`);
            //console.log("Portfolio added to investor:", data);
        },
        onError: (error) => {
            toast.error(error);
        },
    });
   
    const handlePortfolioSelect = useCallback((portfolio: SafeInvestmentPortfolio2) => {
        setProceedNext(false)//show modal
        setSelectedPortfolio(portfolio);
        setInvestmentDetails((prev) => ({ ...prev, portfolioId: portfolio.id }));
    }, []);

   
    return (
        <div className="container mx-auto px-4 py-1">
            <h1 className="text-2xl font-bold text-center text-yellow-700 mb-2">
                Invest to support our mission together
            </h1>

            <Tabs 
                defaultValue="portfolios"  
                /*....................... These two are working super fine................................ */ 
                value={activeTab} // Bind the value to the activeTab state
                onValueChange={setActiveTab} // Directly use the setActiveTab function
                /*................................29 April Finally solved..................................  */
                className="w-full lg:max-w-[90%] sm:max-w-[95%] mx-auto"
            >
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-yellow-200">
                    <TabsTrigger value="portfolios">
                        <Gem className="w-4 h-4 mr-2" />
                        Portfolios
                    </TabsTrigger>
                    <TabsTrigger value="invest">
                        <Heart className="w-4 h-4 mr-2" />
                        Invest
                    </TabsTrigger>
                    <TabsTrigger value="investors">
                        <Users className="w-4 h-4 mr-2" />
                        {investorsPageTitle}  {/* 'Our Investors' HEADING*/}
                    </TabsTrigger>
                </TabsList>
                
                {/* 1................. */}
                <TabsContent value="portfolios" className="space-y-2 shadow-sm">
                        
                    <div className="flex flex-row gap-1 justify-end mx-auto">
                       
                        <Search 
                            setSearchTerm={setSearchTerm} 
                            searchTerm = {searchTerm}
                            debounce={1500}  //Custom debounce of 1500ms
                            placeholderText="filter records..."
                        />
                    </div> 

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRecords.length > 0 ?filteredRecords?.map((portfolio) => (
                           <Card
                           key={portfolio.id}
                           className={cn(
                             "transition-all duration-300",
                             "border-0 shadow-md",
                             "hover:shadow-lg hover:border-blue-500/30",
                             "cursor-pointer",
                             "group",
                             "bg-white/90 backdrop-blur-md",
                             "border border-white/10",
                             "flex flex-col h-full" // Make Card a flex container with full height
                           )}
                           onClick={() => handlePortfolioSelect(portfolio)}
                         >
                           <CardHeader>
                             <CardTitle className="flex items-center text-lg font-semibold">
                               {portfolio.title}
                             </CardTitle>
                             <CardDescription className="flex items-center text-gray-500">
                               <MapPin className="w-4 h-4 mr-1" />
                               {portfolio.country}
                             </CardDescription>
                           </CardHeader>
                           <CardContent className="flex-grow"> {/* Content will grow to take available space */}
                             <img
                               src={portfolio.imageUrl.split('|')[1]}
                               alt={portfolio.title}
                               className="w-full h-48 object-cover rounded-md mb-4"
                             />
                             <p className="text-gray-700 mb-2">
                               {portfolio.description}
                             </p>
                             <div className="mb-2">
                               <span className="font-semibold">Type:</span> {portfolio.type}
                             </div>
                             <div className="mb-2">
                               <span className="font-semibold">Target:</span> $
                               {portfolio.targetAmount.toLocaleString()}
                             </div>
                             <div className="mb-4 flex items-center">
                               <span className="font-semibold mr-1">Raised:</span> $
                               {portfolio.raisedAmount.toLocaleString()}
                               <span className="text-sm text-green-500 ml-2">
                                 ({((portfolio.raisedAmount / portfolio.targetAmount) * 100).toFixed(1)}%)
                               </span>
                             </div>
                             {portfolio.expectedReturn && (
                               <div className="mb-2 flex items-center">
                                 <PercentCircle className="w-4 h-4 mr-1 text-blue-500" />
                                 <span className="font-semibold">Expected Return:</span>{' '}
                                 {portfolio.expectedReturn}
                               </div>
                             )}
                           </CardContent>
                           <div className="border-t border-gray-200 pt-2"> {/* Separate container for the button */}
                             <Button
                               className={cn(
                                 "w-full",
                                 "bg-gradient-to-r from-yellow-200 to-yellow-400",
                                 "text-white",
                                 "hover:from-yellow-500 hover:to-yellow-700",
                                 "transition-all duration-300",
                                 "shadow-lg hover:shadow-xl",
                                 "border-0",
                                 "text-sm font-medium",
                                 "group-hover:scale-105"
                               )}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedPortfolio(portfolio);
                                 setProceedNext(false)//show modal
                               }}
                             >
                               Invest Now
                             </Button>
                           </div>
                         </Card>
                        )) : (
                            <div className="col-span-full text-center py-4 min-h-[80vh] flex items-center justify-center bg-yellow-100">
                                <p className='text-blue-400 text-3xl'>No investment portfolios found matching your criteria.</p>
                            </div>
                            
                        )}
                    </div>
                    {/* Selected Portfolio Details Modal */}
                    
                    {(selectedPortfolio && !proceedNext)  && (
                       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-md border border-white/10 shadow-2xl">    
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        {selectedPortfolio.title}
                                    </CardTitle>
                                    <CardDescription className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {selectedPortfolio.country}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={selectedPortfolio.imageUrl.split('|')[1]}
                                        alt={selectedPortfolio.title}
                                        className="w-full h-64 object-cover rounded-md mb-4"
                                    />
                                    <p className="text-gray-700 mb-4">
                                        {selectedPortfolio.description}
                                    </p>
                                    <div className="mb-2">
                                        <span className="font-semibold">Type:</span>{' '}
                                        {selectedPortfolio.type}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Target:</span> $
                                        {selectedPortfolio.targetAmount.toLocaleString()}
                                    </div>
                                    <div className="mb-4 flex items-center">
                                        <span className="font-semibold mr-1">Raised:</span> $
                                        {selectedPortfolio.raisedAmount.toLocaleString()}
                                        <span className="text-sm text-green-500 ml-2">
                                            ({((selectedPortfolio.raisedAmount /
                                                selectedPortfolio.targetAmount) *
                                                100).toFixed(1)}%)
                                        </span>
                                    </div>
                                    {selectedPortfolio.expectedReturn && (
                                        <div className="mb-2 flex items-center">
                                            <PercentCircle className="w-4 h-4 mr-1 text-blue-500" />
                                            <span className="font-semibold">Expected Return:</span>{' '}
                                            {selectedPortfolio.expectedReturn}
                                        </div>
                                    )}
                                   <div className="flex gap-2"> {/* Wrap buttons in a flex container */}
                                        <Button
                                            className="w-1/2 bg-green-500 hover:bg-green-600 text-white" // Adjusted width
                                            onClick={() => {
                                                handleTabChange('invest');
                                                setProceedNext(true);
                                            }}
                                        >
                                        Proceed to Invest
                                        </Button>
                                        <Button
                                            className="w-1/2 mt-0 bg-gray-400 hover:bg-gray-500 text-white" // Adjusted width and margin
                                            onClick={() => setSelectedPortfolio(null)} // Close the modal
                                        >
                                        Close
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
                
                {/* 2............ */}
                <TabsContent value="invest">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Make an Investment</CardTitle>
                            <CardDescription>
                                Support our mission by making an investment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InvestmentForm
                                currentUser={currentUser} // Pass the currentUser
                                curr_selectedPortfolio={curr_selectedPortfolio}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* 3................ */}
                <TabsContent value="investors">
                    <Card>
                        <CardHeader className="flex flex-col items-center justify-between">
                            <div>
                                <CardTitle className='text-2xl'>{investorsPageTitle}</CardTitle>
                                <CardDescription className='sm:text-xl text-sm'>
                                    {investorsPageSubTitle}  {/* Meet the people who are making a difference. */}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end sm:justify-between gap-1 md:w-full w-full"> {/* Adjusted flex classes */}
                                <div className="sm:flex-grow md:w-full w-full sm:mt-[-41px]">
                                <Search
                                    setSearchTerm={setSearchTermActiveInvestors}
                                    searchTerm={searchTermActiveInvestors}
                                    debounce={1500} //Custom debounce of 1500ms
                                    placeholderText="filter records..."
                                />
                                </div>
                                <div className="flex-shrink-0 self-end sm:self-auto"> {/* Added self-end for small screens */}
                                <ToggleGroup
                                    type="single"
                                    defaultValue="all"
                                    aria-label="Filter Investors"
                                    className="bg-gray-100 rounded-md p-1"
                                    value={filterValue} // Bind the value to our state
                                    onValueChange={handleFilterChange} // Update state on selection
                                >
                                    <ToggleGroupItem
                                    value="all"
                                    aria-label="All Investors"
                                    className="bg-white text-gray-700 rounded-md px-3 py-2 data-[state=on]:bg-yellow-500 data-[state=on]:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    >
                                    All
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                    value="me"
                                    aria-label="Current User"
                                    className="bg-white text-gray-700 rounded-md px-3 py-2 data-[state=on]:bg-yellow-500 data-[state=on]:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    >
                                    Me
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* First Row Showing returns..... */}
                            <div className="flex md:flex-row flex-col gap-4  p-4 rounded-md shadow-md">
                            <p className="font-semibold text-yellow-800">
                                Invested Amt: <span className="text-md text-gray-700">
                                {totalInvested ? `$${Number(totalInvested).toLocaleString()}` : 'N/A'}
                                </span>
                            </p>
                            <p className="font-semibold text-yellow-800">
                                Total Expected Return: <span className="text-md text-gray-700">
                                {totalReturn ? `$${Number(totalReturn).toLocaleString()}` : 'N/A'}
                                </span>
                            </p>
                            </div>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                                {filteredRecordsActiveInvestors.map((investor) => (
                                    <Card key={investor.id} className="border-[1px] shadow-md border-yellow-100">
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                {investor.email}
                                            </CardTitle>
                                            <CardDescription className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {investor.country}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700 mb-2">
                                                Portfolio:
                                            </p>
                                            <ul className="list-disc list-inside">
                                                {investor.investments.map((v) => {
                                                    let textColorClass = 'text-blue-600'; // Default color

                                                    const titleLower = v.portfolio.title.toLowerCase();

                                                    if (titleLower.includes('venture')) {
                                                        textColorClass = 'text-purple-600';
                                                    } else if (titleLower.includes('real') || titleLower.includes('estate')) {
                                                       textColorClass = 'text-green-600';
                                                    } else if (titleLower.includes('energy')) {
                                                       textColorClass = 'text-yellow-600';
                                                    } else if (titleLower.includes('health')) {
                                                      textColorClass = 'text-red-600';
                                                    } else if (titleLower.includes('finance')) {
                                                      textColorClass = 'text-indigo-600';
                                                   
                                                   } else if (titleLower.includes('start')) {
                                                     textColorClass = 'text-gray-600';
                                                  } else  {
                                                    textColorClass = 'text-green-600';
                                                  }
                                                    // Add more 'else if' conditions for other keywords

                                                    return (
                                                    <li
                                                        key={v.id}
                                                        className={`${textColorClass} hover:underline cursor-pointer`}
                                                        onClick={() => handlePortfolioClick(v, investor)}
                                                    >
                                                        {v.portfolio.title}
                                                    </li>
                                                    );
                                                })}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                ))}
                               {filteredRecordsActiveInvestors.length === 0 && (
                                <div className="flex justify-center items-center py-4 text-gray-600">
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6 mr-2"
                                    >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                    </svg>
                                    <p className="text-sm">No investors found matching your criteria.</p>
                                </div>
                                )}
                            </div>

                             {/* Popup View */}
                             {selectedPortfolio2 && (
                                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-50 p-6">
                                    <Card className="relative w-full md:w-4/5 lg:w-3/4 bg-white rounded-xl shadow-xl overflow-hidden">
                                    <CardHeader className="py-4 px-6 border-b border-gray-200 flex items-center justify-between">
                                        <CardTitle className="text-xl font-semibold text-yellow-700">
                                        {selectedPortfolio2?.portfolio?.title || 'Investment Details'}
                                        </CardTitle>
                                        <button
                                        onClick={handleClosePopup}
                                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                        </button>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Investor:</span>
                                            <span className="text-md">{selectedPortfolio2?.investor?.email || 'N/A'}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Country:</span>
                                            <span className="text-md">{selectedPortfolio2?.investor?.country || 'N/A'}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Reference:</span>
                                            <span className="text-md">{selectedPortfolio2?.id || 'N/A'}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Date:</span>
                                            <span className="text-md">
                                                {selectedPortfolio2?.createdAt
                                                    ? (() => {
                                                        const createdAtDate = new Date(selectedPortfolio2.createdAt);
                                                        const today = new Date();

                                                        const isSameDay =
                                                        createdAtDate.getFullYear() === today.getFullYear() &&
                                                        createdAtDate.getMonth() === today.getMonth() &&
                                                        createdAtDate.getDate() === today.getDate();

                                                        return isSameDay
                                                        ? createdAtDate.toLocaleTimeString(undefined, {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: 'numeric',
                                                            second: 'numeric',
                                                            })
                                                        : createdAtDate.toLocaleDateString(undefined, {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            });
                                                    })()
                                                    : 'N/A'}
                                            </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Portfolio:</span>
                                            <span className="text-md">{selectedPortfolio2?.portfolio?.title || 'N/A'}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-gray-700">
                                            <span className="font-semibold text-yellow-600">Target:</span>
                                            <span className="text-md">
                                                {selectedPortfolio2?.portfolio?.targetAmount
                                                ? `$${Number(selectedPortfolio2.portfolio.targetAmount).toLocaleString()}`
                                                : 'N/A'}
                                            </span>
                                            </p>
                                            <p className="flex items-center gap-2 text-green-700 font-semibold">
                                            <span className="text-yellow-600">Return:</span>
                                            <span className="text-md">
                                                {selectedPortfolio2?.portfolio?.expectedReturn
                                                ? `${selectedPortfolio2.portfolio.expectedReturn}%`
                                                : 'N/A'}
                                            </span>
                                            </p>
                                            <p className="flex items-center gap-2 text-blue-700 font-semibold">
                                            <span className="text-yellow-600">Invested:</span>
                                            <span className="text-md">
                                                {selectedPortfolio2?.amount ? `$${Number(selectedPortfolio2.amount).toLocaleString()}` : 'N/A'}
                                            </span>
                                            </p>
                                        </div>
                                        </div>
                                    </CardContent>
                                    </Card>
                                </div>
                             )}
  
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InvestorClients;
