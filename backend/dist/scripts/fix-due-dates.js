"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Veritabanı taraması başlatılıyor...');
    // Bütün kararları, bağlı oldukları toplantılarla birlikte çekelim
    const decisions = await prisma.ohsBoardDecision.findMany({
        include: {
            meeting: true
        }
    });
    let fixedCount = 0;
    for (const decision of decisions) {
        if (decision.dueDate && decision.meeting?.meetingDate) {
            const dueDate = new Date(decision.dueDate);
            const meetingDate = new Date(decision.meeting.meetingDate);
            // Sadece tarih kısımlarını karşılaştırmak için saatleri sıfırlayalım
            dueDate.setHours(0, 0, 0, 0);
            meetingDate.setHours(0, 0, 0, 0);
            // Eğer termin tarihi, toplantı tarihinden önceyse
            if (dueDate < meetingDate) {
                // Yeni termin tarihini toplantı tarihinden 30 gün sonraya ayarla
                const newDueDate = new Date(meetingDate);
                newDueDate.setDate(newDueDate.getDate() + 30);
                console.log(`Hatalı Karar Bulundu: Karar No: ${decision.decisionNumber}`);
                console.log(`  Toplantı Tarihi: ${meetingDate.toLocaleDateString('tr-TR')}`);
                console.log(`  Eski Termin: ${dueDate.toLocaleDateString('tr-TR')}`);
                console.log(`  Yeni Termin: ${newDueDate.toLocaleDateString('tr-TR')}`);
                console.log('--------------------------------------------------');
                await prisma.ohsBoardDecision.update({
                    where: { id: decision.id },
                    data: {
                        dueDate: newDueDate
                    }
                });
                fixedCount++;
            }
        }
    }
    console.log('==================================================');
    console.log(`İşlem Tamamlandı! Toplam ${fixedCount} adet hatalı termin tarihi düzeltildi.`);
}
main()
    .catch((e) => {
    console.error('Bir hata oluştu:', e);
    throw e;
})
    .finally(async () => {
    await prisma.$disconnect();
});
