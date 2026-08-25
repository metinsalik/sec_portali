import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning invalid departmentId values for OhsBoardDecision and OhsBoardMember...');
  // Get all existing department IDs
  const existing = await prisma.ohsBoardDepartment.findMany({ select: { id: true } });
  const validIds = new Set(existing.map(d => d.id));

  // Find decisions with a departmentId that does not exist
  const badDecisions = await prisma.ohsBoardDecision.findMany({
    where: { departmentId: { not: null } },
    select: { id: true, departmentId: true },
  });

  let updatedDecisions = 0;
  for (const d of badDecisions) {
    if (!validIds.has(d.departmentId!)) {
      await prisma.ohsBoardDecision.update({
        where: { id: d.id },
        data: { departmentId: null },
      });
      console.log(`- Nullified departmentId for decision ${d.id}`);
      updatedDecisions++;
    }
  }
  console.log(`Finished cleaning OhsBoardDecision. ${updatedDecisions} records updated.`);

  const badMembers = await prisma.ohsBoardMember.findMany({
    where: { departmentId: { not: null } },
    select: { id: true, departmentId: true },
  });

  let updatedMembers = 0;
  for (const m of badMembers) {
    if (!validIds.has(m.departmentId!)) {
      await prisma.ohsBoardMember.update({
        where: { id: m.id },
        data: { departmentId: null },
      });
      console.log(`- Nullified departmentId for member ${m.id}`);
      updatedMembers++;
    }
  }
  console.log(`Finished cleaning OhsBoardMember. ${updatedMembers} records updated.`);
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
