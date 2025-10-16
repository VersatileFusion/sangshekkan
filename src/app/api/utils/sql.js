// Deprecated: SQL utility replaced by Prisma; keep a noop to avoid SSR crashes
const sql = async () => {
  throw new Error('SQL utility is deprecated. Use Prisma via utils/prisma.ts');
};
export default sql;