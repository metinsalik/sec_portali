import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    const meetings = await prisma.ohsBoardMeeting.findMany({
      include: {
        facility: { select: { name: true } },
        decisions: {
          include: {
            category: { select: { id: true, name: true, color: true } },
            department: { select: { id: true, name: true } },
            actions: { select: { id: true, actionText: true } }
          }
        }
      },
      orderBy: { meetingDate: 'desc' }
    });
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
test();
