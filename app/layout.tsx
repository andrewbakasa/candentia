import { Nunito } from 'next/font/google'
import LoginModal from './components/modals/LoginModal';
import RegisterModal from './components/modals/RegisterModal';
import ToasterProvider from './providers/ToasterProvider';
import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";

import './globals.css'
import ClientOnly from './components/ClientOnly';
import getCurrentUser from './actions/getCurrentUser';
import { Toaster } from "sonner";
import { cn } from '@/lib/utils';
import Hero from './components/Hero';
//import NavBar from './components/navbar/NavBar2';
import getJobOpenings from './actions/getJobOpenings';
import NavBar from './components/navbar/Navigation/NavBar';
//import { saveInitialJobs } from './vacancy/[jobId]/_components/initialDB';
export const metadata = {
  title: 'Horizon21: Illuminating Solutions',
  description: 'Building the Future today, together',
   icons: {
    icon: '/horizon.png', // This refers to app/icon.png
    shortcut: '/shortcut-icon.png', // If you have a different shortcut icon
    apple: '/horizon.png', // This refers to app/apple-icon.png
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/horizon.png',
      },
      {
        rel: 'mask-icon',
        url: '/horizon.png',
        color: '#000000',
      },
    ],
  },

}

const font = Nunito({ 
  subsets: ['latin'], 
});

export const dynamic = 'force-dynamic';
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  //saveInitialJobs();
  const currentUser = await getCurrentUser();
  const jobOpenings =await getJobOpenings();
  //console.log(`jobOpenings :${jobOpenings}`)
   let paddingState='pt-28';
  return (
    <html lang="en">
      <body className={font.className}>
        <ClientOnly>
            
          <QueryProvider>
              <ToasterProvider />
              <Toaster />
              <LoginModal />
             <RegisterModal />
              <ModalProvider />
             
              
              <NavBar currentUser={currentUser} />
              <div className={cn("pb-5 h-full",paddingState)}>
                  {children}
              </div>
          </QueryProvider>   
        </ClientOnly>
       
      </body>
    </html>
  )
}
