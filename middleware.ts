
/**
 * Without defined matcher, this one line applies next-auth to the entire project
 */
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server';

export default withAuth(

    // `withAuth` augments your `Request` with the user's token.
    function middleware(request: NextRequestWithAuth) {

        if (request.nextUrl.pathname.startsWith('/achived-projects')
            && !request.nextauth.token?.roles?.includes("Admin") ) {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

        if (request.nextUrl.pathname.startsWith('/input-investments')
           && !request.nextauth.token?.roles?.includes("Admin") ) {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }
        if (request.nextUrl.pathname.startsWith('/input-investments')
           && !request.nextauth.token?.roles?.includes("Admin") ) {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

        if (request.nextUrl.pathname.startsWith('/input-investments')
        && !request.nextauth.token?.roles?.includes("Admin") ) {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

        if (request.nextUrl.pathname.startsWith('/edit-investments')
        && !request.nextauth.token?.roles?.includes("Admin") ) {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
)


export const config = { 
  matcher: [
    "/archived-projects",
    "/projects",
    "/myprojects",
    "/users",
    //"/financing",
    //"/contact",
    // "/edit-investments",
    
  ]
};
