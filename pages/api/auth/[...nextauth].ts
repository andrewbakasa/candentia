import bcrypt from "bcrypt"
import NextAuth, { AuthOptions,
  //CallbacksOptions,
  // CreateUserCallback 
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/app/libs/prismadb"


 
export const authOptions: AuthOptions = {
  
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'email', type: 'text' },
        password: { label: 'password', type: 'password' },
        roles:{},
        id: {}

      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.hashedPassword) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return user;
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,

  
  // callbacks: {
  //   // { user?: User | AdapterUser; token: JWT & {id:string , role:string} }
  //           //async jwt({ token, user }:{user?: nextUser | AdapterUser; token: JWT & {id:String, role:String}} ){
  //           // async jwt({ token, user }){
    
  //           //     if (token && user) {
  //           //         try {
  //           //           let dbUser
  //           //           if (user?.email){
  //           //              dbUser = await prisma.user.findUnique({
  //           //               where: {
  //           //                 email: user?.email 
  //           //               }
  //           //             });
  //           //           }else {
  //           //             token.roles = ''
  //           //             return token
  //           //           }
    
  //           //             if (user) {
  //           //                 token.roles = dbUser?.roles
  //           //                 token.id = dbUser?.id.toString()||"";
  //           //             }
    
  //           //             return token
  //           //         } catch (error) {
  //           //             console.log('ERROR :: ', (error as Error).message);
  //           //             return false;
  //           //         }
  //           //     }
    
  //           //     return null
  //           // },
    
  //           // If you want to use role in client components
  //           // async session({ session, token }) {
    
  //           //     if (session?.user) {
                   
  //           //         let dbUser
  //           //         if (session?.user.email){
  //           //            dbUser = await prisma.user.findUnique({
  //           //             where: {
  //           //               email: session.user.email 
  //           //             }
  //           //           });
  //           //         }
                    
    
  //           //         // do not allow user in if they are not in the db
  //           //         if (!dbUser) return redirect('api/auth/signin');
    
  //           //         session.user.id = dbUser.id.toString()//token.id;
  //           //         session.user.role = dbUser.roles || []//token.role;
  //           //     }
    
  //           //     return session;
  //           // },
    
           
    
  //       }
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`

      return baseUrl
      // Allows callback URLs on the same origin
     /*  else if (new URL(url).origin === baseUrl) return url
      re turn baseUrl*/
    },
       
    jwt: async ({ token, user }) => {
      // First time JWT callback is run, user object is available
      // if (user && user.id && user.roles) {
      //   token.id = user.id;
      //   token.roles = user.roles;
      //   token.email = user.email;
      
      // }
      // return token;
      if (user) {
        if (user.id && user.roles) {
          token.id = user.id;
          token.roles = user.roles;
          token.email = user.email;
        } else if (user.email) {
          // Fetch user from database based on email (assuming roles exist there)
          const dbUser = await prisma.user.findUnique({
            where: {
              email: user.email,
            },
          });
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.roles = dbUser.roles || ['visitor'];
            token.email = user.email;
          }
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && token.id && token.role) {
        session.user.id = token.id;
        session.user.roles = token.roles;
      }
      return session;
    },

    
  },
  // async createUser({ user, account, profile }) { // createUser should be here, NOT inside callbacks
  //   if (account?.provider === 'google') {
  //     return {
  //       ...user,
  //       cardReadMode: false,
  //       showMobileView: false,
  //       collapseBoards: false,
  //     };
  //   }
  //   return user;
  //},
}

export default NextAuth(authOptions);