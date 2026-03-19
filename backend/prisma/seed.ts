import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@provedor.com.br' },
    create: {
      name: 'Administrador',
      email: 'admin@provedor.com.br',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      role: UserRole.ADMIN,
    },
    update: {},
  });

  console.log(`✅ Usuário admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());