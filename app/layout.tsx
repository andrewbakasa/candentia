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
import NavBar from './components/navbar/NavBar2';
import getJobOpenings from './actions/getJobOpenings';
//import { saveInitialJobs } from './vacancy/[jobId]/_components/initialDB';
export const metadata = {
  title: 'Candentia: Illuminating Engineering Solutions',
  description: 'Intergrated Design, Engineering Assembly, Manufacture, Maintenance Modelling,Operations',
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
