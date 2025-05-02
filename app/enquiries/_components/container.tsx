"use client";
import Head from "next/head";
import Link from "next/link";
import { CalendarIcon, EnvelopeIcon, PhoneIcon, TagIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { Enquiry } from "@prisma/client";

interface EnquiriesContainerProps {
  record: Enquiry | null;
  id: string;
}

export const EnquiriesContainer = ({
  record,
  id,
}: EnquiriesContainerProps) => {

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-md shadow-md p-6">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-3" />
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Enquiry Not Found</h1>
        <p className="text-gray-600 mb-4">The enquiry you are looking for could not be found.</p>
        <Link href="/enquiries" className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Enquiries
        </Link>
      </div>
    );
  }

  const categories: string[] = record.category?.map((cat: string) => cat.trim()) || []

  return (
    <div className="bg-white rounded-md shadow-md p-6 mb-4 border border-gray-200"> {/* Added margin-bottom and border */}
      <Head>
        <title>{record.first_name} {record.last_name} | Enquiry Details</title>
        <meta name="description" content={`Details for enquiry from ${record.email}`} />
      </Head>

      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{record.first_name} {record.last_name}</h1>
        <p className="text-gray-500 text-sm">
          Received on {format(new Date(record.createdAt), "dd MMMM 'at' HH:mm", { locale: enGB })}
          {record.createdAt !== record.updatedAt && (
            <span className="italic ml-2">(Last updated on {format(new Date(record.updatedAt), "dd MMMM 'at' HH:mm", { locale: enGB })})</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center text-gray-700 mb-2">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
            <span className="font-semibold">Email:</span> {record.email}
          </div>
          <div className="flex items-center text-gray-700 mb-2">
            <PhoneIcon className="h-5 w-5 mr-2 text-green-500" />
            <span className="font-semibold">Contact:</span> {record.phone_number || 'N/A'}
          </div>
        </div>
        <div>
        <div className="flex flex-col items-start text-gray-700 mb-2">
            <div className="flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-indigo-500" />
                <span className="font-semibold">Category:</span>
            </div>
            
            {categories.length > 0 ? (
                <ul className="list-disc list-inside ml-7"> {/* Increased left margin */}
                    {categories.map((category, index) => (
                        <li key={index}>{category}</li>
                    ))}
                </ul>
            ) : (
                <span className="ml-7">N/A</span> 
            )}
        </div>
          
          
        </div>
      </div>

      {record.message && (
          <>
              <p className="text-sm font-semibold text-gray-900 mb-2">Enquiry Message</p>
              <div className="mb-1 rounded-md border border-gray-300 p-4 max-h-48 overflow-y-auto">
                  <div className="prose prose-sm w-full h-full bg-gray-100" dangerouslySetInnerHTML={{ __html: record.message }} />
              </div>
          </>
      )}


      {!record.message && (
        <div className="mb-6">
          <p className="text-gray-600 italic">No message provided.</p>
        </div>
      )}
    </div>
  );
};
// "use client";
// import Head from "next/head";
// import Link from "next/link";
// import { CalendarIcon, EnvelopeIcon, PhoneIcon, TagIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
// import { format } from "date-fns";
// import { enGB } from "date-fns/locale";
// import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode, Key } from "react";
// import { Enquiry } from "@prisma/client";

// interface EnquiriesContainerProps {
//   record: Enquiry ;
//   id: string;
// }

// export const EnquiriesContainer = ({
//   record,
//   id,
// }: EnquiriesContainerProps) => {

//   if (!record) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-md shadow-md p-6">
//         <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-3" />
//         <h1 className="text-xl font-semibold text-gray-800 mb-2">Enquiry Not Found</h1>
//         <p className="text-gray-600 mb-4">The enquiry you are looking for could not be found.</p>
//         <Link href="/enquiries" className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -ml-1" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
//           </svg>
//           Back to Enquiries
//         </Link>
//       </div>
//     );
//   }

//   const categories: string[] = record.category?.map((cat: string) => cat.trim()) || []

//   return (
//     <div className="bg-white rounded-md shadow-md p-6">
//       <Head>
//         <title>{record?.first_name} {record?.last_name} | Enquiry Details</title>
//         <meta name="description" content={`Details for enquiry from ${record?.email}`} />
//       </Head>

//       <div className="mb-6 border-b pb-4">
//         <h1 className="text-2xl font-bold text-gray-900">{record.first_name} {record.last_name}</h1>
//         <p className="text-gray-500 text-sm">
//           Received on {format(new Date(record?.createdAt), "dd MMMM 'at' HH:mm", { locale: enGB })}
//           {record.createdAt !== record.updatedAt && (
//             <span className="italic ml-2">(Last updated on {format(new Date(record?.updatedAt), "dd MMMM 'at' HH:mm", { locale: enGB })})</span>
//           )}
//         </p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <div>
//           <div className="flex items-center text-gray-700 mb-2">
//             <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
//             <span className="font-semibold">Email:</span> {record.email}
//           </div>
//           <div className="flex items-center text-gray-700 mb-2">
//             <PhoneIcon className="h-5 w-5 mr-2 text-green-500" />
//             <span className="font-semibold">Contact:</span> {record.phone_number || 'N/A'}
//           </div>
//         </div>
//         <div>
//           <div className="flex items-center text-gray-700 mb-2">
//             <TagIcon className="h-5 w-5 mr-2 text-indigo-500" />
//             <span className="font-semibold">Category:</span>
//             {categories.length > 0 ? (
//               <ul className="list-disc list-inside ml-2">
//                 {categories.map((category: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined, index: Key | null | undefined) => (
//                   <li key={index}>{category}</li>
//                 ))}
//               </ul>
//             ) : (
//               'N/A'
//             )}
//           </div>
//           {/* You can add more relevant information here */}
//         </div>
//       </div>

//       {record.message && (
//         <div className="mb-6 border-b pb-4">
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Enquiry Message</h2>
//           <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: record.message }} />
//         </div>
//       )}

//       {!record.message && (
//         <div className="mb-6">
//           <p className="text-gray-600 italic">No message provided.</p>
//         </div>
//       )}

     
//     </div>
//   );
// };