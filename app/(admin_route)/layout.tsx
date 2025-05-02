import React, { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import getCurrentUser from '../actions/getCurrentUser';

interface Props {
  children: ReactNode;
}
export default async function AdminLayout({ children }: Props) {
  const session = await getServerSession(authOptions);

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }

  const user = session?.user as { role: string } | undefined;
  const isAdmin = currentUser?.roles?.some(role => role?.toLowerCase().trim() === 'admin');
  
  // return the user to sign in page if user not found in session
  if (!currentUser) redirect('api/auth/signin');

  if (!isAdmin) {
    return (
    <div className="flex justify-center items-center ">
      <h1 className="text-5xl text-red-500 font-bold">Access Denied</h1>
    </div>
    );
 }

 

  return <>{children}</>;
}
