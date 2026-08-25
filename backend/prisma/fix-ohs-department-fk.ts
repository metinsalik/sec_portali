import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning invalid OhsBoardDecision.departmentId values...');
  // Get all existing department IDs
  const existing = await prisma.ohsBoardDepartment.findMany({ select: { id: true } });
  const validIds = new Set(existing.map(d => d.id));

  // Find decisions with a departmentId that does not exist
  const badDecisions = await prisma.ohsBoardDecision.findMany({
    where: { departmentId: { not: null } },
    select: { id: true, departmentId: true },
  });

  let updated = 0;
  for (const d of badDecisions) {
    if (!validIds.has(d.departmentId!)) {
      await prisma.ohsBoardDecision.update({
        where: { id: d.id },
        data: { departmentId: null },
      });
      console.log(`- Nullified departmentId for decision ${d.id}`);
      updated++;
    }
  }
  console.log(`Finished cleaning. ${updated} records updated.`);
}

main()
  .catch(e => {
    console.error('Error during cleaning:', e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
