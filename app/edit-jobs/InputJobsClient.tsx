/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Import react-paginate
import ReactPaginate from "react-paginate";

// If you need the SafeUser type for currentUser, you'll need to define it or import it
// from your types file, similar to how it's done in JobsClient.
// For now, let's assume CareerFormProps is still just mockCareers.
// interface SafeUser {
//   id: string;
//   email: string;
//   pageSize: number;
//   roles: string[];
//   // ... other properties of SafeUser
// }

// Define the type for our form data
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
    mockCareers: Career[];
    // currentUser?: SafeUser | null; // Uncomment if you want to pass currentUser here
}

const CareerClient: React.FC<CareerFormProps> = ({ mockCareers /*, currentUser*/ }) => {
    const [selectedCareer, setSelectedCareer] = useState<CareerFormValues | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination states from JobsClient
    const [pageSize, setPageSize] = useState<number>(8); // Default to 8, adjust as needed. If you pass currentUser, you can use: currentUser ? currentUser.pageSize : 8
    const [pageCount, setPageCount] = useState(0); // Will be calculated in useEffect
    const [itemOffset, setItemOffset] = useState(0);

    const [fList, setFList] = useState(mockCareers); // This will hold the filtered (but not yet paginated) list
    const [fListPage, setFListPage] = useState<Career[]>([]); // This will hold the records for the current page

    const router = useRouter();

    // Combined filtering and search logic using useMemo
    const filteredAndSearchedRecords = useMemo(() => {
        let careerList = mockCareers;

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
            return results;
        }
        return careerList;
    }, [mockCareers, searchTerm]);

    // Update fList whenever filteredAndSearchedRecords changes
    useEffect(() => {
        setFList(filteredAndSearchedRecords);
        setItemOffset(0); // Reset pagination to the first page when filters change
    }, [filteredAndSearchedRecords]);


    // Effect to calculate and update fListPage based on itemOffset and pageSize
    useEffect(() => {
        const calculatePageSlice = (list: Career[], offset: number, size: number): Career[] => {
            const end = Math.min(offset + size, list.length);
            return list.slice(offset, end);
        };
        setFListPage(calculatePageSlice(fList, itemOffset, pageSize));
    }, [itemOffset, fList, pageSize]);

    // Effect to update pageCount when fList or pageSize changes
    useEffect(() => {
        if (fList && pageSize) {
            const newPageCount = Math.ceil(fList.length / pageSize);
            if (pageCount !== newPageCount) {
                setPageCount(newPageCount);
            }
        }
    }, [fList, pageSize, pageCount]);

    // Effect to reset itemOffset when pageCount changes (e.g., if total items decrease)
    useEffect(() => {
        setItemOffset(0);
    }, [pageCount]);


    const handleCareerSelect = useCallback((career: Career) => {
        const initialData: CareerFormValues = {
            id: career.id,
            title: career?.title || "",
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

    /* ----------------Pagination logic copied from JobsClient------------ */
    type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60';

    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        // If you were passing currentUser and wanted to update user's pageSize in DB:
        // if (currentUser) {
        //   execute({ id: currentUser.id, pageSize: numericPageSize });
        // }
        setItemOffset(0); // Reset to the first page when page size changes
    };

    const handlePageClick = (event: { selected: number }) => {
        const newOffset = (event.selected * pageSize) % fList.length;
        setItemOffset(newOffset);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        buttons.push(
            <ReactPaginate
                breakLabel="..."
                containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2"
                activeClassName="active bg-orange-300 text-white"
                previousLabel="«"
                nextLabel="»"
                key={'career-pagination'}
                onPageChange={handlePageClick}
                pageRangeDisplayed={5}
                pageCount={pageCount || 0} // Use calculated pageCount
                forcePage={Math.floor(itemOffset / pageSize)} // Control the current page
                renderOnZeroPageCount={null}
            />
        );
        buttons.push(
            <select
                className='border-gray-300 rounded border text-rose-500'
                value={pageSize}
                key={'career-page-size-select'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            >
                <option value="1" >1 per Page</option>
                <option value="2">2 per Page</option>
                <option value="3">3 per Page</option>
                <option value="4">4 per Page</option>
                <option value="8">8 per Page</option>
                <option value="16">16 per Page</option>
                <option value="24">24 per Page</option>
                <option value="32">32 per Page</option>
                <option value="48">48 per Page</option>
                <option value="60">60 per Page</option>
            </select>
        );
        return <div className="flex justify-center gap-3">{buttons}</div>;
    };
    /* ----------------End Pagination logic------------ */


    return (
        <>
            <div className="flex-col justify-between sm:px-1 xs:px-2 mb-2.5 ">
                <div className='flex flex-col justify-between py-1 sm:flex-row gap-1 md:gap-5 lg:max-w-[90%] sm:max-w-[95%] mx-auto'>
                    <div
                        role="button"
                        onClick={() => { router.push('/input-jobs') }}
                        className="sm:w-[200px] w-full mt-1 md:mt-10 aspect-video relative h-[38px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                        <p className="text-sm">Create new Career</p>
                    </div>
                    <div className="">
                        <Search
                            setSearchTerm={setSearchTerm}
                            searchTerm={searchTerm}
                            debounce={1500}
                            placeholderText="filter records..."
                        />
                    </div>
                </div>

                <div className="my-2 mb-2 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-green-100 lg:max-w-[90%] sm:max-w-[95%] mx-auto">
                    {fListPage?.length > 0 ? fListPage?.map((career) => (
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
                            onClick={() => handleCareerSelect(career)}
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
                            <p className='text-red-400 text-3xl'>No career postings found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {fList && fList.length > 0 && (
                    <div className="mt-4 max-w-9 flex flex-wrap gap-1">
                        {renderPaginationButtons()}
                    </div>
                )}
                {!fList && <p>Loading data...</p>}

            </div>
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[90vw] overflow-y-auto max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className='text-yellow-300 hover:text-yellow-700'>Edit Career Posting</DialogTitle>
                        <DialogDescription className='text-yellow-700'>
                            Make changes to the career posting below. Click save when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[100vh] overflow-x-hidden overflow-y-auto">

                        {selectedCareer && (
                            <CareerForm initialData={selectedCareer} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CareerClient;