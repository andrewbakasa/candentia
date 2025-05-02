'use client';
import Link from 'next/link';
// import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
//import { useEffect, useState } from 'react';
import getCurrentUser from '../actions/getCurrentUser';

const denied = () => {

 
  //const [data, setData] = useState(null);

  //useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     const currentUser = await getCurrentUser();
    //     if (currentUser) {
    //       redirect(`/myprojects`);
    //     }
    //   //  setData(data);
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //   }
    // };

    // fetchData();
 // }, []);
  
 
  return (
    <div className="
    h-[60vh]
    flex 
    flex-col 
    gap-2 
    justify-center 
    items-center 
  ">
      <h1>Access Denied</h1>
      <Link href="/" className="text-3xl">
        Return to Home Page
      </Link>
    </div>
  );
};

export default denied;
