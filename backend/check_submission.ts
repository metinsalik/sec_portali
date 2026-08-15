import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const template = await prisma.checklistTemplate.findFirst({
    where: { title: 'Yangın Denetimleri - Haziran 2026' },
    include: { scaleSet: { include: { options: true } } }
  });
  
  if (!template) {
    console.log("Template not found");
    return;
  }
  
  console.log("Template ScaleSet ID:", template.scaleSetId);
  console.log("ScaleSet Options:", template.scaleSet?.options);

  const sub = await prisma.checklistSubmission.findFirst({
    where: { templateId: template.id },
    include: { answers: true }
  });
  
  if (sub) {
    console.log("Answers:", sub.answers.slice(0, 3));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
