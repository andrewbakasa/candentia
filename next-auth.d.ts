// https://authjs.dev/getting-started/typescript#module-augmentation
import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

// declare module "next-auth" {
   

//     interface Session extends DefaultSession {
//         user: DefaultSession["user"] & {
//           id: string;
//           roles: string[],

//     }
//     interface User extends DefaultUser {
//         roles: string[],
//     }

//     interface Profile {
//         name?: string;
//         picture?: string;
//     }
// }



declare module "next-auth" {
    interface JWT extends DefaultJWT {
        id: string,
        roles: string[],
    }
    
    interface User extends DefaultUser {
        roles: string[]; // Add type definition for roles
    }
        
    interface Session extends DefaultSession {
        user: DefaultSession["user"] & User; // Reference the extended User interface
    }
    interface Profile {
                name?: string;
                picture?: string;
} 
}

  
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
      id: string;
      roles: string[]; // Add type definition for roles
    }
}
  
