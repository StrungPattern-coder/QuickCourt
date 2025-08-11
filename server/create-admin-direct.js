const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@quickcourt.com';
    const adminPassword = 'admin123456';
    
    console.log('🔨 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('Admin ID:', existingAdmin.id);
      return existingAdmin;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user directly
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'QuickCourt Admin',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 ID:', admin.id);
    
    return admin;
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin().catch(console.error);
