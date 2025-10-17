// Temporary stub file for MongoDB migration
// This file provides a placeholder for Prisma imports during the migration process
// TODO: Remove this file once all Prisma references are converted to MongoDB

console.warn('⚠️ Using Prisma stub - MongoDB migration in progress');

// Export a mock Prisma client that throws helpful errors
export const prisma = {
  user: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findUnique: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  otpCode: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    deleteMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  message: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  content: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  video: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  challenge: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  report: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  profanity: {
    findFirst: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    findMany: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    create: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    update: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
    delete: () => Promise.reject(new Error('Prisma migration: Use MongoDB instead')),
  },
  // Add other collections as needed
};

export default prisma;
