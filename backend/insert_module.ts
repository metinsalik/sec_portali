import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.module.create({
    data: {
      code: 'FIRE_DOORS',
      name: 'Yangın Kapıları',
      description: 'Yangın kapıları denetimi ve özellikleri',
      icon: 'DoorClosed'
    }
  });
  console.log('Module inserted.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
