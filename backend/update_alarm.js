const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: 'Alarm Butonu', parentId: null } });
  if (!cat) { console.log('not found'); return; }

  const newParams = [
      { name: "Çalışma Prensibi", options: ["Adresli", "Konvansiyonel", "Basma Elemanlı"] },
      { name: "Buton Tipi", options: ["Kırılabilir Camlı", "Resetlenebilir"] },
      { name: "Koruma Kapağı", options: ["Var", "Yok"] },
      { name: "Kullanım Alanı", options: ["İç Ortam", "Dış Ortam", "Islak Hacim", "Ex-proof Alan"] },
      { name: "Yangın Paneli Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Test Anahtarı", options: ["Var", "Yok"] },
      { name: "Not", type: "text" }
  ];

  await prisma.fireEquipmentCategory.update({
    where: { id: cat.id },
    data: { inventoryParameters: newParams }
  });

  console.log('updated parent');

  // Find subcategories and fix "Ex-proof Buton" case and add missing ones if they don't exist
  const existingSubs = await prisma.fireEquipmentCategory.findMany({ where: { parentId: cat.id } });
  
  const wantedSubs = ["Dış Ortam Butonu", "Ex-Proof Buton", "Kırılabilir Camlı Buton", "Resetlenebilir Buton"];
  
  for (const w of wantedSubs) {
    const existing = existingSubs.find(e => e.name.toLowerCase() === w.toLowerCase());
    if (existing) {
      if (existing.name !== w) {
        await prisma.fireEquipmentCategory.update({ where: { id: existing.id }, data: { name: w } });
        console.log('renamed', existing.name, 'to', w);
      }
    } else {
      await prisma.fireEquipmentCategory.create({
        data: { name: w, parentId: cat.id, isActive: true, inventoryParameters: [], maintenanceChecks: [] }
      });
      console.log('created', w);
    }
  }

  // Delete any extra subcategories
  for (const e of existingSubs) {
    const w = wantedSubs.find(ww => ww.toLowerCase() === e.name.toLowerCase());
    if (!w) {
      console.log('should delete', e.name);
      await prisma.fireEquipmentCategory.delete({ where: { id: e.id } });
    }
  }

  console.log('done');
}

run().finally(() => prisma.$disconnect());
