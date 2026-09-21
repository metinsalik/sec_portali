import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function scoreToLevel(score: number): string {
  if (score > 400) return 'Tolere Gösterilmez Risk';
  if (score > 200) return 'Yüksek Risk';
  if (score > 70)  return 'Önemli Risk';
  if (score > 20)  return 'Olası Risk';
  return 'Önemsiz Risk';
}

async function fixDefaultFinalScores() {
  console.log('[MIGRATION] Checking for risks with missing post-improvement risk scores...');
  
  const prob = 0.5;
  const freq = 3;
  const sev = 7;
  const score = Math.round(prob * freq * sev); // 11
  const level = scoreToLevel(score);

  const result = await prisma.riskLifecycle.updateMany({
    where: {
      OR: [
        { finalProb: null },
        { finalScore: null }
      ]
    },
    data: {
      finalProb: prob,
      finalFreq: freq,
      finalSev: sev,
      finalScore: score,
      finalLevel: level
    }
  });

  if (result.count > 0) {
    console.log(`[MIGRATION] Successfully updated ${result.count} existing risk(s) with default post-improvement scores (O: 0.5, F: 3, S: 7 -> Puan: 11).`);
  } else {
    console.log('[MIGRATION] All risks already have post-improvement scores set.');
  }
}

fixDefaultFinalScores()
  .catch((e) => {
    console.error('[MIGRATION ERROR] Failed to fix default final scores:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
