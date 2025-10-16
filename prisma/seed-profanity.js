import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// لیست اولیه کلمات نامناسب (مدیر می‌تواند از پنل ادمین کلمات بیشتری اضافه کند)
const initialWords = [
  'احمق',
  'خر',
  'گاو',
  'کثیف',
  'مزخرف'
];

async function seedProfanity() {
  console.log('🌱 Starting profanity seed...');
  
  for (const word of initialWords) {
    try {
      await prisma.profanity.upsert({
        where: { word },
        update: {},
        create: { word }
      });
      console.log(`✅ Added/Updated: ${word}`);
    } catch (error) {
      console.error(`❌ Error adding ${word}:`, error.message);
    }
  }
  
  console.log('✅ Profanity seed completed!');
}

seedProfanity()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

