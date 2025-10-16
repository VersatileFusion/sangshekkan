import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// مشخصات ادمین اصلی - قابل تنظیم از طریق متغیرهای محیطی
const ADMIN_CONFIG = {
  phone: process.env.ADMIN_PHONE || '09900314740',
  password: process.env.ADMIN_PASSWORD || 'Admin@2024Strong',
  email: process.env.ADMIN_EMAIL || 'admin@khanom-sangshekan.ir',
  name: process.env.ADMIN_NAME || 'ادمین',
  role: 'ADMIN'
};

async function createAdminUser() {
  console.log('🌱 Starting admin user seed...\n');
  
  try {
    // بررسی وجود کاربر ادمین با این شماره موبایل
    const existingAdmin = await prisma.user.findFirst({
      where: {
        phone: ADMIN_CONFIG.phone,
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists. No action taken.');
      console.log(`   📞 Phone: ${ADMIN_CONFIG.phone}`);
      console.log(`   👤 Name: ${existingAdmin.name}`);
      console.log(`   🆔 ID: ${existingAdmin.id}`);
      return;
    }

    // هش کردن پسورد
    console.log('🔐 Hashing password...');
    const hashedPassword = await argon2.hash(ADMIN_CONFIG.password);

    // ایجاد کاربر ادمین جدید
    const admin = await prisma.user.create({
      data: {
        phone: ADMIN_CONFIG.phone,
        password: hashedPassword,
        name: ADMIN_CONFIG.name,
        role: ADMIN_CONFIG.role,
        isVerified: true,
        phoneVerifiedAt: new Date(),
        status: 'ACTIVE'
      }
    });

    console.log('\n🎉 Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   👤 Name: ${admin.name}`);
    console.log(`   📞 Phone: ${admin.phone}`);
    console.log(`   📧 Email: ${ADMIN_CONFIG.email || 'Not set'}`);
    console.log(`   🔑 Role: ${admin.role}`);
    console.log(`   🆔 ID: ${admin.id}`);
    console.log(`   ✅ Status: ${admin.status}`);
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log(`   Username: ${ADMIN_CONFIG.phone}`);
    console.log(`   Password: ${ADMIN_CONFIG.password}`);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error('   Message:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  🌱 Prisma Seed - Admin User Creation');
  console.log('═══════════════════════════════════════════════\n');
  
  await createAdminUser();
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ Seed completed successfully!');
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('\n💥 Fatal error during seeding:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

