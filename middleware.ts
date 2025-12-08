
// import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(request: NextRequestWithAuth) {
//     const pathname = request.nextUrl.pathname;
    
//     // 1. EXTRACT DATA FROM TOKEN
//     // The token is automatically attached to the request by next-auth/middleware
//     const token = request.nextauth.token;
//     const userOrgId = token?.orgId; // Ensure your NextAuth session/JWT includes orgId
//     const userRoles = (token?.roles as string[]) || [];

//     // 2. DYNAMIC ORG FOLDER VALIDATION
//     // Assumes URL structure is /[orgId]/...
//     const orgIdInUrl = pathname.split('/')[1];
    
//     // Logic: If user tries to access an org folder they don't belong to
//     if (userOrgId && orgIdInUrl && userOrgId !== orgIdInUrl) {
//       return NextResponse.rewrite(new URL('/unauthorized', request.url));
//     }

//     // 3. ADMIN-ONLY ROUTES CHECK
//     const adminOnlyRoutes = [
//       '/achived-projects', // Fixed typo from 'archived-projects' if used in URL
//       '/input-investments',
//       '/edit-investments'
//     ];

//     const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));

//     if (isAdminRoute && !userRoles.includes("Admin")) {
//       return NextResponse.rewrite(new URL("/denied", request.url));
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       // Basic authorization: user must be logged in (token exists)
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     "/((?!api|_next/static|_next/image|favicon.ico).*)",
//   ],
// };
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
    "/contents",
    "/mycontents",
    "/users",
    //"/financing",
    //"/contact",
    // "/edit-investments",
    
  ]
};
