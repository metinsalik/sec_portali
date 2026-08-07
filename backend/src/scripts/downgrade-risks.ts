import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIRE_KEYWORDS = [
  'yangın', 'söndürme', 'sprinkler', 'itfaiye', 'duman', 'alarm', 
  'tahliye', 'hortum', 'pompa', 'fm200', 'çıkış', 'hidrant'
];

const IMPORTANT_RISK_KEYWORDS = [
  'elektrik', 'pano', 'yüksekte', 'kimyasal', 'makine', 'korkuluk', 
  'iskele', 'kaza', 'ramak', 'asansör', 'basınçlı', 'tehlikeli', 
  'periyodik', 'bakım', 'kazası'
];

async function main() {
  console.log('Starting risk downgrade process...');
  
  const highRiskDecisions = await prisma.ohsBoardDecision.findMany({
    where: {
      priority: 'Yüksek Risk'
    },
    include: {
      category: true
    }
  });

  console.log(`Found ${highRiskDecisions.length} decisions with "Yüksek Risk". Evaluating...`);

  let fireCount = 0;
  let importantCount = 0;
  let possibleCount = 0;

  for (const decision of highRiskDecisions) {
    const text = (decision.decisionText || '').toLowerCase();
    const categoryName = (decision.category?.name || '').toLowerCase();
    
    // Check Fire Keywords or Fire Category
    const isFire = categoryName.includes('yangın') || FIRE_KEYWORDS.some(kw => text.includes(kw));
    
    if (isFire) {
      fireCount++;
      continue; // Keep as Yüksek Risk
    }
    
    // Check Important Risk Keywords
    const isImportant = IMPORTANT_RISK_KEYWORDS.some(kw => text.includes(kw));
    
    if (isImportant) {
      await prisma.ohsBoardDecision.update({
        where: { id: decision.id },
        data: { priority: 'Önemli Risk' }
      });
      importantCount++;
    } else {
      // Default to Olası Risk
      await prisma.ohsBoardDecision.update({
        where: { id: decision.id },
        data: { priority: 'Olası Risk' }
      });
      possibleCount++;
    }
  }

  console.log('--- Migration Completed ---');
  console.log(`Kept as Yüksek Risk (Fire-related): ${fireCount}`);
  console.log(`Downgraded to Önemli Risk: ${importantCount}`);
  console.log(`Downgraded to Olası Risk: ${possibleCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
