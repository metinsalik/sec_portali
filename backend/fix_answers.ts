import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const answers = await prisma.checklistAnswer.findMany({
    where: { scaleOptionId: null, earnedScore: { not: 0 } },
    include: { submission: { include: { template: true } } }
  });
  console.log("Answers with null scaleOptionId but non-zero score:", answers.length);
  
  // Just update them
  if (answers.length > 0) {
    const scaleSet = await prisma.checklistScaleSet.findFirst({
      where: { name: 'Standart Uygunluk Ölçeği (10, 5, -10)' },
      include: { options: true }
    });
    let updated = 0;
    for (const ans of answers) {
      const option = scaleSet?.options.find(o => o.multiplier === ans.earnedScore);
      if (option) {
        await prisma.checklistAnswer.update({
          where: { id: ans.id },
          data: { scaleOptionId: option.id }
        });
        updated++;
      }
    }
    console.log("Updated", updated, "answers.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
