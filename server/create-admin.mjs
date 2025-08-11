import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Change these if you want custom creds
const email = 'admin@quickcourt.local';
const fullName = 'QuickCourt Admin';
const password = 'Admin@12345!';

async function main() {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      console.log('Admin user updated:', { id: updated.id, email: updated.email, role: updated.role });
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      console.log('Admin user created:', { id: created.id, email: created.email, role: created.role });
    }

    console.log('\nLogin credentials:');
    console.log('Email   :', email);
    console.log('Password:', password);
  } catch (e) {
    console.error('Failed to create admin:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
