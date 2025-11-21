

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


// import { PrismaClient } from '@prisma/client';
// import config from '../prisma/config'; // Import the new configuration

// // Global variable to hold the Prisma Client instance (for development hot-reloading)
// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

// // Create the Prisma client instance, passing the configuration adapter
// // This is the core change required by Prisma v7
// const prisma = global.prisma || new PrismaClient({ adapter: config });

// if (process.env.NODE_ENV !== 'production') {
//   global.prisma = prisma;
// }

// export default prisma;