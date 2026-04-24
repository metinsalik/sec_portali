import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Veri Aktarımı Başladı ---');

  // Veri dosyalarının yolu: backend/data dizini
  const dataPath = path.join(__dirname, '..', '..', 'data');
  console.log(`Veri dizini: ${dataPath}`);

  // Helper to normalize strings for matching
  const normalize = (s: string) => s ? s.trim().toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ö/g, 'o').replace(/Ö/g, 'o').replace(/ç/g, 'c').replace(/Ç/g, 'c') : '';

  // TEMİZLİK: İlişkili tüm tabloları silelim (Foreign Key hatalarını önlemek için sıra önemli)
  console.log('Temizlik yapılıyor...');
  await prisma.activityLog.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.employeeCountHistory.deleteMany({});
  await prisma.facilityBuilding.deleteMany({});
  await prisma.monthlyHRData.deleteMany({});
  await prisma.monthlyAccidentData.deleteMany({});
  await prisma.reconciliation.deleteMany({});
  await prisma.userFacility.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.oSGBCompany.deleteMany({});

  // 1. OSGB Şirketlerini Aktar
  console.log('OSGB Şirketleri aktarılıyor...');
  const osgbFile = fs.readFileSync(path.join(dataPath, 'osgb.csv'));
  const osgbData = iconv.decode(osgbFile, 'windows-1254');
  const osgbRecords = parse(osgbData, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true
  }) as any[];

  for (const r of osgbRecords) {
    const name = r['OSGB Adı'];
    if (!name) continue;
    await prisma.oSGBCompany.create({
        data: {
            name,
            contact: r['Yetkili İletişim'],
            phone: r['Telefon'],
            email: r['E-posta'],
            city: r['İl'],
            district: r['İlçe']
        }
    });
  }

  // 2. Profesyonelleri Aktar
  console.log('Profesyoneller aktarılıyor...');
  const profFile = fs.readFileSync(path.join(dataPath, 'profesyoneller.csv'));
  const profData = iconv.decode(profFile, 'windows-1254');
  const profRecords = parse(profData, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true
  }) as any[];

  const titleMap: Record<string, string> = {
    'A Sınıfı İGU': 'A Sınıfı IGU',
    'B Sınıfı İGU': 'B Sınıfı IGU',
    'C Sınıfı İGU': 'C Sınıfı IGU',
    'İşyeri Hekimi': 'İşyeri Hekimi',
    'DSP': 'DSP',
    'Diğer Sağlık Personeli': 'DSP'
  };

  for (const r of profRecords) {
    const fullName = r['Ad Soyad'];
    const rawTitle = r['Sınıf/Unvan'];
    const titleClass = titleMap[rawTitle] || rawTitle;

    await prisma.professional.create({
        data: {
            fullName,
            employmentType: r['İstihdam Tipi'] || 'OSGB Kadrosu',
            osgbName: r['OSGB Adı'],
            titleClass: titleClass,
            certificateNo: r['Sertifika No'],
            certificateDate: r['Belge Tarihi'] ? new Date(r['Belge Tarihi']) : null,
            phone: r['Telefon'],
            email: r['E-Posta'],
            unitPrice: parseFloat(r['Birim Fiyat']) || 0,
            isActive: true
        }
    });
  }

  // 3. Tesisleri Aktar
  console.log('Tesisler aktarılıyor...');
  const facilityFile = fs.readFileSync(path.join(dataPath, 'tesisler.csv'));
  const facilityData = iconv.decode(facilityFile, 'windows-1254');
  const facilityRecords = parse(facilityData, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true
  }) as any[];

  const facilityMap = new Map<string, string>(); // name -> id

  for (const r of facilityRecords) {
    const name = r['Tesis Adı'];
    if (!name) continue;

    // ID üretimi: İsimden benzersiz ID (Slug) kullanıyoruz ki her zaman aynı kalsın
    const facilityId = normalize(name).toUpperCase().replace(/\s+/g, '-').substring(0, 15);
    facilityMap.set(normalize(name), facilityId);

    const sgk = r['SGK'];
    await prisma.facility.create({
        data: {
            id: facilityId,
            name,
            commercialTitle: r['Ticari Unvan'],
            city: r['İl'],
            district: r['İlçe'],
            fullAddress: r['Adres'],
            sgkNumber: sgk && !sgk.includes('E+') ? sgk : null,
            dangerClass: r['Tehlike Sınıfı'] || 'Az Tehlikeli',
            employeeCount: parseInt(r['Çalışan Sayısı']) || 0,
            type: r['Tesis Türü'] || 'Ofis',
            isActive: true
        }
    });
  }

  // 4. Atamaları Aktar
  console.log('Atamalar aktarılıyor...');
  const assignFile = fs.readFileSync(path.join(dataPath, 'atamalar.csv'));
  const assignData = iconv.decode(assignFile, 'windows-1254');
  const assignRecords = parse(assignData, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true
  }) as any[];

  for (const r of assignRecords) {
    const tName = r['Tesis Adı'];
    const normTName = normalize(tName);
    const facilityId = facilityMap.get(normTName);
    
    if (!facilityId) {
      console.warn(`Uyarı: "${tName}" (${normTName}) isimli tesis haritada bulunamadı.`);
      continue;
    }

    // Profesyoneli bul
    const profName = r['Uzman Adı'] || r['Hekim Adı'] || r['DSP Adı'];
    if (!profName) continue;

    const professional = await prisma.professional.findFirst({ 
        where: { fullName: { equals: profName, mode: 'insensitive' } } 
    });
    
    if (!professional) {
      console.warn(`Uyarı: "${profName}" isimli profesyonel bulunamadı.`);
      continue;
    }

    let type = 'IGU';
    if (r['Hekim Adı']) type = 'Hekim';
    else if (r['DSP Adı']) type = 'DSP';

    await prisma.assignment.create({
      data: {
        facilityId: facilityId,
        professionalId: professional.id,
        type: type,
        durationMinutes: parseInt(r['Süre']) || 0,
        isFullTime: r['Tam Zamanlı'] === 'Evet',
        startDate: new Date(r['Başlangıç Tarihi'] || new Date()),
        endDate: r['Bitiş Tarihi'] ? new Date(r['Bitiş Tarihi']) : null,
        status: r['Durum'] || 'Aktif',
        costType: 'Aylık Sabit'
      }
    });
  }

  console.log('--- Veri Aktarımı Tamamlandı ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
