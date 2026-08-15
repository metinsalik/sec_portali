import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const answers = await prisma.checklistAnswer.findMany({
    where: { scaleOptionId: null, earnedScore: 0 },
    include: { submission: { include: { template: true } } }
  });
  
  if (answers.length > 0) {
    const scaleSet = await prisma.checklistScaleSet.findFirst({
      where: { name: 'Standart Uygunluk Ölçeği (10, 5, -10)' },
      include: { options: true }
    });
    
    // Find G/D option
    const gdOption = scaleSet?.options.find(o => o.label === 'G/D');
    
    let updated = 0;
    for (const ans of answers) {
      if (gdOption) {
        // I should only update it if the excel actually had G/D. But wait, I don't know if it was G/D or just empty.
        // If it was empty, earnedScore is 0, but it really is unanswered.
        // Let's just leave it if it's 0. 
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
