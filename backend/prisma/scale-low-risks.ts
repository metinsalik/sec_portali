import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function scoreToLevel(score: number): string {
  if (score > 400) return 'Tolere Gösterilmez Risk';
  if (score > 200) return 'Yüksek Risk';
  if (score > 70)  return 'Önemli Risk';
  if (score > 20)  return 'Olası Risk';
  return 'Önemsiz Risk';
}

async function scaleLowRisks() {
  console.log('[MIGRATION] Scaling existing low risks (<= 20) into Olası Risk / Önemli Risk bands...');

  // Find all risks that currently have initialLevel 'Önemsiz Risk' or initialScore <= 20
  const lowRisks = await prisma.riskLifecycle.findMany({
    where: {
      OR: [
        { initialLevel: 'Önemsiz Risk' },
        { initialScore: { lte: 20 } }
      ]
    }
  });

  if (lowRisks.length === 0) {
    console.log('[MIGRATION] No low risks found. Skipping.');
    return;
  }

  console.log(`[MIGRATION] Found ${lowRisks.length} low risk record(s) to scale.`);

  let updatedCount = 0;

  for (const risk of lowRisks) {
    let newProb = risk.initialProb;
    let newFreq = risk.initialFreq || 3;
    let newSev = risk.initialSev || 7;

    // Scaling logic based on severity
    if (newSev >= 15) {
      // Önemli Risk (71 - 200 bandı)
      if (newSev >= 40) {
        newProb = 1; // 1 - Beklenmedik Fakat Mümkün
        newFreq = 2; // 2 - Sık Değil
        // 1 * 2 * 40 = 80 (Önemli Risk)
      } else {
        // newSev === 15 (Biyolojik riskler, ağır hasar)
        newProb = 3; // 3 - Olası
        newFreq = 2; // 2 - Sık Değil
        // 3 * 2 * 15 = 90 (Önemli Risk)
      }
    } else {
      // Olası Risk (21 - 70 bandı)
      if (newSev <= 1) {
        newSev = 7;
        newProb = 3;
        newFreq = 2;
        // 3 * 2 * 7 = 42 (Olası Risk)
      } else if (newSev === 3) {
        newProb = 3;
        newFreq = 3;
        // 3 * 3 * 3 = 27 (Olası Risk)
      } else {
        // newSev === 7
        newProb = 3;
        newFreq = 3;
        // 3 * 3 * 7 = 63 (Olası Risk)
      }
    }

    const newScore = Math.round(newProb * newFreq * newSev);
    const newLevel = scoreToLevel(newScore);

    // Also update post-improvement risk scores if they are missing or still set to old unmitigated values
    let finalProb = risk.finalProb;
    let finalFreq = risk.finalFreq;
    let finalSev = risk.finalSev;
    let finalScore = risk.finalScore;
    let finalLevel = risk.finalLevel;

    if (!finalScore || finalScore === risk.initialScore || finalLevel === 'Önemsiz Risk') {
      finalProb = 0.5;
      finalFreq = 3;
      finalSev = 7;
      finalScore = Math.round(finalProb * finalFreq * finalSev); // 11
      finalLevel = scoreToLevel(finalScore); // Önemsiz Risk
    }

    await prisma.riskLifecycle.update({
      where: { id: risk.id },
      data: {
        initialProb: newProb,
        initialFreq: newFreq,
        initialSev: newSev,
        initialScore: newScore,
        initialLevel: newLevel,
        finalProb,
        finalFreq,
        finalSev,
        finalScore,
        finalLevel
      }
    });

    updatedCount++;
  }

  console.log(`[MIGRATION] Successfully updated ${updatedCount} risk(s) to Olası/Önemli Risk bands.`);
}

scaleLowRisks()
  .catch((e) => {
    console.error('[MIGRATION ERROR] Failed to scale low risks:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
