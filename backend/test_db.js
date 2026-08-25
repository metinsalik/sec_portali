const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const decisions = await prisma.ohsBoardDecision.findMany({
    take: 10,
    select: { id: true, status: true, decisionNumber: true, decisionText: true }
  });
  console.log("Decisions:", decisions);
  const meetings = await prisma.ohsBoardMeeting.findMany({
    take: 10,
    select: { id: true, status: true, meetingNo: true }
  });
  console.log("Meetings:", meetings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
