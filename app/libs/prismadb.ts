// import { PrismaClient } from "@prisma/client"

// declare global {
//   var prisma: PrismaClient | undefined
// }

// let client = globalThis.prisma || new PrismaClient()
// if (process.env.NODE_ENV !== "production"){
//    globalThis.prisma = client
//   }else{
//   //new connection
//   globalThis.prisma= client
// }

// export default client

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma: PrismaClient | undefined;
}

const client = global.prisma || prismaClientSingleton();

export default client

 if (process.env.NODE_ENV !== 'production') {
     global.prisma = client;
}


// import { PrismaClient } from "@prisma/client";

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// let client: PrismaClient | undefined;

// if (process.env.NODE_ENV !== "production") {
//   client = globalThis.prisma || new PrismaClient();
//   globalThis.prisma = client;
// } else {
//   // Use a singleton pattern to ensure only one connection is created
//   if (!client) {
//     client = new PrismaClient();
//   }
// }

// export default client;


// import { PrismaClient } from '@prisma/client';


// declare global {
//    var prisma: PrismaClient | undefined
// }

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient({
//     log: ['error', 'warn'], // Adjust log level as needed
//   });
// } else {
//   prisma = globalThis.prisma || new PrismaClient();
//   if (!globalThis.prisma) globalThis.prisma = prisma;
// }

// export default prisma;