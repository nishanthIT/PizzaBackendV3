import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');

    // Just check if admin exists - the server handles password hashing
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'ananth' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
    } else {
      console.log('❌ Admin user not found. Please create through server registration.');
    }

    console.log('   Username: ananth');
    console.log('   Password: 7877866920@addis&12345');

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
