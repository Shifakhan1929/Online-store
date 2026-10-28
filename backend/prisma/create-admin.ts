import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';
import { Role } from '../src/generated/prisma/enums.js';

dotenv.config();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Administrator';

  if (!email || !password) {
    console.error('Error: Administrator email and password must be provided.');
    console.log('\nUsage:');
    console.log('  npm run create-admin <email> <password> [name]');
    console.log('Or provide environment variables:');
    console.log('  ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="SecurePassword123!" npm run create-admin\n');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (password.length < 8) {
    console.error('Error: Administrator password must be at least 8 characters long.');
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      role: Role.ADMIN,
      name,
    },
    create: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(`Success: Administrator account ready for [${admin.email}] (ID: ${admin.id}, Role: ${admin.role})`);
}

createAdmin()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Failed to create administrator account:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });

