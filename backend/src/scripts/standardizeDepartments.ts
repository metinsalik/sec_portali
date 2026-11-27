import { PrismaClient } from '@prisma/client';
import { mergeDepartments } from '../utils/departmentMerge';

const prisma = new PrismaClient();

/**
 * Kurumsal Müdürlük / Direktörlük / Koordinatörlük Standart Listesi (2. Görsel)
 */
const CANONICAL_DEPARTMENTS = [
  'Anlaşmalı Kurumlar Direktörlüğü',
  'Bilgi Sistemleri Koordinatörlüğü',
  'Biyomedikal Direktörlüğü',
  'Çağrı Merkezi',
  'Dış Görüntüleme ve İhale Müdürlüğü',
  'Hasta Bakım Hizmetleri Direktörlüğü',
  'Hasta Hakları Grup Müdürlüğü',
  'Hekimlik Hizmetleri Direktörlüğü',
  'Hukuk Müşavirliği',
  'İdari İşler Direktörlüğü',
  'İnsan Kaynakları Koordinatörlüğü',
  'Kalite ve Risk Yönetimi Direktörlüğü',
  'Kurumsal Faturalama Direktörlüğü',
  'Kurumsal Operasyonlar Grup Koordinatörlüğü',
  'Kurumsal Tanıtım ve Marka Yönetimi Koordinatörlüğü',
  'Laboratuvar Direktörlüğü',
  'Mali İşler Koordinatörlüğü',
  'Misafir Hizmetleri',
  'Resmi İşlemler ve Ruhsatlandırma Direktörlüğü',
  'Sağlık, Emniyet, Çevre (SEÇ) Direktörlüğü',
  'Strateji ve Performans Grup Koordinatörlüğü',
  'Tedarik Zinciri Direktörlüğü',
  'Tedarik Zinciri Müdürlüğü',
  'Teknik Hizmetler',
  'Teknik Planlama ve Satınalma Direktörlüğü',
  'Tıbbi Hizmetler Direktörlüğü',
  'Uluslararası Hasta Merkezi Direktörlüğü',
  'Uluslararası Misafir Hizmetleri Müdürlüğü',
  'Verimlilik ve İş Zekası Direktörlüğü',
  'Verimlilik ve Performans Yönetimi Direktörlüğü',
  'Yapay Zeka Koordinatörlüğü',
  'Yatırımcı İlişkileri ve Strateji Direktörlüğü',
  'Yurtdışı Operasyon Direktörlüğü',
  'Başhekimlik',
  'Bilgi Sistemleri Müdürlüğü',
  'Biyomedikal Müdürlüğü',
  'Hasta Bakım Hizmetleri Müdürlüğü',
  'İnsan Kaynakları Müdürlüğü',
  'Kalite Müdürlüğü',
  'Misafir Hizmetleri Müdürlüğü',
  'İdari İşler ve Destek Hizmetleri Müdürlüğü',
  'Teknik Hizmetler Müdürlüğü',
  'Üst Yönetim',
];

/**
 * Anahtar kelime -> Hedef Kurumsal Birim eşleştirme kuralları (öncelik sırasıyla)
 */
const MAPPING_RULES: Array<{ target: string; keywords: string[] }> = [
  {
    target: 'Sağlık, Emniyet, Çevre (SEÇ) Direktörlüğü',
    keywords: [
      'seç', 'isg', 'isgb', 'iş güvenliği', 'iş sağlığı', 'işyeri hekimi',
      'işyeri hemşire', 'çevre', 'hap ', 'hap,', 'afet', 'acil durum',
      'yangın', 'risk değerlendirme', 'sivil savunma',
    ],
  },
  {
    target: 'Teknik Hizmetler Müdürlüğü',
    keywords: [
      'teknik', 'mühendis', 'elektrik', 'mekanik', 'tesisat', 'iklimlendirme',
      'bakım onarım', 'inşaat', 'tadilat', 'kazan', 'jeneratör', 'asansör',
      'trafo', 'ups', 'soğutma', 'ısıtma', 'bina bakım',
    ],
  },
  {
    target: 'Biyomedikal Müdürlüğü',
    keywords: ['biyo', 'biyomedikal', 'tıbbi cihaz'],
  },
  {
    target: 'Bilgi Sistemleri Müdürlüğü',
    keywords: [
      'bilgi işlem', 'bilgi sistem', 'yazılım', 'donanım', 'network',
      'bt ', 'it ', 'hbys', 'otomasyon',
    ],
  },
  {
    target: 'Hasta Bakım Hizmetleri Müdürlüğü',
    keywords: [
      'hasta bakım', 'hbh', 'hemşire', 'bakım hizmet', 'servis sorumlu',
      'enfeksiyon kontrol hemşire', 'yoğun bakım hemşire',
    ],
  },
  {
    target: 'Başhekimlik',
    keywords: [
      'başhekim', 'hekim', 'enfeksiyon', 'komite', 'poliklinik', 'klinik',
      'acil servis', 'yoğun bakım', 'ameliyathane', 'cerrahi', 'radyoloji',
      'onkoloji', 'kardiyoloji', 'nöroloji', 'pediatri', 'kadın doğum',
      'üroloji', 'ortopedi', 'göz', 'kbb', 'dahiliye', 'gastro', 'nefroloji',
      'diyaliz', 'fizik tedavi', 'ftr', 'diş', 'ebe', 'eczane', 'eczacı',
      'doktor', 'tıbbi', 'geriatri', 'girişimsel', 'günübirlik',
    ],
  },
  {
    target: 'Laboratuvar Direktörlüğü',
    keywords: ['laboratuvar', 'lab ', 'patoloji', 'mikrobiyoloji', 'biyokimya', 'kan merkezi'],
  },
  {
    target: 'İdari İşler ve Destek Hizmetleri Müdürlüğü',
    keywords: [
      'idari işler', 'destek hizmet', 'otelcilik', 'odh', 'güvenlik',
      'temizlik', 'yemek', 'mutfak', 'kafeterya', 'çamaşır', 'atık',
      'ulaştırma', 'taşıma', 'arşiv', 'depo', 'morg', 'bahçe', 'otopark',
    ],
  },
  {
    target: 'İnsan Kaynakları Müdürlüğü',
    keywords: ['insan kaynak', 'ik ', 'personel', 'bordro', 'özlük', 'eğitim birimi'],
  },
  {
    target: 'Kalite Müdürlüğü',
    keywords: ['kalite', 'akreditasyon', 'jci', 'sks'],
  },
  {
    target: 'Misafir Hizmetleri Müdürlüğü',
    keywords: ['misafir', 'danışma', 'hasta kabul', 'resepsiyon', 'karşılama', 'santral'],
  },
  {
    target: 'Tedarik Zinciri Müdürlüğü',
    keywords: ['tedarik', 'satınalma', 'satın alma', 'lojistik'],
  },
  {
    target: 'Dış Görüntüleme ve İhale Müdürlüğü',
    keywords: ['ihale', 'dış görüntüleme'],
  },
  {
    target: 'Mali İşler Koordinatörlüğü',
    keywords: ['mali işler', 'muhasebe', 'finans', 'faturalama', 'vezne', 'fiyatlandırma'],
  },
  {
    target: 'Anlaşmalı Kurumlar Direktörlüğü',
    keywords: ['anlaşmalı kurum', 'sgk', 'özel sigorta'],
  },
  {
    target: 'Hasta Hakları Grup Müdürlüğü',
    keywords: ['hasta hakları'],
  },
  {
    target: 'Hukuk Müşavirliği',
    keywords: ['hukuk', 'avukat'],
  },
  {
    target: 'Uluslararası Misafir Hizmetleri Müdürlüğü',
    keywords: ['uluslararası'],
  },
  {
    target: 'Resmi İşlemler ve Ruhsatlandırma Direktörlüğü',
    keywords: ['ruhsat', 'resmi işlem'],
  },
  {
    target: 'Çağrı Merkezi',
    keywords: ['çağrı merkezi', 'call center'],
  },
  {
    target: 'Üst Yönetim',
    keywords: ['genel müdür', 'üst yönetim', 'yönetim kurulu'],
  },
];

function classifyDepartment(name: string): string | null {
  const lower = name.toLocaleLowerCase('tr-TR');
  for (const rule of MAPPING_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.target;
    }
  }
  return null;
}

async function run() {
  const apply = process.argv.includes('--apply');
  const fallbackArg = process.argv.find((a) => a.startsWith('--fallback='));
  const fallbackTarget = fallbackArg ? fallbackArg.split('=')[1] : null;

  console.log('==============================================================');
  console.log(`Kurumsal Departman Standartlastirma (${apply ? 'UYGULAMA MODU' : 'ONIZLEME / DRY-RUN'})`);
  console.log('==============================================================');

  // 1. Resmi 43 kurumsal birimi garantile
  const targetMap = new Map<string, number>();
  for (const canonicalName of CANONICAL_DEPARTMENTS) {
    let dept = await prisma.department.findFirst({
      where: { name: { equals: canonicalName, mode: 'insensitive' } },
    });
    if (!dept) {
      if (apply) {
        dept = await prisma.department.create({ data: { name: canonicalName } });
        console.log(`[+] Olusturuldu: ${canonicalName}`);
      } else {
        console.log(`[+] Olusturulacak: ${canonicalName}`);
      }
    }
    if (dept) {
      targetMap.set(canonicalName.toLocaleLowerCase('tr-TR'), dept.id);
    }
  }

  const allDepts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  const canonicalLowerSet = new Set(CANONICAL_DEPARTMENTS.map((c) => c.toLocaleLowerCase('tr-TR')));

  const groupedSources = new Map<string, { id: number; name: string }[]>();
  const unmatched: { id: number; name: string }[] = [];

  for (const d of allDepts) {
    if (canonicalLowerSet.has(d.name.trim().toLocaleLowerCase('tr-TR'))) {
      continue;
    }
    const matchedTarget = classifyDepartment(d.name) || fallbackTarget;
    if (matchedTarget) {
      const list = groupedSources.get(matchedTarget) || [];
      list.push({ id: d.id, name: d.name });
      groupedSources.set(matchedTarget, list);
    } else {
      unmatched.push({ id: d.id, name: d.name });
    }
  }

  console.log('\n--- Eslesme Ozeti ---');
  for (const [targetName, sources] of groupedSources.entries()) {
    console.log(`  -> ${targetName}: ${sources.length} departman aktarilacak`);
  }
  console.log(`  [?] Eslesmeyen (kisi/ozel isim vb.): ${unmatched.length} departman`);
  if (unmatched.length > 0) {
    console.log(
      '      Ilk 20 eslesmeyen:',
      unmatched.slice(0, 20).map((u) => u.name).join(' | ')
    );
  }

  if (!apply) {
    console.log('\n[DRY-RUN] Veritabani degistirilmedi.');
    console.log('Uygulamak icin: npx ts-node src/scripts/standardizeDepartments.ts --apply');
    console.log(
      'Eslesmeyenleri de ornegin "İdari İşler ve Destek Hizmetleri Müdürlüğü"ne toplamak isterseniz:'
    );
    console.log(
      '  npx ts-node src/scripts/standardizeDepartments.ts --apply --fallback="İdari İşler ve Destek Hizmetleri Müdürlüğü"'
    );
    return;
  }

  // 2. Birlestirme islemini her hedef icin calistir
  for (const [targetName, sources] of groupedSources.entries()) {
    const targetId = targetMap.get(targetName.toLocaleLowerCase('tr-TR'));
    if (!targetId) continue;

    // Kaynaklari 100'erli parcalar halinde aktar
    const sourceIds = sources.map((s) => s.id).filter((id) => id !== targetId);
    for (let i = 0; i < sourceIds.length; i += 100) {
      const chunk = sourceIds.slice(i, i + 100);
      await mergeDepartments(chunk, targetId);
    }
    console.log(`[OK] ${sources.length} departman "${targetName}" altina aktarildi.`);
  }

  console.log('\nTamamlandi!');
}

run()
  .catch((err) => {
    console.error('Hata:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
