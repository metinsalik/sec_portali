const fs = require('fs');
const file = 'src/routes/fire_equipment/index.ts';
const content = fs.readFileSync(file, 'utf8');

const route = `
router.post('/equipment/bulk-alarm/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Geçersiz veri formatı.' });

    const createdEquipments = [];
    for (const eq of items) {
      if (!eq.ekipman_no || !eq.kategori) continue;

      let locationId = null;
      if (eq.blok || eq.kat || eq.birim || eq.mahal) {
        let loc = await prisma.hazmatDepartment.findFirst({
          where: {
            facilityId,
            building: eq.blok || null,
            floor: eq.kat || null,
            department: eq.birim || null,
            name: eq.mahal || null
          }
        });
        if (!loc) {
          loc = await prisma.hazmatDepartment.create({
            data: {
              facilityId,
              building: eq.blok || null,
              floor: eq.kat || null,
              department: eq.birim || null,
              name: eq.mahal || null,
              isActive: true
            }
          });
        }
        locationId = loc.id;
      }

      let companyId = null;
      if (eq.firma) {
        let comp = await prisma.fireEquipmentCompany.findFirst({
          where: { facilityId, name: eq.firma }
        });
        if (!comp) {
          comp = await prisma.fireEquipmentCompany.create({
            data: { facilityId, name: eq.firma, isActive: true }
          });
        }
        companyId = comp.id;
      }

      let categoryId = null;
      if (eq.kategori && eq.alt_kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.alt_kategori } });
        if (cat) categoryId = cat.id;
      } else if (eq.kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.kategori, parentId: null } });
        if (cat) categoryId = cat.id;
      }
      if (!categoryId) continue;

      let imalTarihi = null;
      if (eq.imal_yili) {
        imalTarihi = new Date(\`\${eq.imal_yili}-01-01\`);
        if (isNaN(imalTarihi.getTime())) imalTarihi = null;
      }

      const inventoryData = {
        "Çalışma Prensibi": eq.calisma_prensibi || undefined,
        "Buton Tipi": eq.buton_tipi || undefined,
        "Koruma Kapağı": eq.koruma_kapagi || undefined,
        "Kullanım Alanı": eq.kullanım_alani || undefined,
        "Yangın Paneli Entegrasyonu": eq.yangin_paneli_entegrasyonu || undefined,
        "Test Anahtarı": eq.test_anahtari || undefined,
        "Not": eq.not || undefined,
      };

      const newEq = await prisma.fireEquipment.create({
        data: {
          facilityId, categoryId, locationId, companyId,
          equipmentNo: eq.ekipman_no || \`AB-\${Math.floor(Math.random()*10000)}\`,
          productionDate: imalTarihi,
          responsibleUnit: eq.sorumlu_departman || null,
          brand: eq.marka || null,
          model: eq.model || null,
          inventoryData,
          status: 'AKTIF',
          notes: eq.not ? String(eq.not) : null
        }
      });
      createdEquipments.push(newEq);
    }
    res.json({ message: \`\${createdEquipments.length} adet alarm butonu başarıyla eklendi.\` });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ error: 'Toplu ekleme sırasında bir hata oluştu.' });
  }
});
`;

const newContent = content.replace("router.post('/equipment/:facilityId', async (req, res) => {", route + "\nrouter.post('/equipment/:facilityId', async (req, res) => {");
fs.writeFileSync(file, newContent);
