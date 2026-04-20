import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.assignment.count();
  const pros = await prisma.professional.count();
  const facs = await prisma.facility.count();
  console.log(`Tesisler: ${facs}`);
  console.log(`Profesyoneller: ${pros}`);
  console.log(`Atamalar: ${count}`);
}

main().finally(() => prisma.$disconnect());
